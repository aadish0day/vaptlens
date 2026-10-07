import { FieldMessage } from "@/ui/FieldMessage";
import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx, useLayer } from "@/ui/core";

var DAY = 864e5;
function iso(d: Date) {
  function p(n) {
    return String(n).padStart(2, "0");
  }
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
export var RANGE_PRESETS = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "180d", label: "Last 6 months", days: 182 },
  { key: "365d", label: "Last 12 months", days: 365 },
];
/* resolve a value to concrete dates: { type:"relative", key } | { type:"absolute", from, to } */
export function resolveRange(v, today?: string) {
  if (!v) return null;
  var end = today ? new Date(today + "T00:00:00") : new Date();
  if (v.type === "relative") {
    var p = RANGE_PRESETS.find(function (x) {
      return x.key === v.key;
    });
    if (!p) return null;
    return {
      from: iso(new Date(end.getTime() - (p.days - 1) * DAY)),
      to: iso(end),
    };
  }
  return v.from && v.to ? { from: v.from, to: v.to } : null;
}
export function rangeLabel(v) {
  if (!v) return null;
  if (v.type === "relative") {
    var p = RANGE_PRESETS.find(function (x) {
      return x.key === v.key;
    });
    return p ? p.label : null;
  }
  return v.from && v.to ? v.from + " → " + v.to : null;
}

/* ---------- DateRangePicker (relative presets + absolute range, validated) ---------- */
export function DateRangePicker(props) {
  var ctrl = props.value !== undefined;
  var st = useState(props.defaultValue || null);
  var val = ctrl ? props.value : st[0];
  var open = useState(false);
  var mode = useState(val && val.type === "absolute" ? "absolute" : "relative");
  var draft = useState(
    val && val.type === "absolute"
      ? { from: val.from, to: val.to }
      : { from: "", to: "" },
  );
  var err = useState("");
  var wrap = React.useRef(null),
    trig = React.useRef(null);
  useLayer(
    open[0],
    function (why) {
      open[1](false);
      if (why === "escape" && trig.current) trig.current.focus();
    },
    wrap,
  );
  function commit(v) {
    if (!ctrl) st[1](v);
    if (props.onChange) props.onChange(v, resolveRange(v, props.today));
    open[1](false);
    if (trig.current) trig.current.focus();
  }
  function apply() {
    var d = draft[0];
    if (!d.from || !d.to) return err[1]("Pick both a start and an end date.");
    if (d.from > d.to) return err[1]("The start date is after the end date.");
    if (props.max && d.to > props.max)
      return err[1]("The end date can't be after " + props.max + ".");
    err[1]("");
    commit({ type: "absolute", from: d.from, to: d.to });
  }
  return (
    <div className="vl-drp" ref={wrap}>
      <button
        type="button"
        ref={trig}
        className={cx("vl-ms-trigger", open[0] && "is-open")}
        aria-haspopup="dialog"
        aria-expanded={open[0]}
        onClick={function () {
          open[1](!open[0]);
        }}
      >
        <Icon name="clock" size={14} />
        {props.label ? (
          <span className="vl-ms-label">{props.label}</span>
        ) : null}
        <span className={cx("vl-ms-value", !val && "is-placeholder")}>
          {rangeLabel(val) || props.placeholder || "Any time"}
        </span>
        <Icon name="chevron-down" size={14} />
      </button>
      {open[0] ? (
        <div
          className="vl-ms-menu vl-drp-pop"
          role="dialog"
          aria-label="Choose a date range"
        >
          <div className="vl-seg vl-drp-mode" role="tablist">
            {[
              ["relative", "Relative"],
              ["absolute", "Absolute"],
            ].map(function (m) {
              return (
                <button
                  key={m[0]}
                  type="button"
                  role="tab"
                  aria-selected={mode[0] === m[0]}
                  className={cx("vl-seg-opt", mode[0] === m[0] && "is-on")}
                  onClick={function () {
                    mode[1](m[0]);
                    err[1]("");
                  }}
                >
                  {m[1]}
                </button>
              );
            })}
          </div>
          {mode[0] === "relative" ? (
            <div className="vl-drp-presets">
              {RANGE_PRESETS.map(function (p) {
                var on = val && val.type === "relative" && val.key === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    className={cx("vl-drp-preset", on && "is-on")}
                    aria-pressed={on}
                    onClick={function () {
                      commit({ type: "relative", key: p.key });
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="vl-drp-abs">
              <label>
                <span>From</span>
                <input
                  type="date"
                  value={draft[0].from}
                  max={props.max}
                  onChange={function (e) {
                    draft[1](
                      Object.assign({}, draft[0], { from: e.target.value }),
                    );
                  }}
                />
              </label>
              <label>
                <span>To</span>
                <input
                  type="date"
                  value={draft[0].to}
                  max={props.max}
                  onChange={function (e) {
                    draft[1](
                      Object.assign({}, draft[0], { to: e.target.value }),
                    );
                  }}
                />
              </label>
              <FieldMessage error={err[0]} alert={true} />
              <div className="vl-drp-actions">
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary vl-btn-sm"
                  onClick={function () {
                    open[1](false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="vl-btn vl-btn-primary vl-btn-sm"
                  onClick={apply}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
          {val ? (
            <button
              type="button"
              className="vl-drp-clear"
              onClick={function () {
                commit(null);
              }}
            >
              Clear range
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
