import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  LayoutGrid,
  Lock,
  Moon,
  PanelLeft,
  Plus,
  ShieldCheck,
  Sun,
  Trash2,
} from "lucide-react";
import { useDashboardStore } from "./store/useDashboardStore";
import { UploadZone } from "./components/UploadZone";
import { SlicerPanel } from "./components/SlicerPanel";
import { FilterChips } from "./components/FilterChips";
import { DashboardCanvas } from "./components/DashboardCanvas";
import { Onboarding } from "./components/Onboarding";
import { WidgetBuilder } from "./components/WidgetBuilder";
import { TemplateGallery } from "./components/TemplateGallery";
import { ExportMenu } from "./components/ExportMenu";
import { Button } from "./components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { useTheme } from "./components/theme-provider";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          data-testid="theme-toggle"
        >
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Switch to light" : "Switch to dark"}</TooltipContent>
    </Tooltip>
  );
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <UploadZone />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <SlicerPanel />
      </div>
    </div>
  );
}

export default function App() {
  const findingsCount = useDashboardStore((s) => s.findings.length);
  const batchesCount = useDashboardStore((s) => s.batches.length);
  const clearAllData = useDashboardStore((s) => s.clearAllData);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open filters"
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </Button>

        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-[#8B5CF6] text-white shadow-sm">
            <ShieldCheck className="h-[18px] w-[18px]" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">VAPTLens</div>
            <div className="hidden text-[11px] text-muted-foreground sm:block">
              Vulnerability scan analytics
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground lg:flex">
            <Lock className="h-3 w-3" />
            Client-side · nothing leaves this browser
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
          <SidebarContent />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[340px] p-0">
            <SheetHeader>
              <SheetTitle>Filters &amp; data</SheetTitle>
              <SheetDescription>
                Upload a scan and slice the results.
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border bg-card/60 px-4 py-2.5 backdrop-blur">
            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Dashboard
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {findingsCount.toLocaleString()} findings across {batchesCount}{" "}
                {batchesCount === 1 ? "scan" : "scans"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {findingsCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllData}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden lg:inline">Clear Data</span>
                </Button>
              )}
              <ExportMenu disabled={findingsCount === 0} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGalleryOpen(true)}
                disabled={findingsCount === 0}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </Button>
              <Button size="sm" onClick={() => setBuilderOpen(true)} disabled={findingsCount === 0}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Widget</span>
              </Button>
            </div>
          </div>

          <FilterChips />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-0 flex-1 overflow-auto p-4 md:p-6"
          >
            {findingsCount === 0 ? <Onboarding /> : <DashboardCanvas />}
          </motion.div>
        </main>
      </div>

      <WidgetBuilder open={builderOpen} onOpenChange={setBuilderOpen} />
      <TemplateGallery open={galleryOpen} onOpenChange={setGalleryOpen} />
    </div>
  );
}
