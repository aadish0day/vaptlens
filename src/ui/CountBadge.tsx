import React from "react";
import { cx } from "@/ui/core";

/* ---------- CountBadge (99+ cap, tone; hidden when zero unless showZero) ---------- */
export function CountBadge(props) {
  var n = props.count || 0;
  if (!n && !props.showZero) return null;
  return (
    <span
      className={cx("vl-count", "is-" + (props.tone || "neutral"))}
      aria-label={props.label ? n + " " + props.label : undefined}
    >
      {n > (props.max || 99) ? (props.max || 99) + "+" : n}
    </span>
  );
}
