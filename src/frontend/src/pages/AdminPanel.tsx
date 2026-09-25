import {
  ArrowLeft, Check, ChevronRight, Clock3, KeyRound, Plus, Search, ShieldCheck,
  Trash2, UserPlus, Users,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Role, UserStatus } from "../backend";
import type { UserInfo } from "../backend";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAuth } from "../hooks/useAuth";
import { requestNotificationPermission, showAppNotification } from "../hooks/nativeNotifications";
import {
  useApproveUser, useCreateUser, useCleanupOrphanUserAccounts, useDeleteUserAccount,
  useListUsers, useRevokeAccess, useSetUserRole, useUpdateUserCredentials,
} from "../hooks/useBackend";

const ROLE_OPTIONS: Role[] = [Role.admin, Role.attendanceOnly, Role.contractOnly, Role.viewOnly];
function roleLabel(role: Role): string {
  switch (role) {
    case Role.admin: return "Admin";
    case Role.attendanceOnly: return "Attendance";
    case Role.contractOnly: return "Contract";
    case Role.viewOnly: return "View";
  }
}

export default function AdminPanel() {
  const { isAdmin, setActiveTab, username } = useAuth();
  const [section, setSection] = useState<"overview"|"users"|"create">("overview");
  const [newUsername, setNewUsername] = useState(""), [newPassword, setNewPassword] = useState("");
  const [newRoles, setNewRoles] = useState<Role[]>([Role.viewOnly]);
  const [createError, setCreateError] = useState<string|null>(null);
  const [editingUser, setEditingUser] = useState<UserInfo|null>(null);
  const [editUsername, setEditUsername] = useState(""), [editPassword, setEditPassword] = useState(""), [editError, setEditError] = useState<string|null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string,Role[]>>({});
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserInfo|null>(null);
  const [query, setQuery] = useState("");
  const notifiedPendingRef = useRef<Set<string>|null>(null);

  const usersQuery = useListUsers(), createMutation = useCreateUser(), updateMutation = useUpdateUserCredentials();
  const approveMutation = useApproveUser(), setRoleMutation = useSetUserRole(), revokeMutation = useRevokeAccess();
  const cleanupMutation = useCleanupOrphanUserAccounts(), deleteUserMutation = useDeleteUserAccount();
  const users = usersQuery.data ?? [];
  const pending = users.filter(u=>u.status===UserStatus.pending);
  const approved = users.filter(u=>u.status===UserStatus.approved);
  const revoked = users.filter(u=>u.status===UserStatus.revoked);
  const q = query.trim().toLowerCase();
  const filteredApproved = approved.filter(u=>!q || [u.name,u.username,u.email].some(v=>String(v??"").toLowerCase().includes(q)));

  useEffect(()=>{void requestNotificationPermission()},[]);
  useEffect(()=>{
    const current=new Set(pending.map(u=>u.username));
    if(notifiedPendingRef.current===null){notifiedPendingRef.current=current;return;}
    for(const u of pending) if(!notifiedPendingRef.current.has(u.username)) void showAppNotification("Rossie login request",(u.name||"User")+" ("+u.username+") requested access. Open Admin Panel to Approve or Revoke.");
    notifiedPendingRef.current=current;
  },[pending]);

  if(!isAdmin) return <div className="flex min-h-full items-center justify-center bg-[#f5f9ff] p-6" data-ocid="admin_panel.denied"><div className="max-w-sm rounded-[28px] border border-[#c9ddfa] bg-white p-8 text-center shadow-[0_12px_35px_rgba(53,101,160,.1)]"><ShieldCheck className="mx-auto mb-4 text-[#2f7bf4]" size={46}/><h2 className="text-xl font-extrabold text-[#10265d]">Admin access required</h2><p className="mt-2 text-sm text-[#45659b]">Only administrators can manage accounts and credentials.</p></div></div>;

  const create = () => {
    const u=newUsername.trim();
    if(!u||!newPassword){setCreateError("Enter a username and password.");return;}
    setCreateError(null);
    createMutation.mutate({username:u,password:newPassword,role:newRoles},{
      onSuccess:ok=>{if(!ok)setCreateError("That username is already taken.");else{setNewUsername("");setNewPassword("");setSection("users")}},
      onError:()=>setCreateError("Could not create the account. Please try again."),
    });
  };
  const openEdit=(u:UserInfo)=>{setEditingUser(u);setEditUsername(u.username);setEditPassword("");setEditError(null)};
  const saveCredentials=()=>{
    if(!editingUser)return;
    const n=editUsername.trim();
    if(!n){setEditError("Username cannot be empty.");return;}
    updateMutation.mutate({oldUsername:editingUser.username,newUsername:n,newPassword:editPassword||null},{
      onSuccess:ok=>{if(!ok)setEditError("That username is already taken by another account.");else setEditingUser(null)},
      onError:()=>setEditError("Could not update credentials. Please try again."),
    });
  };
  const approve=(u:UserInfo)=>approveMutation.mutate({username:u.username,role:pendingRoles[u.username]??[Role.viewOnly]},{onSuccess:()=>void showAppNotification("Rossie access approved",(u.name||"User")+" is now approved.")});

  return <div className="relative min-h-full overflow-y-auto bg-[#f5f9ff] text-[#10265d]" data-no-tab-swipe data-ocid="admin_panel">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden"><div className="absolute -left-24 top-24 h-52 w-52 rounded-full bg-[#e8f2ff]"/><div className="absolute -right-28 top-12 h-64 w-64 rounded-full bg-[#e5f0ff]"/><div className="absolute right-[-30px] top-36 h-44 w-44 rounded-full bg-[#ffe6bd]"/></div>
    <div className="relative mx-auto w-full max-w-[680px] px-5 pb-8 sm:px-8">
      <header className="flex items-center gap-5 pb-4 pt-[max(18px,env(safe-area-inset-top))]"><button type="button" onClick={()=>setActiveTab("contracts")} className="flex h-10 w-10 items-center justify-center text-[#10265d]" aria-label="Back" data-ocid="admin_panel.back_button"><ArrowLeft size={29}/></button><h1 className="text-[27px] font-extrabold tracking-tight">Admin Panel</h1></header>

      <button type="button" onClick={()=>setSection("users")} className="flex w-full items-center gap-4 rounded-[20px] border border-[#c9ddfa] bg-white px-5 py-5 text-left shadow-[0_7px_25px_rgba(53,101,160,.07)]" data-ocid="admin_panel.active_accounts_card">
        <span className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f7bf4] to-[#2370e9] text-white shadow-[0_10px_22px_rgba(47,123,244,.2)]"><Users size={32}/></span>
        <span className="min-w-0 flex-1"><span className="block text-[19px] font-semibold">Active Accounts</span><strong className="mt-0.5 block text-[31px] leading-8">{approved.length}</strong><span className="text-[15px] text-[#45659b]">Out of {users.length} total accounts</span></span><ChevronRight size={28} className="shrink-0 text-[#4b78b3]"/>
      </button>

      <button type="button" onClick={()=>setSection("users")} className="mt-4 flex w-full items-center gap-4 rounded-[20px] border border-[#c9ddfa] bg-white px-5 py-5 text-left shadow-[0_7px_25px_rgba(53,101,160,.07)]" data-ocid="admin_panel.pending_requests_card">
        <span className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a2a] to-[#ff6f1c] text-white shadow-[0_10px_22px_rgba(255,126,29,.2)]"><Clock3 size={32}/></span>
        <span className="min-w-0 flex-1"><span className="block text-[19px] font-semibold">Pending Requests</span><strong className="mt-0.5 block text-[31px] leading-8">{pending.length}</strong><span className="text-[15px] text-[#45659b]">Awaiting admin approval</span></span><ChevronRight size={28} className="shrink-0 text-[#4b78b3]"/>
      </button>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-[24px] font-extrabold">User Accounts</h2><button type="button" onClick={()=>setSection("create")} className="flex h-10 items-center gap-1.5 rounded-xl bg-[#2f7bf4] px-3.5 text-sm font-bold text-white" data-ocid="admin_panel.add_user_button"><Plus size={18}/> Add</button></div>
        <div className="flex gap-2"><div className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-[#c9ddfa] bg-white px-3.5"><Search size={22} className="text-[#45659b]"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name or mobile…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#6680aa]" data-ocid="admin_panel.search_input"/></div><button type="button" onClick={()=>setQuery("")} className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#c9ddfa] bg-white text-[#2f7bf4]" aria-label="Clear search" data-ocid="admin_panel.filter_button"><Search size={21}/></button></div>

        {section==="overview" && <div className="mt-4 overflow-hidden rounded-[20px] border border-[#c9ddfa] bg-white shadow-[0_7px_25px_rgba(53,101,160,.07)]">
          {filteredApproved.length===0&&<div className="p-7 text-center text-sm text-[#6680aa]">No active accounts found.</div>}
          {filteredApproved.slice(0,8).map((u,i)=><AccountRow key={u.username} user={u} index={i} onEdit={()=>openEdit(u)} onRevoke={()=>revokeMutation.mutate(u.username)} onDelete={()=>setDeleteUserTarget(u)}/>)}
        </div>}

        {section==="users" && <div className="mt-4 space-y-4">
          {pending.length>0&&<UserGroup title="Pending approval" count={pending.length} users={pending} renderExtra={(u,i)=><><RoleMultiSelect value={pendingRoles[u.username]??[Role.viewOnly]} onChange={roles=>setPendingRoles(p=>({...p,[u.username]:roles}))} dataOcid={"admin_panel.pending_role."+i}/><button type="button" onClick={()=>approve(u)} className="rounded-xl bg-[#2f7bf4] px-4 py-2 text-sm font-bold text-white"><Check size={15} className="mr-1 inline"/>Approve</button></>}/>}
          {approved.length>0&&<UserGroup title="Active accounts" count={approved.length} users={filteredApproved} renderExtra={(u,i)=><div className="flex flex-wrap gap-2"><RoleMultiSelect value={u.roles??[u.role]} onChange={roles=>setRoleMutation.mutate({username:u.username,role:roles})} dataOcid={"admin_panel.role_select."+i}/><button type="button" onClick={()=>openEdit(u)} className="rounded-xl border border-[#c9ddfa] bg-[#f7fbff] px-3 py-2 text-xs font-bold text-[#2f7bf4]"><KeyRound size={14} className="mr-1 inline"/>Credentials</button>{u.username!==username&&<><button type="button" onClick={()=>revokeMutation.mutate(u.username)} className="rounded-xl bg-[#fff0ee] px-3 py-2 text-xs font-bold text-[#d94a3e]"><Trash2 size={14} className="mr-1 inline"/>Revoke</button><button type="button" onClick={()=>setDeleteUserTarget(u)} className="rounded-xl bg-[#fff0ee] px-3 py-2 text-xs font-bold text-[#d94a3e]"><Trash2 size={14} className="mr-1 inline"/>Delete</button></>}</div>}/>}
          {revoked.length>0&&<UserGroup title="Revoked access" count={revoked.length} users={revoked} renderExtra={(u,i)=><><RoleMultiSelect value={u.roles??[u.role]} onChange={roles=>setRoleMutation.mutate({username:u.username,role:roles})} dataOcid={"admin_panel.revoked_role."+i}/><button type="button" onClick={()=>approveMutation.mutate({username:u.username,role:u.roles??[u.role]})} className="rounded-xl bg-[#2f7bf4] px-4 py-2 text-sm font-bold text-white">Restore</button></>}/>}
          <button type="button" onClick={()=>setSection("create")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#9fc1f2] bg-white py-3 text-sm font-bold text-[#2f7bf4]"><UserPlus size={17}/> Create new account</button>
          <button type="button" onClick={()=>cleanupMutation.mutate()} disabled={cleanupMutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ffd1cc] bg-[#fff5f3] py-3 text-xs font-bold text-[#d94a3e]" data-ocid="admin_panel.cleanup_orphan_accounts"><Trash2 size={15}/>{cleanupMutation.isPending?"Checking accounts…":"Remove accounts not in Labour details"}</button>
        </div>}

        {section==="create"&&<section className="mt-4 rounded-[20px] border border-[#c9ddfa] bg-white p-5 shadow-[0_7px_25px_rgba(53,101,160,.07)]" data-ocid="admin_panel.create_section">
          <div className="mb-4 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#2f7bf4]"><UserPlus size={22}/></span><div><h3 className="text-lg font-extrabold">Create account</h3><p className="text-xs text-[#6680aa]">Add a user and assign permissions.</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Username"><input value={newUsername} onChange={e=>setNewUsername(e.target.value)} className="w-full rounded-xl border border-[#c9ddfa] px-3 py-3 text-sm outline-none focus:border-[#2f7bf4]" autoComplete="off" data-ocid="admin_panel.create_username_input"/></Field><Field label="Password"><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full rounded-xl border border-[#c9ddfa] px-3 py-3 text-sm outline-none focus:border-[#2f7bf4]" autoComplete="new-password" data-ocid="admin_panel.create_password_input"/></Field></div>
          <div className="mt-3"><label className="mb-1.5 block text-xs font-bold text-[#45659b]">Permissions</label><RoleMultiSelect value={newRoles} onChange={setNewRoles} dataOcid="admin_panel.create_role_select"/></div>
          {createError&&<p className="mt-3 rounded-xl bg-[#fff0ee] p-3 text-xs font-semibold text-[#d94a3e]">{createError}</p>}
          <button type="button" onClick={create} disabled={createMutation.isPending} className="mt-4 w-full rounded-xl bg-[#2f7bf4] py-3 text-sm font-bold text-white disabled:opacity-50" data-ocid="admin_panel.create_button">{createMutation.isPending?"Creating…":"Create account"}</button>
        </section>}
      </section>
    </div>

    <Dialog open={deleteUserTarget!==null} onOpenChange={open=>{if(!open)setDeleteUserTarget(null)}}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Delete user account</DialogTitle><DialogDescription>Permanently remove the login account for {deleteUserTarget?.name||deleteUserTarget?.username}.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={()=>setDeleteUserTarget(null)}>Cancel</Button><Button variant="destructive" disabled={deleteUserMutation.isPending} onClick={()=>{if(deleteUserTarget)deleteUserMutation.mutate(deleteUserTarget.username,{onSuccess:()=>setDeleteUserTarget(null)})}}>{deleteUserMutation.isPending?"Deleting…":"Delete account"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={editingUser!==null} onOpenChange={open=>{if(!open)setEditingUser(null)}}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Edit credentials</DialogTitle><DialogDescription>Change the username and/or password for {editingUser?.username}. Leave the password blank to keep it unchanged.</DialogDescription></DialogHeader><div className="space-y-3"><Field label="Username"><input value={editUsername} onChange={e=>setEditUsername(e.target.value)} className="w-full rounded-xl border border-[#c9ddfa] px-3 py-3 text-sm outline-none focus:border-[#2f7bf4]" autoComplete="off"/></Field><Field label="New password"><input type="password" value={editPassword} onChange={e=>setEditPassword(e.target.value)} className="w-full rounded-xl border border-[#c9ddfa] px-3 py-3 text-sm outline-none focus:border-[#2f7bf4]" autoComplete="new-password"/></Field>{editError&&<p className="text-xs font-semibold text-[#d94a3e]">{editError}</p>}</div><DialogFooter><Button variant="outline" onClick={()=>setEditingUser(null)}>Cancel</Button><Button onClick={saveCredentials} disabled={updateMutation.isPending}>{updateMutation.isPending?"Saving…":"Save changes"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function AccountRow({user,index,onEdit,onRevoke,onDelete}:{user:UserInfo;index:number;onEdit:()=>void;onRevoke:()=>void;onDelete:()=>void}) {
  const [menu,setMenu]=useState(false);
  const initials=(user.name||user.username||"U").slice(0,2).toUpperCase();
  return <article className="relative flex items-center gap-3 border-b border-[#e3ebf7] px-5 py-3.5 last:border-b-0" data-ocid={"admin_panel.account_row."+index}>
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2f7bf4] text-sm font-bold text-white">{initials}</span>
    <span className="min-w-0 flex-1"><strong className="block truncate text-[16px] font-bold">{user.name||"User"}</strong><span className="block truncate text-sm text-[#4d6fa5]">{user.username}</span></span>
    <span className={"rounded-full px-3 py-1.5 text-xs font-semibold "+(user.role===Role.admin?"bg-[#fff0cf] text-[#d27b00]":"bg-[#dff7e8] text-[#16854c]")}>{roleLabel(user.role)}</span>
    <button type="button" onClick={()=>setMenu(v=>!v)} className="flex h-9 w-9 items-center justify-center rounded-full text-[#4b70a7]" aria-label="Account actions" data-ocid={"admin_panel.account_actions."+index}><ChevronRight size={22}/></button>
    {menu&&<div className="absolute right-3 top-14 z-20 flex flex-col rounded-xl border border-[#c9ddfa] bg-white p-1 shadow-xl"><button type="button" onClick={onEdit} className="px-3 py-2 text-left text-xs font-semibold">Credentials</button><button type="button" onClick={onRevoke} className="px-3 py-2 text-left text-xs font-semibold text-[#d94a3e]">Revoke</button><button type="button" onClick={onDelete} className="px-3 py-2 text-left text-xs font-semibold text-[#d94a3e]">Delete</button></div>}
  </article>;
}
function UserGroup({title,count,users,renderExtra}:{title:string;count:number;users:UserInfo[];renderExtra:(u:UserInfo,i:number)=>ReactNode}) {
  return <section><div className="mb-2 flex items-center gap-2"><h3 className="text-base font-extrabold">{title}</h3><span className="rounded-full bg-[#eaf3ff] px-2.5 py-1 text-xs font-bold text-[#2f7bf4]">{count}</span></div><div className="space-y-3">{users.map((u,i)=><div key={u.username} className="rounded-[18px] border border-[#c9ddfa] bg-white p-4 shadow-[0_5px_20px_rgba(53,101,160,.05)]"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2f7bf4] text-sm font-bold text-white">{(u.name||u.username).slice(0,2).toUpperCase()}</span><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{u.name||"User"}</strong><span className="block truncate text-xs text-[#6680aa]">{u.username}</span></div></div><div className="mt-3 space-y-2">{renderExtra(u,i)}</div></div>)}</div></section>;
}
function Field({label,children}:{label:string;children:ReactNode}){return <label className="block text-xs font-bold text-[#45659b]">{label}<span className="mt-1.5 block">{children}</span></label>}
function RoleMultiSelect({value,onChange,dataOcid}:{value:Role[];onChange:(roles:Role[])=>void;dataOcid:string}) {
  const toggle=(r:Role)=>{const next=value.includes(r)?value.filter(x=>x!==r):[...value,r];if(next.length)onChange(next)};
  return <div className="flex flex-wrap gap-1.5" data-ocid={dataOcid}>{ROLE_OPTIONS.map(r=>{const selected=value.includes(r);return <button key={r} type="button" onClick={()=>toggle(r)} className="rounded-full px-3 py-1.5 text-[10px] font-bold" style={{background:selected?"#eaf3ff":"#f5f9ff",color:selected?"#2f7bf4":"#6680aa",border:selected?"1px solid #9fc1f2":"1px solid #d9e7f8"}}>{selected?"✓ ":""}{roleLabel(r)}</button>})}</div>;
}
