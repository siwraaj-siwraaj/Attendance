import { useEffect, useMemo, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Home, Users, ReceiptText, Plus, X, Wallet, Trash2, Check, UserPlus, Download, Upload, LogIn, LogOut, Image as ImageIcon, FileText, BarChart3, Tag, Moon, Sun } from "lucide-react";
import { supabase } from "./lib/supabase";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { Share } from "@capacitor/share";
import { LocalNotifications } from "@capacitor/local-notifications";

type Person = { id: string; name: string; email?: string; userId?: string; updatedAt?: number };
type Group = { id: string; name: string; members: string[]; updatedAt?: number; sharedGroupId?: string };
type Expense = { id: string; title: string; amount: number; paidBy: string; people: string[]; groupId: string; createdAt: number; updatedAt?: number; splitMode?: "equal"|"exact"|"percent"; shares?: Record<string,number>; category?: string; currency?: string; originalAmount?: number; receiptData?: string; receiptName?: string };
type Payment = { id: string; from: string; to: string; amount: number; createdAt: number; updatedAt?: number };
const me = "You";
const initialPeople: Person[] = [{id:"you",name:me},{id:"alex",name:"Alex"},{id:"sam",name:"Sam"},{id:"jordan",name:"Jordan"}];
const initialGroups: Group[] = [{id:"apartment",name:"Apartment",members:["you","alex","sam"]},{id:"goa",name:"Goa trip",members:["you","alex","sam","jordan"]}];
const load = <T,>(key:string, fallback:T):T => { try { const v=localStorage.getItem("swp_"+key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } };
const CURRENCIES=[["INR","₹",1],["USD","$",83],["EUR","€",90],["GBP","£",105],["AED","د.إ",22.6],["CAD","C$",60],["AUD","A$",55],["SGD","S$",62],["JPY","¥",0.56]] as const; const currencyInfo=(code:string)=>CURRENCIES.find(x=>x[0]===code)||CURRENCIES[0]; const money=(n:number,currency="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(n); const expenseINR=(e:Expense)=>Number(e.amount)||0; const expenseLabel=(e:Expense)=>e.currency&&e.currency!=="INR"&&e.originalAmount!=null?`${money(e.originalAmount,e.currency)} · ${money(expenseINR(e))}`:money(expenseINR(e));
const ensureNotificationPermission=async()=>{
 try{
  const current=await LocalNotifications.checkPermissions();
  if(current.display!=="granted") await LocalNotifications.requestPermissions();
 }catch(error){console.warn("Notification permission unavailable",error);}
};
const notifyReportSaved=async(name:string)=>{
 try{
  await ensureNotificationPermission();
  const permission=await LocalNotifications.checkPermissions();
  if(permission.display==="granted"){
   await LocalNotifications.schedule({notifications:[{id:Date.now()%2147483647,title:"ShiWise report downloaded",body:name,smallIcon:"ic_stat_icon_config_sample",extra:{fileName:name}}]});
  }
 }catch(error){console.warn("Download notification failed",error);}
};
export default function App(){
 const [tab,setTab]=useState("Home");
 const [darkMode,setDarkMode]=useState(()=>load("darkMode",false));
 const [user,setUser]=useState<any>(null); const [accountName,setAccountName]=useState("You");
 const [authMode,setAuthMode]=useState<"login"|"signup"|"reset">("login"); const [authEmail,setAuthEmail]=useState(""); const [authPassword,setAuthPassword]=useState(""); const [authName,setAuthName]=useState(""); const [authBusy,setAuthBusy]=useState(false); const [authMessage,setAuthMessage]=useState("");
 const [expenseSearch,setExpenseSearch]=useState(""); const [expenseGroupFilter,setExpenseGroupFilter]=useState("all"); const [expenseDateFilter,setExpenseDateFilter]=useState("all"); const [expenseSort,setExpenseSort]=useState("newest"); const [expenseCategoryFilter,setExpenseCategoryFilter]=useState("all"); const categories=["Food","Travel","Hotel","Shopping","Entertainment","Bills","Other"];
 const [people,setPeople]=useState<Person[]>(()=>load("people",initialPeople));
 const [groups,setGroups]=useState<Group[]>(()=>load("groups",initialGroups));
 const [expenses,setExpenses]=useState<Expense[]>(()=>{const raw=load<any[]>("expenses",[]);const ids:Record<string,string>={You:"you",Alex:"alex",Sam:"sam",Jordan:"jordan"};return raw.map((e:any)=>({id:String(e.id??crypto.randomUUID()),title:String(e.title??"Expense"),amount:Number(e.amount)||0,paidBy:ids[e.paidBy]||e.paidBy||"you",people:Array.isArray(e.people)?e.people.map((p:string)=>ids[p]||p):["you"],groupId:groups.find(g=>g.name===(e.group||e.groupId))?.id||"apartment",createdAt:Number(e.createdAt)||Number(e.id)||Date.now(),splitMode:e.splitMode||"equal",shares:e.shares||{},category:e.category||"Other"}));});
 const [payments,setPayments]=useState<Payment[]>(()=>load("payments",[]));
 const [modal,setModal]=useState<"expense"|"friend"|"group"|"settle"|"auth"|"invite"|"detail"|null>(null);
 const restoreInputRef=useRef<HTMLInputElement>(null);
 const [title,setTitle]=useState(""); const [amount,setAmount]=useState(""); const [currency,setCurrency]=useState("INR"); const [category,setCategory]=useState("Other"); const [receiptData,setReceiptData]=useState(""); const [receiptName,setReceiptName]=useState(""); const [detailExpense,setDetailExpense]=useState<Expense|null>(null); const [splitMode,setSplitMode]=useState<"equal"|"exact"|"percent">("equal"); const [shares,setShares]=useState<Record<string,string>>({}); const [editingId,setEditingId]=useState<string|null>(null); const [paidBy,setPaidBy]=useState("you"); const [groupId,setGroupId]=useState("apartment"); const [selected,setSelected]=useState<string[]>(["you","alex","sam"]);
 const [friendName,setFriendName]=useState(""); const [friendEmail,setFriendEmail]=useState(""); const [groupName,setGroupName]=useState(""); const [editingGroupId,setEditingGroupId]=useState<string|null>(null); const [groupMembers,setGroupMembers]=useState<string[]>([]); const [settleFrom,setSettleFrom]=useState("alex"); const [settleTo,setSettleTo]=useState("you"); const [inviteGroupId,setInviteGroupId]=useState<string|null>(null); const [inviteEmail,setInviteEmail]=useState(""); const [invitations,setInvitations]=useState<any[]>([]); const [friendInvitations,setFriendInvitations]=useState<any[]>([]); const [sharedMembers,setSharedMembers]=useState<Record<string,any[]>>({});
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
 useEffect(()=>{persist("darkMode",darkMode);document.documentElement.classList.toggle("dark",darkMode);},[darkMode]);
 useEffect(()=>{let active=true;const handle=(url?:string|null)=>{if(active&&url?.startsWith("shiwise://quick-add"))openExpense();};CapacitorApp.getLaunchUrl().then(result=>handle(result?.url));const listener=CapacitorApp.addListener("appUrlOpen",({url})=>handle(url));return()=>{active=false;listener.then(h=>h.remove());};},[]);
 useEffect(()=>{let mounted=true; supabase.auth.getSession().then(async({data})=>{if(!mounted)return;setUser(data.session?.user??null);if(data.session?.user){await loadProfile(data.session.user.id,data.session.user.email??"",data.session.user.user_metadata?.name??"");await loadCloudData(data.session.user.id);}else setCloudReady(true);}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(mounted){setUser(session?.user??null);setCloudReady(false);if(session?.user){loadProfile(session.user.id,session.user.email??"",session.user.user_metadata?.name??"").then(()=>loadCloudData(session.user.id));}else setCloudReady(true);}}); return()=>{mounted=false;subscription.unsubscribe();};},[]);

 useEffect(()=>{if(user&&cloudReady)cloudSync();},[people,groups,expenses,payments,user,cloudReady,deleted]);
 useEffect(()=>{if(!user||!cloudReady){setInvitations([]);return;} let active=true; supabase.from("group_invitations").select("id,group_id,inviter_id,invitee_email,status,created_at").eq("status","pending").ilike("invitee_email",String(user.email||"")).neq("inviter_id",user.id).order("created_at",{ascending:false}).then(async({data,error})=>{if(!active)return;if(error){console.error("Invitation load failed:",error);setInvitations([]);return;}const rows=data||[];const ids=Array.from(new Set(rows.map((x:any)=>x.group_id)));let names:Record<string,string>={};if(ids.length){const {data:groupRows}=await supabase.from("shared_groups").select("id,name").in("id",ids);(groupRows||[]).forEach((g:any)=>{names[g.id]=g.name;});}if(active)setInvitations(rows.map((x:any)=>({...x,group_name:names[x.group_id]||"Shared group"})));});return()=>{active=false;};},[user,cloudReady]);
 const currentEmailForPerson=(list:Person[],uid:string)=>String(list.find(p=>p.userId===uid)?.email||"").trim().toLowerCase();
 const syncAcceptedFriendInvitations=async(rows:any[])=>{
  if(!user)return;
  let changed=false;
  const nextPeople=[...people];
  for(const inv of rows){
   if(inv.status!=="accepted")continue;
   const otherId=inv.inviter_id===user.id?inv.invitee_id:inv.inviter_id;
   if(!otherId||otherId===user.id)continue;
   const isInviter=inv.inviter_id===user.id;
   const name=String(isInviter?inv.invitee_name:inv.inviter_name||"Friend").trim()||"Friend";
   const email=String(isInviter?inv.invitee_email:"").trim().toLowerCase();
   const existingEmail=nextPeople.findIndex(p=>email&&p.email?.toLowerCase()===email);
   const idx=nextPeople.findIndex(p=>p.userId===otherId);
   const targetIndex=existingEmail>=0?existingEmail:idx;
   if(targetIndex>=0){
    const current=nextPeople[targetIndex];
    if(current.userId!==otherId||current.name!==name||(email&&current.email!==email)){
     nextPeople[targetIndex]={...current,userId:otherId,name,...(email?{email}:{}),updatedAt:Date.now()};changed=true;
    }
    for(let i=nextPeople.length-1;i>=0;i--){if(i!==targetIndex&&nextPeople[i].userId===otherId){nextPeople.splice(i,1);changed=true;}}
   }else{nextPeople.push({id:`friend-${otherId}`,name,userId:otherId,...(email?{email}:{}),updatedAt:Date.now()});changed=true;}
   if(isInviter){
    const localPerson=nextPeople.find(p=>p.userId===otherId);
    if(localPerson){
     for(const g of groups){
      if(!g.sharedGroupId||!g.members.includes(localPerson.id))continue;
      const {data:ownerRow}=await supabase.from("shared_group_members").select("user_id").eq("group_id",g.sharedGroupId).eq("user_id",user.id).eq("role","owner").maybeSingle();
      if(!ownerRow)continue;
      const {error:memberError}=await supabase.from("shared_group_members").upsert({group_id:g.sharedGroupId,user_id:otherId,role:"member",display_name:name,email:email||currentEmailForPerson(nextPeople,otherId)},{onConflict:"group_id,user_id"});
      if(memberError)console.error("Accepted friend shared-group link failed:",memberError);
     }
    }
   }
  }
  if(changed){setPeople(nextPeople);persist("people",nextPeople);await cloudSync({people:nextPeople});}
 };
 useEffect(()=>{
  if(!user||!cloudReady){setFriendInvitations([]);return;}
  let active=true;
  const loadFriendInvites=async()=>{
   const {data,error}=await supabase.from("friend_invitations").select("id,inviter_id,invitee_email,invitee_id,status,created_at,responded_at,inviter_name,invitee_name").in("status",["pending","accepted"]).or("invitee_email.ilike."+String(user.email||"")+",inviter_id.eq."+user.id).order("created_at",{ascending:false});
   if(!active)return;
   if(error){console.error("Friend invitation load failed:",error);setFriendInvitations([]);return;}
   const rows=data||[];
   setFriendInvitations(rows.filter((x:any)=>x.status==="pending"&&String(x.invitee_email||"").toLowerCase()===String(user.email||"").toLowerCase()));
   await syncAcceptedFriendInvitations(rows);
  };
  loadFriendInvites();
  const channel=supabase.channel("shiwise-friend-invitations-"+user.id).on("postgres_changes",{event:"*",schema:"public",table:"friend_invitations"},()=>loadFriendInvites()).subscribe();
  return()=>{active=false;supabase.removeChannel(channel);};
 },[user,cloudReady]);
 const respondFriendInvite=async(inv:any,accept:boolean)=>{
  if(!user)return;
  const {error}=await supabase.from("friend_invitations").update({status:accept?"accepted":"declined",invitee_id:user.id,invitee_name:accountName,responded_at:new Date().toISOString()}).eq("id",inv.id);
  if(error){alert(error.message||"Could not update friend invitation.");return;}
  setFriendInvitations(prev=>prev.filter(x=>x.id!==inv.id));
 };
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
  const aliases:Record<string,string>={};
  rows.forEach((r:any)=>{
   const uid=String(r.user_id);
   const email=String(r.email||"").trim().toLowerCase();
   const name=uid===user?.id ? (accountName||"You") : (String(r.display_name||r.email||"Shared member").trim()||"Shared member");
   const accountIndex=uid===user?.id ? nextPeople.findIndex(p=>p.id==="you") : -1;
   const userIndex=nextPeople.findIndex(p=>p.userId===uid);
   const emailIndex=email ? nextPeople.findIndex(p=>String(p.email||"").trim().toLowerCase()===email) : -1;
   const existingIndex=accountIndex>=0 ? accountIndex : (userIndex>=0 ? userIndex : emailIndex);
   const keepId=existingIndex>=0 ? nextPeople[existingIndex].id : `shared-${uid}`;
   const merged:Person={...(existingIndex>=0?nextPeople[existingIndex]:{id:keepId}),name,userId:uid,...(email?{email}:{}),updatedAt:Date.now()};
   if(existingIndex>=0) nextPeople[existingIndex]=merged;
   else nextPeople.push(merged);
   for(let i=nextPeople.length-1;i>=0;i--){
    if(i===existingIndex)continue;
    const sameUser=nextPeople[i].userId===uid;
    const sameEmail=!!email&&String(nextPeople[i].email||"").trim().toLowerCase()===email;
    if(sameUser||sameEmail)nextPeople.splice(i,1);
   }
  });
  const nextGroups=groups.map(x=>({
   ...x,
   members:Array.from(new Set(x.members.map(id=>aliases[id]||id))),
   updatedAt:Object.keys(aliases).length?Date.now():x.updatedAt
  }));
  const nextExpenses=expenses.map(e=>({
   ...e,
   paidBy:aliases[e.paidBy]||e.paidBy,
   people:Array.from(new Set(e.people.map(id=>aliases[id]||id))),
   shares:e.shares?Object.fromEntries(Object.entries(e.shares).map(([id,v])=>[aliases[id]||id,v])):e.shares
  }));
  const nextPayments=payments.map(p=>({...p,from:aliases[p.from]||p.from,to:aliases[p.to]||p.to}));
  setPeople(nextPeople);persist("people",nextPeople);
  setGroups(nextGroups);persist("groups",nextGroups);
  setExpenses(nextExpenses);persist("expenses",nextExpenses);
  setPayments(nextPayments);persist("payments",nextPayments);
  const linked=rows.map((r:any)=>nextPeople.find(p=>p.userId===String(r.user_id))?.id||`shared-${r.user_id}`);
  const linkedSet=new Set(linked);
  const updatedGroups=nextGroups.map(x=>{
   if(x.sharedGroupId!==sharedId)return x;
   const localOnly=x.members.filter(id=>{
    const p=nextPeople.find(person=>person.id===id);
    return !p?.userId;
   });
   return {...x,members:Array.from(new Set([...localOnly,...linkedSet])),updatedAt:Date.now()};
  });
  setGroups(updatedGroups);persist("groups",updatedGroups);
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
  const {data:members,error:memberError}=await supabase.from("shared_group_members").select("user_id,email,display_name").eq("group_id",g.sharedGroupId);
  if(memberError){alert(memberError.message||"Could not load shared members.");return false;}
  const memberRows=members||[];
  const memberIds=new Set(memberRows.map((m:any)=>String(m.user_id)));
  const localToUser=new Map<string,string>();
  people.forEach(p=>{if(p.userId)localToUser.set(p.id,p.userId);});
  localToUser.set("you",user.id);
  const emailToUser=new Map<string,string>();
  memberRows.forEach((m:any)=>{const email=String(m.email||"").trim().toLowerCase();if(email)emailToUser.set(email,String(m.user_id));});
  const resolveUserId=(id:string)=>{
   const direct=localToUser.get(id);
   if(direct)return direct;
   const person=people.find(p=>p.id===id);
   const email=String(person?.email||"").trim().toLowerCase();
   return email?emailToUser.get(email):undefined;
  };
  const payerUid=resolveUserId(e.paidBy);
  const participantUids=e.people.map(resolveUserId).filter(Boolean) as string[];
  if(!payerUid||!memberIds.has(payerUid)||participantUids.length!==e.people.length||participantUids.some(uid=>!memberIds.has(uid))){
   alert("Every person in a shared expense must be a member of the shared group. Add/accept the friend in the shared group first.");
   return false;
  }
  const sharesUserIds=e.shares?Object.fromEntries(Object.entries(e.shares).map(([id,v])=>[resolveUserId(id)||id,v])):{};
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
  let active=true;
  const discoverSharedGroups=async()=>{
   const {data:members,error}=await supabase.from("shared_group_members").select("group_id").eq("user_id",user.id);
   if(!active||error)return;
   const ids=Array.from(new Set((members||[]).map((m:any)=>String(m.group_id))));
   if(!ids.length)return;
   const {data:sgs}=await supabase.from("shared_groups").select("id,name").in("id",ids);
   if(!active)return;
   const existing=new Set(groups.map(g=>g.sharedGroupId).filter(Boolean));
   let next=[...groups]; let changed=false;
   for(const sg of sgs||[]){
    if(existing.has(sg.id))continue;
    next.push({id:`shared-group-${sg.id}`,name:sg.name,members:["you"],sharedGroupId:sg.id,updatedAt:Date.now()});changed=true;
   }
   if(changed){setGroups(next);persist("groups",next);await cloudSync({groups:next});}
  };
  discoverSharedGroups();
  return()=>{active=false;};
 },[user,cloudReady]);
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
  const channel=supabase.channel("shiwise-invitations-"+user.id)
   .on("postgres_changes",{event:"*",schema:"public",table:"group_invitations"},()=>{
    supabase.from("group_invitations")
     .select("id,group_id,inviter_id,invitee_email,status,created_at")
     .eq("status","pending")
     .ilike("invitee_email",String(user.email||""))
     .neq("inviter_id",user.id)
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
 const balances=useMemo(()=>{const b:Record<string,number>={};people.forEach(p=>b[p.id]=0);expenses.forEach(e=>{const total=expenseINR(e);if(!e.people.length)return;b[e.paidBy]=(b[e.paidBy]||0)+total;const split=e.splitMode||"equal";e.people.forEach(id=>{const share=split==="equal"?total/e.people.length:Number(e.shares?.[id]??0);b[id]=(b[id]||0)-share;});});payments.forEach(p=>{b[p.from]=(b[p.from]||0)+p.amount;b[p.to]=(b[p.to]||0)-p.amount});return b;},[people,expenses,payments]);
 useEffect(()=>{ const updateWidgets=async()=>{ try{ const recent=expenses.slice().sort((a,b)=>b.createdAt-a.createdAt).slice(0,5).map(e=>({title:e.title,amount:e.amount,group:group(e.groupId),paidBy:person(e.paidBy),createdAt:e.createdAt})); const groupRows=groups.map(g=>({name:g.name,total:expenses.filter(e=>e.groupId===g.id).reduce((s,e)=>s+e.amount,0)})); const latestExpense=expenses.slice().sort((a,b)=>b.createdAt-a.createdAt)[0]; const tripGroup=groups.find(g=>g.id===latestExpense?.groupId)||groups[0]; const tripRows=tripGroup?expenses.filter(e=>e.groupId===tripGroup.id):[]; const tripTotal=tripRows.reduce((s,e)=>s+e.amount,0); const balance=balances.you||0; await Preferences.set({key:"widget_snapshot",value:JSON.stringify({balance,total,groupCount:groups.length,groups:groupRows,recent,trip:{name:tripGroup?.name||"No trip",total:tripTotal,expenses:tripRows.length}})}); }catch(error){console.warn("Widget update failed:",error);} }; updateWidgets(); },[people,groups,expenses,payments,balances,total]);
 const saveExpense=async()=>{const entered=Number(amount);if(!title.trim()||!Number.isFinite(entered)||entered<=0||selected.length===0)return;const rate=Number(currencyInfo(currency)[2]);const n=currency==="INR"?entered:entered*rate;let splitShares:Record<string,number>={};if(splitMode!=="equal"){const vals=selected.map(id=>Number(shares[id]||0));if(vals.some(v=>!Number.isFinite(v)||v<0))return;const sum=vals.reduce((a,b)=>a+b,0);if(splitMode==="exact"&&Math.abs(sum-entered)>.01)return;if(splitMode==="percent"&&Math.abs(sum-100)>.01)return;selected.forEach((id,i)=>splitShares[id]=splitMode==="percent"?n*vals[i]/100:vals[i]*rate);}const old=expenses.find(e=>e.id===editingId);const now=Date.now();const e:Expense={id:editingId||crypto.randomUUID(),title:title.trim(),amount:n,originalAmount:entered,currency,paidBy,people:selected,groupId,createdAt:old?.createdAt||now,updatedAt:now,splitMode,shares:splitShares,category,receiptData:receiptData||undefined,receiptName:receiptName||undefined};const sg=user?groups.find(g=>g.id===e.groupId)?.sharedGroupId:null;if(sg){const published=await publishSharedExpense(e);if(!published){const nextLocal=editingId?expenses.map(x=>x.id===editingId?e:x):[e,...expenses];setExpenses(nextLocal);persist("expenses",nextLocal);const pending=load<string[]>("pendingSharedExpenseIds",[]);persist("pendingSharedExpenseIds",Array.from(new Set([...pending,e.id])));alert("Saved on this device. It will retry sharing when the connection is available.");return;}}const next=editingId?expenses.map(x=>x.id===editingId?e:x):[e,...expenses];setExpenses(next);persist("expenses",next);cloudSync({expenses:next});setTitle("");setAmount("");setCurrency("INR");setReceiptData("");setReceiptName("");setEditingId(null);setSplitMode("equal");setShares({});setModal(null);};
 const saveFriend=async()=>{const name=friendName.trim();const email=friendEmail.trim().toLowerCase();if(!name)return;if(email&&!/^\\S+@\\S+\\.\\S+$/.test(email)){alert("Enter a valid email.");return;}if(email&&people.some(p=>p.id!==editingId&&p.email?.toLowerCase()===email)){alert("A friend with this email already exists.");return;}if(editingId){const current=people.find(p=>p.id===editingId);const now=Date.now();const next=people.map(p=>p.id===editingId?{...p,name,email:email||undefined,updatedAt:now}:p);setPeople(next);persist("people",next);await cloudSync({people:next});if(user&&current?.userId){for(const g of groups.filter(g=>g.sharedGroupId&&g.members.includes(current.id))){const sharedId=g.sharedGroupId;if(!sharedId)continue;await supabase.from("shared_group_members").update({display_name:name,email}).eq("group_id",sharedId).eq("user_id",current.userId);await loadSharedMembers(sharedId);}}}else{const p={id:crypto.randomUUID(),name,updatedAt:Date.now(),...(email?{email}:{})};const next=[...people,p];setPeople(next);persist("people",next);await cloudSync({people:next});}setFriendName("");setFriendEmail("");setEditingId(null);setModal(null);};
 const addFriend=()=>{const name=friendName.trim();const email=friendEmail.trim().toLowerCase();if(!name)return;if(email&&!/^\\S+@\\S+\\.\\S+$/.test(email)){alert("Enter a valid email.");return;}if(email&&people.some(p=>p.email?.toLowerCase()===email)){alert("A friend with this email already exists.");return;}const p={id:crypto.randomUUID(),name,updatedAt:Date.now(),...(email?{email}:{})};const next=[...people,p];setPeople(next);persist("people",next);cloudSync({people:next});setFriendName("");setFriendEmail("");setModal(null);};
 const editFriend=(p:Person)=>{setEditingId(p.id);setFriendName(p.name);setFriendEmail(p.email||"");setModal("friend");};
 const deleteFriend=(id:string)=>{if(id==="you")return;const p=people.find(x=>x.id===id);if(!p)return;if(!confirm(`Delete ${p.name}? Existing expenses will remain in history.`))return;const next=people.filter(x=>x.id!==id);setPeople(next);persist("people",next);markDeleted("people",id);cloudSync({people:next,deleted:{...deleted,people:Array.from(new Set([...deleted.people,id]))}});};
 const openGroup=(g?:Group)=>{setEditingGroupId(g?.id||null);setGroupName(g?.name||"");setGroupMembers(g?[...g.members]:people.map(p=>p.id));setModal("group");};

 const addGroup=async()=>{
  const name=groupName.trim();
  if(!name||groupMembers.length===0)return;
  const now=Date.now();
  let next:Group[]=editingGroupId?groups.map(g=>g.id===editingGroupId?{...g,name,members:groupMembers,updatedAt:now}:g):[...groups,{id:crypto.randomUUID(),name,members:groupMembers,updatedAt:now}];
  const target=editingGroupId?next.find(g=>g.id===editingGroupId):next[next.length-1];
  if(user&&target&&!target.sharedGroupId){
   const connectedIds=Array.from(new Set(groupMembers.map(id=>people.find(p=>p.id===id)?.userId).filter(Boolean))) as string[];
   if(connectedIds.length){
    const {data,error}=await supabase.from("shared_groups").insert({owner_id:user.id,name}).select("id").single();
    if(error){alert(error.message||"Could not create shared group.");return;}
    const sharedId=data.id;
    const rows:any[]=[{group_id:sharedId,user_id:user.id,role:"owner",display_name:accountName,email:String(user.email||"").toLowerCase()}];
    connectedIds.filter(uid=>uid!==user.id).forEach(uid=>{const p=people.find(x=>x.userId===uid);rows.push({group_id:sharedId,user_id:uid,role:"member",display_name:p?.name||"Friend",email:p?.email||""});});
    const {error:memberError}=await supabase.from("shared_group_members").insert(rows);
    if(memberError){alert(memberError.message||"Could not add shared group members.");return;}
    next=next.map(g=>g.id===target.id?{...g,sharedGroupId:sharedId,updatedAt:Date.now()}:g);
   }
  }else if(user&&target?.sharedGroupId){
   const sharedId=target.sharedGroupId;
   const connectedIds=Array.from(new Set(groupMembers.map(id=>people.find(p=>p.id===id)?.userId).filter(Boolean))) as string[];
   const memberIds=connectedIds.filter(uid=>uid!==user.id);
   const {data:existingRows,error:loadError}=await supabase.from("shared_group_members").select("user_id").eq("group_id",sharedId);
   if(loadError){alert(loadError.message||"Could not load current group members.");return;}
   const existingIds=new Set((existingRows||[]).map((row:any)=>String(row.user_id)));
   const addIds=memberIds.filter(uid=>!existingIds.has(uid));
   const removeIds=Array.from(existingIds).filter(uid=>uid!==user.id&&!memberIds.includes(uid));
   if(addIds.length){
    const rows:any[]=addIds.map(uid=>{const p=people.find(x=>x.userId===uid);return {group_id:sharedId,user_id:uid,role:"member",display_name:p?.name||"Friend",email:p?.email||""};});
    const {error}=await supabase.from("shared_group_members").insert(rows);
    if(error){alert(error.message||"Could not add group members.");return;}
   }
   for(const uid of removeIds){const {error}=await supabase.from("shared_group_members").delete().eq("group_id",sharedId).eq("user_id",uid);if(error){alert(error.message||"Could not remove a group member.");return;}}
   await loadSharedMembers(sharedId);
   next=next.map(g=>g.id===target.id?{...g,updatedAt:Date.now()}:g);
  }
  setGroups(next);persist("groups",next);await cloudSync({groups:next});setGroupName("");setEditingGroupId(null);setGroupMembers([]);setModal(null);
 };
 const deleteGroup=(id:string)=>{if(groups.length<=1){alert("Keep at least one group.");return;}if(!confirm("Delete this group? Existing expenses will remain in history."))return;const next=groups.filter(g=>g.id!==id);setGroups(next);persist("groups",next);markDeleted("groups",id);cloudSync({groups:next,deleted:{...deleted,groups:Array.from(new Set([...deleted.groups,id]))}});};
 const settle=()=>{const n=Number(amount);if(!Number.isFinite(n)||n<=0||settleFrom===settleTo)return;const next=[{id:crypto.randomUUID(),from:settleFrom,to:settleTo,amount:n,createdAt:Date.now(),updatedAt:Date.now()},...payments];setPayments(next);persist("payments",next);cloudSync({payments:next});setAmount("");setModal(null);};
 const removePayment=(id:string)=>{if(!confirm("Remove this settlement record? This reverses its effect on balances."))return;const next=payments.filter(p=>p.id!==id);setPayments(next);persist("payments",next);cloudSync({payments:next});};
 const chooseReceipt=(file:File)=>{const reader=new FileReader();reader.onload=()=>{setReceiptData(String(reader.result));setReceiptName(file.name);};reader.readAsDataURL(file);};
 const removeExpense=async(id:string)=>{const old=expenses.find(e=>e.id===id);if(!old)return;const sg=user?groups.find(g=>g.id===old.groupId)?.sharedGroupId:null;if(sg){const {error}=await supabase.from("shared_group_expenses").delete().eq("expense_id",id);if(error){console.error("Shared expense delete failed:",error);alert(error.message||"Could not delete shared expense.");return;}}const next=expenses.filter(e=>e.id!==id);const nextDeleted={...deleted,expenses:Array.from(new Set([...deleted.expenses,id]))};setExpenses(next);persist("expenses",next);setDeleted(nextDeleted);persist("deleted",nextDeleted);cloudSync({expenses:next,deleted:nextDeleted});};
 const reportRows=useMemo(()=>filteredExpenses.map(e=>({Date:new Date(e.createdAt).toLocaleDateString("en-IN"),Description:e.title,Group:group(e.groupId),PaidBy:person(e.paidBy),Amount:Number(e.amount.toFixed(2)),Split:e.people.map(person).join(", "),Shared:groups.find(g=>g.id===e.groupId)?.sharedGroupId?"Yes":"No"})),[filteredExpenses,groups,people]);
 const saveReportFile=async(name:string,base64:string,mime:string)=>{
  try{
   const result=await Filesystem.writeFile({path:name,data:base64,directory:Directory.Cache,recursive:true});
   if(!(await Share.canShare()).value) throw new Error("Android sharing is unavailable.");
   await Share.share({title:name,text:"Save this ShiWise report",files:[result.uri],dialogTitle:"Save report"});
   await notifyReportSaved(name);
   return result;
  }catch(error){
   console.error("Report save/share failed",error);
   const message=error instanceof Error ? error.message : String(error);
   alert(`Could not save the report. ${message}`);
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
  await saveReportFile(`shiwise-report-${new Date().toISOString().slice(0,10)}.xlsx`,base64,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
 };
 const exportCSV=async()=>{
  const csv=XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(reportRows));
  const base64=btoa(unescape(encodeURIComponent(csv)));
  await saveReportFile(`shiwise-expenses-${new Date().toISOString().slice(0,10)}.csv`,base64,"text/csv");
 };
 const groupReportData=(g:Group)=>{
  const rows=expenses.filter(e=>e.groupId===g.id).sort((a,b)=>a.createdAt-b.createdAt);
  const memberIds=Array.from(new Set([...g.members,...rows.flatMap(e=>e.people)]));
  const paid:Record<string,number>={};const owed:Record<string,number>={};
  memberIds.forEach(id=>{paid[id]=0;owed[id]=0;});
  rows.forEach(e=>{
   paid[e.paidBy]=(paid[e.paidBy]||0)+e.amount;
   e.people.forEach(id=>{const share=(e.splitMode||"equal")==="equal"?e.amount/e.people.length:Number(e.shares?.[id]??0);owed[id]=(owed[id]||0)+share;});
  });
  const net:Record<string,number>={};memberIds.forEach(id=>net[id]=(paid[id]||0)-(owed[id]||0));
  return {rows,memberIds,paid,owed,net,total:rows.reduce((sum,e)=>sum+e.amount,0)};
 };
 const exportPDF=async()=>{
  const doc=new jsPDF({unit:"mm",format:"a4"});
  const margin=14;let y=18;
  doc.setFontSize(18);doc.text("ShiWise Expense Report",margin,y);y+=8;
  doc.setFontSize(9);doc.text(`Generated ${new Date().toLocaleString("en-IN")} · ${filteredExpenses.length} expenses · Total ${money(filteredExpenses.reduce((s,e)=>s+e.amount,0))}`,margin,y);y+=8;
  const headers=["Date","Description","Group","Paid by","Amount"];const widths=[22,52,38,32,34];
  const drawHeader=()=>{let x=margin;doc.setFont("helvetica","bold");headers.forEach((h,i)=>{doc.text(h,x,y);x+=widths[i];});doc.setFont("helvetica","normal");y+=6;};
  drawHeader();
  reportRows.forEach((r:any)=>{if(y>282){doc.addPage();y=18;drawHeader();}const vals=[r.Date,String(r.Description).slice(0,28),String(r.Group).slice(0,20),String(r.PaidBy).slice(0,18),money(r.Amount)];let x=margin;vals.forEach((v,i)=>{doc.text(v,x,y);x+=widths[i];});y+=6;});
  const base64=doc.output("datauristring").split(",")[1];
  await saveReportFile(`shiwise-report-${new Date().toISOString().slice(0,10)}.pdf`,base64,"application/pdf");
 };
 const exportTripPDF=async(g:Group)=>{
  const r=groupReportData(g);
  const slug=g.name.replace(/[^a-z0-9]+/gi,"-").toLowerCase();
  const dateLabel=r.rows.length?(()=>{
   const dates=r.rows.map(e=>new Date(e.createdAt));const first=dates[0];const last=dates[dates.length-1];
   return first.toDateString()===last.toDateString()?first.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):first.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})+" - "+last.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  })():"No expenses yet";
  const transfers=(()=>{
   const creditors=r.memberIds.map(id=>({id,amount:Math.max(0,r.net[id]||0)})).filter(x=>x.amount>.005).sort((a,b)=>b.amount-a.amount);
   const debtors=r.memberIds.map(id=>({id,amount:Math.max(0,-(r.net[id]||0))})).filter(x=>x.amount>.005).sort((a,b)=>b.amount-a.amount);
   const out:{from:string;to:string;amount:number}[]=[];let ci=0,di=0;
   while(ci<creditors.length&&di<debtors.length){
    const amount=Math.min(creditors[ci].amount,debtors[di].amount);
    if(amount>.005)out.push({from:debtors[di].id,to:creditors[ci].id,amount});
    creditors[ci].amount-=amount;debtors[di].amount-=amount;
    if(creditors[ci].amount<=.005)ci++;if(debtors[di].amount<=.005)di++;
   }
   return out;
  })();
  const doc=new jsPDF({unit:"mm",format:"a4"});
  const margin=12,pageWidth=210,pageHeight=297,tableWidth=pageWidth-margin*2;
  const drawHeader=(title:string)=>{
   doc.setFont("helvetica","bold");doc.setFontSize(18);doc.setTextColor(28,34,32);doc.text(title,margin,18);
   doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(90,90,90);doc.text(dateLabel,margin,25);
  };
  const drawTable=(headers:string[],widths:number[],rows:string[][],options?:{fontSize?:number;rowHeight?:number;startY?:number})=>{
   const fontSize=options?.fontSize??8.5,rowHeight=options?.rowHeight??9;
   const headerHeight=9,x0=margin;let y:number=options?.startY??32;
   const wrap=(value:string,width:number)=>{
    doc.setFont("helvetica","normal");doc.setFontSize(fontSize);
    return doc.splitTextToSize(String(value),Math.max(10,width-4)) as string[];
   };
   const drawHeaderRow=()=>{
    doc.setFillColor(238,241,239);doc.setDrawColor(190,195,192);doc.rect(x0,y,tableWidth,headerHeight,"FD");
    let x=x0;doc.setFont("helvetica","bold");doc.setFontSize(fontSize);doc.setTextColor(28,34,32);
    headers.forEach((h,i)=>{doc.text(h,x+2,y+6);x+=widths[i];});y+=headerHeight;
   };
   drawHeaderRow();
   rows.forEach(row=>{
    const lines=row.map((v,i)=>wrap(v,widths[i]));const needed=Math.max(rowHeight,Math.max(...lines.map(a=>a.length))*4.2+3);
    if(y+needed>pageHeight-12){doc.addPage();y=16;drawHeader(g.name.toUpperCase());y=32;drawHeaderRow();}
    doc.setDrawColor(215,218,216);doc.rect(x0,y,tableWidth,needed,"S");
    let x=x0;doc.setFont("helvetica","normal");doc.setFontSize(fontSize);doc.setTextColor(40,40,40);
    row.forEach((_,i)=>{doc.line(x,y,x,y+needed);lines[i].slice(0,4).forEach((line,index)=>doc.text(line,x+2,y+5+index*4.2));x+=widths[i];});
    doc.line(x,y,x,y+needed);y+=needed;
   });
   return y;
  };
  const drawBarChart=(title:string,items:{label:string;value:number}[],startY:number)=>{
   const x=margin,w=tableWidth,rowH=10,chartH=Math.max(36,items.length*rowH+20),max=Math.max(1,...items.map(i=>i.value));
   doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(28,34,32);doc.text(title,x,startY);
   let yy=startY+8;
   items.forEach(item=>{
    const label=doc.splitTextToSize(item.label,34)[0];const barX=x+39,barW=w-82;
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(70,75,72);doc.text(label,x,yy+4);
    doc.setFillColor(235,242,239);doc.roundedRect(barX,yy,barW,6,2,2,"F");
    doc.setFillColor(28,194,159);doc.roundedRect(barX,yy,Math.max(1,barW*(item.value/max)),6,2,2,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.setTextColor(40,45,42);doc.text(money(item.value),x+w-39,yy+4,{align:"right"});
    yy+=rowH;
   });
   return startY+chartH;
  };
  const drawLineChart=(title:string,items:{label:string;value:number}[],startY:number)=>{
   const x=margin,w=tableWidth,chartTop=startY+9,chartH=54,left=x+8,right=x+w-4,base=chartTop+chartH;
   const max=Math.max(1,...items.map(i=>i.value));const step=items.length>1?(right-left)/(items.length-1):0;
   doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(28,34,32);doc.text(title,x,startY);   doc.setDrawColor(220,226,223);doc.line(left,base,right,base);doc.line(left,chartTop,right,chartTop);
   if(items.length){
    const pts=items.map((item,i)=>({x:left+step*i,y:base-(item.value/max)*chartH}));
    doc.setDrawColor(28,194,159);doc.setLineWidth(0.9);
    pts.forEach((p,i)=>{if(i)doc.line(pts[i-1].x,pts[i-1].y,p.x,p.y);doc.setFillColor(28,194,159);doc.circle(p.x,p.y,1.5,"F");});
    doc.setLineWidth(0.2);doc.setFont("helvetica","normal");doc.setFontSize(6.5);doc.setTextColor(75,80,77);
    items.forEach((item,i)=>{const label=item.label.length>10?item.label.slice(0,10):item.label;doc.text(label,pts[i].x,base+7,{align:"center"});doc.text(money(item.value),pts[i].x,pts[i].y-3,{align:"center"});});
   }
   return base+14;
  };
  drawHeader(g.name.toUpperCase());
  doc.setFont("helvetica","bold");doc.setFontSize(25);doc.setTextColor(28,34,32);doc.text(money(r.total),margin,43);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text(r.memberIds.length+" people  ·  "+r.rows.length+" expenses",margin,49);

  const paidByItems=r.memberIds.map(id=>({label:person(id),value:r.paid[id]||0})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
  const dailyMap=new Map<string,number>();
  r.rows.forEach(e=>{const d=new Date(e.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short"});dailyMap.set(d,(dailyMap.get(d)||0)+e.amount);});
  const dailyItems=Array.from(dailyMap.entries()).map(([label,value])=>({label,value}));
  let y=58;
  y=drawBarChart("SPENDING BY PAYER",paidByItems,y)+5;
  if(dailyItems.length){y=drawLineChart("DAILY SPENDING",dailyItems,y)+4;}
  if(y>250){doc.addPage();drawHeader(g.name.toUpperCase());y=32;}
  doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(28,34,32);doc.text("SETTLEMENT",margin,y);y+=5;
  if(transfers.length){
   const settlementRows=transfers.map(t=>[person(t.from)+" → "+person(t.to),money(t.amount)]);
   y=drawTable(["FROM / TO","AMOUNT"],[tableWidth-48,48],settlementRows,{fontSize:9,rowHeight:9,startY:y});
  }else{doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text("All settled",margin,y+5);y+=14;}
  y+=9;doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("EXPENSES",margin,y);y+=5;
  const expenseRows=r.rows.map(e=>{
   const split=e.splitMode==="equal"?"Equal ("+money(e.people.length?e.amount/e.people.length:0)+")":e.splitMode==="percent"?"Percentage":"Exact";
   return [new Date(e.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),e.title,person(e.paidBy),money(e.amount),split];
  });
  drawTable(["DATE","EXPENSE","PAID BY","AMOUNT","SPLIT"],[27,66,34,32,27],expenseRows,{fontSize:8,rowHeight:10});
  if(r.rows.some(e=>e.splitMode!=="equal")){
   doc.addPage();drawHeader(g.name.toUpperCase()+" · SPLIT DETAILS");
   const detailRows:string[][]=[];
   r.rows.forEach(e=>{if(e.splitMode==="equal")return;e.people.forEach(id=>detailRows.push([e.title,person(id),e.splitMode==="percent"?((Number(e.shares?.[id]??0)/e.amount)*100).toFixed(1)+"%":money(Number(e.shares?.[id]??0))]));});
   if(detailRows.length)drawTable(["EXPENSE","PERSON","SHARE"],[90,55,41],detailRows,{fontSize:8.5,rowHeight:9,startY:32});
  }
  const base64=doc.output("datauristring").split(",")[1];
  await saveReportFile("shiwise-"+slug+"-trip-details.pdf",base64,"application/pdf");
 };
 const saveTripImage=async(g:Group)=>{
  const r=groupReportData(g);const slug=g.name.replace(/[^a-z0-9]+/gi,"-").toLowerCase();
  const dateLabel=r.rows.length?(()=>{const dates=r.rows.map(e=>new Date(e.createdAt));const first=dates[0];const last=dates[dates.length-1];return first.toDateString()===last.toDateString()?first.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):first.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})+" - "+last.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});})():"No expenses yet";
  const transfers=(()=>{const creditors=r.memberIds.map(id=>({id,amount:Math.max(0,r.net[id]||0)})).filter(x=>x.amount>.005).sort((a,b)=>b.amount-a.amount);const debtors=r.memberIds.map(id=>({id,amount:Math.max(0,-(r.net[id]||0))})).filter(x=>x.amount>.005).sort((a,b)=>b.amount-a.amount);const out:{from:string;to:string;amount:number}[]=[];let ci=0,di=0;while(ci<creditors.length&&di<debtors.length){const amount=Math.min(creditors[ci].amount,debtors[di].amount);if(amount>.005)out.push({from:debtors[di].id,to:creditors[ci].id,amount});creditors[ci].amount-=amount;debtors[di].amount-=amount;if(creditors[ci].amount<=.005)ci++;if(debtors[di].amount<=.005)di++;}return out;})();
  const width=1200,pad=80,scale=2,lineH=46,contentWidth=width-pad*2;const canvas=document.createElement("canvas");const ctx=canvas.getContext("2d");if(!ctx)return;
  const items:{text:string;font:string;gap:number}[]=[];const add=(t:string,f:string,gap:number)=>items.push({text:t,font:f,gap});
  const wrap=(value:string,font:string)=>{ctx.font=font;const words=value.split(/\s+/);const out:string[]=[];let line="";for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>contentWidth&&line){out.push(line);line=word;}else line=test;}if(line)out.push(line);return out;};
  add(g.name.toUpperCase(),"700 52px Arial",68);add(dateLabel.toUpperCase(),"28px Arial",52);add("","20px Arial",18);add(money(r.total),"700 64px Arial",76);add("TOTAL EXPENSE","700 24px Arial",48);add(r.memberIds.length+" PEOPLE  ·  "+r.rows.length+" EXPENSES","28px Arial",58);add("","20px Arial",14);add("SETTLEMENT","700 34px Arial",56);
  if(transfers.length)transfers.forEach(t=>add(person(t.from)+" → "+person(t.to)+"     "+money(t.amount),"700 28px Arial",50));else add("All settled","26px Arial",50);
  add("","20px Arial",12);add("EXPENSES","700 34px Arial",56);r.rows.forEach(e=>{add(new Date(e.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})+"  ·  "+e.title,"700 27px Arial",42);add("Paid by "+person(e.paidBy)+"     "+money(e.amount),"24px Arial",52);});
  const wrapped:{text:string;font:string;gap:number}[]=[];items.forEach(item=>wrap(item.text,item.font).forEach((t,i)=>wrapped.push({text:t,font:item.font,gap:i===0?item.gap:lineH})));
  const height=Math.max(1000,wrapped.reduce((sum,item)=>sum+item.gap,0)+100);canvas.width=width*scale;canvas.height=height*scale;ctx.scale(scale,scale);ctx.fillStyle="#ffffff";ctx.fillRect(0,0,width,height);ctx.fillStyle="#18221f";let y=92;wrapped.forEach(item=>{ctx.font=item.font;ctx.fillText(item.text,pad,y);y+=item.gap;});
  const base64=canvas.toDataURL("image/png",1).split(",")[1];await saveReportFile("shiwise-"+slug+"-trip-details.png",base64,"image/png");
 }; const exportBackup=()=>{
  const backup={version:1,app:"ShiWise",exportedAt:new Date().toISOString(),people,groups,expenses,payments};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url; a.download=`shiwise-backup-${new Date().toISOString().slice(0,10)}.json`;
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
   }catch{ alert("This file is not a valid ShiWise backup."); }
  };
  reader.readAsText(file);
 };
 const openExpense=()=>{setEditingId(null);setTitle("");setAmount("");setCurrency("INR");setReceiptData("");setReceiptName("");setCategory("Other");setPaidBy("you");setGroupId(groups[0]?.id||"");setSelected(groups[0]?.members||people.map(p=>p.id));setSplitMode("equal");setShares({});setModal("expense");}; const editExpense=(e:Expense)=>{setEditingId(e.id);setTitle(e.title);setAmount(String(e.originalAmount??e.amount));setCurrency(e.currency||"INR");setReceiptData(e.receiptData||"");setReceiptName(e.receiptName||"");setCategory(e.category||"Other");setPaidBy(e.paidBy);setGroupId(e.groupId);setSelected(e.people);setSplitMode(e.splitMode||"equal");setShares(Object.fromEntries(e.people.map(id=>[id,String(e.splitMode==="percent"?(e.shares?.[id]||0)*100/e.amount:(e.shares?.[id]??0))])));setModal("expense");};
 const creditors=useMemo(()=>people.filter(p=>p.id!=="you"&&(balances[p.id]||0)>.005),[people,balances]); const debtors=useMemo(()=>people.filter(p=>p.id!=="you"&&(balances[p.id]||0)<-.005),[people,balances]); const categoryTotals=useMemo(()=>categories.map(name=>({name,total:expenses.filter(e=>(e.category||"Other")===name).reduce((sum,e)=>sum+e.amount,0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total),[expenses]); const topCategory=categoryTotals[0]?.name||"No expenses yet"; const nav=[{n:"Home",I:Home},{n:"Groups",I:Users},{n:"Activity",I:ReceiptText},{n:"Friends",I:Users},{n:"Balances",I:Wallet},{n:"Stats",I:BarChart3}];
 return <div className="app"><header><div className="logo"><b>S</b> ShiWise</div><button className="themebtn" aria-label={darkMode?"Switch to light mode":"Switch to dark mode"} onClick={()=>setDarkMode(v=>!v)}>{darkMode?<Sun size={18}/>:<Moon size={18}/>}</button><button className="avatar" aria-label={user?"Account":"Log in"} onClick={()=>{setAuthMessage("");setAuthMode("login");setModal("auth")}}>{user?(accountName[0]?.toUpperCase()||"Y"):<LogIn size={18}/>}</button></header><main>
 <p className="eyebrow">YOUR EXPENSES</p><h1>{tab==="Home"?(user&&accountName&&accountName!=="You"?`Hey, ${accountName}`:"Hey, You"):tab}</h1><p className="muted">Keep track of shared expenses, simply.</p>{user&&<p className="muted">{syncing?"Syncing to cloud…":"Cloud sync on"}</p>}
 {tab==="Home"&&<><section className="balance"><small>TOTAL SHARED EXPENSES</small><h2>{money(total)}</h2><p>{expenses.length} expenses · saved on this device</p></section><div className="section"><h3>Balances</h3><button className="link" onClick={()=>setTab("Balances")}>Details</button></div>
 <div className="section"><h3>Backup & Restore</h3></div>
 <div className="section"><h3>Reports & Export</h3></div>
 <p className="muted">Trip reports show every expense, who paid, each person's share, and the final net balance in plain language.</p>
 {groups.map(g=><div className="tile" key={"report-"+g.id}><FileText/><div className="grow"><b>{g.name}</b><p>{groupReportData(g).rows.length} expenses · {money(groupReportData(g).total)}</p></div><button className="link" onClick={()=>exportTripPDF(g)}>PDF</button><button className="iconbtn" aria-label={"Download high resolution image for "+g.name} onClick={()=>saveTripImage(g)}><ImageIcon size={17}/></button></div>)}
 <button className="add" onClick={exportPDF}><Download size={18}/> Export all expenses PDF</button>
 <button className="add" onClick={exportExcel}><Download size={18}/> Export Excel report</button>
 <button className="add" onClick={exportCSV}><Download size={18}/> Export CSV</button>
 <button className="add" onClick={exportBackup}><Download size={18}/> Export backup</button>
 <button className="add" onClick={()=>restoreInputRef.current?.click()}><Upload size={18}/> Restore backup</button>
 <input ref={restoreInputRef} type="file" accept="application/json,.json" hidden onChange={e=>{const file=e.target.files?.[0];if(file)restoreBackup(file);e.currentTarget.value="";}}/>{people.filter(p=>p.id!=="you").map(p=><div className="tile" key={p.id}><span className="friend">{p.name[0]?.toUpperCase()}</span><div className="grow"><b>{p.name}</b><p>{Math.abs(balances[p.id]||0)<.005?"All settled":(balances[p.id]>0?"owes you ":"you owe ")+money(Math.abs(balances[p.id]||0))}</p></div></div>)}<div className="section"><h3>Recent expenses</h3><button className="link" onClick={()=>setTab("Activity")}>See all</button></div><ExpenseList expenses={expenses.slice(0,4)} person={person} group={group} remove={removeExpense} edit={editExpense} groups={groups} openDetail={e=>{setDetailExpense(e);setModal("detail");}}/></>}
 {tab==="Activity"&&<><div className="section"><h3>All expenses</h3><span className="muted">{filteredExpenses.length} of {expenses.length}</span></div><input aria-label="Search expenses" value={expenseSearch} onChange={e=>setExpenseSearch(e.target.value)} placeholder="Search description, person..."/><div className="filters"><select aria-label="Filter by group" value={expenseGroupFilter} onChange={e=>setExpenseGroupFilter(e.target.value)}><option value="all">All groups</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><select aria-label="Filter by date" value={expenseDateFilter} onChange={e=>setExpenseDateFilter(e.target.value)}><option value="all">Any date</option><option value="month">This month</option><option value="year">This year</option></select><select aria-label="Sort expenses" value={expenseSort} onChange={e=>setExpenseSort(e.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="amount">Highest amount</option></select><select aria-label="Filter by category" value={expenseCategoryFilter} onChange={e=>setExpenseCategoryFilter(e.target.value)}><option value="all">All categories</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></div><ExpenseList expenses={filteredExpenses} person={person} group={group} remove={removeExpense} edit={editExpense} groups={groups} openDetail={e=>{setDetailExpense(e);setModal("detail");}}/><div className="section"><h3>Settlements</h3></div>{payments.map(p=><div className="expense" key={p.id}><div className="date"><Check size={18}/></div><div className="grow"><b>Settlement</b><p>{person(p.from)} paid {person(p.to)} · {new Date(p.createdAt).toLocaleDateString("en-IN")}</p></div><strong>{money(p.amount)}</strong><button className="iconbtn" aria-label="Reverse settlement" onClick={()=>removePayment(p.id)}><X size={16}/></button></div>)}</>}
 {tab==="Groups"&&<><div className="section"><h3>Invitations</h3></div>{!user&&<p className="muted">Log in to receive shared-group invitations.</p>}{user&&invitations.length===0&&<p className="muted">No pending invitations.</p>}{invitations.map(inv=><div className="tile" key={inv.id}><Users/><div className="grow"><b>{inv.group_name||"Shared group"}</b><p>Invitation to join this shared group</p></div><button className="link" onClick={()=>respondInvite(inv,true)}>Accept</button><button className="iconbtn" onClick={()=>respondInvite(inv,false)}><X size={16}/></button></div>)}<div className="section"><h3>Your groups</h3></div>{groups.map(g=><div className="tile" key={g.id}><Users/><div className="grow"><b>{g.name}</b><p>{g.members.map(person).join(", ")}</p><p>{g.members.length} members{g.sharedGroupId?" · shared":""}</p>{g.sharedGroupId&&<><p>{(sharedMembers[g.sharedGroupId]||[]).map((m:any)=>m.display_name||m.email).filter(Boolean).join(", ")||"Loading members…"}</p>{sharedMembers[g.sharedGroupId]?.some((m:any)=>m.user_id===user?.id&&m.role==="owner")&&<div className="checks">{(sharedMembers[g.sharedGroupId]||[]).filter((m:any)=>m.user_id!==user?.id).map((m:any)=><button className="link" key={m.user_id} onClick={()=>removeSharedMember(g,m)}>Remove {m.display_name||m.email||"member"}</button>)}</div>}</>}</div><button className="link" onClick={()=>openGroup(g)}>Manage</button>{g.sharedGroupId&&<button className="link" onClick={()=>leaveSharedGroup(g)}>Leave</button>}<button className="link" onClick={()=>openInvite(g)}>Share</button>{(!g.sharedGroupId||sharedMembers[g.sharedGroupId]?.some((m:any)=>m.user_id===user?.id&&m.role==="owner"))&&<button className="iconbtn" aria-label="Delete group" onClick={()=>deleteGroup(g.id)}><Trash2 size={16}/></button>}</div>)}<button className="add" onClick={()=>openGroup()}><Plus size={18}/> Create group</button></>}
 {tab==="Friends"&&<>{user&&friendInvitations.length>0&&<><div className="section"><h3>Friend invitations</h3></div>{friendInvitations.map(inv=><div className="tile" key={inv.id}><UserPlus/><div className="grow"><b>{inv.inviter_name||"Friend request"}</b><p>{inv.invitee_email}</p></div><button className="link" onClick={()=>respondFriendInvite(inv,true)}>Accept</button><button className="iconbtn" onClick={()=>respondFriendInvite(inv,false)}><X size={16}/></button></div>)}</>}{people.map(p=><div className="tile" key={p.id}><span className="friend">{p.name[0]?.toUpperCase()}</span><div className="grow"><b>{p.name}</b><p>{p.id==="you"?"Your account":(balances[p.id]||0)>.005?"Owes you "+money(balances[p.id]):(balances[p.id]||0)<-.005?"You owe "+money(-balances[p.id]):"Settled up"}{p.email&&p.id!=="you"?` · ${p.email}`:""}</p></div>{p.id!=="you"&&<><button className="link" onClick={()=>editFriend(p)}>Edit</button><button className="iconbtn" aria-label={"Delete "+p.name} onClick={()=>deleteFriend(p.id)}><Trash2 size={16}/></button></>}</div>)}<button className="add" onClick={()=>{setEditingId(null);setFriendName("");setFriendEmail("");setModal("friend")}}><UserPlus size={18}/> Add a friend</button></>}
 {tab==="Balances"&&<><section className="balance"><small>YOUR NET BALANCE</small><h2>{money(balances.you||0)}</h2><p>Positive means you are owed; negative means you owe.</p></section><h3>People who owe</h3>{creditors.map(p=><div className="tile" key={p.id}><div className="grow"><b>{person(p.id)}</b></div><strong>{money(balances[p.id])}</strong><button className="link" onClick={()=>{setSettleFrom("you");setSettleTo(p.id);setAmount(String(balances[p.id].toFixed(2)));setModal("settle")}}>Settle</button></div>)}<h3>People you owe</h3>{debtors.map(p=><div className="tile" key={p.id}><div className="grow"><b>{person(p.id)}</b></div><strong>{money(-balances[p.id])}</strong><button className="link" onClick={()=>{setSettleFrom(p.id);setSettleTo("you");setAmount(String((-balances[p.id]).toFixed(2)));setModal("settle")}}>Settle</button></div>)}</>}
 {tab==="Stats"&&<><section className="balance"><small>ALL-TIME SPENDING</small><h2>{money(total)}</h2><div className="dashboard-grid"><div><b>{money(expenses.filter(e=>{const d=new Date(e.createdAt),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}).reduce((s,e)=>s+expenseINR(e),0))}</b><small>This month</small></div><div><b>{groups.length}</b><small>Groups</small></div><div><b>{expenses.length}</b><small>Expenses</small></div></div><p>{expenses.length} expenses across {groups.length} groups</p></section><div className="section"><h3>Dashboard</h3></div><div className="tile"><BarChart3/><div className="grow"><b>Top spending category</b><p>{topCategory}</p></div>{categoryTotals[0]&&<strong>{money(categoryTotals[0].total)}</strong>}</div><div className="section"><h3>Spending by category</h3></div>{categoryTotals.length?categoryTotals.map(c=><div className="tile" key={c.name}><Tag/><div className="grow"><b>{c.name}</b><p>{total?Math.round(c.total/total*100)+"% of total":""}</p></div><strong>{money(c.total)}</strong></div>):<p className="muted">Add expenses to see your spending breakdown.</p>}<div className="section"><h3>Settlement overview</h3></div><div className="tile"><Wallet/><div className="grow"><b>People who owe you</b><p>{creditors.length}</p></div><strong>{money(creditors.reduce((s,p)=>s+(balances[p.id]||0),0))}</strong></div><div className="tile"><Wallet/><div className="grow"><b>People you owe</b><p>{debtors.length}</p></div><strong>{money(debtors.reduce((s,p)=>s+(-(balances[p.id]||0)),0))}</strong></div></>}
 <button className="add" onClick={openExpense}><Plus size={19}/> Add an expense</button>
 </main><nav>{nav.map(({n,I})=><button className={tab===n?"active":""} onClick={()=>setTab(n)} key={n}><I/><span>{n}</span></button>)}</nav>
 {modal&&<div className="overlay"><section className="sheet"><div className="sheethead"><h2>{modal==="expense"?(editingId?"Edit expense":"Add an expense"):modal==="friend"?"Add a friend":modal==="group"?(editingGroupId?"Edit group":"Create a group"):modal==="auth"?(user?"Account":"Log in"):modal==="invite"?"Invite to group":modal==="detail"?"Expense details":"Record settlement"}</h2><button className="close" onClick={()=>setModal(null)}><X/></button></div>
 {modal==="detail"&&detailExpense&&<><div className="detail-card"><b>{detailExpense.title}</b><strong>{expenseLabel(detailExpense)}</strong><p>{group(detailExpense.groupId)} · {new Date(detailExpense.createdAt).toLocaleString("en-IN")}</p><div className="detail-row"><span>Paid by</span><b>{person(detailExpense.paidBy)}</b></div><div className="detail-row"><span>Participants</span><b>{detailExpense.people.length ? detailExpense.people.map(person).join(", ") : "No participants"}</b></div><p>Category: {detailExpense.category||"Other"} · Split: {detailExpense.splitMode||"equal"}</p>{detailExpense.receiptData&&<img className="receipt-preview" src={detailExpense.receiptData} alt="Receipt"/>}</div><button className="save" onClick={()=>{setModal(null);editExpense(detailExpense)}}>Edit expense</button></>}
 {modal==="expense"&&<><label>Description</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What was it for?"/><label>Currency</label><select value={currency} onChange={e=>setCurrency(e.target.value)}>{CURRENCIES.map(c=><option key={c[0]} value={c[0]}>{c[0]} ({c[1]})</option>)}</select><label>Amount ({currencyInfo(currency)[1]})</label><input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/><label>Category</label><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select><label>Paid by</label><select value={paidBy} onChange={e=>setPaidBy(e.target.value)}>{people.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select><label>Group</label><select value={groupId} onChange={e=>{setGroupId(e.target.value);setSelected(groups.find(g=>g.id===e.target.value)?.members||[])}}>{groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select><label>Split type</label><select value={splitMode} onChange={e=>setSplitMode(e.target.value as "equal"|"exact"|"percent")}><option value="equal">Equally</option><option value="exact">Exact amounts</option><option value="percent">Percentages</option></select><label>{splitMode==="equal"?"Split equally between":splitMode==="exact"?"Share amount for each person (₹)":"Share percentage for each person (%)"}</label><div className="checks">{people.map(p=><label className="check" key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={e=>setSelected(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/>{p.name}{splitMode!=="equal"&&<input className="share-input" type="number" min="0" value={shares[p.id]||""} placeholder={splitMode==="percent"?"%":"₹"} onChange={e=>setShares({...shares,[p.id]:e.target.value})}/>}</label>)}</div><label>Receipt / photo</label><input type="file" accept="image/*" capture="environment" onChange={e=>{const f=e.target.files?.[0];if(f)chooseReceipt(f)}}/><p className="muted">{receiptName?`Attached: ${receiptName}`:"Take a photo or choose a receipt image."}</p><p className="muted">{splitMode==="equal"?"Each selected person gets an equal share.":splitMode==="exact"?"Exact shares must add up to the expense total.":"Percentages must add up to 100%."} Saved on this device.</p><button className="save" onClick={saveExpense}><Check/> Save expense</button></>}
 {modal==="invite"&&<><label>Group</label><select value={inviteGroupId||""} onChange={e=>setInviteGroupId(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><label>Friend's email</label><input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="friend@example.com"/><p className="muted">They can accept this invitation when they log in with this email.</p><button className="save" onClick={sendInvite}>Send invitation</button></>}{modal==="friend"&&<><label>Friend's name</label><input value={friendName} onChange={e=>setFriendName(e.target.value)} placeholder="Name"/><label>Email (optional)</label><input type="email" value={friendEmail} onChange={e=>setFriendEmail(e.target.value)} placeholder="friend@example.com"/><p className="muted">If you are logged in, adding an email sends them a friend invitation. They can accept it after logging in.</p><button className="save" onClick={saveFriend}>{editingId?"Save changes":"Add friend"}</button></>}
 {modal==="group"&&<><label>Group name</label><input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="e.g. Weekend trip"/><label>Members</label><div className="checks">{people.map(p=><label className="check" key={p.id}><input type="checkbox" checked={groupMembers.includes(p.id)} onChange={e=>setGroupMembers(e.target.checked?[...groupMembers,p.id]:groupMembers.filter(id=>id!==p.id))}/>{p.name}</label>)}</div><p className="muted">Choose who belongs to this group. Existing expenses are preserved when you edit membership.</p><button className="save" onClick={addGroup}>{editingGroupId?"Save group":"Create group"}</button></>}
 {modal==="auth"&&(user?<><div className="tile"><span className="friend">{accountName[0]?.toUpperCase()||"Y"}</span><div className="grow"><b>{accountName}</b><p>{user.email}</p></div></div><p className="muted">Your ShiWise account is connected. Cloud data sync is enabled.</p><button className="save" onClick={signOut}><LogOut size={18}/> Log out</button></>:<><label>{authMode==="signup"?"Your name":"Email"}</label>{authMode==="signup"&&<input value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Your name" autoComplete="name"/>}<input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/>{authMode!=="reset"&&<><label>Password</label><input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={authMode==="signup"?"new-password":"current-password"}/></>}<p className="muted">{authMessage|| (authMode==="signup"?"Create an account to sync your ShiWise data in the cloud.":"Sign in to your ShiWise account.")}</p><button className="save" onClick={submitAuth} disabled={authBusy}>{authBusy?"Please wait…":authMode==="signup"?"Create account":authMode==="reset"?"Send reset link":"Log in"}</button><button className="link" onClick={()=>{setAuthMessage("");setAuthMode(authMode==="login"?"signup":"login")}}>{authMode==="login"?"Create a new account":authMode==="signup"?"Already have an account? Log in":"Back to login"}</button>{authMode==="login"&&<button className="link" onClick={()=>{setAuthMessage("");setAuthMode("reset")}}>Forgot password?</button>}</>)}
 {modal==="settle"&&<><label>From</label><select value={settleFrom} onChange={e=>setSettleFrom(e.target.value)}>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><label>To</label><select value={settleTo} onChange={e=>setSettleTo(e.target.value)}>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><label>Amount (₹)</label><input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)}/><button className="save" onClick={settle}><Check/> Record payment</button></>}
 </section></div>}</div>
}
function ExpenseList({expenses,person,group,remove,edit,groups,openDetail}:{expenses:Expense[];person:(id:string)=>string;group:(id:string)=>string;remove:(id:string)=>void;edit:(e:Expense)=>void;groups:Group[];openDetail:(e:Expense)=>void}){return <div>{expenses.map(e=><div className="expense" key={e.id} onClick={()=>openDetail(e)}><div className="date"><small>{new Date(e.createdAt).toLocaleDateString("en",{month:"short"})}</small><b>{new Date(e.createdAt).getDate()}</b></div><div className="grow"><b>{e.title}</b><p><Tag size={13}/> {e.category||"Other"} · {group(e.groupId)}{groups.find(g=>g.id===e.groupId)?.sharedGroupId?" · Shared":""} · {person(e.paidBy)} paid · split {e.people.length} ways</p></div><strong>{expenseLabel(e)}</strong><button className="iconbtn" aria-label="Edit expense" onClick={ev=>{ev.stopPropagation();edit(e)}}><ReceiptText size={16}/></button><button className="iconbtn" aria-label="Delete expense" onClick={ev=>{ev.stopPropagation();if(confirm("Delete this expense?"))remove(e.id)}}><Trash2 size={16}/></button></div>)}</div>}