import React from "react";
import { cx } from "@/ui/core";

/* ---------- EffortMeter ---------- */
export function EffortMeter(props) {
  var v = Math.max(1, Math.min(10, props.value || 1));
  var segs = [];
  for (var i = 1; i <= 10; i++)
    segs.push(
      <span
        key={i}
        className={cx("vl-effort-seg", i <= Math.round(v) && "is-on")}
      />,
    );
  return (
    <div
      className={cx("vl-effort", v >= 6 ? "is-high" : "is-low")}
      role="meter"
      aria-valuemin={1}
      aria-valuemax={10}
      aria-valuenow={v}
      aria-label="Remediation effort"
    >
      <div className="vl-effort-segs">{segs}</div>
      <span className="vl-effort-v">{v.toFixed(1)}</span>
      <span className="vl-effort-l">
        {v >= 6 ? "High effort" : "Low effort"}
      </span>
    </div>
  );
}

/* ---------- TierBadge ---------- */
