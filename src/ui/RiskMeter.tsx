import React from "react";

/* ---------- RiskMeter ---------- */
export function RiskMeter(props) {
  var max = props.max || 100;
  var pct = Math.max(0, Math.min(100, (props.score / max) * 100));
  var band =
    pct >= 75 ? "critical" : pct >= 50 ? "high" : pct >= 25 ? "medium" : "low";
  return (
    <div className="vl-risk">
      <div className="vl-risk-top">
        <span className="vl-risk-host">{props.host}</span>
        {props.criticals ? (
          <span className="vl-risk-crit">{props.criticals + " crit"}</span>
        ) : null}
        <span className="vl-risk-score">{props.score}</span>
      </div>
      <div
        className="vl-risk-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={props.score}
        aria-label={"Risk score for " + props.host}
      >
        <div
          className={"vl-risk-fill vl-bg-" + band}
          style={{
            width: pct + "%",
          }}
        />
      </div>
    </div>
  );
}

/* ---------- KanbanCard ---------- */
