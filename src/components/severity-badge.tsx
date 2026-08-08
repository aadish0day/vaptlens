import { cn } from "../lib/utils";
import { severityBadge } from "../lib/chart-theme";
import { useTheme } from "./theme-provider";
import type { Severity } from "../lib/types";

export function SeverityBadge({
  severity,
  className,
  onClick,
  ariaPressed,
  title,
}: {
  severity: Severity;
  className?: string;
  /** When provided, renders an accessible button that calls this on click (with stopPropagation). */
  onClick?: () => void;
  ariaPressed?: boolean;
  title?: string;
}) {
  const { theme } = useTheme();
  const s = severityBadge(severity, theme === "dark");

  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
    className
  );

  const inner = (
    <>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: s.dot }}
        aria-hidden
      />
      {severity}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onKeyDown={(e) => {
          // stopPropagation keeps the parent card (role="button") from also firing
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
          }
        }}
        aria-pressed={ariaPressed}
        title={title}
        className={cn(
          classes,
          "cursor-pointer select-none transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          ariaPressed && "ring-2 ring-primary/40"
        )}
        style={{ color: s.text, backgroundColor: s.bg, borderColor: s.border }}
      >
        {inner}
      </button>
    );
  }

  return (
    <span
      className={classes}
      style={{ color: s.text, backgroundColor: s.bg, borderColor: s.border }}
    >
      {inner}
    </span>
  );
}
