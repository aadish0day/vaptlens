import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- ButtonGroup (attached buttons) ---------- */
export function ButtonGroup(props) {
  return <div className={cx("vl-bgroup", props.className)} role="group" aria-label={props.label}>{props.children}</div>;
}
/* ---------- ToggleButtonGroup (single or multiple pressed state, e.g. List/Board/Map view) ---------- */
export function ToggleButtonGroup(props) {
  var opts = (props.options || []).map(function (o) { return typeof o === "string" ? { value: o, label: o } : o; });
  var multi = !!props.multiple, ctrl = props.value !== undefined;
  var st = useState(props.defaultValue != null ? props.defaultValue : multi ? [] : opts[0] && opts[0].value);
  var val = ctrl ? props.value : st[0];
  function on(v) { return multi ? (val || []).indexOf(v) >= 0 : val === v; }
  function click(v) {
    var n = multi ? (on(v) ? val.filter(function (x) { return x !== v; }) : (val || []).concat([v])) : v;
    if (!ctrl) st[1](n);
    if (props.onChange) props.onChange(n);
  }
  return (
    <div className="vl-bgroup" role="group" aria-label={props.label}>
      {opts.map(function (o) {
        return (
          <button key={o.value} type="button" aria-pressed={on(o.value)} title={o.iconOnly ? o.label : undefined} aria-label={o.iconOnly ? o.label : undefined} disabled={o.disabled} className={cx("vl-tbtn", on(o.value) && "is-on")} onClick={function () { click(o.value); }}>
            {o.icon ? <Icon name={o.icon} size={14} /> : null}
            {o.iconOnly ? null : <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
