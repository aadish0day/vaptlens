import React from "react";
import { cx } from "@/ui/core";

/* ---------- Spinner ---------- */
export function Spinner(props) {
  var s = props.size || 16;
  return (
    <span className={cx("vl-spinner", props.className)} role="status" aria-live="polite">
      <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className={props.showLabel ? "vl-spinner-label" : "vl-sr"}>{props.label || "Loading"}</span>
    </span>
  );
}
