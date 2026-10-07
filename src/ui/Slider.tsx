import React, { useState } from "react";

/* ---------- Slider (native range, labelled, with value readout and optional marks) ---------- */
export function Slider(props) {
  var ctrl = props.value !== undefined, st = useState(props.defaultValue == null ? props.min || 0 : props.defaultValue);
  var v = ctrl ? props.value : st[0], min = props.min || 0, max = props.max == null ? 100 : props.max;
  var id = React.useRef("vl-sl-" + Math.random().toString(36).slice(2, 8)).current;
  return (
    <div className="vl-slider">
      <div className="vl-slider-head">
        <label htmlFor={id}>{props.label}</label>
        <output htmlFor={id}>{props.format ? props.format(v) : v}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={props.step || 1} value={v} disabled={props.disabled} style={{ ["--pct" as any]: ((100 * (v - min)) / (max - min || 1)) + "%" }} aria-valuetext={props.format ? props.format(v) : undefined} onChange={function (e) { var n = +e.target.value; if (!ctrl) st[1](n); if (props.onChange) props.onChange(n); }} />
      {props.marks ? <div className="vl-slider-marks" aria-hidden="true">{props.marks.map(function (m) { return <span key={m.value} style={{ left: ((100 * (m.value - min)) / (max - min)) + "%" }}>{m.label}</span>; })}</div> : null}
    </div>
  );
}
