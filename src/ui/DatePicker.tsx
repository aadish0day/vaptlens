import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx, useLayer } from "@/ui/core";

function p2(n) {
  return String(n).padStart(2, "0");
}
function iso(d: Date) {
  return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
}
function parse(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
var WD = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/* ---------- DatePicker (calendar grid; arrows move days, PgUp/PgDn months, Home/End week edges) ---------- */
export function DatePicker(props) {
  var ctrl = props.value !== undefined,
    st = useState(props.defaultValue || "");
  var val = ctrl ? props.value : st[0],
    sel = parse(val);
  var open = useState(false),
    cur = useState(sel || (props.today ? parse(props.today) : new Date()));
  var wrap = React.useRef(null),
    trig = React.useRef(null),
    grid = React.useRef(null);
  useLayer(
    open[0],
    function (why) {
      open[1](false);
      if (why === "escape" && trig.current) trig.current.focus();
    },
    wrap,
  );
  function ok(d) {
    var s = iso(d);
    return !(props.min && s < props.min) && !(props.max && s > props.max);
  }
  function choose(d) {
    if (!ok(d)) return;
    var s = iso(d);
    if (!ctrl) st[1](s);
    if (props.onChange) props.onChange(s);
    open[1](false);
    if (trig.current) trig.current.focus();
  }
  function move(days, months?) {
    var d = new Date(cur[0]);
    if (months) d.setMonth(d.getMonth() + months);
    else d.setDate(d.getDate() + days);
    cur[1](d);
    setTimeout(function () {
      var b = grid.current && grid.current.querySelector('[data-focus="1"]');
      if (b) b.focus();
    }, 0);
  }
  var c = cur[0],
    first = new Date(c.getFullYear(), c.getMonth(), 1),
    lead = (first.getDay() + 6) % 7,
    days = [];
  for (var i = 0; i < 42; i++)
    days.push(new Date(c.getFullYear(), c.getMonth(), 1 - lead + i));
  var today = iso(props.today ? parse(props.today) : new Date());
  return (
    <div className="vl-dp" ref={wrap}>
      {props.label ? (
        <span className="vl-field-label">{props.label}</span>
      ) : null}
      <button
        type="button"
        ref={trig}
        className="vl-ms-trigger"
        aria-haspopup="dialog"
        aria-expanded={open[0]}
        onClick={function () {
          cur[1](sel || new Date());
          open[1](!open[0]);
          setTimeout(function () {
            var b =
              grid.current && grid.current.querySelector('[data-focus="1"]');
            if (b) b.focus();
          }, 0);
        }}
      >
        <Icon name="calendar" size={14} />
        <span className={cx("vl-ms-value", !val && "is-placeholder")}>
          {val || props.placeholder || "Pick a date"}
        </span>
      </button>
      {open[0] ? (
        <div
          className="vl-ms-menu vl-dp-pop"
          role="dialog"
          aria-label="Choose date"
        >
          <div className="vl-dp-head">
            <button
              type="button"
              className="vl-ibtn is-sm is-ghost"
              aria-label="Previous month"
              onClick={function () {
                move(0, -1);
              }}
            >
              <Icon name="chevron-left" size={14} />
            </button>
            <span aria-live="polite">
              {c.toLocaleString("en", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              className="vl-ibtn is-sm is-ghost"
              aria-label="Next month"
              onClick={function () {
                move(0, 1);
              }}
            >
              <Icon name="chevron-right" size={14} />
            </button>
          </div>
          <table className="vl-dp-grid" role="grid" ref={grid}>
            <thead>
              <tr>
                {WD.map(function (w) {
                  return (
                    <th key={w} scope="col" abbr={w}>
                      {w}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4, 5].map(function (r) {
                return (
                  <tr key={r}>
                    {days.slice(r * 7, r * 7 + 7).map(function (d) {
                      var s = iso(d),
                        inM = d.getMonth() === c.getMonth(),
                        isCur = s === iso(c);
                      return (
                        <td key={s}>
                          <button
                            type="button"
                            tabIndex={isCur ? 0 : -1}
                            data-focus={isCur ? "1" : "0"}
                            disabled={!ok(d)}
                            aria-pressed={s === val}
                            aria-current={s === today ? "date" : undefined}
                            className={cx(
                              "vl-dp-day",
                              !inM && "is-out",
                              s === val && "is-on",
                              s === today && "is-today",
                            )}
                            onClick={function () {
                              choose(d);
                            }}
                            onKeyDown={function (e) {
                              var k = e.key;
                              if (k === "ArrowLeft") {
                                e.preventDefault();
                                move(-1);
                              } else if (k === "ArrowRight") {
                                e.preventDefault();
                                move(1);
                              } else if (k === "ArrowUp") {
                                e.preventDefault();
                                move(-7);
                              } else if (k === "ArrowDown") {
                                e.preventDefault();
                                move(7);
                              } else if (k === "PageUp") {
                                e.preventDefault();
                                move(0, -1);
                              } else if (k === "PageDown") {
                                e.preventDefault();
                                move(0, 1);
                              } else if (k === "Home") {
                                e.preventDefault();
                                move(-((d.getDay() + 6) % 7));
                              } else if (k === "End") {
                                e.preventDefault();
                                move(6 - ((d.getDay() + 6) % 7));
                              }
                            }}
                          >
                            {d.getDate()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="vl-dp-foot">
            <button
              type="button"
              className="vl-drp-clear"
              onClick={function () {
                choose(parse(today));
              }}
            >
              Today
            </button>
            {val ? (
              <button
                type="button"
                className="vl-drp-clear"
                onClick={function () {
                  if (!ctrl) st[1]("");
                  if (props.onChange) props.onChange("");
                  open[1](false);
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
