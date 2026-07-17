import { cn } from "../lib/utils";
import { severityBadge } from "../lib/chart-theme";
import { useTheme } from "./theme-provider";
import type { Severity } from "../lib/types";

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const { theme } = useTheme();
  const s = severityBadge(severity, theme === "dark");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        className
      )}
      style={{ color: s.text, backgroundColor: s.bg, borderColor: s.border }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: s.dot }}
        aria-hidden
      />
      {severity}
    </span>
  );
}
