import React from "react";
import { cx } from "@/ui/core";

var LABEL = {
  ok: "Healthy",
  warn: "Degraded",
  danger: "Failing",
  info: "Info",
  pending: "Pending",
  off: "Off",
  running: "Running",
};
/* ---------- StatusIndicator (dot + word, never colour alone) ---------- */
export function StatusIndicator(props) {
  var s = props.status || "info";
  return (
    <span className={cx("vl-status", "is-" + s, props.className)}>
      <span className="vl-status-dot" aria-hidden="true" />
      <span>{props.children || LABEL[s] || s}</span>
    </span>
  );
}
