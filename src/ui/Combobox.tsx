import React, { useState } from "react";
import { cx, useLayer } from "@/ui/core";

/* ---------- Combobox (free text with suggestions; ARIA 1.2 combobox pattern) ---------- */
export function Combobox(props) {
  var ctrl = props.value !== undefined, st = useState(props.defaultValue || "");
  var v = ctrl ? props.value : st[0], open = useState(false), act = useState(-1);
  var wrap = React.useRef(null), id = React.useRef("vl-cb-" + Math.random().toString(36).slice(2, 8)).current;
  var sugg = (props.suggestions || []).filter(function (s) { return !v || String(s).toLowerCase().indexOf(String(v).toLowerCase()) >= 0; }).slice(0, props.max || 8);
  useLayer(open[0] && sugg.length > 0, function () { open[1](false); }, wrap);
  function set(n) { if (!ctrl) st[1](n); if (props.onChange) props.onChange(n); }
  function pick(s) { set(s); open[1](false); act[1](-1); if (props.onSelect) props.onSelect(s); }
  var show = open[0] && sugg.length > 0;
  return (
    <div className="vl-field vl-cb" ref={wrap}>
      {props.label ? <label className="vl-field-label" htmlFor={id}>{props.label}</label> : null}
      <input id={id} className="vl-cb-input" role="combobox" aria-expanded={show} aria-controls={id + "-l"} aria-autocomplete="list" aria-activedescendant={show && act[0] >= 0 ? id + "-" + act[0] : undefined}
        value={v} placeholder={props.placeholder} autoComplete="off"
        onChange={function (e) { set(e.target.value); open[1](true); act[1](-1); }}
        onFocus={function () { open[1](true); }}
        onKeyDown={function (e) {
          if (e.key === "ArrowDown") { e.preventDefault(); open[1](true); act[1](Math.min(sugg.length - 1, act[0] + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); act[1](Math.max(-1, act[0] - 1)); }
          else if (e.key === "Enter" && show && act[0] >= 0) { e.preventDefault(); pick(sugg[act[0]]); }
          else if (e.key === "Escape" && show) { e.stopPropagation(); open[1](false); }
        }} />
      {show ? (
        <ul id={id + "-l"} role="listbox" className="vl-ms-menu vl-cb-list">
          {sugg.map(function (s, i) {
            return <li key={s} id={id + "-" + i} role="option" aria-selected={i === act[0]} className={cx("vl-sel-opt", i === act[0] && "is-active")} onMouseDown={function (e) { e.preventDefault(); }} onClick={function () { pick(s); }}>{s}</li>;
          })}
        </ul>
      ) : null}
    </div>
  );
}
