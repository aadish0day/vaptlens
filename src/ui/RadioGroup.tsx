import React, { useState } from "react";
import { cx } from "@/ui/core";

/* ---------- RadioGroup (roving tabindex, arrow keys) ---------- */
export function RadioGroup(props) {
  var opts = (props.options || []).map(function (o) {
    return typeof o === "string" ? { value: o, label: o } : o;
  });
  var ctrl = props.value !== undefined;
  var st = useState(props.defaultValue);
  var val = ctrl ? props.value : st[0];
  var refs = React.useRef([]);
  function set(v) {
    if (!ctrl) st[1](v);
    if (props.onChange) props.onChange(v);
  }
  function keys(e, i) {
    var d =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (!d) return;
    e.preventDefault();
    var n = i;
    for (var k = 0; k < opts.length; k++) {
      n = (n + d + opts.length) % opts.length;
      if (!opts[n].disabled) break;
    }
    set(opts[n].value);
    if (refs.current[n]) refs.current[n].focus();
  }
  var first = opts.findIndex(function (o) {
    return o.value === val;
  });
  return (
    <div
      role="radiogroup"
      aria-label={props.label}
      className={cx("vl-radios", props.inline && "is-inline")}
    >
      {props.label && props.showLabel !== false ? (
        <span className="vl-field-label">{props.label}</span>
      ) : null}
      {opts.map(function (o, i) {
        var on = o.value === val;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            ref={function (el) {
              refs.current[i] = el;
            }}
            aria-checked={on}
            disabled={o.disabled}
            tabIndex={on || (first < 0 && i === 0) ? 0 : -1}
            className={cx("vl-radio", on && "is-on")}
            onClick={function () {
              set(o.value);
            }}
            onKeyDown={function (e) {
              keys(e, i);
            }}
          >
            <span className="vl-radio-dot" aria-hidden="true" />
            <span className="vl-radio-text">
              <span>{o.label}</span>
              {o.description ? <small>{o.description}</small> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
