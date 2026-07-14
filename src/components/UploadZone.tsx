import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { Upload, FileText, CheckCircle2, AlertTriangle, Pencil } from "lucide-react";
import { useDashboardStore, uid } from "../store/useDashboardStore";
import { detectTool } from "../lib/presets";
import { parseCsv } from "../lib/parseCsv";
import type { ScanBatch } from "../lib/types";
import { ColumnMapper } from "./ColumnMapper";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function UploadZone() {
  const findings = useDashboardStore((s) => s.findings);
  const setPendingUpload = useDashboardStore((s) => s.setPendingUpload);
  const pendingUpload = useDashboardStore((s) => s.pendingUpload);
  const addBatch = useDashboardStore((s) => s.addBatch);
  const batches = useDashboardStore((s) => s.batches);
  const updateBatch = useDashboardStore((s) => s.updateBatchLabel);

  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith(".csv")) {
          setError(`Skipped ${file.name}: not a CSV.`);
          continue;
        }
        try {
          const text = await readFile(file);
          const parsed = Papa.parse(text, { header: true, preview: 1 });
          const headers = (parsed.meta.fields ?? []).map((h) => h.trim());
          if (headers.length === 0) {
            setError(`Could not read headers from ${file.name}.`);
            continue;
          }
          const detected = detectTool(headers);
          const batchId = uid("scan");
          const base: ScanBatch = {
            id: batchId,
            label: file.name.replace(/\.csv$/i, ""),
            date: new Date().toISOString().slice(0, 10),
            tool: detected?.tool ?? "Unrecognized",
            findingCount: 0,
          };
          if (detected) {
            const result = parseCsv(text, detected.mapping, base);
            if (result.findings.length === 0) {
              setError(
                `Parsed 0 rows from ${file.name}. Severity column may be missing — map manually.`
              );
              setPendingUpload({
                headers,
                csvText: text,
                batch: base,
                suggestedTool: detected.tool,
              });
              continue;
            }
            addBatch(result.findings, result.batch);
          } else {
            setPendingUpload({
              headers,
              csvText: text,
              batch: base,
              suggestedTool: "Unrecognized",
            });
          }
        } catch (e) {
          setError(`Failed to process ${file.name}: ${(e as Error).message}`);
        }
      }
    },
    [addBatch, setPendingUpload]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-border hover:border-muted"
        }`}
      >
        <Upload size={18} className="mb-1 text-muted" />
        <p className="font-mono text-xs text-text">
          Drop CSVs here or <span className="text-accent">browse</span>
        </p>
        <p className="mt-1 font-mono text-[10px] text-muted">
          Nessus · OpenVAS · Qualys · Burp · ZAP · Nikto · generic
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded border border-sev-high/40 bg-sev-high/10 px-3 py-2 font-mono text-[11px] text-sev-high">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {batches.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
            <CheckCircle2 size={12} className="text-accent" />
            {batches.length} scan {batches.length === 1 ? "batch" : "batches"} ·{" "}
            {findings.length} findings
          </div>
          <ul className="space-y-1">
            {batches.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-2 rounded border border-border bg-bg px-2 py-1"
              >
                <FileText size={12} className="shrink-0 text-muted" />
                <input
                  value={b.label}
                  onChange={(e) => updateBatch(b.id, e.target.value)}
                  className="min-w-0 flex-1 bg-transparent font-mono text-xs text-text outline-none"
                  aria-label={`Rename ${b.label}`}
                />
                <span className="shrink-0 font-mono text-[10px] text-muted">
                  {b.tool} · {b.findingCount}
                </span>
                <Pencil size={11} className="shrink-0 text-muted" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingUpload && <ColumnMapper />}
    </div>
  );
}
