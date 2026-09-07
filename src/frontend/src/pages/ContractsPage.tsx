import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../hooks/useAuth";

import {
  useAddContract,
  useAddWorkColumn,
  useContracts,
  useGetActiveLabours,
  useLabours,
  useSetAttendance,
  useUpdateContract,
} from "../hooks/useBackend";

import { format } from "date-fns";
import { Calendar, FileText, LayoutGrid, List, Wrench } from "lucide-react";
import SkeletonLoader, { SkeletonCardList } from "../components/SkeletonLoader";
import type {
  AttendanceRecord,
  AttendanceValue,
  Contract,
  Labour,
  WorkColumn,
} from "../types";
import {
  PARTIAL_VALUES,
  getAttendanceDisplay,
  sortWorkColumns,
} from "../types";
import { AttendanceTable } from "./AttendancePage";

interface ContractFormData {
  name: string;
  multiplier: string;
  contractAmount: string;
  machineExpenses: string;
  bedAmount: string;
  paperAmount: string;
  meshAmount: string;
}

function ContractsPage({
  onViewAttendance,
}: {
  onViewAttendance?: (id: bigint) => void;
}) {
  const { canEdit, isAdmin } = useAuth();
  const { data: contracts = [], isLoading } = useContracts();
  const addContract = useAddContract();
  const updateContract = useUpdateContract();
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCombinedFlow, setShowCombinedFlow] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedContractId, setExpandedContractId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  const getBedBase = () =>
    Number(localStorage.getItem("rossie_bed_base") || "11000") || 11000;
  const getPaperBase = () =>
    Number(localStorage.getItem("rossie_paper_base") || "7000") || 7000;

  const [form, setForm] = useState<ContractFormData>({
    name: "",
    multiplier: "1",
    contractAmount: "0",
    machineExpenses: "0",
    bedAmount: getBedBase().toString(),
    paperAmount: getPaperBase().toString(),
    meshAmount: "0",
  });

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showForm) {
      // Small timeout lets the dialog render before focusing
      const t = setTimeout(() => nameRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [showForm]);

  const updateMultiplier = (val: string) => {
    const m = Number.parseFloat(val) || 1;
    const bed = getBedBase() * m;
    const paper = getPaperBase() * m;
    const contractAmount = Number.parseFloat(form.contractAmount) || 0;
    const machineExpenses = Number.parseFloat(form.machineExpenses) || 0;
    const mesh = contractAmount - (bed + paper + machineExpenses);
    setForm((prev) => ({
      ...prev,
      multiplier: val,
      bedAmount: bed.toString(),
      paperAmount: paper.toString(),
      meshAmount: mesh.toString(),
    }));
  };

  // Closes the dialog and clears all form state.
  const closeForm = useCallback(() => {
    setShowForm(false);
  }, []);

  const openEdit = useCallback((c: any) => {
    setForm({
      name: c.name,
      multiplier: c.multiplier.toString(),
      contractAmount: c.contractAmount.toString(),
      machineExpenses: c.machineExpenses.toString(),
      bedAmount: c.bedAmount.toString(),
      paperAmount: c.paperAmount.toString(),
      meshAmount: (c.meshAmount ?? 0).toString(),
    });
    setIsEditing(true);
    setSelectedContract(c);
    setShowForm(true);
  }, []);

  const isSaving = addContract.isPending || updateContract.isPending;

  const handleSave = useCallback(() => {
    if (isEditing && selectedContract) {
      updateContract.mutate({
        id: selectedContract.id,
        name: form.name.trim(),
        multiplier: Number.parseFloat(form.multiplier),
        contractAmount: Number.parseFloat(form.contractAmount),
        machineExpenses: Number.parseFloat(form.machineExpenses),
        bedAmount: Number.parseFloat(form.bedAmount),
        paperAmount: Number.parseFloat(form.paperAmount),
        meshAmount: Number.parseFloat(form.meshAmount),
      });
      setShowForm(false);
    } else {
      addContract.mutate({
        name: form.name.trim(),
        multiplier: Number.parseFloat(form.multiplier),
        contractAmount: Number.parseFloat(form.contractAmount),
        machineExpenses: Number.parseFloat(form.machineExpenses),
        bedAmount: Number.parseFloat(form.bedAmount),
        paperAmount: Number.parseFloat(form.paperAmount),
        meshAmount: Number.parseFloat(form.meshAmount),
      });
      // Close immediately — the optimistic update in useBackend.ts already
      // reflects the new contract in the list, so the save runs in the
      // background and the user can keep working without a confirmation.
      setShowForm(false);
    }
  }, [isEditing, selectedContract, form, updateContract, addContract]);

  const fmt = useCallback(
    (n: number) =>
      `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
    [],
  );

  const fmtDate = (d: bigint | number | undefined) => {
    if (d === undefined || d === null) return "—";
    const ms = typeof d === "bigint" ? Number(d) / 1_000_000 : Number(d);
    if (!ms || Number.isNaN(ms)) return "—";
    return format(new Date(ms), "MMM d, yyyy");
  };

  const activeContracts = useMemo(
    () => contracts.filter((c: any) => !c.settled),
    [contracts],
  );

  const filteredContracts = useMemo(
    () =>
      activeContracts
        .slice()
        .sort((a: any, b: any) => (b.id > a.id ? 1 : b.id < a.id ? -1 : 0))
        .filter((c: any) => {
          if (!searchQuery.trim()) return true;
          return c.name.toLowerCase().includes(searchQuery.toLowerCase());
        }),
    [activeContracts, searchQuery],
  );

  if (isLoading)
    return (
      <div
        className="flex flex-col h-full px-4 pt-4"
        data-ocid="contracts.loading_state"
      >
        <SkeletonCardList count={4} />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] text-white font-['Figtree',sans-serif]">
      {/* FROZEN top section: heading + search */}
      <div className="shrink-0 space-y-3 px-4 pt-4 pb-3 bg-[#0a0f1e] sticky top-0 z-10">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            Contracts
          </h1>
          <div className="flex items-center gap-2" />
        </div>

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
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-[#1a2035] border border-white/15 px-4 py-2 pl-10 text-white/80 placeholder-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all text-sm"
              data-ocid="contracts.search_input"
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
            data-ocid="contracts.view_toggle"
          >
            {viewMode === "list" ? (
              <LayoutGrid className="w-4 h-4 text-white/60" />
            ) : (
              <List className="w-4 h-4 text-white/60" />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable contract list */}
      <div
        className="flex-1 overflow-y-auto px-4 pb-24"
        style={{
          height: "calc(100vh - 200px)",
          maxHeight: "calc(100vh - 200px)",
        }}
      >
        {!isLoading && filteredContracts.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-gray-400 mt-2">
            No active contracts. {canEdit && 'Tap "+" to add a contract.'}
          </div>
        ) : viewMode === "card" ? (
          /* CARD VIEW — vertical cards */
          <div className="space-y-3 mt-1">
            {filteredContracts.map((c: any) => {
              const isExpanded = expandedContractId === c.id.toString();
              return (
                <button
                  key={c.id.toString()}
                  type="button"
                  className="glass-card rounded-2xl p-4 cursor-pointer transition-smooth w-full text-left border border-orange-500/20 hover:border-orange-500/60 active:scale-[0.98]"
                  onClick={() =>
                    setExpandedContractId(isExpanded ? null : c.id.toString())
                  }
                  aria-label="Toggle contract details"
                  data-ocid="contract.card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-orange-400 shrink-0" />
                      <p className="text-white font-semibold text-base truncate">
                        {c.name}
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>Expand</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-orange-400 font-bold text-lg">
                      {fmt(c.contractAmount)}
                    </span>
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {fmtDate(c.createdAt)}
                    </span>
                  </div>
                  {isExpanded && (
                    <div
                      className="mt-3 pt-3 border-t border-white/10 space-y-3"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs">Multiplier</p>
                          <p className="text-orange-400 font-medium">
                            {c.multiplier}x
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Bed Amount</p>
                          <p className="text-white font-medium">
                            {fmt(c.bedAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Paper Amount</p>
                          <p className="text-white font-medium">
                            {fmt(c.paperAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Mesh Amount</p>
                          <p className="text-white font-medium">
                            {fmt(c.meshAmount ?? 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            Machine Expenses
                          </p>
                          <p className="text-white font-medium">
                            {fmt(c.machineExpenses)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Columns</p>
                          <p className="text-white font-medium">
                            {c.workColumns?.length ?? 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewAttendance?.(c.id);
                          }}
                          className="btn-orange text-sm px-3 py-1.5 rounded-lg"
                          data-ocid="contract.view_attendance_button"
                        >
                          View Attendance →
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(c);
                            }}
                            className="bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg transition-colors"
                            data-ocid="contract.edit_button"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW — true single-line compact rows */
          <div className="mt-1 rounded-xl overflow-hidden border border-white/10">
            {filteredContracts.map((c: any, idx: number) => {
              const isExpanded = expandedContractId === c.id.toString();
              return (
                <div key={c.id.toString()}>
                  {/* Single-line row */}
                  <button
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors cursor-pointer ${
                      idx > 0 ? "border-t border-white/10" : ""
                    }`}
                    onClick={() =>
                      setExpandedContractId(isExpanded ? null : c.id.toString())
                    }
                    aria-label="Toggle contract details"
                    data-ocid={`contract.item.${idx + 1}`}
                  >
                    <FileText className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="flex-1 min-w-0 text-sm font-medium text-white truncate text-left">
                      {c.name}
                    </span>
                    <span className="text-orange-400 font-semibold text-sm shrink-0">
                      {fmt(c.contractAmount)}
                    </span>
                    <svg
                      className={`w-4 h-4 text-white/30 shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>{isExpanded ? "Collapse" : "Expand"}</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="bg-white/[0.03] border-t border-white/10 px-4 py-3 space-y-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-white/40 text-xs">Multiplier</p>
                          <p className="text-orange-400 font-medium">
                            {c.multiplier}x
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Created</p>
                          <p className="text-white/80 font-medium">
                            {fmtDate(c.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Bed Amount</p>
                          <p className="text-white font-medium">
                            {fmt(c.bedAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Paper Amount</p>
                          <p className="text-white font-medium">
                            {fmt(c.paperAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs">Mesh Amount</p>
                          <p className="text-white font-medium">
                            {fmt(c.meshAmount ?? 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Machine Exp.
                          </p>
                          <p className="text-white font-medium">
                            {fmt(c.machineExpenses)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewAttendance?.(c.id);
                          }}
                          className="btn-orange text-xs px-3 py-1.5 rounded-lg"
                          data-ocid="contract.view_attendance_button"
                        >
                          View Attendance →
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(c);
                            }}
                            className="bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-xs px-3 py-1.5 rounded-lg transition-colors"
                            data-ocid="contract.edit_button"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button — the combined contract+attendance flow calls
          setAttendance, which the backend gates to the attendanceOnly role, so
          it is only offered to the admin role (which can both create contracts
          AND mark attendance). Other roles use the separate flows. */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => setShowCombinedFlow(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-30 bg-gradient-to-br from-orange-500 to-orange-600 text-white"
          aria-label="Add Contract"
          data-ocid="contract.add_button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <title>Add Contract</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      )}

      {/* Combined contract creation + attendance flow */}
      {showCombinedFlow && (
        <CombinedFlow onClose={() => setShowCombinedFlow(false)} />
      )}

      {/* Add/Edit Contract Dialog */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeForm();
          }}
          role="presentation"
          tabIndex={-1}
        >
          <div className="glass-dialog rounded-2xl w-full max-w-md max-h-[82vh] flex flex-col">
            <>
              <div className="p-4 pb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {isEditing ? "Edit Contract" : "Add Contract"}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Close"
                  data-ocid="contract.close_button"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Close dialog"
                  >
                    <title>Close dialog</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3">
                {/* Contract Name — autofocused */}
                <div>
                  <label
                    htmlFor="contract-name"
                    className="text-gray-400 text-xs mb-1 block"
                  >
                    Contract Name
                  </label>
                  <input
                    ref={nameRef}
                    id="contract-name"
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                    placeholder="Contract name"
                  />
                </div>
                {[
                  {
                    label: "Multiplier",
                    key: "multiplier",
                    type: "number",
                    step: "0.1",
                  },
                  {
                    label: "Contract Amount (₹)",
                    key: "contractAmount",
                    type: "number",
                  },
                  {
                    label: "Machine Expenses (₹)",
                    key: "machineExpenses",
                    type: "number",
                  },
                ].map(({ label, key, type, step }) => (
                  <div key={key}>
                    <label
                      htmlFor={`contract-${key}`}
                      className="text-gray-400 text-xs mb-1 block"
                    >
                      {label}
                    </label>
                    <input
                      id={`contract-${key}`}
                      type={type}
                      step={step}
                      value={form[key as keyof ContractFormData]}
                      onChange={(e) => {
                        if (key === "multiplier") {
                          updateMultiplier(e.target.value);
                        } else {
                          setForm((prev) => {
                            const next = { ...prev, [key]: e.target.value };
                            if (
                              key === "contractAmount" ||
                              key === "machineExpenses"
                            ) {
                              const contractAmount =
                                Number.parseFloat(
                                  key === "contractAmount"
                                    ? e.target.value
                                    : next.contractAmount,
                                ) || 0;
                              const bedAmount =
                                Number.parseFloat(next.bedAmount) || 0;
                              const paperAmount =
                                Number.parseFloat(next.paperAmount) || 0;
                              const machineExpenses =
                                Number.parseFloat(
                                  key === "machineExpenses"
                                    ? e.target.value
                                    : next.machineExpenses,
                                ) || 0;
                              next.meshAmount = (
                                contractAmount -
                                (bedAmount + paperAmount + machineExpenses)
                              ).toString();
                            }
                            return next;
                          });
                        }
                      }}
                      className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                ))}
                {/* Bed and Paper side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="contract-bedAmount"
                      className="text-gray-400 text-xs mb-1 block"
                    >
                      Bed Amount (₹)
                    </label>
                    <input
                      id="contract-bedAmount"
                      type="number"
                      value={form.bedAmount}
                      onChange={(e) =>
                        setForm((prev) => {
                          const next = { ...prev, bedAmount: e.target.value };
                          const ca =
                            Number.parseFloat(next.contractAmount) || 0;
                          const ba = Number.parseFloat(e.target.value) || 0;
                          const pa = Number.parseFloat(next.paperAmount) || 0;
                          const me =
                            Number.parseFloat(next.machineExpenses) || 0;
                          next.meshAmount = (ca - (ba + pa + me)).toString();
                          return next;
                        })
                      }
                      className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contract-paperAmount"
                      className="text-gray-400 text-xs mb-1 block"
                    >
                      Paper Amount (₹)
                    </label>
                    <input
                      id="contract-paperAmount"
                      type="number"
                      value={form.paperAmount}
                      onChange={(e) =>
                        setForm((prev) => {
                          const next = {
                            ...prev,
                            paperAmount: e.target.value,
                          };
                          const ca =
                            Number.parseFloat(next.contractAmount) || 0;
                          const ba = Number.parseFloat(next.bedAmount) || 0;
                          const pa = Number.parseFloat(e.target.value) || 0;
                          const me =
                            Number.parseFloat(next.machineExpenses) || 0;
                          next.meshAmount = (ca - (ba + pa + me)).toString();
                          return next;
                        })
                      }
                      className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                </div>
                {/* Mesh Amount on its own row */}
                <div>
                  <label
                    htmlFor="contract-meshAmount"
                    className="text-gray-400 text-xs mb-1 block"
                  >
                    Mesh Amount (₹)
                  </label>
                  <input
                    id="contract-meshAmount"
                    type="number"
                    value={form.meshAmount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        meshAmount: e.target.value,
                      }))
                    }
                    className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
                {isSaving && (
                  <p className="text-orange-400 text-xs flex items-center gap-2">
                    <svg
                      className="animate-spin w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving contract...
                  </p>
                )}
              </div>
              <div className="p-4 pt-3 border-t border-white/10 flex gap-3 pb-safe">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2.5 rounded-xl font-semibold border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors"
                  data-ocid="contract.cancel_button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !form.name.trim()}
                  className="btn-orange flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-ocid="contract.save_button"
                >
                  {isSaving && (
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Combined contract creation + attendance flow. A 1-2-3 stepped wizard:
 *   Step 1 — enter contract details (name, multiplier, amounts) and create the
 *            contract, then add its work columns.
 *   Step 2 — mark attendance for the newly created contract using the shared
 *            AttendanceTable.
 *   Step 3 — confirm the summary and save the attendance.
 */
function CombinedFlow({ onClose }: { onClose: () => void }) {
  const { canEdit } = useAuth();
  const addContract = useAddContract();
  const addWorkColumn = useAddWorkColumn();
  const setAttendance = useSetAttendance();
  const { data: allLabours = [] } = useLabours();
  const { data: activeLabours = [] } = useGetActiveLabours();

  const getBedBase = () =>
    Number(localStorage.getItem("rossie_bed_base") || "11000") || 11000;
  const getPaperBase = () =>
    Number(localStorage.getItem("rossie_paper_base") || "7000") || 7000;

  const blankForm = (): ContractFormData => ({
    name: "",
    multiplier: "1",
    contractAmount: "0",
    machineExpenses: "0",
    bedAmount: getBedBase().toString(),
    paperAmount: getPaperBase().toString(),
    meshAmount: "0",
  });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ContractFormData>(blankForm);
  const [createdContract, setCreatedContract] = useState<Contract | null>(null);
  const [creating, setCreating] = useState(false);
  const [instantAddLoading, setInstantAddLoading] = useState<string | null>(
    null,
  );
  const [attendanceOverrides, setAttendanceOverrides] = useState<
    Record<string, AttendanceValue>
  >({});
  const [saving, setSaving] = useState(false);

  const updateMultiplier = (val: string) => {
    const m = Number.parseFloat(val) || 1;
    const bed = getBedBase() * m;
    const paper = getPaperBase() * m;
    const contractAmount = Number.parseFloat(form.contractAmount) || 0;
    const machineExpenses = Number.parseFloat(form.machineExpenses) || 0;
    const mesh = contractAmount - (bed + paper + machineExpenses);
    setForm((prev) => ({
      ...prev,
      multiplier: val,
      bedAmount: bed.toString(),
      paperAmount: paper.toString(),
      meshAmount: mesh.toString(),
    }));
  };

  const handleCreateContract = () => {
    if (!form.name.trim() || creating) return;
    setCreating(true);
    addContract.mutate(
      {
        name: form.name.trim(),
        multiplier: Number.parseFloat(form.multiplier),
        contractAmount: Number.parseFloat(form.contractAmount),
        machineExpenses: Number.parseFloat(form.machineExpenses),
        bedAmount: Number.parseFloat(form.bedAmount),
        paperAmount: Number.parseFloat(form.paperAmount),
        meshAmount: Number.parseFloat(form.meshAmount),
      },
      {
        onSuccess: (created) => {
          setCreatedContract(created as unknown as Contract);
          setCreating(false);
        },
        onError: () => setCreating(false),
      },
    );
  };

  const handleAddColumn = (workType: string) => {
    if (!createdContract) return;

    const baseName =
      workType === "bed"
        ? "Bed"
        : workType === "paper"
          ? "Paper"
          : workType === "mesh"
            ? "Mesh"
            : workType;

    const sameTypeCount = createdContract.workColumns.filter(
      (column) => column.workType === workType,
    ).length;

    const columnName =
      sameTypeCount === 0 ? baseName : `${baseName} ${sameTypeCount + 1}`;

    setInstantAddLoading(workType);
    addWorkColumn.mutate(
      {
        contractId: createdContract.id,
        name: columnName,
        workType,
      },
      {
        // The mutation returns the full updated contract (with the new work
        // column appended). Replace the local createdContract snapshot with it
        // so sortedWorkColumns re-derives and step 2's AttendanceTable shows
        // the newly added columns. The react-query cache is updated separately
        // inside useAddWorkColumn; this keeps the local snapshot in sync.
        onSuccess: (updatedContract) => {
          if (updatedContract) {
            setCreatedContract(updatedContract as unknown as Contract);
          }
        },
        onSettled: () => setInstantAddLoading(null),
        onError: () => setInstantAddLoading(null),
      },
    );
  };

  const handleAttendanceChange = (
    labourId: bigint,
    columnId: string,
    value: AttendanceValue,
  ) => {
    setAttendanceOverrides((prev) => ({
      ...prev,
      [`${String(labourId)}|${columnId}`]: value,
    }));
  };

  const sortedWorkColumns: WorkColumn[] = useMemo(
    () => (createdContract ? sortWorkColumns(createdContract.workColumns) : []),
    [createdContract],
  );

  const labours: Labour[] = useMemo(() => {
    const activeIds = new Set(activeLabours.map((l) => String(l.id)));
    return allLabours.filter((l) => activeIds.has(String(l.id)));
  }, [allLabours, activeLabours]);

  const attendanceRecords: AttendanceRecord[] = useMemo(() => {
    if (!createdContract) return [];
    return Object.entries(attendanceOverrides).map(([key, value]) => {
      const [labourIdStr, columnId] = key.split("|");
      return {
        contractId: createdContract.id,
        labourId: BigInt(labourIdStr),
        columnId,
        value,
      };
    });
  }, [attendanceOverrides, createdContract]);

  const presentCount = useMemo(
    () =>
      attendanceRecords.filter((r) => getAttendanceDisplay(r.value) > 0).length,
    [attendanceRecords],
  );

  const handleSave = () => {
    if (!createdContract || saving) return;
    setSaving(true);
    for (const record of attendanceRecords) {
      setAttendance.mutate({
        contractId: createdContract.id,
        labourId: record.labourId,
        columnId: record.columnId,
        value: record.value,
      });
    }
    // Give the mutations a moment to flush before closing.
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 400);
  };

  const stepLabels = ["Contract", "Attendance", "Confirm"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
      tabIndex={-1}
      data-ocid="combined_flow.dialog"
    >
      <div className="glass-dialog rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            New Contract + Attendance
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close"
            data-ocid="combined_flow.close_button"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Close dialog"
            >
              <title>Close dialog</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-4 pt-4 flex items-center">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div
                key={label}
                className="flex items-center flex-1 last:flex-none"
              >
                <div
                  className={`flow-step ${isActive ? "flow-step-active" : ""} ${
                    isDone ? "flow-step-done" : ""
                  }`}
                >
                  <div className="flow-step-dot">{isDone ? "✓" : stepNum}</div>
                  <span className="flow-step-label">{label}</span>
                </div>
                {stepNum < stepLabels.length && (
                  <div
                    className={`flow-connector ${
                      step > stepNum ? "flow-connector-done" : ""
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {step === 1 && (
            <>
              <div>
                <label
                  htmlFor="combined-name"
                  className="text-gray-400 text-xs mb-1 block"
                >
                  Contract Name
                </label>
                <input
                  id="combined-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  placeholder="Contract name"
                  data-ocid="combined_flow.name_input"
                />
              </div>
              {[
                {
                  label: "Multiplier",
                  key: "multiplier",
                  type: "number",
                  step: "0.1",
                },
                {
                  label: "Contract Amount (₹)",
                  key: "contractAmount",
                  type: "number",
                },
                {
                  label: "Machine Expenses (₹)",
                  key: "machineExpenses",
                  type: "number",
                },
              ].map(({ label, key, type, step }) => (
                <div key={key}>
                  <label
                    htmlFor={`combined-${key}`}
                    className="text-gray-400 text-xs mb-1 block"
                  >
                    {label}
                  </label>
                  <input
                    id={`combined-${key}`}
                    type={type}
                    step={step}
                    value={form[key as keyof ContractFormData]}
                    onChange={(e) => {
                      if (key === "multiplier") {
                        updateMultiplier(e.target.value);
                      } else {
                        setForm((prev) => {
                          const next = { ...prev, [key]: e.target.value };
                          if (
                            key === "contractAmount" ||
                            key === "machineExpenses"
                          ) {
                            const contractAmount =
                              Number.parseFloat(
                                key === "contractAmount"
                                  ? e.target.value
                                  : next.contractAmount,
                              ) || 0;
                            const bedAmount =
                              Number.parseFloat(next.bedAmount) || 0;
                            const paperAmount =
                              Number.parseFloat(next.paperAmount) || 0;
                            const machineExpenses =
                              Number.parseFloat(
                                key === "machineExpenses"
                                  ? e.target.value
                                  : next.machineExpenses,
                              ) || 0;
                            next.meshAmount = (
                              contractAmount -
                              (bedAmount + paperAmount + machineExpenses)
                            ).toString();
                          }
                          return next;
                        });
                      }
                    }}
                    className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="combined-bedAmount"
                    className="text-gray-400 text-xs mb-1 block"
                  >
                    Bed Amount (₹)
                  </label>
                  <input
                    id="combined-bedAmount"
                    type="number"
                    value={form.bedAmount}
                    onChange={(e) =>
                      setForm((prev) => {
                        const next = { ...prev, bedAmount: e.target.value };
                        const ca = Number.parseFloat(next.contractAmount) || 0;
                        const ba = Number.parseFloat(e.target.value) || 0;
                        const pa = Number.parseFloat(next.paperAmount) || 0;
                        const me = Number.parseFloat(next.machineExpenses) || 0;
                        next.meshAmount = (ca - (ba + pa + me)).toString();
                        return next;
                      })
                    }
                    className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="combined-paperAmount"
                    className="text-gray-400 text-xs mb-1 block"
                  >
                    Paper Amount (₹)
                  </label>
                  <input
                    id="combined-paperAmount"
                    type="number"
                    value={form.paperAmount}
                    onChange={(e) =>
                      setForm((prev) => {
                        const next = { ...prev, paperAmount: e.target.value };
                        const ca = Number.parseFloat(next.contractAmount) || 0;
                        const ba = Number.parseFloat(next.bedAmount) || 0;
                        const pa = Number.parseFloat(e.target.value) || 0;
                        const me = Number.parseFloat(next.machineExpenses) || 0;
                        next.meshAmount = (ca - (ba + pa + me)).toString();
                        return next;
                      })
                    }
                    className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="combined-meshAmount"
                  className="text-gray-400 text-xs mb-1 block"
                >
                  Mesh Amount (₹)
                </label>
                <input
                  id="combined-meshAmount"
                  type="number"
                  value={form.meshAmount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      meshAmount: e.target.value,
                    }))
                  }
                  className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              {/* Create contract */}
              {!createdContract ? (
                <button
                  type="button"
                  onClick={handleCreateContract}
                  disabled={!form.name.trim() || creating}
                  className="w-full py-2.5 rounded-xl btn-orange font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-ocid="combined_flow.create_contract_button"
                >
                  {creating ? "Creating..." : "Create Contract"}
                </button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">
                      {createdContract.name}
                    </p>
                    <span className="text-xs text-green-400">✓ Created</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                      Work Columns
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {sortedWorkColumns.map((col) => (
                        <span
                          key={col.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-md px-2 py-1"
                        >
                          {col.name}
                        </span>
                      ))}
                      {sortedWorkColumns.length === 0 && (
                        <span className="text-xs text-white/40">
                          No columns yet — add one below
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddColumn("bed")}
                        disabled={instantAddLoading === "bed"}
                        className="py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-300 text-xs font-semibold hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-ocid="combined_flow.add_bed_button"
                      >
                        {instantAddLoading === "bed" ? "…" : "+ Bed"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddColumn("paper")}
                        disabled={instantAddLoading === "paper"}
                        className="py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-ocid="combined_flow.add_paper_button"
                      >
                        {instantAddLoading === "paper" ? "…" : "+ Paper"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddColumn("mesh")}
                        disabled={instantAddLoading === "mesh"}
                        className="py-2 rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-ocid="combined_flow.add_mesh_button"
                      >
                        {instantAddLoading === "mesh" ? "…" : "+ Mesh"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && createdContract && (
            <>
              <p className="text-sm text-white/60">
                Mark attendance for{" "}
                <span className="text-orange-400 font-semibold">
                  {createdContract.name}
                </span>
              </p>
              {labours.length === 0 ? (
                <div
                  className="glass-card rounded-xl p-8 text-center text-gray-400"
                  data-ocid="combined_flow.attendance_empty_state"
                >
                  <p className="text-sm">
                    No active labours to mark attendance for.
                  </p>
                </div>
              ) : (
                <AttendanceTable
                  contract={createdContract}
                  workColumns={sortedWorkColumns}
                  labours={labours}
                  attendance={attendanceRecords}
                  canEdit={canEdit}
                  onChange={handleAttendanceChange}
                />
              )}
            </>
          )}

          {step === 3 && createdContract && (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                <p className="text-sm font-semibold text-white">
                  {createdContract.name}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Contract Amount</p>
                    <p className="text-orange-400 font-medium">
                      ₹
                      {createdContract.contractAmount.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Work Columns</p>
                    <p className="text-white font-medium">
                      {sortedWorkColumns.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Labours Marked</p>
                    <p className="text-white font-medium">
                      {attendanceRecords.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Present</p>
                    <p className="text-green-400 font-medium">{presentCount}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/40">
                Review the details above. Saving will create the contract and
                record the attendance you marked.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-3 border-t border-white/10 flex gap-3 pb-safe">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl font-semibold border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors disabled:opacity-50"
              data-ocid="combined_flow.back_button"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-semibold border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors"
              data-ocid="combined_flow.cancel_button"
            >
              Cancel
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !createdContract}
              className="btn-orange flex-1 py-2.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              data-ocid="combined_flow.next_button"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-orange flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-ocid="combined_flow.save_button"
            >
              {saving ? "Saving..." : "Save & Finish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ContractsPage);
