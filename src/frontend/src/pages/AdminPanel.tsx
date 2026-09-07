import {
  Check,
  KeyRound,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { useState } from "react";
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

const ROLE_OPTIONS: Role[] = [
  Role.admin,
  Role.attendanceOnly,
  Role.contractOnly,
  Role.viewOnly,
];

function roleLabel(role: Role): string {
  switch (role) {
    case Role.admin:
      return "Admin";
    case Role.attendanceOnly:
      return "Attendance";
    case Role.contractOnly:
      return "Contract";
    case Role.viewOnly:
      return "View";
  }
}

function roleBadgeClass(role: Role): string {
  switch (role) {
    case Role.admin:
      return "role-admin";
    case Role.attendanceOnly:
      return "role-attendance";
    case Role.contractOnly:
      return "role-contract";
    case Role.viewOnly:
      return "role-view";
  }
}

function statusLabel(status: UserStatus): string {
  switch (status) {
    case UserStatus.pending:
      return "Pending";
    case UserStatus.approved:
      return "Approved";
    case UserStatus.revoked:
      return "Revoked";
  }
}

export default function AdminPanel() {
  const { isAdmin } = useAuth();

  // Create-user form draft (Local UI state).
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoles, setNewRoles] = useState<Role[]>([Role.viewOnly]);
  const [createError, setCreateError] = useState<string | null>(null);

  // Credential-edit modal state.
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Per-pending-user role selection, keyed by username.
  const [pendingRoles, setPendingRoles] = useState<Record<string, Role[]>>({});

  const usersQuery = useListUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUserCredentials();
  const approveMutation = useApproveUser();
  const setRoleMutation = useSetUserRole();
  const revokeMutation = useRevokeAccess();

  if (!isAdmin) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-6"
        data-ocid="admin_panel.denied"
      >
        <div className="text-center max-w-sm">
          <ShieldCheck
            size={40}
            className="mx-auto mb-4 text-[#f97316]"
            aria-hidden="true"
          />
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Admin access required
          </h2>
          <p className="text-sm" style={{ color: "#8892a4" }}>
            Only users with the Admin role can manage accounts and credentials.
          </p>
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
    if (!username || !newPassword) {
      setCreateError("Enter a username and password.");
      return;
    }
    setCreateError(null);
    const capturedUsername = username;
    const capturedPassword = newPassword;
    const capturedRoles = newRoles;
    // Clear the draft synchronously before the mutation settles.
    setNewUsername("");
    setNewPassword("");
    createMutation.mutate(
      {
        username: capturedUsername,
        password: capturedPassword,
        role: capturedRoles,
      },
      {
        onSuccess: (created) => {
          if (!created) {
            setCreateError("That username is already taken.");
            setNewUsername(capturedUsername);
            setNewPassword(capturedPassword);
          }
        },
        onError: () => {
          setCreateError("Could not create the account. Please try again.");
          setNewUsername(capturedUsername);
          setNewPassword(capturedPassword);
        },
      },
    );
  };

  const openEdit = (user: UserInfo) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditPassword("");
    setEditError(null);
  };

  const handleSaveCredentials = () => {
    if (!editingUser) return;
    const newName = editUsername.trim();
    if (!newName) {
      setEditError("Username cannot be empty.");
      return;
    }
    setEditError(null);
    const oldUsername = editingUser.username;
    const capturedName = newName;
    const capturedPassword = editPassword;
    updateMutation.mutate(
      {
        oldUsername,
        newUsername: capturedName,
        newPassword: capturedPassword ? capturedPassword : null,
      },
      {
        onSuccess: (updated) => {
          if (!updated) {
            setEditError("That username is already taken by another account.");
            return;
          }
          setEditingUser(null);
        },
        onError: () => {
          setEditError("Could not update credentials. Please try again.");
        },
      },
    );
  };

  const handleApprove = (user: UserInfo) => {
    const roles = pendingRoles[user.username] ?? [Role.viewOnly];
    approveMutation.mutate({ username: user.username, role: roles });
  };

  return (
    <div className="flex-1 overflow-y-auto pb-safe" data-ocid="admin_panel">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            Admin Panel
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#8892a4" }}>
            Manage user accounts, credentials, roles, and access.
          </p>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total users" value={users.length} />
          <StatCard label="Pending" value={pending.length} accent="#f97316" />
          <StatCard label="Approved" value={approved.length} accent="#10b981" />
        </div>

        {/* Create user */}
        <section
          className="glass-card rounded-2xl p-4"
          data-ocid="admin_panel.create_section"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#f97316]">
              <UserPlus size={16} aria-hidden="true" />
            </span>
            <h3 className="font-display text-sm font-bold text-white">
              Create new user
            </h3>
          </div>
          <div className="space-y-2.5">
            <div>
              <label htmlFor="admin-create-username" className="login-label">
                Username
              </label>
              <input
                id="admin-create-username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="login-input"
                placeholder="e.g. rossie"
                autoComplete="off"
                data-ocid="admin_panel.create_username_input"
              />
            </div>
            <div>
              <label htmlFor="admin-create-password" className="login-label">
                Password
              </label>
              <input
                id="admin-create-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="login-input"
                placeholder="Set a password"
                autoComplete="new-password"
                data-ocid="admin_panel.create_password_input"
              />
            </div>
            <div>
              <label className="login-label">
                Roles
              </label>
              <RoleMultiSelect
                value={newRoles}
                onChange={setNewRoles}
                dataOcid="admin_panel.create_role_select"
              />
            </div>
            {createError && (
              <div className="login-error" data-ocid="admin_panel.create_error">
                {createError}
              </div>
            )}
            <button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="btn-orange w-full flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-60"
              data-ocid="admin_panel.create_button"
            >
              <UserPlus size={16} aria-hidden="true" />
              {createMutation.isPending ? "Creating…" : "Create account"}
            </button>
          </div>
        </section>

        {usersQuery.isLoading && (
          <div
            className="rounded-2xl p-6 text-center text-sm"
            style={{ color: "#8892a4" }}
            data-ocid="admin_panel.loading_state"
          >
            Loading users…
          </div>
        )}

        {usersQuery.isError && (
          <div
            className="rounded-2xl p-6 text-center text-sm"
            style={{ color: "#f87171" }}
            data-ocid="admin_panel.error_state"
          >
            Could not load users. Please try again.
          </div>
        )}

        {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(249,115,22,0.15)",
            }}
            data-ocid="admin_panel.empty_state"
          >
            <Users
              size={36}
              className="mx-auto mb-3 text-[#f97316]"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-white">No users yet</p>
            <p className="text-xs mt-1" style={{ color: "#8892a4" }}>
              Create the first account above to get started.
            </p>
          </div>
        )}

        {/* Pending approvals */}
        {pending.length > 0 && (
          <section data-ocid="admin_panel.pending_section">
            <SectionTitle
              icon={<UserPlus size={16} aria-hidden="true" />}
              title="Pending approval"
              count={pending.length}
            />
            <div className="space-y-2">
              {pending.map((user, i) => (
                <UserCard
                  key={user.username}
                  user={user}
                  index={i}
                  roleSelect={
                    <RoleMultiSelect
                      value={pendingRoles[user.username] ?? [Role.viewOnly]}
                      onChange={(roles) =>
                        setPendingRoles((prev) => ({
                          ...prev,
                          [user.username]: roles,
                        }))
                      }
                      dataOcid={`admin_panel.pending_role.${i}`}
                    />
                  }
                  actions={
                    <button
                      type="button"
                      onClick={() => handleApprove(user)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, #f97316, #ea580c)",
                        boxShadow: "0 4px 16px rgba(249,115,22,0.25)",
                      }}
                      data-ocid={`admin_panel.approve_button.${i}`}
                    >
                      <Check size={14} aria-hidden="true" />
                      Approve
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Approved users */}
        {approved.length > 0 && (
          <section data-ocid="admin_panel.approved_section">
            <SectionTitle
              icon={<ShieldCheck size={16} aria-hidden="true" />}
              title="Approved users"
              count={approved.length}
            />
            <div className="space-y-2">
              {approved.map((user, i) => (
                <UserCard
                  key={user.username}
                  user={user}
                  index={i}
                  roleSelect={
                    <RoleMultiSelect
                      value={user.roles ?? [user.role]}
                      onChange={(roles) =>
                        setRoleMutation.mutate({
                          username: user.username,
                          role: roles,
                        })
                      }
                      dataOcid={`admin_panel.role_select.${i}`}
                    />
                  }
                  actions={
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                        style={{
                          background: "rgba(249,115,22,0.12)",
                          border: "1px solid rgba(249,115,22,0.3)",
                          color: "#fb923c",
                        }}
                        data-ocid={`admin_panel.edit_button.${i}`}
                      >
                        <KeyRound size={14} aria-hidden="true" />
                        Credentials
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeMutation.mutate(user.username)}
                        disabled={revokeMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                        style={{
                          background: "rgba(225,29,72,0.12)",
                          border: "1px solid rgba(225,29,72,0.3)",
                          color: "#fb7185",
                        }}
                        data-ocid={`admin_panel.revoke_button.${i}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Revoked users */}
        {revoked.length > 0 && (
          <section data-ocid="admin_panel.revoked_section">
            <SectionTitle
              icon={<UserX size={16} aria-hidden="true" />}
              title="Revoked access"
              count={revoked.length}
            />
            <div className="space-y-2">
              {revoked.map((user, i) => (
                <UserCard
                  key={user.username}
                  user={user}
                  index={i}
                  roleSelect={
                    <RoleMultiSelect
                      value={user.roles ?? [user.role]}
                      onChange={(roles) =>
                        setRoleMutation.mutate({
                          username: user.username,
                          role: roles,
                        })
                      }
                      dataOcid={`admin_panel.revoked_role.${i}`}
                    />
                  }
                  actions={
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                        style={{
                          background: "rgba(249,115,22,0.12)",
                          border: "1px solid rgba(249,115,22,0.3)",
                          color: "#fb923c",
                        }}
                        data-ocid={`admin_panel.revoked_edit_button.${i}`}
                      >
                        <KeyRound size={14} aria-hidden="true" />
                        Credentials
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          approveMutation.mutate({
                            username: user.username,
                            role: user.roles ?? [user.role],
                          })
                        }
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        style={{
                          background:
                            "linear-gradient(135deg, #f97316, #ea580c)",
                        }}
                        data-ocid={`admin_panel.restore_button.${i}`}
                      >
                        <Check size={14} aria-hidden="true" />
                        Restore
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Edit credentials modal */}
      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent
          className="glass-dialog border-border"
          data-ocid="admin_panel.edit_modal"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-white">
              Edit credentials
            </DialogTitle>
            <DialogDescription>
              Change the username and/or password for{" "}
              <span className="font-semibold text-white">
                {editingUser?.username}
              </span>
              . Leave the password blank to keep it unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="admin-edit-username" className="login-label">
                Username
              </label>
              <input
                id="admin-edit-username"
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="login-input"
                autoComplete="off"
                data-ocid="admin_panel.edit_username_input"
              />
            </div>
            <div>
              <label htmlFor="admin-edit-password" className="login-label">
                New password
              </label>
              <input
                id="admin-edit-password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="login-input"
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
                data-ocid="admin_panel.edit_password_input"
              />
            </div>
            {editError && (
              <div className="login-error" data-ocid="admin_panel.edit_error">
                {editError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              data-ocid="admin_panel.edit_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCredentials}
              disabled={updateMutation.isPending}
              data-ocid="admin_panel.edit_save_button"
            >
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "#ffffff",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(249,115,22,0.15)",
      }}
    >
      <div
        className="font-display text-2xl font-bold tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className="text-[11px] mt-0.5" style={{ color: "#8892a4" }}>
        {label}
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[#f97316]">{icon}</span>
      <h3 className="font-display text-sm font-bold text-white">{title}</h3>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{
          background: "rgba(249,115,22,0.15)",
          border: "1px solid rgba(249,115,22,0.3)",
          color: "#fb923c",
        }}
      >
        {count}
      </span>
    </div>
  );
}

function UserCard({
  user,
  index,
  roleSelect,
  actions,
}: {
  user: UserInfo;
  index: number;
  roleSelect: React.ReactNode;
  actions: React.ReactNode;
}) {
  const isPending = user.status === UserStatus.pending;
  const isRevoked = user.status === UserStatus.revoked;
  const badgeClass = isPending
    ? "role-pending"
    : isRevoked
      ? "role-pending"
      : roleBadgeClass(user.role);

  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(249,115,22,0.15)",
      }}
      data-ocid={`admin_panel.user.${index}`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: "rgba(249,115,22,0.12)",
          border: "1px solid rgba(249,115,22,0.25)",
        }}
      >
        <Users size={18} className="text-[#fb923c]" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">
            {user.username}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
          >
            {isPending || isRevoked
              ? statusLabel(user.status)
              : roleLabel(user.role)}
          </span>
        </div>
        <div
          className="text-[11px] mt-0.5 truncate"
          style={{ color: "#8892a4" }}
        >
          {isPending || isRevoked
            ? statusLabel(user.status)
            : `${roleLabel(user.role)} role`}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {roleSelect}
        {actions}
      </div>
    </div>
  );
}

function RoleMultiSelect({
  value,
  onChange,
  dataOcid,
}: {
  value: Role[];
  onChange: (roles: Role[]) => void;
  dataOcid: string;
}) {
  const toggle = (role: Role) => {
    const next = value.includes(role)
      ? value.filter((r) => r !== role)
      : [...value, role];

    if (next.length > 0) onChange(next);
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 max-w-[260px]"
      data-ocid={dataOcid}
      aria-label="Assign roles"
    >
      {ROLE_OPTIONS.map((role) => {
        const selected = value.includes(role);
        return (
          <button
            key={role}
            type="button"
            onClick={() => toggle(role)}
            className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
            style={{
              background: selected
                ? "rgba(249,115,22,0.18)"
                : "rgba(255,255,255,0.04)",
              border: selected
                ? "1px solid rgba(249,115,22,0.45)"
                : "1px solid rgba(255,255,255,0.12)",
              color: selected ? "#fb923c" : "#8892a4",
            }}
            aria-pressed={selected}
          >
            {selected ? "✓ " : ""}{roleLabel(role)}
          </button>
        );
      })}
    </div>
  );
}
