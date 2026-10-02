import { useEffect, useMemo, useRef, useState } from "react";
import { Home, Users, ReceiptText, Plus, X, Wallet, Trash2, Check, UserPlus, Download, Upload, LogIn, LogOut } from "lucide-react";
import { supabase } from "./lib/supabase";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Filesystem, Directory } from "@capacitor/filesystem";

type Person = { id: string; name: string; email?: string; userId?: string; updatedAt?: number };
type Group = { id: string; name: string; members: string[]; updatedAt?: number; sharedGroupId?: string };
type Expense = { id: string; title: string; amount: number; paidBy: string; people: string[]; groupId: string; createdAt: number; updatedAt?: number; splitMode?: "equal"|"exact"|"percent"; shares?: Record<string,number> };
type Payment = { id: string; from: string; to: string; amount: number; createdAt: number; updatedAt?: number };
const me = "You";
const initialPeople: Person[] = [{id:"you",name:me},{id:"alex",name:"Alex"},{id:"sam",name:"Sam"},{id:"jordan",name:"Jordan"}];
const initialGroups: Group[] = [{id:"apartment",name:"Apartment",members:["you","alex","sam"]},{id:"goa",name:"Goa trip",members:["you","alex","sam","jordan"]}];
const load = <T,>(key:string, fallback:T):T => { try { const v=localStorage.getItem("swp_"+key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } };
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n);
export default function App(){
 const [tab,setTab]=useState("Home");
 const [user,setUser]=useState<any>(null); const [accountName,setAccountName]=useState("You");
 const [authMode,setAuthMode]=useState<"login"|"signup"|"reset">("login"); const [authEmail,setAuthEmail]=useState(""); const [authPassword,setAuthPassword]=useState(""); const [authName,setAuthName]=useState(""); const [authBusy,setAuthBusy]=useState(false); const [authMessage,setAuthMessage]=useState("");
 const [expenseSearch,setExpenseSearch]=useState(""); const [expenseGroupFilter,setExpenseGroupFilter]=useState("all"); const [expenseDateFilter,setExpenseDateFilter]=useState("all"); const [expenseSort,setExpenseSort]=useState("newest");
 const [people,setPeople]=useState<Person[]>(()=>load("people",initialPeople));
 const [groups,setGroups]=useState<Group[]>(()=>load("groups",initialGroups));
 const [expenses,setExpenses]=useState<Expense[]>(()=>{const raw=load<any[]>("expenses",[]);const ids:Record<string,string>={You:"you",Alex:"alex",Sam:"sam",Jordan:"jordan"};return raw.map((e:any)=>({id:String(e.id??crypto.randomUUID()),title:String(e.title??"Expense"),amount:Number(e.amount)||0,paidBy:ids[e.paidBy]||e.paidBy||"you",people:Array.isArray(e.people)?e.people.map((p:string)=>ids[p]||p):["you"],groupId:groups.find(g=>g.name===(e.group||e.groupId))?.id||"apartment",createdAt:Number(e.createdAt)||Number(e.id)||Date.now(),splitMode:e.splitMode||"equal",shares:e.shares||{}}));});
 const [payments,setPayments]=useState<Payment[]>(()=>load("payments",[]));
 const [modal,setModal]=useState<"expense"|"friend"|"group"|"settle"|"auth"|"invite"|null>(null);
 const restoreInputRef=useRef<HTMLInputElement>(null);
 const [title,setTitle]=useState(""); const [amount,setAmount]=useState(""); const [splitMode,setSplitMode]=useState<"equal"|"exact"|"percent">("equal"); const [shares,setShares]=useState<Record<string,string>>({}); const [editingId,setEditingId]=useState<string|null>(null); const [paidBy,setPaidBy]=useState("you"); const [groupId,setGroupId]=useState("apartment"); const [selected,setSelected]=useState<string[]>(["you","alex","sam"]);
 const [friendName,setFriendName]=useState(""); const [friendEmail,setFriendEmail]=useState(""); const [groupName,setGroupName]=useState(""); const [editingGroupId,setEditingGroupId]=useState<string|null>(null); const [groupMembers,setGroupMembers]=useState<string[]>([]); const [settleFrom,setSettleFrom]=useState("alex"); const [settleTo,setSettleTo]=useState("you"); const [inviteGroupId,setInviteGroupId]=useState<string|null>(null); const [inviteEmail,setInviteEmail]=useState(""); const [invitations,setInvitations]=useState<any[]>([]); const [sharedMembers,setSharedMembers]=useState<Record<string,any[]>>({});
 const persist=(key:string,value:unknown)=>localStorage.setItem("swp_"+key,JSON.stringify(value));
 const [cloudReady,setCloudReady]=useState(false);
 const [syncing,setSyncing]=useState(false);
 const [deleted,setDeleted]=useState<{people:string[];groups:string[];expenses:string[];payments:string[]}>(()=>load("deleted",{people:[],groups:[],expenses:[],payments:[]}));
 const markDeleted=(kind:"people"|"groups"|"expenses"|"payments",id:string)=>{
  setDeleted(prev=>{const next={...prev,[kind]:Array.from(new Set([...prev[kind],id]))};persist("deleted",next);return next;});
 };
 const mergeById=<T extends {id:string;updatedAt?:number}>(local:T[],cloud:T[],deletedIds:string[])=>{
  const removed=new Set(deletedIds);
  const map=new Map<string,T>();
  [...cloud,...local].forEach(item=>{if(removed.has(item.id))return;const current=map.get(item.id);if(!current||(item.updatedAt??0)>=(current.updatedAt??0))map.set(item.id,item);});
  return Array.from(map.values());
 };
 const cloudSync=async(next?:{people?:Person[];groups?:Group[];expenses?:Expense[];payments?:Payment[];deleted?:typeof deleted})=>{
  if(!user||!cloudReady)return;
  setSyncing(true);
  const d=next?.deleted??deleted;
  const payload={user_id:user.id,people:next?.people??people,groups_data:next?.groups??groups,expenses:next?.expenses??expenses,payments:next?.payments??payments,deleted_people:d.people,deleted_groups:d.groups,deleted_expenses:d.expenses,deleted_payments:d.payments,updated_at:new Date().toISOString()};
  const {error}=await supabase.from("user_data").upsert(payload,{onConflict:"user_id"});
  if(error) console.error("Cloud sync failed:",error);
  setSyncing(false);
 };
 const loadCloudData=async(id:string)=>{
  const {data,error}=await supabase.from("user_data").select("people,groups_data,expenses,payments,deleted_people,deleted_groups,deleted_expenses,deleted_payments").eq("user_id",id).maybeSingle();
  if(error){console.error("Cloud load failed:",error);setCloudReady(true);return;}
  if(data){
   const cloudPeople=Array.isArray(data.people)?data.people as Person[]:[];
   const cloudGroups=Array.isArray(data.groups_data)?data.groups_data as Group[]:[];
   const cloudExpenses=Array.isArray(data.expenses)?data.expenses as Expense[]:[];
   const cloudPayments=Array.isArray(data.payments)?data.payments as Payment[]:[];
   const cloudDeleted={people:Array.isArray(data.deleted_people)?data.deleted_people as string[]:[],groups:Array.isArray(data.deleted_groups)?data.deleted_groups as string[]:[],expenses:Array.isArray(data.deleted_expenses)?data.deleted_expenses as string[]:[],payments:Array.isArray(data.deleted_payments)?data.deleted_payments as string[]:[]};
   const mergedDeleted={people:Array.from(new Set([...deleted.people,...cloudDeleted.people])),groups:Array.from(new Set([...deleted.groups,...cloudDeleted.groups])),expenses:Array.from(new Set([...deleted.expenses,...cloudDeleted.expenses])),payments:Array.from(new Set([...deleted.payments,...cloudDeleted.payments]))};
   const mergedPeople=mergeById(people,cloudPeople,mergedDeleted.people);
   const mergedGroups=mergeById(groups,cloudGroups,mergedDeleted.groups);
   const mergedExpenses=mergeById(expenses,cloudExpenses,mergedDeleted.expenses);
   const mergedPayments=mergeById(payments,cloudPayments,mergedDeleted.payments);
   setPeople(mergedPeople);setGroups(mergedGroups);setExpenses(mergedExpenses);setPayments(mergedPayments);setDeleted(mergedDeleted);
   persist("people",mergedPeople);persist("groups",mergedGroups);persist("expenses",mergedExpenses);persist("payments",mergedPayments);persist("deleted",mergedDeleted);
   await supabase.from("user_data").upsert({user_id:id,people:mergedPeople,groups_data:mergedGroups,expenses:mergedExpenses,payments:mergedPayments,deleted_people:mergedDeleted.people,deleted_groups:mergedDeleted.groups,deleted_expenses:mergedDeleted.expenses,deleted_payments:mergedDeleted.payments});
  } else {
   await supabase.from("user_data").upsert({user_id:id,people,groups_data:groups,expenses,payments,deleted_people:deleted.people,deleted_groups:deleted.groups,deleted_expenses:deleted.expenses,deleted_payments:deleted.payments});
  }
  setCloudReady(true);
 };
 useEffect(()=>{let mounted=true; supabase.auth.getSession().then(async({data})=>{if(!mounted)return;setUser(data.session?.user??null);if(data.session?.user){await loadProfile(data.session.user.id,data.session.user.email??"",data.session.user.user_metadata?.name??"");await loadCloudData(data.session.user.id);}else setCloudReady(true);}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(mounted){setUser(session?.user??null);setCloudReady(false);if(session?.user){loadProfile(session.user.id,session.user.email??"",session.user.user_metadata?.name??"").then(()=>loadCloudData(session.user.id));}else setCloudReady(true);}}); return()=>{mounted=false;subscription.unsubscribe();};},[]);

 useEffect(()=>{if(user&&cloudReady)cloudSync();},[people,groups,expenses,payments,user,cloudReady,deleted]);
 useEffect(()=>{if(!user||!cloudReady){setInvitations([]);return;} let active=true; supabase.from("group_invitations").select("id,group_id,inviter_id,invitee_email,status,created_at").eq("status","pending").order("created_at",{ascending:false}).then(async({data,error})=>{if(!active)return;if(error){console.error("Invitation load failed:",error);setInvitations([]);return;}const rows=data||[];const ids=Array.from(new Set(rows.map((x:any)=>x.group_id)));let names:Record<string,string>={};if(ids.length){const {data:groupRows}=await supabase.from("shared_groups").select("id,name").in("id",ids);(groupRows||[]).forEach((g:any)=>{names[g.id]=g.name;});}if(active)setInvitations(rows.map((x:any)=>({...x,group_name:names[x.group_id]||"Shared group"})));});return()=>{active=false;};},[user,cloudReady]);
 const openInvite=async(g:Group)=>{if(!user){setAuthMessage("Log in to invite people to a shared group.");setAuthMode("login");setModal("auth");return;}setInviteGroupId(g.id);setInviteEmail("");setModal("invite");};
 const sharedPersonId=(uid:string)=>people.find(p=>p.userId===uid)?.id||`shared-${uid}`;
 const applySharedExpenseRow=(x:any)=>{
  const localGroup=groups.find(g=>g.sharedGroupId===x.group_id);
  const memberRows=sharedMembers[x.group_id]||[];
  const ensureMemberIds=Array.isArray(x.people_user_ids)?x.people_user_ids:[];
  const localPeople=ensureMemberIds.map((uid:string)=>{
   const existing=people.find(p=>p.userId===uid);
   const m=memberRows.find((r:any)=>r.user_id===uid);
   return existing?.id||sharedPersonId(uid);
  });
  const payerUid=String(x.paid_by_user_id||"");
  return {
   id:x.expense_id,title:x.title,amount:Number(x.amount),
   paidBy:payerUid?(people.find(p=>p.userId===payerUid)?.id||sharedPersonId(payerUid)):x.paid_by,
   people:localPeople.length?localPeople:(Array.isArray(x.people)?x.people:[]),
   groupId:localGroup?.id||x.group_id,createdAt:new Date(x.created_at).getTime(),
   updatedAt:new Date(x.updated_at||x.created_at).getTime(),splitMode:x.split_mode||"equal",
   shares:x.shares_user_ids&&typeof x.shares_user_ids==="object" ? Object.fromEntries(Object.entries(x.shares_user_ids).map(([uid,v])=>[sharedPersonId(uid),Number(v)])) : (x.shares||{})
  } as Expense;
 };
 const upsertSharedExpenseLocal=(row:any)=>{
  const mapped=applySharedExpenseRow(row);
  setExpenses(prev=>{
   const existing=prev.find(e=>e.id===mapped.id);
   const next=existing && (existing.updatedAt??0)>(mapped.updatedAt??0) ? prev : mergeById(prev,[mapped],deleted.expenses);
   persist("expenses",next);
   return next;
  });
 };
 const syncLocalSharedGroup=async(sharedId:string,rows:any[])=>{
  const g=groups.find(x=>x.sharedGroupId===sharedId);
  if(!g)return;
  const nextPeople=[...people];
  rows.forEach((r:any)=>{
   const uid=String(r.user_id);
   const existingIndex=nextPeople.findIndex(p=>p.userId===uid);
   const email=String(r.email||"").trim().toLowerCase();
   const name=uid===user?.id ? (accountName||"You") : (String(r.display_name||r.email||"Shared member").trim()||"Shared member");
   if(existingIndex>=0){
    nextPeople[existingIndex]={...nextPeople[existingIndex],name,userId:uid,...(email?{email}:{}),updatedAt:Date.now()};
   }else{
    nextPeople.push({id:`shared-${uid}`,name,userId:uid,...(email?{email}:{}),updatedAt:Date.now()});
   }
  });
  setPeople(nextPeople);persist("people",nextPeople);
  const linked=rows.map((r:any)=>nextPeople.find(p=>p.userId===String(r.user_id))?.id||`shared-${r.user_id}`);
  const nextGroups=groups.map(x=>x.id===g.id?{...x,members:Array.from(new Set(linked)),updatedAt:Date.now()}:x);
  setGroups(nextGroups);persist("groups",nextGroups);
 };
 const loadSharedMembers=async(sharedId:string)=>{
  if(!user)return;
  const {data,error}=await supabase.from("shared_group_members").select("group_id,user_id,role,display_name,email,created_at").eq("group_id",sharedId).order("created_at",{ascending:true});
  if(error){console.error("Shared members load failed:",error);return;}
  setSharedMembers(prev=>({...prev,[sharedId]:data||[]}));
  await syncLocalSharedGroup(sharedId,data||[]);
 };
 const leaveSharedGroup=async(g:Group)=>{
  if(!user||!g.sharedGroupId)return;
  if(!confirm(`Leave "${g.name}" shared group? Shared expenses will remain in history.`))return;
  const {error}=await supabase.from("shared_group_members").delete().eq("group_id",g.sharedGroupId).eq("user_id",user.id);
  if(error){alert(error.message||"Could not leave group.");return;}
  const next=groups.filter(x=>x.id!==g.id);
  setGroups(next);persist("groups",next);setSharedMembers(prev=>{const n={...prev};delete n[g.sharedGroupId!];return n;});
 };
 const removeSharedMember=async(g:Group,member:any)=>{
  if(!user||!g.sharedGroupId)return;
  const isOwner=(sharedMembers[g.sharedGroupId]||[]).some((m:any)=>m.user_id===user.id&&m.role==="owner");
  if(!isOwner){alert("Only the group owner can remove members.");return;}
  if(member.user_id===user.id){alert("Use Leave for your own membership.");return;}
  const name=member.display_name||member.email||"this member";
  if(!confirm(`Remove ${name} from "${g.name}"?`))return;
  const {error}=await supabase.from("shared_group_members").delete().eq("group_id",g.sharedGroupId).eq("user_id",member.user_id);
  if(error){alert(error.message||"Could not remove member.");return;}
  await loadSharedMembers(g.sharedGroupId);
 };
 const loadSharedExpenses=async(sharedId:string)=>{
  if(!user)return;
  const {data,error}=await supabase.from("shared_group_expenses")
   .select("expense_id,title,amount,paid_by,people,group_id,created_at,updated_at,split_mode,shares,paid_by_user_id,people_user_ids,shares_user_ids")
   .eq("group_id",sharedId);
  if(error){console.error("Shared expenses load failed:",error);return;}
  const mapped=(data||[]).map(applySharedExpenseRow);
  setExpenses(prev=>{
   const next=mergeById(prev,mapped,deleted.expenses);
   persist("expenses",next);
   return next;
  });
 };
 const publishSharedExpense=async(e:Expense)=>{
  const g=groups.find(x=>x.id===e.groupId);
  if(!user||!g?.sharedGroupId)return;
  const {data:members,error:memberError}=await supabase.from("shared_group_members").select("user_id").eq("group_id",g.sharedGroupId);
  if(memberError){alert(memberError.message||"Could not load shared members.");return false;}
  const memberIds=new Set((members||[]).map((m:any)=>String(m.user_id)));
  const localToUser=new Map(people.filter(p=>p.userId).map(p=>[p.id,p.userId!] as const));
  localToUser.set("you",user.id);
  const payerUid=localToUser.get(e.paidBy);
  const participantUids=e.people.map(id=>localToUser.get(id)).filter(Boolean) as string[];
  if(!payerUid||!memberIds.has(payerUid)||participantUids.length!==e.people.length||participantUids.some(uid=>!memberIds.has(uid))){
   alert("Every person in a shared expense must be a member of the shared group.");
   return false;
  }
  const sharesUserIds=e.shares?Object.fromEntries(Object.entries(e.shares).map(([id,v])=>[localToUser.get(id)||id,v])):{};
  const {error}=await supabase.from("shared_group_expenses").upsert({
   expense_id:e.id,group_id:g.sharedGroupId,title:e.title,amount:e.amount,paid_by:e.paidBy,
   people:e.people,paid_by_user_id:payerUid,people_user_ids:participantUids,shares_user_ids:sharesUserIds,
   created_at:new Date(e.createdAt).toISOString(),updated_at:new Date(e.updatedAt||Date.now()).toISOString(),
   split_mode:e.splitMode||"equal",shares:e.shares||{}
  },{onConflict:"expense_id"});
  if(error){console.error("Shared expense publish failed:",error);alert(error.message||"Could not share expense.");return false;}
  return true;
 };
 useEffect(()=>{
  if(!user||!cloudReady)return;
  const pending=load<string[]>("pendingSharedExpenseIds",[]);
  if(!pending.length)return;
  let cancelled=false;
  (async()=>{
   const remaining:string[]=[];
   for(const id of pending){
    if(cancelled)break;
    const e=expenses.find(x=>x.id===id);
    if(!e)continue;
    const ok=await publishSharedExpense(e);
    if(!ok)remaining.push(id);
   }
   if(!cancelled)persist("pendingSharedExpenseIds",remaining);
  })();
  return()=>{cancelled=true;};
 },[user,cloudReady,expenses]);
 useEffect(()=>{
  if(!user||!cloudReady)return;
  const sharedIds=groups.filter(g=>g.sharedGroupId).map(g=>g.sharedGroupId!);
  sharedIds.forEach(sharedId=>{loadSharedExpenses(sharedId);loadSharedMembers(sharedId);});
  if(!sharedIds.length)return;
  const channels=[
   ...sharedIds.map(sharedId=>supabase.channel("shared-expenses-"+sharedId)
    .on("postgres_changes",{event:"*",schema:"public",table:"shared_group_expenses",filter:`group_id=eq.${sharedId}`},payload=>{
     if(payload.eventType==="DELETE"){const id=String((payload.old as any)?.expense_id||"");if(!id)return;setExpenses(prev=>{const next=prev.filter(e=>e.id!==id);persist("expenses",next);return next;});return;}
     if(payload.new)upsertSharedExpenseLocal(payload.new);
    })),
   ...sharedIds.map(sharedId=>supabase.channel("shared-members-"+sharedId)
    .on("postgres_changes",{event:"*",schema:"public",table:"shared_group_members",filter:`group_id=eq.${sharedId}`},()=>loadSharedMembers(sharedId)))
  ];
  channels.forEach(channel=>channel.subscribe(status=>{if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")console.error("Shared realtime status:",status);}));
  return()=>{channels.forEach(channel=>{supabase.removeChannel(channel);});};
 },[user,cloudReady,groups.map(g=>g.id+":"+g.sharedGroupId).join("|")]);
 useEffect(()=>{
  if(!user||!cloudReady)return;
  const channel=supabase.channel("splitwise-invitations-"+user.id)
   .on("postgres_changes",{event:"*",schema:"public",table:"group_invitations"},()=>{
    supabase.from("group_invitations")
     .select("id,group_id,inviter_id,invitee_email,status,created_at")
     .eq("status","pending")
     .order("created_at",{ascending:false})
     .then(async({data,error})=>{if(error){console.error("Invitation realtime reload failed:",error);return;}const rows=data||[];const ids=Array.from(new Set(rows.map((x:any)=>x.group_id)));let names:Record<string,string>={};if(ids.length){const {data:groupRows}=await supabase.from("shared_groups").select("id,name").in("id",ids);(groupRows||[]).forEach((g:any)=>{names[g.id]=g.name;});}setInvitations(rows.map((x:any)=>({...x,group_name:names[x.group_id]||"Shared group"})));});
   })
   .subscribe(status=>{if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")console.error("Invitation realtime status:",status);});
  return()=>{supabase.removeChannel(channel);};
 },[user,cloudReady]);
 const sendInvite=async()=>{const g=groups.find(x=>x.id===inviteGroupId);const email=inviteEmail.trim().toLowerCase();if(!g||!user)return;if(!/^\S+@\S+\.\S+$/.test(email)){alert("Enter a valid email.");return;}if(email===String(user.email||"").toLowerCase()){alert("You cannot invite yourself.");return;}let sharedId=g.sharedGroupId;if(!sharedId){const {data,error}=await supabase.from("shared_groups").insert({owner_id:user.id,name:g.name}).select("id").single();if(error){alert(error.message||"Could not create shared group.");return;}sharedId=data.id;const {error:memberError}=await supabase.from("shared_group_members").insert({group_id:sharedId,user_id:user.id,role:"owner",display_name:accountName,email:String(user.email||"").toLowerCase()});if(memberError){alert(memberError.message||"Could not create group membership.");return;}const next=groups.map(x=>x.id===g.id?{...x,sharedGroupId:sharedId,updatedAt:Date.now()}:x);setGroups(next);persist("groups",next);await cloudSync({groups:next});}const {data:existing}=await supabase.from("group_invitations").select("id").eq("group_id",sharedId).eq("invitee_email",email).eq("status","pending").maybeSingle();if(existing){alert("An invitation is already pending for this email.");return;}const {error}=await supabase.from("group_invitations").insert({group_id:sharedId,inviter_id:user.id,invitee_email:email});if(error){alert(error.message||"Could not send invitation.");return;}setInviteEmail("");setModal(null);alert("Invitation sent.");};
 const respondInvite=async(inv:any,accept:boolean)=>{if(!user)return;const status=accept?"accepted":"declined";const {error}=await supabase.from("group_invitations").update({status,responded_at:new Date().toISOString()}).eq("id",inv.id);if(error){alert(error.message||"Could not update invitation.");return;}if(accept){const {error:memberError}=await supabase.from("shared_group_members").upsert({group_id:inv.group_id,user_id:user.id,role:"member",display_name:accountName,email:String(user.email||"").toLowerCase()},{onConflict:"group_id,user_id"});if(memberError){alert(memberError.message||"Could not join group.");return;}const {data:sg}=await supabase.from("shared_groups").select("id,name").eq("id",inv.group_id).single();if(sg&&!groups.some(g=>g.sharedGroupId===sg.id)){const ng:Group={id:crypto.randomUUID(),name:sg.name,members:["you"],sharedGroupId:sg.id,updatedAt:Date.now()};const next=[...groups,ng];setGroups(next);persist("groups",next);await cloudSync({groups:next});}}setInvitations(prev=>prev.filter(x=>x.id!==inv.id));};

 const loadProfile=async(id:string,email:string,fallbackName:string)=>{const {data}=await supabase.from("profiles").select("name,email").eq("id",id).maybeSingle();setAccountName(data?.name||fallbackName||"You");};
 const submitAuth=async()=>{const email=authEmail.trim().toLowerCase();if(!email){setAuthMessage("Enter your email.");return;}if(authMode!=="reset"&&authPassword.length<6){setAuthMessage("Password must be at least 6 characters.");return;}setAuthBusy(true);setAuthMessage("");try{if(authMode==="signup"){const name=authName.trim();if(!name){setAuthMessage("Enter your name.");return;}const {data,error}=await supabase.auth.signUp({email,password:authPassword,options:{data:{name}}});if(error)throw error;const signedUpUser=data.user;if(data.session&&signedUpUser){await supabase.from("profiles").upsert({id:signedUpUser.id,name,email},{onConflict:"id"});setAccountName(name);setUser(signedUpUser);setPeople(prev=>prev.map(p=>p.id==="you"?{...p,userId:signedUpUser.id,updatedAt:Date.now()}:p));setModal(null);}else{setAuthMessage("Account created. Check your email to confirm your account, then log in.");setAuthMode("login");}}else if(authMode==="login"){const {data,error}=await supabase.auth.signInWithPassword({email,password:authPassword});if(error)throw error;const signedInUser=data.user;if(signedInUser){await supabase.from("profiles").upsert({id:signedInUser.id,name:signedInUser.user_metadata?.name||"You",email},{onConflict:"id"});await loadProfile(signedInUser.id,email,signedInUser.user_metadata?.name||"You");setModal(null);}}else{const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});if(error)throw error;setAuthMessage("If an account exists for that email, a password reset link has been sent.");}}catch(e:any){setAuthMessage(e?.message||"Authentication failed.");}finally{setAuthBusy(false);}};
 const signOut=async()=>{await supabase.auth.signOut();setUser(null);setAccountName("You");};
 const person=(id:string)=>people.find(p=>p.id===id)?.name||"Unknown";
 const group=(id:string)=>groups.find(g=>g.id===id)?.name||"No group";
 const total=expenses.reduce((s,e)=>s+e.amount,0);
 const filteredExpenses=useMemo(()=>{const q=expenseSearch.trim().toLowerCase();const now=new Date();return expenses.filter(e=>{const d=new Date(e.createdAt);const matchesText=!q||[e.title,person(e.paidBy),group(e.groupId),...e.people.map(person)].some(v=>v.toLowerCase().includes(q));const matchesGroup=expenseGroupFilter==="all"||e.groupId===expenseGroupFilter;const matchesDate=expenseDateFilter==="all"||(expenseDateFilter==="month"&&d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth())||(expenseDateFilter==="year"&&d.getFullYear()===now.getFullYear());return matchesText&&matchesGroup&&matchesDate;}).sort((a,b)=>expenseSort==="oldest"?a.createdAt-b.createdAt:expenseSort==="amount"?b.amount-a.amount:b.createdAt-a.createdAt);},[expenses,expenseSearch,expenseGroupFilter,expenseDateFilter,expenseSort,people,groups]);
 const balances=useMemo(()=>{const b:Record<string,number>={};people.forEach(p=>b[p.id]=0);expenses.forEach(e=>{if(!e.people.length)return;b[e.paidBy]=(b[e.paidBy]||0)+e.amount;const split=e.splitMode||"equal";e.people.forEach(id=>{const share=split==="equal"?e.amount/e.people.length:Number(e.shares?.[id]??0);b[id]=(b[id]||0)-share;});});payments.forEach(p=>{b[p.from]=(b[p.from]||0)+p.amount;b[p.to]=(b[p.to]||0)-p.amount});return b;},[people,expenses,payments]);
 const saveExpense=async()=>{const n=Number(amount);if(!title.trim()||!Number.isFinite(n)||n<=0||selected.length===0)return;let splitShares:Record<string,number>={};if(splitMode!=="equal"){const vals=selected.map(id=>Number(shares[id]||0));if(vals.some(v=>!Number.isFinite(v)||v<0))return;const sum=vals.reduce((a,b)=>a+b,0);if(splitMode==="exact"&&Math.abs(sum-n)>.01)return;if(splitMode==="percent"&&Math.abs(sum-100)>.01)return;selected.forEach((id,i)=>splitShares[id]=splitMode==="percent"?n*vals[i]/100:vals[i]);}const old=expenses.find(e=>e.id===editingId);const now=Date.now();const e:Expense={id:editingId||crypto.randomUUID(),title:title.trim(),amount:n,paidBy,people:selected,groupId,createdAt:old?.createdAt||now,updatedAt:now,splitMode,shares:splitShares};const sg=user?groups.find(g=>g.id===e.groupId)?.sharedGroupId:null;if(sg){const published=await publishSharedExpense(e);if(!published){const nextLocal=editingId?expenses.map(x=>x.id===editingId?e:x):[e,...expenses];setExpenses(nextLocal);persist("expenses",nextLocal);const pending=load<string[]>("pendingSharedExpenseIds",[]);persist("pendingSharedExpenseIds",Array.from(new Set([...pending,e.id])));alert("Saved on this device. It will retry sharing when the connection is available.");return;}}const next=editingId?expenses.map(x=>x.id===editingId?e:x):[e,...expenses];setExpenses(next);persist("expenses",next);cloudSync({expenses:next});setTitle("");setAmount("");setEditingId(null);setSplitMode("equal");setShares({});setModal(null);};
 const addFriend=()=>{const name=friendName.trim();const email=friendEmail.trim().toLowerCase();if(!name)return;if(email&&!/^\S+@\S+\.\S+$/.test(email)){alert("Enter a valid email.");return;}if(email&&people.some(p=>p.email?.toLowerCase()===email)){alert("A friend with this email already exists.");return;}const p:Person={id:crypto.randomUUID(),name,updatedAt:Date.now(),...(email?{email}:{})};const next=[...people,p];setPeople(next);persist("people",next);cloudSync({people:next});setFriendName("");setFriendEmail("");setModal(null);};
 const openGroup=(g?:Group)=>{setEditingGroupId(g?.id||null);setGroupName(g?.name||"");setGroupMembers(g?[...g.members]:people.map(p=>p.id));setModal("group");}; const addGroup=()=>{const name=groupName.trim();if(!name||groupMembers.length===0)return;const next=editingGroupId?groups.map(g=>g.id===editingGroupId?{...g,name,members:groupMembers,updatedAt:Date.now()}:g):[...groups,{id:crypto.randomUUID(),name,members:groupMembers,updatedAt:Date.now()}];setGroups(next);persist("groups",next);cloudSync({groups:next});setGroupName("");setEditingGroupId(null);setGroupMembers([]);setModal(null);}; const deleteGroup=(id:string)=>{if(groups.length<=1){alert("Keep at least one group.");return;}if(!confirm("Delete this group? Existing expenses will remain in history."))return;const next=groups.filter(g=>g.id!==id);setGroups(next);persist("groups",next);markDeleted("groups",id);cloudSync({groups:next,deleted:{...deleted,groups:Array.from(new Set([...deleted.groups,id]))}});};
 const settle=()=>{const n=Number(amount);if(!Number.isFinite(n)||n<=0||settleFrom===settleTo)return;const next=[{id:crypto.randomUUID(),from:settleFrom,to:settleTo,amount:n,createdAt:Date.now(),updatedAt:Date.now()},...payments];setPayments(next);persist("payments",next);cloudSync({payments:next});setAmount("");setModal(null);};
 const removeExpense=async(id:string)=>{const old=expenses.find(e=>e.id===id);if(!old)return;const sg=user?groups.find(g=>g.id===old.groupId)?.sharedGroupId:null;if(sg){const {error}=await supabase.from("shared_group_expenses").delete().eq("expense_id",id);if(error){console.error("Shared expense delete failed:",error);alert(error.message||"Could not delete shared expense.");return;}}const next=expenses.filter(e=>e.id!==id);const nextDeleted={...deleted,expenses:Array.from(new Set([...deleted.expenses,id]))};setExpenses(next);persist("expenses",next);setDeleted(nextDeleted);persist("deleted",nextDeleted);cloudSync({expenses:next,deleted:nextDeleted});};
 const reportRows=useMemo(()=>filteredExpenses.map(e=>({Date:new Date(e.createdAt).toLocaleDateString("en-IN"),Description:e.title,Group:group(e.groupId),PaidBy:person(e.paidBy),Amount:Number(e.amount.toFixed(2)),Split:e.people.map(person).join(", "),Shared:groups.find(g=>g.id===e.groupId)?.sharedGroupId?"Yes":"No"})),[filteredExpenses,groups,people]);
 const saveReportFile=async(name:string,base64:string,mime:string)=>{
  try{
   const result=await Filesystem.writeFile({path:name,data:base64,directory:Directory.Documents,recursive:true});
   alert(`Report saved successfully: ${name}`);
   return result;
  }catch(error){
   console.error("Report save failed",error);
   alert("Could not save the report. Please check Android storage permission.");
   return null;
  }
 };
 const exportExcel=async()=>{
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(reportRows),"Expenses");
  const balanceRows=people.map(p=>({Person:p.name,Balance:Number((balances[p.id]||0).toFixed(2)),Status:Math.abs(balances[p.id]||0)<.005?"Settled":(balances[p.id]>0?"Owes you":"You owe")}));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(balanceRows),"Balances");
  const paymentRows=payments.map(p=>({Date:new Date(p.createdAt).toLocaleDateString("en-IN"),From:person(p.from),To:person(p.to),Amount:Number(p.amount.toFixed(2))}));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(paymentRows),"Settlements");
  const base64=XLSX.write(wb,{bookType:"xlsx",type:"base64"});
  await saveReportFile(`splitwise-report-${new Date().toISOString().slice(0,10)}.xlsx`,base64,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
 };
 const exportCSV=async()=>{
  const csv=XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(reportRows));
  const base64=btoa(unescape(encodeURIComponent(csv)));
  await saveReportFile(`splitwise-expenses-${new Date().toISOString().slice(0,10)}.csv`,base64,"text/csv");
 };
 const exportPDF=async()=>{
  const doc=new jsPDF({unit:"mm",format:"a4"});
  const margin=14;let y=18;
  doc.setFontSize(18);doc.text("Splitwise Expense Report",margin,y);y+=8;
  doc.setFontSize(9);doc.text(`Generated ${new Date().toLocaleString("en-IN")} · ${filteredExpenses.length} expenses · Total ${money(filteredExpenses.reduce((s,e)=>s+e.amount,0))}`,margin,y);y+=8;
  const headers=["Date","Description","Group","Paid by","Amount"];const widths=[22,52,38,32,34];
  const drawHeader=()=>{let x=margin;doc.setFont("helvetica","bold");headers.forEach((h,i)=>{doc.text(h,x,y);x+=widths[i];});doc.setFont("helvetica","normal");y+=6;};
  drawHeader();
  reportRows.forEach((r:any)=>{if(y>282){doc.addPage();y=18;drawHeader();}const vals=[r.Date,String(r.Description).slice(0,28),String(r.Group).slice(0,20),String(r.PaidBy).slice(0,18),money(r.Amount)];let x=margin;vals.forEach((v,i)=>{doc.text(v,x,y);x+=widths[i];});y+=6;});
  const base64=doc.output("datauristring").split(",")[1];
  await saveReportFile(`splitwise-report-${new Date().toISOString().slice(0,10)}.pdf`,base64,"application/pdf");
 };
 const exportBackup=()=>{
  const backup={version:1,app:"Splitwise",exportedAt:new Date().toISOString(),people,groups,expenses,payments};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url; a.download=`splitwise-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
 };
 const restoreBackup=(file:File)=>{
  const reader=new FileReader();
  reader.onload=()=>{
   try{
    const data=JSON.parse(String(reader.result));
    if(!data||data.version!==1||!Array.isArray(data.people)||!Array.isArray(data.groups)||!Array.isArray(data.expenses)||!Array.isArray(data.payments)) throw new Error("Invalid backup");
    if(!confirm("Restore this backup? Your current groups, friends, expenses, and settlements will be replaced.")) return;
    setPeople(data.people); setGroups(data.groups); setExpenses(data.expenses); setPayments(data.payments);
    persist("people",data.people); persist("groups",data.groups); persist("expenses",data.expenses); persist("payments",data.payments);
    alert("Backup restored successfully.");
   }catch{ alert("This file is not a valid Splitwise backup."); }
  };
  reader.readAsText(file);
 };
 const openExpense=()=>{setEditingId(null);setTitle("");setAmount("");setPaidBy("you");setGroupId(groups[0]?.id||"");setSelected(groups[0]?.members||people.map(p=>p.id));setSplitMode("equal");setShares({});setModal("expense");}; const editExpense=(e:Expense)=>{setEditingId(e.id);setTitle(e.title);setAmount(String(e.amount));setPaidBy(e.paidBy);setGroupId(e.groupId);setSelected(e.people);setSplitMode(e.splitMode||"equal");setShares(Object.fromEntries(e.people.map(id=>[id,String(e.splitMode==="percent"?(e.shares?.[id]||0)*100/e.amount:(e.shares?.[id]??0))])));setModal("expense");};
 const debtors=people.filter(p=>(balances[p.id]||0)<-.005), creditors=people.filter(p=>(balances[p.id]||0)>.005);
 const nav=[{n:"Home",I:Home},{n:"Groups",I:Users},{n:"Activity",I:ReceiptText},{n:"Friends",I:Users},{n:"Balances",I:Wallet}];
 return <div className="app"><header><div className="logo"><b>S</b> Splitwise</div><button className="avatar" aria-label={user?"Account":"Log in"} onClick={()=>{setAuthMessage("");setAuthMode("login");setModal("auth")}}>{user?(accountName[0]?.toUpperCase()||"Y"):<LogIn size={18}/>}</button></header><main>
 <p className="eyebrow">YOUR EXPENSES</p><h1>{tab==="Home"?"Hey, You":tab}</h1><p className="muted">Keep track of shared expenses, simply.</p>{user&&<p className="muted">{syncing?"Syncing to cloud…":"Cloud sync on"}</p>}
 {tab==="Home"&&<><section className="balance"><small>TOTAL SHARED EXPENSES</small><h2>{money(total)}</h2><p>{expenses.length} expenses · saved on this device</p></section><div className="section"><h3>Balances</h3><button className="link" onClick={()=>setTab("Balances")}>Details</button></div>
 <div className="section"><h3>Backup & Restore</h3></div>
 <div className="section"><h3>Reports & Export</h3></div>
 <button className="add" onClick={exportPDF}><Download size={18}/> Export PDF report</button>
 <button className="add" onClick={exportExcel}><Download size={18}/> Export Excel report</button>
 <button className="add" onClick={exportCSV}><Download size={18}/> Export CSV</button>
 <button className="add" onClick={exportBackup}><Download size={18}/> Export backup</button>
 <button className="add" onClick={()=>restoreInputRef.current?.click()}><Upload size={18}/> Restore backup</button>
 <input ref={restoreInputRef} type="file" accept="application/json,.json" hidden onChange={e=>{const file=e.target.files?.[0];if(file)restoreBackup(file);e.currentTarget.value="";}}/>{people.filter(p=>p.id!=="you").map(p=><div className="tile" key={p.id}><span className="friend">{p.name[0]?.toUpperCase()}</span><div className="grow"><b>{p.name}</b><p>{Math.abs(balances[p.id]||0)<.005?"All settled":(balances[p.id]>0?"owes you ":"you owe ")+money(Math.abs(balances[p.id]||0))}</p></div></div>)}<div className="section"><h3>Recent expenses</h3><button className="link" onClick={()=>setTab("Activity")}>See all</button></div><ExpenseList expenses={expenses.slice(0,4)} person={person} group={group} remove={removeExpense} edit={editExpense} groups={groups}/></>}
 {tab==="Activity"&&<><div className="section"><h3>All expenses</h3><span className="muted">{filteredExpenses.length} of {expenses.length}</span></div><input aria-label="Search expenses" value={expenseSearch} onChange={e=>setExpenseSearch(e.target.value)} placeholder="Search description, person..."/><div className="filters"><select aria-label="Filter by group" value={expenseGroupFilter} onChange={e=>setExpenseGroupFilter(e.target.value)}><option value="all">All groups</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><select aria-label="Filter by date" value={expenseDateFilter} onChange={e=>setExpenseDateFilter(e.target.value)}><option value="all">Any date</option><option value="month">This month</option><option value="year">This year</option></select><select aria-label="Sort expenses" value={expenseSort} onChange={e=>setExpenseSort(e.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="amount">Highest amount</option></select></div><ExpenseList expenses={filteredExpenses} person={person} group={group} remove={removeExpense} edit={editExpense} groups={groups}/><div className="section"><h3>Settlements</h3></div>{payments.map(p=><div className="expense" key={p.id}><div className="date"><Check size={18}/></div><div className="grow"><b>Settlement</b><p>{person(p.from)} paid {person(p.to)}</p></div><strong>{money(p.amount)}</strong></div>)}</>}
 {tab==="Groups"&&<><div className="section"><h3>Invitations</h3></div>{!user&&<p className="muted">Log in to receive shared-group invitations.</p>}{user&&invitations.length===0&&<p className="muted">No pending invitations.</p>}{invitations.map(inv=><div className="tile" key={inv.id}><Users/><div className="grow"><b>{inv.group_name||"Shared group"}</b><p>Invitation to join this shared group</p></div><button className="link" onClick={()=>respondInvite(inv,true)}>Accept</button><button className="iconbtn" onClick={()=>respondInvite(inv,false)}><X size={16}/></button></div>)}<div className="section"><h3>Your groups</h3></div>{groups.map(g=><div className="tile" key={g.id}><Users/><div className="grow"><b>{g.name}</b><p>{g.members.map(person).join(", ")}</p><p>{g.members.length} members{g.sharedGroupId?" · shared":""}</p>{g.sharedGroupId&&<><p>{(sharedMembers[g.sharedGroupId]||[]).map((m:any)=>m.display_name||m.email).filter(Boolean).join(", ")||"Loading members…"}</p>{sharedMembers[g.sharedGroupId]?.some((m:any)=>m.user_id===user?.id&&m.role==="owner")&&<div className="checks">{(sharedMembers[g.sharedGroupId]||[]).filter((m:any)=>m.user_id!==user?.id).map((m:any)=><button className="link" key={m.user_id} onClick={()=>removeSharedMember(g,m)}>Remove {m.display_name||m.email||"member"}</button>)}</div>}</>}</div><button className="link" onClick={()=>openGroup(g)}>Manage</button>{g.sharedGroupId&&<button className="link" onClick={()=>leaveSharedGroup(g)}>Leave</button>}<button className="link" onClick={()=>openInvite(g)}>Share</button>{(!g.sharedGroupId||sharedMembers[g.sharedGroupId]?.some((m:any)=>m.user_id===user?.id&&m.role==="owner"))&&<button className="iconbtn" aria-label="Delete group" onClick={()=>deleteGroup(g.id)}><Trash2 size={16}/></button>}</div>)}<button className="add" onClick={()=>openGroup()}><Plus size={18}/> Create group</button></>}
 {tab==="Friends"&&<>{people.map(p=><div className="tile" key={p.id}><span className="friend">{p.name[0]?.toUpperCase()}</span><div className="grow"><b>{p.name}</b><p>{p.id==="you"?"Your account":(balances[p.id]||0)>.005?"Owes you "+money(balances[p.id]):(balances[p.id]||0)<-.005?"You owe "+money(-balances[p.id]):"Settled up"}</p></div></div>)}<button className="add" onClick={()=>setModal("friend")}><UserPlus size={18}/> Add a friend</button></>}
 {tab==="Balances"&&<><section className="balance"><small>YOUR NET BALANCE</small><h2>{money(balances.you||0)}</h2><p>Positive means you are owed; negative means you owe.</p></section><h3>People who owe</h3>{creditors.map(p=><div className="tile" key={p.id}><div className="grow"><b>{person(p.id)}</b></div><strong>{money(balances[p.id])}</strong><button className="link" onClick={()=>{setSettleFrom("you");setSettleTo(p.id);setAmount(String(balances[p.id].toFixed(2)));setModal("settle")}}>Settle</button></div>)}<h3>People you owe</h3>{debtors.map(p=><div className="tile" key={p.id}><div className="grow"><b>{person(p.id)}</b></div><strong>{money(-balances[p.id])}</strong><button className="link" onClick={()=>{setSettleFrom(p.id);setSettleTo("you");setAmount(String((-balances[p.id]).toFixed(2)));setModal("settle")}}>Settle</button></div>)}</>}
 {tab==="Stats"&&<section className="balance"><small>ALL-TIME SPENDING</small><h2>{money(total)}</h2><p>Across {expenses.length} expenses</p></section>}
 <button className="add" onClick={openExpense}><Plus size={19}/> Add an expense</button>
 </main><nav>{nav.map(({n,I})=><button className={tab===n?"active":""} onClick={()=>setTab(n)} key={n}><I/><span>{n}</span></button>)}</nav>
 {modal&&<div className="overlay"><section className="sheet"><div className="sheethead"><h2>{modal==="expense"?(editingId?"Edit expense":"Add an expense"):modal==="friend"?"Add a friend":modal==="group"?(editingGroupId?"Edit group":"Create a group"):modal==="auth"?(user?"Account":"Log in"):modal==="invite"?"Invite to group":"Record settlement"}</h2><button className="close" onClick={()=>setModal(null)}><X/></button></div>
 {modal==="expense"&&<><label>Description</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What was it for?"/><label>Amount (₹)</label><input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/><label>Paid by</label><select value={paidBy} onChange={e=>setPaidBy(e.target.value)}>{people.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select><label>Group</label><select value={groupId} onChange={e=>{setGroupId(e.target.value);setSelected(groups.find(g=>g.id===e.target.value)?.members||[])}}>{groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select><label>Split type</label><select value={splitMode} onChange={e=>setSplitMode(e.target.value as "equal"|"exact"|"percent")}><option value="equal">Equally</option><option value="exact">Exact amounts</option><option value="percent">Percentages</option></select><label>{splitMode==="equal"?"Split equally between":splitMode==="exact"?"Share amount for each person (₹)":"Share percentage for each person (%)"}</label><div className="checks">{people.map(p=><label className="check" key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={e=>setSelected(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/>{p.name}{splitMode!=="equal"&&<input className="share-input" type="number" min="0" value={shares[p.id]||""} placeholder={splitMode==="percent"?"%":"₹"} onChange={e=>setShares({...shares,[p.id]:e.target.value})}/>}</label>)}</div><p className="muted">{splitMode==="equal"?"Each selected person gets an equal share.":splitMode==="exact"?"Exact shares must add up to the expense total.":"Percentages must add up to 100%."} Saved on this device.</p><button className="save" onClick={saveExpense}><Check/> Save expense</button></>}
 {modal==="invite"&&<><label>Group</label><select value={inviteGroupId||""} onChange={e=>setInviteGroupId(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><label>Friend's email</label><input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="friend@example.com"/><p className="muted">They can accept this invitation when they log in with this email.</p><button className="save" onClick={sendInvite}>Send invitation</button></>}{modal==="friend"&&<><label>Friend's name</label><input value={friendName} onChange={e=>setFriendName(e.target.value)} placeholder="Name"/><label>Email (optional)</label><input type="email" value={friendEmail} onChange={e=>setFriendEmail(e.target.value)} placeholder="friend@example.com"/><p className="muted">Add an email so this friend can be linked to their account later.</p><button className="save" onClick={addFriend}>Add friend</button></>}
 {modal==="group"&&<><label>Group name</label><input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="e.g. Weekend trip"/><label>Members</label><div className="checks">{people.map(p=><label className="check" key={p.id}><input type="checkbox" checked={groupMembers.includes(p.id)} onChange={e=>setGroupMembers(e.target.checked?[...groupMembers,p.id]:groupMembers.filter(id=>id!==p.id))}/>{p.name}</label>)}</div><p className="muted">Choose who belongs to this group. Existing expenses are preserved when you edit membership.</p><button className="save" onClick={addGroup}>{editingGroupId?"Save group":"Create group"}</button></>}
 {modal==="auth"&&(user?<><div className="tile"><span className="friend">{accountName[0]?.toUpperCase()||"Y"}</span><div className="grow"><b>{accountName}</b><p>{user.email}</p></div></div><p className="muted">Your Splitwise account is connected. Cloud data sync is enabled.</p><button className="save" onClick={signOut}><LogOut size={18}/> Log out</button></>:<><label>{authMode==="signup"?"Your name":"Email"}</label>{authMode==="signup"&&<input value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Your name" autoComplete="name"/>}<input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/>{authMode!=="reset"&&<><label>Password</label><input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={authMode==="signup"?"new-password":"current-password"}/></>}<p className="muted">{authMessage|| (authMode==="signup"?"Create an account to sync your Splitwise data in the cloud.":"Sign in to your Splitwise account.")}</p><button className="save" onClick={submitAuth} disabled={authBusy}>{authBusy?"Please wait…":authMode==="signup"?"Create account":authMode==="reset"?"Send reset link":"Log in"}</button><button className="link" onClick={()=>{setAuthMessage("");setAuthMode(authMode==="login"?"signup":"login")}}>{authMode==="login"?"Create a new account":authMode==="signup"?"Already have an account? Log in":"Back to login"}</button>{authMode==="login"&&<button className="link" onClick={()=>{setAuthMessage("");setAuthMode("reset")}}>Forgot password?</button>}</>)}
 {modal==="settle"&&<><label>From</label><select value={settleFrom} onChange={e=>setSettleFrom(e.target.value)}>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><label>To</label><select value={settleTo} onChange={e=>setSettleTo(e.target.value)}>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><label>Amount (₹)</label><input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)}/><button className="save" onClick={settle}><Check/> Record payment</button></>}
 </section></div>}</div>
}
function ExpenseList({expenses,person,group,remove,edit,groups}:{expenses:Expense[];person:(id:string)=>string;group:(id:string)=>string;remove:(id:string)=>void;edit:(e:Expense)=>void;groups:Group[]}){return <div>{expenses.map(e=><div className="expense" key={e.id}><div className="date"><small>{new Date(e.createdAt).toLocaleDateString("en",{month:"short"})}</small><b>{new Date(e.createdAt).getDate()}</b></div><div className="grow"><b>{e.title}</b><p>{group(e.groupId)}{groups.find(g=>g.id===e.groupId)?.sharedGroupId?" · Shared":""} · {person(e.paidBy)} paid · split {e.people.length} ways</p></div><strong>{money(e.amount)}</strong><button className="iconbtn" aria-label="Edit expense" onClick={()=>{edit(e)}}><ReceiptText size={16}/></button><button className="iconbtn" aria-label="Delete expense" onClick={()=>{if(confirm("Delete this expense?"))remove(e.id)}}><Trash2 size={16}/></button></div>)}</div>}
