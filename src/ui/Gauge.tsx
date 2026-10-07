import React from "react";

/* ---------- Gauge (semicircle score with banded colours; value + word, not colour alone) ---------- */
export function Gauge(props) {
  var min = props.min || 0, max = props.max == null ? 100 : props.max, v = Math.max(min, Math.min(max, props.value || 0));
  var bands = props.bands || [{ to: 40, color: "var(--status-ok)", label: "Low" }, { to: 70, color: "var(--status-warn)", label: "Elevated" }, { to: 90, color: "var(--sev-high)", label: "High" }, { to: max, color: "var(--sev-critical)", label: "Critical" }];
  var W = 160, R = 64, cx0 = 80, cy0 = 76, sw = 12;
  function pt(val) { var a = Math.PI * (1 - (val - min) / (max - min)); return [cx0 + R * Math.cos(a), cy0 - R * Math.sin(a)]; }
  function arc(a, b) { var p = pt(a), q = pt(b); return "M" + p[0] + " " + p[1] + " A" + R + " " + R + " 0 0 1 " + q[0] + " " + q[1]; }
  var band = bands.find(function (b) { return v <= b.to; }) || bands[bands.length - 1];
  var prev = min, n = pt(v);
  return (
    <figure className="vl-gauge" role="meter" aria-valuemin={min} aria-valuemax={max} aria-valuenow={v} aria-valuetext={v + " " + band.label} aria-label={props.label || "Score"}>
      <svg viewBox={"0 0 " + W + " 92"} width="100%" style={{ maxWidth: props.width || 200 }} aria-hidden="true">
        {bands.map(function (b, i) { var d = arc(prev, Math.min(b.to, max)); prev = b.to; return <path key={i} d={d} stroke={b.color} strokeOpacity="0.28" strokeWidth={sw} fill="none" />; })}
        <path d={arc(min, Math.max(min + 0.0001, v))} stroke={band.color} strokeWidth={sw} fill="none" strokeLinecap="round" />
        <circle cx={n[0]} cy={n[1]} r="5" fill="var(--surface-100)" stroke={band.color} strokeWidth="3" />
        <text x={cx0} y={cy0 - 8} textAnchor="middle" className="vl-gauge-v">{props.format ? props.format(v) : Math.round(v)}</text>
        <text x={cx0} y={cy0 + 10} textAnchor="middle" className="vl-gauge-b">{band.label}</text>
      </svg>
      {props.caption ? <figcaption>{props.caption}</figcaption> : null}
    </figure>
  );
}
