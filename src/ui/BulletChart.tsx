import React from "react";

/* ---------- BulletChart (actual vs target on qualitative bands, e.g. MTTR days vs SLA) ---------- */
/* lowerIsBetter flips colours: for MTTR or open counts, under the target is good */
export function BulletChart(props) {
  var max = props.max || Math.max(props.value || 0, props.target || 0) * 1.25 || 1;
  var pct = function (v) { return Math.max(0, Math.min(100, (100 * v) / max)); };
  var good = props.lowerIsBetter ? props.value <= props.target : props.value >= props.target;
  return (
    <div className="vl-bullet">
      <div className="vl-bullet-head"><span>{props.label}</span><b className={good ? "is-ok" : "is-bad"}>{props.format ? props.format(props.value) : props.value}</b><small>target {props.format ? props.format(props.target) : props.target}</small></div>
      <div className="vl-bullet-track" role="img" aria-label={props.label + ": " + props.value + " against a target of " + props.target + (good ? " (on target)" : " (off target)")}>
        {(props.bands || [0.6, 0.85, 1]).map(function (b, i) { return <span key={i} className={"vl-bullet-band is-b" + i} style={{ width: b * 100 + "%" }} />; })}
        <span className={"vl-bullet-bar " + (good ? "is-ok" : "is-bad")} style={{ width: pct(props.value) + "%" }} />
        <span className="vl-bullet-target" style={{ left: pct(props.target) + "%" }} />
      </div>
    </div>
  );
}
