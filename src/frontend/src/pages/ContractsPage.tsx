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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("active");

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
      return (
    <section className="rossie-page rossie-reference-page">
      <header className="rossie-page-header">
        <div>
          <p className="rossie-eyebrow">Operations</p>
          <h1 className="rossie-display">Contract portfolio</h1>
          <p className="rossie-muted">{activeContracts.length} active · {contracts.length} total</p>
        </div>
        {isAdmin && <button type="button" onClick={()=>setShowCombinedFlow(true)} className="rossie-icon-button" aria-label="Create contract">+</button>}
      </header>

      <section className="rossie-hero-card">
        <div className="rossie-orb rossie-orb-pink"/>
        <div className="relative z-10">
          <p className="rossie-kicker">Active contract value</p>
          <p className="rossie-hero-value">{fmt(activeContracts.reduce((s:number,c:any)=>s+Number(c.contractAmount||0),0))}</p>
          <div className="mt-4 flex gap-2">
            <span className="rossie-status-pill">{activeContracts.length} active</span>
            <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[9px] font-bold text-white/55">{contracts.filter((c:any)=>c.settled).length} settled</span>
          </div>
        </div>
      </section>

      <div className="relative">
        <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search contracts" className="w-full pl-4 pr-4" data-ocid="contracts.search_input"/>
      </div>

      <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Contract status">
        {([
          ["active",`Active ${activeContracts.length}`],
          ["all",`All ${contracts.length}`],
          ["completed",`Completed ${contracts.filter((c:any)=>Boolean(c.settled)).length}`],
        ] as const).map(([key,label])=><button key={key} type="button" onClick={()=>setStatusFilter(key)} className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold ${statusFilter===key?"bg-gradient-to-r from-[#a94cff] to-[#ee2d93] text-white":"bg-white/[0.05] text-white/45 border border-white/10"}`} data-ocid={`contracts.filter.${key}`}>{label}</button>)}
      </div>

      <div className="rossie-list-stack">
        {filteredContracts.length===0 ? <div className="rossie-empty-card">No contracts match this view.</div> : filteredContracts.map((c:any)=>{
          const id=String(c.id); const open=expandedContractId===id;
          return <article key={id} className="rossie-reference-row !block overflow-hidden p-0" data-ocid="contract.card">
            <button type="button" onClick={()=>setExpandedContractId(open?null:id)} className="flex w-full items-center gap-3 p-3 text-left">
              <span className="row-icon"><FileText size={17}/></span>
              <span className="min-w-0 flex-1"><b className="truncate">{c.name}</b><small>{fmtDate(c.createdAt)} · {c.workColumns?.length||0} columns</small></span>
              <span className="row-value"><span>{fmt(Number(c.contractAmount||0))}</span><span className={`rounded-full px-2 py-1 text-[8px] ${c.settled?"bg-white/7 text-white/40":"bg-emerald-400/10 text-emerald-300"}`}>{c.settled?"Settled":"Active"}</span></span>
            </button>
            {open && <div className="border-t border-white/[0.08] p-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Multiplier",`${c.multiplier}×`],
                  ["Bed",fmt(Number(c.bedAmount||0))],
                  ["Paper",fmt(Number(c.paperAmount||0))],
                  ["Mesh",fmt(Number(c.meshAmount||0))],
                  ["Machine",fmt(Number(c.machineExpenses||0))],
                  ["Columns",String(c.workColumns?.length||0)],
                ].map(([label,value])=><div key={label} className="rounded-2xl bg-white/[0.035] p-3"><p className="text-[9px] uppercase tracking-wider text-white/30">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>)}
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={()=>onViewAttendance?.(c.id)} className="rossie-primary flex-1 rounded-xl py-2.5 text-[10px] font-bold" data-ocid="contract.view_attendance_button">Open attendance</button>
                {canEdit && <button type="button" onClick={()=>openEdit(c)} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[10px] font-bold text-white/65" data-ocid="contract.edit_button">Edit</button>}
              </div>
            </div>}
          </article>;
        })}
      </div>

      {isAdmin && <button type="button" onClick={()=>setShowCombinedFlow(true)} className="rossie-fab z-40 flex items-center justify-center text-2xl font-light" aria-label="Add Contract" data-ocid="contract.add_button">+</button>}

      {showCombinedFlow && <CombinedFlow onClose={()=>setShowCombinedFlow(false)}/>}

      {showForm && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={e=>{if(e.target===e.currentTarget)closeForm()}}>
        <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1727]/95 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
            <div><p className="rossie-eyebrow">Portfolio</p><h2 className="mt-1 text-xl font-bold">{isEditing?"Edit contract":"Add contract"}</h2></div>
            <button type="button" onClick={closeForm} className="rounded-xl bg-white/[0.05] px-3 py-2 text-white/50">×</button>
          </div>
          <div className="max-h-[65vh] space-y-3 overflow-y-auto p-5">
            {[
              ["Contract name","name","text"],
              ["Multiplier","multiplier","number"],
              ["Contract amount","contractAmount","number"],
              ["Machine expenses","machineExpenses","number"],
              ["Bed amount","bedAmount","number"],
              ["Paper amount","paperAmount","number"],
              ["Mesh amount","meshAmount","number"],
            ].map(([label,key,type])=><label key={key} className="block"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</span><input ref={key==="name"?nameRef:undefined} type={type} value={form[key as keyof ContractFormData]} onChange={e=>key==="multiplier"?updateMultiplier(e.target.value):setForm(prev=>({...prev,[key]:e.target.value}))} className="w-full" /></label>)}
            {isSaving && <p className="text-xs text-pink-300">Saving contract…</p>}
          </div>
          <div className="flex gap-2 border-t border-white/[0.08] p-5">
            <button type="button" onClick={closeForm} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/55">Cancel</button>
            <button type="button" disabled={isSaving||!form.name.trim()} onClick={handleSave} className="rossie-primary flex-1 rounded-xl py-3 text-sm font-bold" data-ocid="contract.save_button">{isSaving?"Saving…":"Save contract"}</button>
          </div>
        </div>
      </div>}
    </section>
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
