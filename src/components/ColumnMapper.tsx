import { useMemo, useState } from "react";
import { ArrowRight, Save } from "lucide-react";
import { useDashboardStore } from "../store/useDashboardStore";
import { guessMapping } from "../lib/presets";
import { parseCsv } from "../lib/parseCsv";
import type { ColumnMapping } from "../lib/types";

const TARGET_FIELDS: { key: keyof ColumnMapping; label: string; required?: boolean }[] = [
  { key: "host", label: "Host / IP", required: true },
  { key: "severity", label: "Severity" },
  { key: "cvss", label: "CVSS" },
  { key: "name", label: "Finding name" },
  { key: "cve", label: "CVE / CWE" },
  { key: "port", label: "Port" },
  { key: "protocol", label: "Protocol" },
  { key: "description", label: "Description" },
  { key: "solution", label: "Solution" },
  { key: "pluginId", label: "Plugin / QID / OSVDB" },
  { key: "scanDate", label: "Scan date" },
];

export function ColumnMapper() {
  const pending = useDashboardStore((s) => s.pendingUpload);
  const clearPendingUpload = useDashboardStore((s) => s.clearPendingUpload);
  const addBatch = useDashboardStore((s) => s.addBatch);
  const mappings = useDashboardStore((s) => s.mappings);
  const saveMapping = useDashboardStore((s) => s.saveMapping);

  const initial = useMemo(
    () => (pending ? guessMapping(pending.headers) : {}),
    [pending]
  );

  const [mapping, setMapping] = useState<ColumnMapping>(initial);
  const [toolName, setToolName] = useState(pending?.suggestedTool ?? "Custom");
  const [presetName, setPresetName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!pending) return null;

  const setField = (key: keyof ColumnMapping, value: string) =>
    setMapping((m) => ({ ...m, [key]: value || undefined }));

  const applyPreset = (name: string) => {
    const preset = mappings.find((m) => m.name === name);
    if (preset) {
      const { name: _n, ...rest } = preset;
      void _n;
      setMapping(rest);
      setToolName(preset.tool ?? toolName);
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    saveMapping({ ...mapping, name: presetName.trim(), tool: toolName });
    setPresetName("");
  };

  const handleSubmit = () => {
    if (!mapping.host) {
      setError("A Host / IP column is required to continue.");
      return;
    }
    const result = parseCsv(pending.csvText, mapping, {
      id: pending.batch.id,
      label: pending.batch.label,
      date: pending.batch.date,
      tool: toolName || "Custom",
      findingCount: 0,
    });
    if (result.findings.length === 0) {
      setError("No rows mapped. Check that the severity (or CVSS) column is set.");
      return;
    }
    addBatch(result.findings, result.batch);
    clearPendingUpload();
  };

  return (
    <div className="rounded-md border border-border bg-bg p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-xs font-semibold text-text">
          Map columns — {pending.batch.label}
        </span>
        <span className="rounded bg-sev-high/15 px-1.5 py-0.5 font-mono text-[10px] text-sev-high">
          unrecognized
        </span>
      </div>

      {mappings.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase text-muted">Presets:</span>
          {mappings.map((m) => (
            <button
              key={m.name}
              onClick={() => applyPreset(m.name)}
              className="rounded border border-border px-2 py-0.5 font-mono text-[10px] text-muted hover:border-accent hover:text-accent"
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        {TARGET_FIELDS.map((f) => (
          <div key={f.key} className="flex items-center gap-2">
            <span className="w-36 shrink-0 truncate font-mono text-[11px] text-text">
              {f.label}
              {f.required && <span className="text-sev-critical"> *</span>}
            </span>
            <ArrowRight size={12} className="shrink-0 text-muted" />
            <select
              value={mapping[f.key] ?? ""}
              onChange={(e) => setField(f.key, e.target.value)}
              className="min-w-0 flex-1 rounded border border-border bg-panel px-2 py-1 font-mono text-[11px] text-text focus:border-accent focus:outline-none"
            >
              <option value="">— none —</option>
              {pending.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <label className="font-mono text-[11px] text-muted">Tool</label>
        <input
          value={toolName}
          onChange={(e) => setToolName(e.target.value)}
          className="w-32 rounded border border-border bg-panel px-2 py-1 font-mono text-[11px] text-text focus:border-accent focus:outline-none"
        />
        <input
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="preset name"
          className="w-28 rounded border border-border bg-panel px-2 py-1 font-mono text-[11px] text-text focus:border-accent focus:outline-none placeholder:text-muted"
        />
        <button
          onClick={handleSavePreset}
          className="flex items-center gap-1 rounded border border-border px-2 py-1 font-mono text-[11px] text-muted hover:border-accent hover:text-accent"
        >
          <Save size={11} /> Save
        </button>
      </div>

      {error && (
        <p className="mt-2 font-mono text-[11px] text-sev-critical">{error}</p>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={clearPendingUpload}
          className="rounded px-3 py-1.5 font-mono text-xs text-muted hover:text-text"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="rounded bg-accent px-3 py-1.5 font-mono text-xs font-semibold text-bg hover:bg-accent/85 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          Import scan
        </button>
      </div>
    </div>
  );
}
