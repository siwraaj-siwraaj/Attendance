import { useEffect, useState } from "react";

interface SettingsPanelProps {
  onClose?: () => void;
}

/** Settings rows rendered inside the right-side account/settings drawer. */
export default function SettingsPanel({
  onClose: _onClose,
}: SettingsPanelProps) {
  const [bedBase, setBedBase] = useState<string>(
    () => localStorage.getItem("rossie_bed_base") ?? "11000",
  );
  const [paperBase, setPaperBase] = useState<string>(
    () => localStorage.getItem("rossie_paper_base") ?? "7000",
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const num = Number(bedBase);
    if (!Number.isNaN(num) && num > 0) {
      localStorage.setItem("rossie_bed_base", String(num));
    }
  }, [bedBase]);

  useEffect(() => {
    const num = Number(paperBase);
    if (!Number.isNaN(num) && num > 0) {
      localStorage.setItem("rossie_paper_base", String(num));
    }
  }, [paperBase]);

  const handleSave = () => {
    const b = Number(bedBase);
    const p = Number(paperBase);
    if (!Number.isNaN(b) && b > 0)
      localStorage.setItem("rossie_bed_base", String(b));
    if (!Number.isNaN(p) && p > 0)
      localStorage.setItem("rossie_paper_base", String(p));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="px-4 py-3 space-y-3" data-ocid="settings.panel">
      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
        Default Multiplier Amounts
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor="settings-bed-base"
            className="text-white/50 text-[11px] block mb-1"
          >
            Bed Base (₹)
          </label>
          <input
            id="settings-bed-base"
            type="number"
            value={bedBase}
            onChange={(e) => setBedBase(e.target.value)}
            className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-2 py-1.5 text-white text-sm outline-none"
            placeholder="11000"
            data-ocid="settings.bed_base_input"
          />
        </div>
        <div>
          <label
            htmlFor="settings-paper-base"
            className="text-white/50 text-[11px] block mb-1"
          >
            Paper Base (₹)
          </label>
          <input
            id="settings-paper-base"
            type="number"
            value={paperBase}
            onChange={(e) => setPaperBase(e.target.value)}
            className="w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-2 py-1.5 text-white text-sm outline-none"
            placeholder="7000"
            data-ocid="settings.paper_base_input"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleSave}
        className="w-full py-1.5 rounded-lg text-xs font-semibold transition-colors"
        style={{
          background: saved ? "rgba(16,185,129,0.2)" : "rgba(249,115,22,0.15)",
          border: saved
            ? "1px solid rgba(16,185,129,0.4)"
            : "1px solid rgba(249,115,22,0.3)",
          color: saved ? "#6ee7b7" : "#fb923c",
        }}
        data-ocid="settings.save_button"
      >
        {saved ? "✓ Saved" : "Save Defaults"}
      </button>
    </div>
  );
}
