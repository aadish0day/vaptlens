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
  Kanban,
  Network,
  Target,
  FileText,
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
import { PrioritizationMatrix } from "./components/PrioritizationMatrix";
import { RemediationBoard } from "./components/RemediationBoard";
import { NetworkMap } from "./components/NetworkMap";
import { ReportBuilder } from "./components/ReportBuilder";
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
          aria-label="Toggle theme"
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

  const [activeTab, setActiveTab] = useState<"dashboard" | "matrix" | "board" | "map" | "report">("dashboard");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeTitle = {
    dashboard: { label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 text-primary" /> },
    matrix: { label: "Prioritization Matrix", icon: <Target className="h-4 w-4 text-emerald-500" /> },
    board: { label: "Remediation Board", icon: <Kanban className="h-4 w-4 text-blue-500" /> },
    map: { label: "Subnet Network Map", icon: <Network className="h-4 w-4 text-purple-500" /> },
    report: { label: "Executive Report Builder", icon: <FileText className="h-4 w-4 text-amber-500" /> },
  }[activeTab];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/70 print:hidden">
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
        <aside className="hidden w-80 shrink-0 flex-col border-r border-border bg-sidebar md:flex print:hidden">
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
          <div className="flex items-center gap-3 border-b border-border bg-card/60 px-4 py-2.5 backdrop-blur print:hidden">
            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
                {activeTitle.icon}
                {activeTitle.label}
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
              {activeTab === "dashboard" && (
                <>
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
                </>
              )}
            </div>
          </div>

          {findingsCount > 0 && (
            <div className="flex items-center gap-1 border-b border-border bg-card/45 px-4 py-1.5 overflow-x-auto print:hidden">
              <Button
                variant={activeTab === "dashboard" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("dashboard")}
                className="text-xs h-7 gap-1.5"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === "matrix" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("matrix")}
                className="text-xs h-7 gap-1.5"
              >
                <Target className="h-3.5 w-3.5 text-emerald-500" />
                Prioritization Matrix
              </Button>
              <Button
                variant={activeTab === "board" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("board")}
                className="text-xs h-7 gap-1.5"
              >
                <Kanban className="h-3.5 w-3.5 text-blue-500" />
                Remediation Board
              </Button>
              <Button
                variant={activeTab === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("map")}
                className="text-xs h-7 gap-1.5"
              >
                <Network className="h-3.5 w-3.5 text-purple-500" />
                Network Map
              </Button>
              <Button
                variant={activeTab === "report" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("report")}
                className="text-xs h-7 gap-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                Executive Report
              </Button>
            </div>
          )}

          <FilterChips />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-0 flex-1 overflow-auto p-4 md:p-6 print:p-0 print:overflow-visible"
          >
            {findingsCount === 0 ? (
              <Onboarding />
            ) : activeTab === "dashboard" ? (
              <DashboardCanvas />
            ) : activeTab === "matrix" ? (
              <PrioritizationMatrix />
            ) : activeTab === "board" ? (
              <RemediationBoard />
            ) : activeTab === "map" ? (
              <NetworkMap />
            ) : (
              <ReportBuilder />
            )}
          </motion.div>
        </main>
      </div>

      <WidgetBuilder open={builderOpen} onOpenChange={setBuilderOpen} />
      <TemplateGallery open={galleryOpen} onOpenChange={setGalleryOpen} />
    </div>
  );
}
