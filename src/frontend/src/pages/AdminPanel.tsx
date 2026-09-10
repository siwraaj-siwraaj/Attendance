import {
  Check,
  KeyRound,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserX,
  Users,
  Activity,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Role, UserStatus } from "../backend";
import type { UserInfo } from "../backend";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useAuth } from "../hooks/useAuth";
import {
  useApproveUser,
  useCreateUser,
  useListUsers,
  useRevokeAccess,
  useSetUserRole,
  useUpdateUserCredentials,
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

function roleBadgeClass(role: Role): string {
  switch (role) {
    case Role.admin: return "role-admin";
    case Role.attendanceOnly: return "role-attendance";
    case Role.contractOnly: return "role-contract";
    case Role.viewOnly: return "role-view";
  }
}

function statusLabel(status: UserStatus): string {
  switch (status) {
    case UserStatus.pending: return "Pending";
    case UserStatus.approved: return "Approved";
    case UserStatus.revoked: return "Revoked";
  }
}

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [section, setSection] = useState<"overview" | "users" | "create">("overview");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoles, setNewRoles] = useState<Role[]>([Role.viewOnly]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, Role[]>>({});

  const usersQuery = useListUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUserCredentials();
  const approveMutation = useApproveUser();
  const setRoleMutation = useSetUserRole();
  const revokeMutation = useRevokeAccess();

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6" data-ocid="admin_panel.denied">
        <div className="text-center max-w-sm rounded-3xl p-8" style={{ background: "linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018))", border: "1px solid rgba(249,115,22,.18)" }}>
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(249,115,22,.12)", border: "1px solid rgba(249,115,22,.25)" }}><ShieldCheck size={28} className="text-[#f97316]" /></div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Admin access required</h2>
          <p className="text-sm" style={{ color: "#8892a4" }}>Only users with the Admin role can manage accounts and credentials.</p>
        </div>
      </div>
    );
  }

  const users = usersQuery.data ?? [];
  const pending = users.filter((u) => u.status === UserStatus.pending);
  const approved = users.filter((u) => u.status === UserStatus.approved);
  const revoked = users.filter((u) => u.status === UserStatus.revoked);

  const handleCreate = () => {
    const username = newUsername.trim();
    if (!username || !newPassword) { setCreateError("Enter a username and password."); return; }
    setCreateError(null);
    const capturedUsername = username;
    const capturedPassword = newPassword;
    const capturedRoles = newRoles;
    setNewUsername(""); setNewPassword("");
    createMutation.mutate({ username: capturedUsername, password: capturedPassword, role: capturedRoles }, {
      onSuccess: (created) => {
        if (!created) { setCreateError("That username is already taken."); setNewUsername(capturedUsername); setNewPassword(capturedPassword); }
      },
      onError: () => { setCreateError("Could not create the account. Please try again."); setNewUsername(capturedUsername); setNewPassword(capturedPassword); },
    });
  };

  const openEdit = (user: UserInfo) => { setEditingUser(user); setEditUsername(user.username); setEditPassword(""); setEditError(null); };

  const handleSaveCredentials = () => {
    if (!editingUser) return;
    const newName = editUsername.trim();
    if (!newName) { setEditError("Username cannot be empty."); return; }
    setEditError(null);
    const oldUsername = editingUser.username;
    updateMutation.mutate({ oldUsername, newUsername: newName, newPassword: editPassword ? editPassword : null }, {
      onSuccess: (updated) => { if (!updated) { setEditError("That username is already taken by another account."); return; } setEditingUser(null); },
      onError: () => setEditError("Could not update credentials. Please try again."),
    });
  };

  const handleApprove = (user: UserInfo) => approveMutation.mutate({ username: user.username, role: pendingRoles[user.username] ?? [Role.viewOnly] });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-safe" data-ocid="admin_panel">
      <div className="max-w-5xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">
        {/* Dashboard hero */}
        <section className="relative overflow-hidden rounded-[28px] p-5 sm:p-7" style={{ background: "radial-gradient(circle at 100% 0%,rgba(249,115,22,.22),transparent 38%),linear-gradient(135deg,#121b2e,#0b1220 70%)", border: "1px solid rgba(249,115,22,.18)", boxShadow: "0 18px 45px rgba(0,0,0,.22)" }}>
          <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full border border-orange-400/10" />
          <div className="absolute right-8 -bottom-24 h-40 w-40 rounded-full border border-orange-400/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#fb923c]"><LockKeyhole size={14} /> Administration</div>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div><h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">Control Center</h1><p className="mt-1 text-xs sm:text-sm" style={{ color: "#9aa5b8" }}>Manage accounts, permissions and access from one place.</p></div>
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(249,115,22,.13)", border: "1px solid rgba(249,115,22,.25)" }}><ShieldCheck size={24} className="text-[#fb923c]" /></div>
            </div>
          </div>
        </section>

        {/* Primary navigation */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl p-1.5" style={{ background: "rgba(5,10,20,.72)", border: "1px solid rgba(255,255,255,.07)" }}>
          <AdminNavButton active={section === "overview"} icon={<Activity size={15} />} label="Overview" onClick={() => setSection("overview")} />
          <AdminNavButton active={section === "users"} icon={<Users size={15} />} label="Users" badge={users.length} onClick={() => setSection("users")} />
          <AdminNavButton active={section === "create"} icon={<UserPlus size={15} />} label="Add user" onClick={() => setSection("create")} />
        </div>

        {/* Overview */}
        {section === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <MetricCard label="Total users" value={users.length} icon={<Users size={17} />} />
              <MetricCard label="Approved" value={approved.length} icon={<ShieldCheck size={17} />} accent="green" />
              <MetricCard label="Pending" value={pending.length} icon={<UserPlus size={17} />} accent="orange" />
              <MetricCard label="Revoked" value={revoked.length} icon={<UserX size={17} />} accent="red" />
            </div>

            <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-4">
              <section className="rounded-3xl p-4 sm:p-5" style={{ background: "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))", border: "1px solid rgba(255,255,255,.07)" }}>
                <div className="flex items-center justify-between mb-4"><div><h2 className="font-display text-base font-bold text-white">Account activity</h2><p className="text-[11px] mt-1" style={{ color: "#7f8a9e" }}>Current access distribution</p></div><button type="button" onClick={() => setSection("users")} className="text-[11px] font-semibold text-[#fb923c] flex items-center gap-1">Manage <ChevronRight size={13} /></button></div>
                <div className="space-y-3">
                  <ProgressRow label="Approved accounts" value={approved.length} total={Math.max(users.length,1)} accent="green" />
                  <ProgressRow label="Awaiting approval" value={pending.length} total={Math.max(users.length,1)} accent="orange" />
                  <ProgressRow label="Revoked access" value={revoked.length} total={Math.max(users.length,1)} accent="red" />
                </div>
              </section>
              <section className="rounded-3xl p-4 sm:p-5" style={{ background: "radial-gradient(circle at 100% 0%,rgba(249,115,22,.12),transparent 55%),rgba(255,255,255,.025)", border: "1px solid rgba(249,115,22,.12)" }}>
                <div className="flex items-center gap-2 mb-3"><span className="text-[#fb923c]"><UserPlus size={17} /></span><h2 className="font-display text-base font-bold text-white">Pending approvals</h2></div>
                {pending.length === 0 ? <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(0,0,0,.13)" }}><Check size={24} className="mx-auto mb-2 text-emerald-400" /><p className="text-xs font-semibold text-white">All clear</p><p className="text-[11px] mt-1" style={{ color: "#7f8a9e" }}>No accounts are waiting for approval.</p></div> : <div className="space-y-2">{pending.slice(0,3).map((u,i)=><CompactUser key={u.username} user={u} index={i} action={<button type="button" onClick={()=>handleApprove(u)} className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white" style={{background:"linear-gradient(135deg,#f97316,#ea580c)"}}>Approve</button>} />)}</div>}
                {pending.length > 3 && <button type="button" onClick={()=>setSection("users")} className="mt-3 text-[11px] text-[#fb923c] font-semibold">View all {pending.length} pending →</button>}
              </section>
            </div>
          </div>
        )}

        {/* Create */}
        {section === "create" && (
          <section className="rounded-3xl p-4 sm:p-6" style={{ background: "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))", border: "1px solid rgba(249,115,22,.16)", boxShadow: "0 16px 40px rgba(0,0,0,.16)" }} data-ocid="admin_panel.create_section">
            <div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(249,115,22,.13)",border:"1px solid rgba(249,115,22,.25)"}}><UserPlus size={20} className="text-[#fb923c]"/></div><div><h2 className="font-display text-lg font-bold text-white">Create account</h2><p className="text-xs mt-1" style={{color:"#7f8a9e"}}>Add a new user and assign the permissions they need.</p></div></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Username"><input id="admin-create-username" type="text" value={newUsername} onChange={e=>setNewUsername(e.target.value)} className="login-input" placeholder="Enter username" autoComplete="off" data-ocid="admin_panel.create_username_input" /></Field>
              <Field label="Password"><input id="admin-create-password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="login-input" placeholder="Set a password" autoComplete="new-password" data-ocid="admin_panel.create_password_input" /></Field>
            </div>
            <div className="mt-3"><label className="login-label">Permissions</label><RoleMultiSelect value={newRoles} onChange={setNewRoles} dataOcid="admin_panel.create_role_select" /></div>
            {createError && <div className="login-error mt-3" data-ocid="admin_panel.create_error">{createError}</div>}
            <div className="mt-4 flex justify-end"><button type="button" onClick={handleCreate} disabled={createMutation.isPending} className="btn-orange flex items-center justify-center gap-2 px-5 py-2.5 text-sm disabled:opacity-60" data-ocid="admin_panel.create_button"><UserPlus size={16}/>{createMutation.isPending?"Creating…":"Create account"}</button></div>
          </section>
        )}

        {/* Users */}
        {section === "users" && (
          <div className="space-y-5">
            {usersQuery.isLoading && <StateBox text="Loading users…" />}
            {usersQuery.isError && <StateBox text="Could not load users. Please try again." error data-ocid="admin_panel.error_state" />}
            {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && <StateBox text="No users yet. Create the first account from Add user." />}
            {pending.length > 0 && <UserGroup title="Pending approval" count={pending.length} icon={<UserPlus size={16}/>} users={pending} renderExtra={(u,i)=><><RoleMultiSelect value={pendingRoles[u.username]??[Role.viewOnly]} onChange={roles=>setPendingRoles(p=>({...p,[u.username]:roles}))} dataOcid={`admin_panel.pending_role.${i}`}/><button type="button" onClick={()=>handleApprove(u)} disabled={approveMutation.isPending} className="admin-action primary" data-ocid={`admin_panel.approve_button.${i}`}><Check size={14}/>Approve</button></>} />}
            {approved.length > 0 && <UserGroup title="Active accounts" count={approved.length} icon={<ShieldCheck size={16}/>} users={approved} renderExtra={(u,i)=><><RoleMultiSelect value={u.roles??[u.role]} onChange={roles=>setRoleMutation.mutate({username:u.username,role:roles})} dataOcid={`admin_panel.role_select.${i}`}/><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>openEdit(u)} className="admin-action secondary" data-ocid={`admin_panel.edit_button.${i}`}><KeyRound size={14}/>Credentials</button><button type="button" onClick={()=>revokeMutation.mutate(u.username)} disabled={revokeMutation.isPending} className="admin-action danger" data-ocid={`admin_panel.revoke_button.${i}`}><Trash2 size={14}/>Remove</button></div></>} />}
            {revoked.length > 0 && <UserGroup title="Revoked access" count={revoked.length} icon={<UserX size={16}/>} users={revoked} renderExtra={(u,i)=><><RoleMultiSelect value={u.roles??[u.role]} onChange={roles=>setRoleMutation.mutate({username:u.username,role:roles})} dataOcid={`admin_panel.revoked_role.${i}`}/><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>openEdit(u)} className="admin-action secondary" data-ocid={`admin_panel.revoked_edit_button.${i}`}><KeyRound size={14}/>Credentials</button><button type="button" onClick={()=>approveMutation.mutate({username:u.username,role:u.roles??[u.role]})} disabled={approveMutation.isPending} className="admin-action primary" data-ocid={`admin_panel.restore_button.${i}`}><Check size={14}/>Restore</button></div></>} />}
          </div>
        )}
      </div>

      <Dialog open={editingUser!==null} onOpenChange={open=>{if(!open)setEditingUser(null)}}>
        <DialogContent className="glass-dialog border-border" data-ocid="admin_panel.edit_modal">
          <DialogHeader><DialogTitle className="font-display text-white">Edit credentials</DialogTitle><DialogDescription>Change the username and/or password for <span className="font-semibold text-white">{editingUser?.username}</span>. Leave the password blank to keep it unchanged.</DialogDescription></DialogHeader>
          <div className="space-y-3"><Field label="Username"><input id="admin-edit-username" type="text" value={editUsername} onChange={e=>setEditUsername(e.target.value)} className="login-input" autoComplete="off" data-ocid="admin_panel.edit_username_input" /></Field><Field label="New password"><input id="admin-edit-password" type="password" value={editPassword} onChange={e=>setEditPassword(e.target.value)} className="login-input" placeholder="Leave blank to keep current" autoComplete="new-password" data-ocid="admin_panel.edit_password_input" /></Field>{editError&&<div className="login-error" data-ocid="admin_panel.edit_error">{editError}</div>}</div>
          <DialogFooter><Button variant="outline" onClick={()=>setEditingUser(null)} data-ocid="admin_panel.edit_cancel_button">Cancel</Button><Button onClick={handleSaveCredentials} disabled={updateMutation.isPending} data-ocid="admin_panel.edit_save_button">{updateMutation.isPending?"Saving…":"Save changes"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminNavButton({active,icon,label,badge,onClick}:{active:boolean;icon:ReactNode;label:string;badge?:number;onClick:()=>void}){
  return <button type="button" onClick={onClick} className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] sm:text-xs font-bold transition-all" style={{background:active?"linear-gradient(135deg,rgba(249,115,22,.22),rgba(249,115,22,.08))":"transparent",color:active?"#fb923c":"#7f8a9e",border:active?"1px solid rgba(249,115,22,.25)":"1px solid transparent"}}>{icon}{label}{badge!==undefined&&<span className="rounded-full px-1.5 py-0.5 text-[9px]" style={{background:active?"rgba(249,115,22,.2)":"rgba(255,255,255,.06)",color:active?"#fb923c":"#8892a4"}}>{badge}</span>}</button>;
}

function MetricCard({label,value,icon,accent="orange"}:{label:string;value:number;icon:ReactNode;accent?:"orange"|"green"|"red"}){
  const color=accent==="green"?"#34d399":accent==="red"?"#fb7185":"#fb923c";
  return <div className="rounded-2xl p-3.5" style={{background:"rgba(255,255,255,.035)",border:"1px solid rgba(255,255,255,.065)"}}><div className="flex items-center justify-between"><span style={{color}}>{icon}</span><span className="font-display text-xl font-extrabold text-white tabular-nums">{value}</span></div><div className="text-[10px] mt-2" style={{color:"#7f8a9e"}}>{label}</div></div>;
}

function ProgressRow({label,value,total,accent}:{label:string;value:number;total:number;accent:"green"|"orange"|"red"}){
  const color=accent==="green"?"#34d399":accent==="red"?"#fb7185":"#fb923c";
  const pct=Math.min(100,Math.round((value/total)*100));
  return <div><div className="flex justify-between text-[11px] mb-1.5"><span className="text-white">{label}</span><span style={{color}}>{value}</span></div><div className="h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,.06)"}}><div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:color}}/></div></div>;
}

function CompactUser({user,index,action}:{user:UserInfo;index:number;action:ReactNode}){return <div className="flex items-center gap-3 rounded-2xl p-3" style={{background:"rgba(0,0,0,.13)",border:"1px solid rgba(255,255,255,.05)"}}><div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-[#fb923c]" style={{background:"rgba(249,115,22,.1)"}}>{user.username.slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="text-xs font-bold text-white truncate">{user.username}</div><div className="text-[10px] mt-0.5" style={{color:"#7f8a9e"}}>Waiting for approval</div></div>{action}</div>}

function UserGroup({title,count,icon,users,renderExtra}:{title:string;count:number;icon:ReactNode;users:UserInfo[];renderExtra:(user:UserInfo,index:number)=>ReactNode}){
  return <section data-ocid={`admin_panel.${title.toLowerCase().replaceAll(" ","_")}_section`}><div className="flex items-center gap-2 mb-2.5"><span className="text-[#fb923c]">{icon}</span><h2 className="font-display text-sm font-bold text-white">{title}</h2><span className="rounded-full px-2 py-0.5 text-[9px] font-bold text-[#fb923c]" style={{background:"rgba(249,115,22,.12)",border:"1px solid rgba(249,115,22,.2)"}}>{count}</span></div><div className="space-y-2">{users.map((u,i)=><div key={u.username} className="rounded-2xl p-3.5" style={{background:"linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018))",border:"1px solid rgba(255,255,255,.065)"}}><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-[#fb923c]" style={{background:"rgba(249,115,22,.1)",border:"1px solid rgba(249,115,22,.16)"}}>{u.username.slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-sm font-bold text-white truncate">{u.username}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${u.status===UserStatus.pending||u.status===UserStatus.revoked?"role-pending":roleBadgeClass(u.role)}`}>{u.status===UserStatus.approved?roleLabel(u.role):statusLabel(u.status)}</span></div><div className="text-[10px] mt-1" style={{color:"#7f8a9e"}}>{u.status===UserStatus.pending?"Waiting for approval":u.status===UserStatus.revoked?"Access revoked":"Active account"}</div></div></div><div className="rounded-xl p-2.5 space-y-2.5" style={{background:"rgba(0,0,0,.13)",border:"1px solid rgba(255,255,255,.045)"}}>{renderExtra(u,i)}</div></div>)}</div></section>;
}

function Field({label,children}:{label:string;children:ReactNode}){return <div><label className="login-label">{label}</label>{children}</div>}
function StateBox({text,error=false,"data-ocid":ocid}:{text:string;error?:boolean;"data-ocid"?:string}){return <div className="rounded-2xl p-7 text-center text-xs" style={{color:error?"#f87171":"#8892a4",background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.06)"}} data-ocid={ocid}>{text}</div>}

function RoleMultiSelect({value,onChange,dataOcid}:{value:Role[];onChange:(roles:Role[])=>void;dataOcid:string}){
  const toggle=(role:Role)=>{const next=value.includes(role)?value.filter(r=>r!==role):[...value,role];if(next.length>0)onChange(next)};
  return <div className="flex flex-wrap gap-1.5 w-full" data-ocid={dataOcid} aria-label="Assign roles">{ROLE_OPTIONS.map(role=>{const selected=value.includes(role);return <button key={role} type="button" onClick={()=>toggle(role)} className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-all" style={{background:selected?"rgba(249,115,22,.16)":"rgba(255,255,255,.035)",border:selected?"1px solid rgba(249,115,22,.4)":"1px solid rgba(255,255,255,.1)",color:selected?"#fb923c":"#8892a4"}} aria-pressed={selected}>{selected?"✓ ":""}{roleLabel(role)}</button>})}</div>;
}
