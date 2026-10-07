import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx, useLayer } from "@/ui/core";

/* ---------- Select (single choice, optional type-to-filter) ---------- */
/* options: strings or { value, label, description?, disabled? } */
export function Select(props) {
  var opts = (props.options || []).map(function (o) {
    return typeof o === "string" ? { value: o, label: o } : o;
  });
  var ctrl = props.value !== undefined;
  var st = useState(props.defaultValue == null ? null : props.defaultValue);
  var val = ctrl ? props.value : st[0];
  var open = useState(false),
    q = useState(""),
    act = useState(0);
  var wrap = React.useRef(null),
    trig = React.useRef(null),
    id = React.useRef("vl-sel-" + Math.random().toString(36).slice(2, 8)).current;
  var shown = props.filterable && q[0]
    ? opts.filter(function (o) { return String(o.label).toLowerCase().indexOf(q[0].toLowerCase()) >= 0; })
    : opts;
  var cur = opts.find(function (o) { return o.value === val; });
  function close(focus) {
    open[1](false);
    q[1]("");
    if (focus && trig.current) trig.current.focus();
  }
  useLayer(open[0], function (why) { close(why === "escape"); }, wrap);
  function pick(o) {
    if (!o || o.disabled) return;
    if (!ctrl) st[1](o.value);
    if (props.onChange) props.onChange(o.value, o);
    close(true);
  }
  function openMenu() {
    var i = Math.max(0, shown.findIndex(function (o) { return o.value === val; }));
    act[1](i);
    open[1](true);
  }
  function keys(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open[0]) return openMenu();
      var d = e.key === "ArrowDown" ? 1 : -1, n = act[0];
      for (var k = 0; k < shown.length; k++) {
        n = (n + d + shown.length) % shown.length;
        if (!shown[n].disabled) break;
      }
      act[1](n);
    } else if (e.key === "Enter" || (e.key === " " && !props.filterable)) {
      if (open[0]) { e.preventDefault(); pick(shown[act[0]]); }
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); openMenu(); }
    } else if (e.key === "Home" && open[0]) { e.preventDefault(); act[1](0); }
    else if (e.key === "End" && open[0]) { e.preventDefault(); act[1](shown.length - 1); }
  }
  return (
    <div className={cx("vl-sel", props.className, props.invalid && "is-invalid")} ref={wrap}>
      <button
        type="button"
        ref={trig}
        className={cx("vl-ms-trigger", open[0] && "is-open")}
        aria-haspopup="listbox"
        aria-expanded={open[0]}
        aria-controls={open[0] ? id : undefined}
        aria-label={props.ariaLabel || props.label}
        disabled={props.disabled}
        onClick={function () { open[0] ? close(false) : openMenu(); }}
        onKeyDown={props.filterable && open[0] ? undefined : keys}
      >
        {props.label ? <span className="vl-ms-label">{props.label}</span> : null}
        <span className={cx("vl-ms-value", !cur && "is-placeholder")}>{cur ? cur.label : props.placeholder || "Choose…"}</span>
        <Icon name="chevron-down" size={14} />
      </button>
      {open[0] ? (
        <div className="vl-ms-menu vl-sel-menu">
          {props.filterable ? (
            <div className="vl-sel-search">
              <Icon name="search" size={14} />
              <input
                autoFocus
                value={q[0]}
                placeholder="Filter…"
                aria-label="Filter options"
                aria-controls={id}
                aria-activedescendant={shown[act[0]] ? id + "-" + act[0] : undefined}
                onChange={function (e) { q[1](e.target.value); act[1](0); }}
                onKeyDown={keys}
              />
            </div>
          ) : null}
          <ul role="listbox" id={id} aria-label={props.label || props.ariaLabel}>
            {shown.length === 0 ? <li className="vl-sel-empty">No matches</li> : null}
            {shown.map(function (o, i) {
              return (
                <li
                  key={o.value}
                  id={id + "-" + i}
                  role="option"
                  aria-selected={o.value === val}
                  aria-disabled={o.disabled || undefined}
                  className={cx("vl-sel-opt", i === act[0] && "is-active", o.value === val && "is-on", o.disabled && "is-disabled")}
                  onMouseEnter={function () { act[1](i); }}
                  onMouseDown={function (e) { e.preventDefault(); }}
                  onClick={function () { pick(o); }}
                >
                  <span className="vl-sel-text">
                    <span>{o.label}</span>
                    {o.description ? <small>{o.description}</small> : null}
                  </span>
                  {o.value === val ? <Icon name="check" size={14} /> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
