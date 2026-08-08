import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Pencil,
  UploadCloud,
} from "lucide-react";
import { useDashboardStore, uid } from "../store/useDashboardStore";
import { detectTool } from "../lib/presets";
import { parseCsv } from "../lib/parseCsv";
import type { ScanBatch } from "../lib/types";
import { ColumnMapper } from "./ColumnMapper";
import { cn } from "../lib/utils";

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
      <motion.div
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
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragOver
            ? "border-primary bg-primary-soft"
            : "border-border bg-card hover:border-foreground/20 hover:bg-accent/40"
        )}
      >
        <div
          className={cn(
            "mb-2 grid h-10 w-10 place-items-center rounded-full transition-colors",
            dragOver ? "bg-primary text-primary-foreground" : "bg-accent text-primary"
          )}
        >
          <UploadCloud className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Drop CSVs here or{" "}
          <span className="text-primary">browse</span>
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
Nessus · OpenVAS · Qualys · Burp · ZAP · Nikto · Acunetix · Wapiti · nuclei · Dependency-Check · generic
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </motion.div>

      {batches.length === 0 && (
        <div className="text-center py-1">
          <button
            type="button"
            onClick={useDashboardStore.getState().loadSampleData}
            className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors underline cursor-pointer"
          >
            Or load sample scan data
          </button>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 overflow-hidden rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {batches.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-0.5 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            {batches.length} {batches.length === 1 ? "batch" : "batches"} ·{" "}
            {findings.length.toLocaleString()} findings
          </div>
          <ul className="space-y-1">
            {batches.map((b) => (
              <li
                key={b.id}
                className="group flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-sm transition-colors hover:border-foreground/20"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  value={b.label}
                  onChange={(e) => updateBatch(b.id, e.target.value)}
                  className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-xs font-medium text-foreground outline-none focus:bg-accent"
                  aria-label={`Rename ${b.label}`}
                />
                <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {b.tool}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {b.findingCount}
                </span>
                <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingUpload && <ColumnMapper />}
    </div>
  );
}
