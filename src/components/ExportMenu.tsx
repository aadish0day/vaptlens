import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileDown, FileImage, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { exportDashboardPdf, exportDashboardPng } from "../lib/exporter";

type Kind = "png" | "pdf";

export function ExportMenu({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Kind | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = async (kind: Kind) => {
    const el = document.getElementById("dashboard-capture");
    if (!el) return;
    setBusy(kind);
    setOpen(false);
    try {
      if (kind === "png") await exportDashboardPng(el);
      else await exportDashboardPdf(el);
    } catch (err) {
      console.error("Export failed", err);
      window.alert("Export failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative flex" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="rounded-r-none focus-visible:relative"
        onClick={() => run("pdf")}
        disabled={busy !== null || disabled}
      >
        {busy === "pdf" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Export PDF</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="rounded-l-none border-l-0 px-1.5 focus-visible:relative"
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null || disabled}
        aria-label="More export options"
      >
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-9 w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg shadow-black/10">
          <button
            onClick={() => run("png")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <FileImage className="h-4 w-4" />
            Export as PNG
          </button>
        </div>
      )}
    </div>
  );
}
