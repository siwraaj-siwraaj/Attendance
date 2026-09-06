import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../hooks/useAuth";

import { useAddLabour, useLabours, useUpdateLabour } from "../hooks/useBackend";

import { LayoutGrid, List, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import SkeletonLoader, { SkeletonCardList } from "../components/SkeletonLoader";

function LaboursPage() {
  const { isAdmin } = useAuth();
  const { data: labours = [], isLoading } = useLabours();
  const addLabour = useAddLabour();
  const updateLabour = useUpdateLabour();

  const [showForm, setShowForm] = useState(false);
  const [editingLabour, setEditingLabour] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [isActiveForm, setIsActiveForm] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  const labourNameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => labourNameRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [showForm]);

  const openAdd = useCallback(() => {
    setEditingLabour(null);
    setName("");
    setEmployeeId("");
    setJoinDate("");
    setIsActiveForm(true);
    setError("");
    setShowForm(true);
  }, []);
  const openEdit = useCallback((l: any) => {
    setEditingLabour(l);
    setName(l.name);
    setEmployeeId(l.employeeId ?? "");
    setJoinDate(l.joinDate ?? "");
    setIsActiveForm(l.isActive !== false);
    setError("");
    setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    // Close the form immediately — the optimistic update in the mutation
    // already reflects the change in the list, so the user never waits on
    // the canister round-trip. Errors surface via toast without blocking.
    setShowForm(false);
    setError("");
    const onError = (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to save";
      console.error("Save labour error:", msg);
      toast.error(msg);
    };
    if (editingLabour) {
      updateLabour.mutate(
        {
          id: editingLabour.id,
          name: name.trim(),
          employeeId: employeeId.trim(),
          joinDate: joinDate.trim(),
          isActive: isActiveForm,
        },
        { onError },
      );
    } else {
      addLabour.mutate(
        {
          name: name.trim(),
          employeeId: employeeId.trim(),
          joinDate: joinDate.trim(),
        },
        { onError },
      );
    }
  }, [
    name,
    employeeId,
    joinDate,
    isActiveForm,
    editingLabour,
    updateLabour,
    addLabour,
  ]);

  const _handleToggleActive = useCallback(
    (l: any) => {
      updateLabour.mutate(
        {
          id: l.id,
          name: l.name,
          employeeId: l.employeeId ?? "",
          joinDate: l.joinDate ?? "",
          isActive: !l.isActive,
        },
        {
          onError: (err) => {
            const msg = err instanceof Error ? err.message : "Failed to update";
            console.error("Toggle active error:", err);
            toast.error(msg);
          },
        },
      );
    },
    [updateLabour],
  );

  const activeLabours = useMemo(
    () => labours.filter((l: any) => l.isActive !== false),
    [labours],
  );
  const inactiveLabours = useMemo(
    () => labours.filter((l: any) => l.isActive === false),
    [labours],
  );

  const filteredActive = useMemo(
    () =>
      activeLabours.filter((l: any) => {
        if (!searchQuery.trim()) return true;
        return l.name.toLowerCase().includes(searchQuery.toLowerCase());
      }),
    [activeLabours, searchQuery],
  );
  const filteredInactive = useMemo(
    () =>
      inactiveLabours.filter((l: any) => {
        if (!searchQuery.trim()) return true;
        return l.name.toLowerCase().includes(searchQuery.toLowerCase());
      }),
    [inactiveLabours, searchQuery],
  );

  function renderLabourCard(l: any, idx: number) {
    if (viewMode === "card") {
      return (
        <div
          key={l.id.toString()}
          className={`glass-card rounded-xl p-4 flex flex-col gap-2 border border-orange-500/15 hover:border-orange-500/40 transition-colors ${
            l.isActive === false ? "opacity-60" : ""
          }`}
          data-ocid={`labour.item.${idx + 1}`}
        >
          <p className="text-white font-semibold text-base leading-tight">
            {l.name}
          </p>
          {l.employeeId && (
            <p className="text-xs text-gray-400">
              ID: <span className="text-gray-300">{l.employeeId}</span>
            </p>
          )}
          {l.joinDate && (
            <p className="text-xs text-gray-400">
              Joined: <span className="text-gray-300">{l.joinDate}</span>
            </p>
          )}
          {isAdmin && (
            <div className="flex items-center justify-end mt-1 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => openEdit(l)}
                className="text-orange-400 hover:text-orange-300 text-xs"
                data-ocid="labours.edit_button"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      );
    }

    // LIST view — true single-line compact rows
    return (
      <button
        key={l.id.toString()}
        type="button"
        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors cursor-pointer ${
          l.isActive === false ? "opacity-60" : ""
        }`}
        onClick={() => (isAdmin ? openEdit(l) : undefined)}
        aria-label={`Labour: ${l.name}`}
        data-ocid={`labour.item.${idx + 1}`}
      >
        <span className="flex-1 min-w-0 text-sm font-medium text-white truncate text-left">
          {l.name}
        </span>
        {l.joinDate ? (
          <span className="text-white/40 text-xs shrink-0">{l.joinDate}</span>
        ) : null}
        <svg
          className="w-4 h-4 text-white/20 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>Open</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    );
  }

  if (isLoading)
    return (
      <div
        className="flex flex-col h-full px-4 pt-4"
        data-ocid="labours.loading_state"
      >
        <SkeletonCardList count={4} />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] text-white font-['Figtree',sans-serif]">
      {/* FROZEN sticky header */}
      <div className="shrink-0 space-y-3 px-4 pt-4 pb-3 bg-[#0a0f1e] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#f97316]" />
            Labours
          </h1>
          <div className="flex items-center gap-2" />
        </div>

        {/* Search + View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Search</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search labours..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-[#1a2035] border border-white/15 px-4 py-2 pl-10 text-white/80 placeholder-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
              data-ocid="labours.search_input"
            />
          </div>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "list" ? "card" : "list")}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shrink-0"
            aria-label={
              viewMode === "list"
                ? "Switch to card view"
                : "Switch to list view"
            }
            data-ocid="labours.view_toggle"
          >
            {viewMode === "list" ? (
              <LayoutGrid className="w-4 h-4 text-white/60" />
            ) : (
              <List className="w-4 h-4 text-white/60" />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto px-4 pb-24"
        style={{
          height: "calc(100vh - 200px)",
          maxHeight: "calc(100vh - 200px)",
        }}
      >
        {labours.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-gray-400 mt-2">
            No labours yet. {isAdmin && 'Tap "+" to add a labour.'}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-green-400 flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-green-400" />
                Active Labours ({activeLabours.length})
              </h2>
              <div className="rounded-xl overflow-hidden border border-white/10">
                {filteredActive.map((l: any, idx: number) =>
                  renderLabourCard(l, idx),
                )}
              </div>
            </div>
            {inactiveLabours.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-gray-500" />
                  Inactive Labours ({inactiveLabours.length})
                </h2>
                <div className="rounded-xl overflow-hidden border border-white/10">
                  {filteredInactive.map((l: any, idx: number) =>
                    renderLabourCard(l, idx + activeLabours.length),
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {isAdmin && (
        <button
          type="button"
          onClick={openAdd}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-30 bg-gradient-to-br from-orange-500 to-orange-600 text-white"
          aria-label="Add Labour"
          data-ocid="labours.add_button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <title>Add Labour</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowForm(false);
          }}
          role="presentation"
          tabIndex={-1}
        >
          <div className="glass-dialog rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingLabour ? "Edit Labour" : "Add Labour"}
            </h2>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="labour-name"
                  className="text-gray-400 text-xs mb-1 block"
                >
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  ref={labourNameRef}
                  id="labour-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  placeholder="Labour name"
                />
              </div>
              <div>
                <label
                  htmlFor="labour-empid"
                  className="text-gray-400 text-xs mb-1 block"
                >
                  Employee ID
                </label>
                <input
                  id="labour-empid"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  placeholder="Employee ID"
                />
              </div>
              <div>
                <label
                  htmlFor="labour-joindate"
                  className="text-gray-400 text-xs mb-1 block"
                >
                  Join Date
                </label>
                <input
                  id="labour-joindate"
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>
              {/* Active / Inactive toggle — only in edit form */}
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-sm font-medium text-white">Status</p>
                  <p className="text-xs text-gray-400">
                    {isActiveForm
                      ? "Active — appears in new contracts"
                      : "Inactive — hidden from new contracts"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActiveForm((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
                    isActiveForm ? "bg-green-500" : "bg-gray-600"
                  }`}
                  aria-label={isActiveForm ? "Mark inactive" : "Mark active"}
                  data-ocid="labour.status_toggle"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      isActiveForm ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={addLabour.isPending || updateLabour.isPending}
                className="btn-orange flex-1 py-2.5 rounded-xl font-semibold disabled:opacity-50"
                data-ocid="labours.save_button"
              >
                {addLabour.isPending || updateLabour.isPending
                  ? "Saving..."
                  : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(LaboursPage);
