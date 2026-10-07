import React, { useState } from "react";
import { Checkbox } from "@/ui/Checkbox";
import { Icon } from "@/ui/Icon";
import { cx, menuKeys, useLayer } from "@/ui/core";

/* ---------- MultiSelect ---------- */
export function MultiSelect(props) {
  var opts = props.options || [];
  var ctrl = props.value !== undefined;
  var st = useState(props.defaultValue || []);
  var sel = ctrl ? props.value : st[0];
  var o = useState(!!props.defaultOpen);
  function toggle(v) {
    var next =
      sel.indexOf(v) >= 0
        ? sel.filter(function (x) {
            return x !== v;
          })
        : sel.concat([v]);
    if (!ctrl) st[1](next);
    if (props.onChange) props.onChange(next);
  }
  var summary =
    sel.length === 0
      ? props.placeholder || "All"
      : sel.length === 1
        ? sel[0]
        : sel.length + " selected";
  var wrap = React.useRef(null),
    trig = React.useRef(null);
  useLayer(
    o[0],
    function (why) {
      o[1](false);
      if (why === "escape" && trig.current) trig.current.focus();
    },
    wrap,
  );
  return (
    <div className="vl-ms" ref={wrap}>
      <button
        type="button"
        ref={trig}
        className={cx("vl-ms-trigger", o[0] && "is-open")}
        aria-expanded={o[0]}
        aria-haspopup="listbox"
        onClick={function () {
          o[1](!o[0]);
        }}
        onKeyDown={function (e) {
          if (e.key === "ArrowDown" && !o[0]) {
            e.preventDefault();
            o[1](true);
            setTimeout(function () {
              var c =
                wrap.current && wrap.current.querySelector(".vl-ms-menu input");
              if (c) c.focus();
            }, 0);
          }
        }}
      >
        {props.label ? (
          <span className="vl-ms-label">{props.label}</span>
        ) : null}
        <span className="vl-ms-value">{summary}</span>
        <Icon name="chevron-down" size={14} />
      </button>
      {o[0] ? (
        <div
          className="vl-ms-menu"
          role="listbox"
          aria-multiselectable="true"
          onKeyDown={function (e) {
            menuKeys(e, "input");
          }}
        >
          {opts.map(function (op) {
            var v = typeof op === "string" ? op : op.value;
            return (
              <div key={v} className="vl-ms-item">
                <Checkbox
                  label={typeof op === "string" ? op : op.label || v}
                  severity={op.severity}
                  count={op.count}
                  checked={sel.indexOf(v) >= 0}
                  onChange={function () {
                    toggle(v);
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Modal ---------- */
/* controlled-or-internal chart selection: pass selected + onSelect(labelOrNull) to cross-filter */
/* Enter / Space activate an SVG mark the way a click does */
