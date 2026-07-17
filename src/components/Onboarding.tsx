import { motion } from "framer-motion";
import {
  UploadCloud,
  ShieldCheck,
  Lock,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useDashboardStore } from "../store/useDashboardStore";
import { Button } from "./ui/button";
import { useRef, useState } from "react";
import Papa from "papaparse";
import { detectTool } from "../lib/presets";
import { parseCsv } from "../lib/parseCsv";
import type { ScanBatch } from "../lib/types";
import { cn } from "../lib/utils";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function Onboarding() {
  const loadSampleData = useDashboardStore((s) => s.loadSampleData);
  const addBatch = useDashboardStore((s) => s.addBatch);
  const setPendingUpload = useDashboardStore((s) => s.setPendingUpload);

  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
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
        const batchId = `scan_${Math.random().toString(36).slice(2, 9)}`;
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
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#8B5CF6] text-white shadow-lg shadow-primary/20">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Welcome to <span className="text-primary">VAPTLens</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
          Universal client-side VAPT scan analytics dashboard. Explore your vulnerability scans with a Power BI-style canvas.
        </p>
      </motion.div>

      <div className="mt-8 grid w-full max-w-3xl gap-6 md:grid-cols-2">
        {/* Left Side: Upload / Demo Actions */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Get Started
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Load our pre-packaged vulnerability data to explore the interactive charts, cross-filters, and canvas immediately.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              onClick={loadSampleData}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium group transition-all"
            >
              Load Demo Scan Data
              <Sparkles className="ml-1.5 h-4 w-4 text-white/90 group-hover:scale-110 transition-transform" />
            </Button>

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
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={cn(
                "group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                dragOver
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-accent/20 hover:border-primary/50 hover:bg-accent/40"
              )}
            >
              <UploadCloud className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="mt-1.5 text-xs font-medium text-foreground">
                Drop your scan CSV or <span className="text-primary">browse</span>
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Supports Nessus, Burp, ZAP, Qualys, etc.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>
            {error && (
              <p className="text-[10px] font-medium text-destructive text-center">{error}</p>
            )}
          </div>
        </motion.div>

        {/* Right Side: Features Callout */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Core Capabilities
            </h3>
            <div className="mt-4 space-y-3.5">
              <div className="flex gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Cross-Filtering Canvas</h4>
                  <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Click on any chart segment or badge to filter all widgets dynamically. Explore correlations instantly.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">100% Client-Side Privacy</h4>
                  <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Your scans are processed entirely in memory. No network calls are made; your security findings never leave your machine.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Interactive Report Builder</h4>
                  <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Drag, resize, create, and remove widgets. Custom layout configurations are automatically saved.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-3">
            <span>Powered by Vite &amp; React</span>
            <span className="flex items-center gap-1">
              Read docs <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
