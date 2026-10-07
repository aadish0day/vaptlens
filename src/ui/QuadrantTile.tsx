import React from "react";
import { cx } from "@/ui/core";

/* ---------- QuadrantTile ---------- */
export var QUAD = {
  quickwins: ["Quick Wins", "High risk · low effort", "Patch now"],
  strategic: ["Strategic", "High risk · high effort", "Plan a sprint"],
  mundane: ["Mundane Fixes", "Low risk · low effort", "Routine maintenance"],
  deferrable: ["Deferrable", "Low risk · high effort", "Backlog"],
};

export function QuadrantTile(props) {
  var q = QUAD[props.kind] || QUAD.quickwins;
  return (
    <button
      type="button"
      className={cx(
        "vl-quad",
        "vl-quad-" + props.kind,
        props.selected && "is-selected",
      )}
      aria-pressed={!!props.selected}
      onClick={props.onClick}
    >
      <span className="vl-quad-top">
        <span className="vl-quad-name">{q[0]}</span>
        <span className="vl-quad-count">
          {props.count != null ? props.count : 0}
        </span>
      </span>
      <span className="vl-quad-axes">{q[1]}</span>
      <span className="vl-quad-hint">{q[2]}</span>
    </button>
  );
}

/* ---------- AuditLogRow ---------- */
