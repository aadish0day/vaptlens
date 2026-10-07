import React from "react";

/* ---------- EpssMeter (EPSS probability + percentile; log-ish scale so 1% vs 10% is visible) ---------- */
export function EpssMeter(props) {
  var p = props.probability == null ? null : Math.max(0, Math.min(1, props.probability));
  if (p == null) return <span className="vl-epss is-none">EPSS n/a</span>;
  var pos = Math.min(100, (Math.log10(p * 1000 + 1) / 3) * 100);
  var tone = p >= 0.1 ? "danger" : p >= 0.01 ? "warn" : "ok";
  return (
    <div className={"vl-epss is-" + tone} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 1000) / 10} aria-label={"EPSS " + (p * 100).toFixed(1) + "% chance of exploitation in 30 days"}>
      <div className="vl-epss-head"><span>EPSS</span><b>{(p * 100).toFixed(p < 0.01 ? 2 : 1)}%</b>{props.percentile != null ? <small>{Math.round(props.percentile * 100)}th pct</small> : null}</div>
      <div className="vl-epss-track"><span style={{ width: pos + "%" }} /></div>
      <div className="vl-epss-scale" aria-hidden="true"><span>0.1%</span><span>1%</span><span>10%</span><span>100%</span></div>
    </div>
  );
}
