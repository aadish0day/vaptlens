import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- RiskDelta ---------- */
export function RiskDelta(props) {
  var p = props.pct || 0,
    better = p < 0;
  return (
    <div className="vl-delta">
      <span className="vl-label">{props.label || "Net risk delta"}</span>
      <div className="vl-delta-main">
        <Icon name={better ? "trend-down" : "trend-up"} size={20} />
        <span className={cx("vl-delta-v", better ? "is-better" : "is-worse")}>
          {(p > 0 ? "+" : p < 0 ? "−" : "") + Math.abs(p) + "%"}
        </span>
        <span className="vl-delta-word">
          {better ? "Risk reduced" : p === 0 ? "No change" : "Risk increased"}
        </span>
      </div>
      <div className="vl-delta-ab">
        <span>
          <b>A</b> {props.baseline || "Baseline"}
          <i>{props.before != null ? "ΣCVSS " + props.before : ""}</i>
        </span>
        <Icon name="chevron-right" size={12} />
        <span>
          <b>B</b> {props.retest || "Re-test"}
          <i>{props.after != null ? "ΣCVSS " + props.after : ""}</i>
        </span>
      </div>
    </div>
  );
}

/* ---------- TopologyMap ---------- */
