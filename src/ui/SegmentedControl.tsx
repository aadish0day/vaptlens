import React, { useState } from "react";
import { cx } from "@/ui/core";
import { motion } from "motion/react";
import { GLIDE, NONE, useReduced } from "@/ui/motion";

/* ---------- SegmentedControl (ported from interior.dev segmented-control: gliding thumb pill, keyboard nav) ---------- */
export function SegmentedControl(props) {
  var opts = props.options || [
    "7 days",
    "15 days",
    "30 days",
    "6 months",
    "All",
  ];
  var ctrl = props.value != null;
  var st = useState(
    ctrl
      ? props.value
      : props.defaultValue != null
        ? props.defaultValue
        : opts[opts.length - 1],
  );
  var val = ctrl ? props.value : st[0];
  var reduced = useReduced();
  var layoutId = React.useId();

  function select(o) {
    if (!ctrl) st[1](o);
    if (props.onChange) props.onChange(o);
  }

  function onKeyDown(e) {
    var cur = opts.indexOf(val);
    if (cur < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      var next = opts[(cur + 1) % opts.length];
      select(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      var prev = opts[(cur - 1 + opts.length) % opts.length];
      select(prev);
    }
  }

  return (
    <div
      className={cx("vl-seg", props.className)}
      role="radiogroup"
      aria-label={props.label || "Segmented options"}
      onKeyDown={onKeyDown}
    >
      {opts.map(function (o) {
        var on = o === val;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            className={cx("vl-seg-opt", on && "is-on")}
            onClick={function () {
              select(o);
            }}
          >
            {on ? (
              <motion.span
                layoutId={layoutId}
                className="vl-seg-pill"
                transition={reduced ? NONE : GLIDE}
              />
            ) : null}
            <span className="vl-seg-label">{o}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Input ---------- */
