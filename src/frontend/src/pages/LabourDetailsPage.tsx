import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useUpdateLabour, useDeleteLabour } from "../hooks/useBackend";

interface LabourDetailsPageProps {
  labour: any;
  onBack: () => void;
}

export default function LabourDetailsPage({ labour, onBack }: LabourDetailsPageProps) {
  const { isAdmin } = useAuth();
  const updateLabour = useUpdateLabour();
  const deleteLabour = useDeleteLabour();
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [name, setName] = useState(String(labour?.name ?? ""));
  const [employeeId, setEmployeeId] = useState(String(labour?.employeeId ?? ""));
  const [phoneNumber, setPhoneNumber] = useState(String(labour?.phoneNumber ?? ""));
  const [joinDate, setJoinDate] = useState(String(labour?.joinDate ?? ""));
  const [birthday, setBirthday] = useState(String(labour?.birthday ?? ""));
  const [active, setActive] = useState(labour?.isActive !== false);

  const initial = String(labour?.name ?? "?").trim().charAt(0).toUpperCase() || "?";

  const joined = joinDate
    ? new Date(joinDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Not recorded";

  const age = useMemo(() => {
    const raw = labour?.age ?? labour?.years ?? labour?.yearsOld;
    if (raw !== undefined && raw !== null && String(raw).trim() !== "") return String(raw);
    const dob = labour?.dateOfBirth ?? labour?.dob ?? labour?.birthDate;
    if (!dob) return "";
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return "";
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const beforeBirthday =
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    if (beforeBirthday) years -= 1;
    return years > 0 ? String(years) : "";
  }, [labour]);

  const gender = String(labour?.gender ?? labour?.sex ?? "").trim();
  const birthdayDate = birthday ? new Date(`${birthday}T00:00:00`) : null;
  const calculatedAge = birthdayDate && !Number.isNaN(birthdayDate.getTime()) ? (() => { const today = new Date(); let years = today.getFullYear() - birthdayDate.getFullYear(); if (today.getMonth() < birthdayDate.getMonth() || (today.getMonth() === birthdayDate.getMonth() && today.getDate() < birthdayDate.getDate())) years -= 1; return years > 0 ? String(years) : ""; })() : "";
  const displayAge = age || calculatedAge;
  const demographic = [gender, displayAge ? `${displayAge} yrs` : ""].filter(Boolean).join(" · ") || "Demographics not recorded";
  const address = String(labour?.address ?? labour?.location ?? labour?.fullAddress ?? "").trim() || "Address not recorded";
  const experienceRaw = labour?.experience ?? labour?.experienceYears ?? labour?.yearsOfExperience;
  const experience = experienceRaw !== undefined && experienceRaw !== null && String(experienceRaw).trim() !== ""
    ? String(experienceRaw)
    : "";
  const experienceText = experience
    ? /year|month/i.test(experience)
      ? experience
      : `${experience} ${Number(experience) === 1 ? "year" : "years"}`
    : "Not recorded";
  const birthdayText = birthdayDate && !Number.isNaN(birthdayDate.getTime())
    ? birthdayDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "Not recorded";
  const fatherName = String(labour?.fatherName ?? "").trim();
  const primaryNameLabel = fatherName ? "Father Name" : "Full Name";
  const primaryName = fatherName || String(labour?.name ?? "").trim() || "Not recorded";

  const save = () => {
    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    if (!name.trim()) return toast.error("Name is required");
    if (!/^\d{10}$/.test(normalizedPhone)) return toast.error("Enter a valid 10-digit mobile number");

    updateLabour.mutate(
      {
        id: labour.id,
        name: name.trim(),
        employeeId: employeeId.trim(),
        joinDate: joinDate.trim(),
        isActive: active,
        phoneNumber: normalizedPhone,
      },
      {
        onSuccess: () => {
          toast.success("Labour updated");
          setEditing(false);
        },
        onError: (e: unknown) =>
          toast.error(e instanceof Error ? e.message : "Could not update labour"),
      },
    );
  };

  const remove = () =>
    deleteLabour.mutate(labour.id, {
      onSuccess: () => {
        toast.success("Labour removed");
        onBack();
      },
      onError: (e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Could not remove labour"),
    });

  if (!labour) return null;

  return (
    <div className="min-h-full bg-[#F5F7FA] font-['Figtree',sans-serif] text-[#172536]">
      <main className="mx-auto w-full max-w-2xl px-4 pb-0 pt-0 sm:px-6">
        <header className="sticky top-0 z-30 -mx-4 flex h-16 items-center border-b border-[#E5E7EB] bg-[#F5F7FA]/95 px-3 backdrop-blur-md sm:-mx-6 sm:px-5">
          <button
            onClick={onBack}
            type="button"
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#172536] active:bg-black/5"
          >
            <ArrowLeft size={21} strokeWidth={2.2} />
          </button>

          <h1 className="flex-1 text-center text-[17px] font-extrabold tracking-[-0.01em]">
            Labour Details
          </h1>

          <div className="relative">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setMenuOpen((value) => !value)}
                  type="button"
                  aria-label="Labour options"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[#172536] active:bg-black/5"
                >
                  <MoreVertical size={21} strokeWidth={2.2} />
                </button>

                {menuOpen && (
                  <>
                    <button
                      aria-label="Close options"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setMenuOpen(false)}
                      type="button"
                    />
                    <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white p-1.5 shadow-[0_14px_36px_rgba(16,24,40,0.16)]">
                      <button
                        onClick={() => {
                          const nextActive = !active;
                          setMenuOpen(false);
                          setActive(nextActive);
                          updateLabour.mutate(
                            { id: labour.id, name: name.trim(), employeeId: employeeId.trim(), joinDate: joinDate.trim(), birthday: birthday.trim(), isActive: nextActive, phoneNumber: phoneNumber.replace(/\\D/g, "") },
                            { onSuccess: () => toast.success(nextActive ? "Labour marked active" : "Labour marked inactive"), onError: (e: unknown) => { setActive(!nextActive); toast.error(e instanceof Error ? e.message : "Could not change labour status"); } },
                          );
                        }}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-[#F5F7FA]"
                      >
                        <span className={active ? "h-2.5 w-2.5 rounded-full bg-emerald-500" : "h-2.5 w-2.5 rounded-full bg-slate-400"} />
                        {active ? "Mark inactive" : "Mark active"}
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmRemove(true);
                        }}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                        Delete labour
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="h-10 w-10" />
            )}
          </div>
        </header>

        <section className="px-2 pb-5 pt-7 text-center">
          <div className="mx-auto flex h-[92px] w-[92px] items-center justify-center rounded-full border-[5px] border-white bg-[#DCE5EC] text-[34px] font-black text-[#516779] shadow-[0_5px_20px_rgba(16,24,40,0.10)]">
            {initial}
          </div>
          <h2 className="mt-4 text-[25px] font-black tracking-[-0.025em]">
            {labour.name || "Unnamed labour"}
          </h2>
          <div className="mt-2 inline-flex items-center rounded-full bg-[#E7EDF2] px-3.5 py-1.5 text-[11px] font-extrabold text-[#526675]">
            {demographic}
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-[#E4E8EC] bg-white shadow-[0_5px_22px_rgba(16,24,40,0.055)]">
          <div className="flex items-center gap-3.5 border-b border-[#EEF0F2] px-4 py-4.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#EEF3F6] text-[#5B7181]">
              <UserRound size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8A98A4]">{primaryNameLabel}</p>
              <p className="mt-1 truncate text-[15px] font-bold text-[#172536]">{primaryName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 border-b border-[#EEF0F2] px-4 py-4.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#EEF3F6] text-[#5B7181]">
              <Phone size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8A98A4]">Phone Number</p>
              <p className="mt-1 text-[15px] font-bold text-[#172536]">{phoneNumber || "Not recorded"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 border-b border-[#EEF0F2] px-4 py-4.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#EEF3F6] text-[#5B7181]">
              <MapPin size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8A98A4]">Address</p>
              <p className="mt-1 text-[15px] font-bold leading-5 text-[#172536]">{address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 border-b border-[#EEF0F2] px-4 py-4.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#EEF3F6] text-[#5B7181]">
              <CalendarDays size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8A98A4]">Experience</p>
              <p className="mt-1 text-[15px] font-bold text-[#172536]">{birthdayText}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 px-4 py-4.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#EEF3F6] text-[#5B7181]">
              <Clock3 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8A98A4]">Experience</p>
              <p className="mt-1 text-[15px] font-bold text-[#172536]">{experienceText}</p>
            </div>
          </div>
        </section>

        {isAdmin && (
          <button
            onClick={() => setEditing(true)}
            type="button"
            className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#60798A] text-[15px] font-extrabold text-white shadow-[0_5px_16px_rgba(77,100,116,0.18)] active:scale-[0.99]"
          >
            <Pencil size={17} />
            Edit
          </button>
        )}

        {editing && (
          <section className="mt-4 rounded-[22px] border border-[#E4E8EC] bg-white p-5 shadow-[0_5px_22px_rgba(16,24,40,0.055)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#60798A]">Edit profile</p>
                <h3 className="mt-1 text-lg font-black">Labour details</h3>
              </div>
              <button onClick={() => setEditing(false)} type="button" className="rounded-xl bg-[#F2F4F6] p-2">
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-[#344054]">Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-semibold outline-none focus:border-[#60798A]" />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-[#344054]">Mobile number</span>
                <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-semibold outline-none focus:border-[#60798A]" />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-[#344054]">Employee ID</span>
                <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-semibold outline-none focus:border-[#60798A]" />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-[#344054]">Birthday</span>
                <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-semibold outline-none focus:border-[#60798A]" />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-[#344054]">Joining date</span>
                <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-semibold outline-none focus:border-[#60798A]" />
              </label>
              <button onClick={() => setActive((value) => !value)} type="button" className="flex h-12 items-center justify-between rounded-xl border border-[#D0D5DD] bg-[#F9FAFB] px-4 text-sm font-bold">
                <span>{active ? "Active" : "Inactive"}</span>
                <span className={`h-6 w-11 rounded-full p-1 ${active ? "bg-emerald-500" : "bg-[#D0D5DD]"}`}>
                  <span className={`block h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : ""}`} />
                </span>
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => setEditing(false)} type="button" className="h-12 flex-1 rounded-xl border border-[#D0D5DD] text-sm font-bold">Cancel</button>
              <button onClick={save} type="button" disabled={updateLabour.isPending} className="h-12 flex-1 rounded-xl bg-[#60798A] text-sm font-extrabold text-white disabled:opacity-50">
                {updateLabour.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </section>
        )}

        {confirmRemove && (
          <section className="mt-4 rounded-[22px] border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-black text-red-700">Delete {labour.name}?</p>
            <p className="mt-1 text-xs leading-5 text-red-700/70">The labour will be archived and their existing history will be preserved.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmRemove(false)} type="button" className="h-11 flex-1 rounded-xl bg-white text-sm font-bold">Cancel</button>
              <button onClick={remove} type="button" disabled={deleteLabour.isPending} className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-extrabold text-white">
                {deleteLabour.isPending ? "Deleting…" : "Delete labour"}
              </button>
            </div>
          </section>
        )}

        <div aria-hidden="true" className="h-[var(--rossie-nav-clearance)] shrink-0" />
      </main>
    </div>
  );
}
