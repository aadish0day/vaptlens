import { useEffect, useState } from "react";
import { Plus, LayoutGrid, PanelLeft, ShieldAlert, X } from "lucide-react";
import { useDashboardStore } from "./store/useDashboardStore";
import { UploadZone } from "./components/UploadZone";
import { SlicerPanel } from "./components/SlicerPanel";
import { FilterChips } from "./components/FilterChips";
import { DashboardCanvas } from "./components/DashboardCanvas";
import { WidgetBuilder } from "./components/WidgetBuilder";
import { TemplateGallery } from "./components/TemplateGallery";

export default function App() {
  const scanline = useDashboardStore((s) => s.scanline);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sweep, setSweep] = useState(false);

  useEffect(() => {
    if (scanline === 0) return;
    setSweep(true);
    const t = setTimeout(() => setSweep(false), 1700);
    return () => clearTimeout(t);
  }, [scanline]);

  return (
    <div className="flex h-screen flex-col bg-bg text-text">
      {/* Terminal / report banner header */}
      <header className="relative flex items-center justify-between border-b border-border bg-panel px-4 py-3">
        {sweep && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-12 animate-scanline bg-gradient-to-b from-accent/30 to-transparent"
            aria-hidden
          />
        )}
        <div className="flex items-center gap-3">
          <ShieldAlert size={18} className="text-accent" />
          <div className="font-mono text-sm">
            <span className="text-muted">root@vaptlens</span>
            <span className="text-accent">:~$</span>{" "}
            <span className="font-semibold tracking-wide text-text">vaptlens</span>
            <span className="text-muted"> — vulnerability scan analytics</span>
          </div>
        </div>
        <div className="hidden font-mono text-[11px] text-muted sm:block">
          client-side · no data leaves this browser
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar (desktop) / drawer (mobile) */}
        <aside
          className={`${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-40 w-72 shrink-0 transform border-r border-border bg-panel transition-transform md:static md:translate-x-0`}
        >
          <div className="flex h-full flex-col overflow-auto">
            <div className="border-b border-border p-3">
              <UploadZone />
            </div>
            <div className="min-h-0 flex-1">
              <SlicerPanel />
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute right-2 top-2 rounded p-1 text-muted hover:text-text md:hidden"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </aside>

        {drawerOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* Main canvas area */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-panel px-3 py-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded p-1.5 text-muted hover:bg-border hover:text-text md:hidden"
              aria-label="Open filters"
            >
              <PanelLeft size={16} />
            </button>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Canvas
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowGallery(true)}
                className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 font-mono text-xs text-muted hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <LayoutGrid size={13} /> Templates
              </button>
              <button
                onClick={() => setShowBuilder(true)}
                className="flex items-center gap-1.5 rounded bg-accent px-2.5 py-1.5 font-mono text-xs font-semibold text-bg hover:bg-accent/85 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <Plus size={13} /> Add Widget
              </button>
            </div>
          </div>

          <FilterChips />

          <div className="min-h-0 flex-1 overflow-auto p-3">
            <DashboardCanvas />
          </div>
        </main>
      </div>

      {showBuilder && <WidgetBuilder onClose={() => setShowBuilder(false)} />}
      {showGallery && <TemplateGallery onClose={() => setShowGallery(false)} />}
    </div>
  );
}
