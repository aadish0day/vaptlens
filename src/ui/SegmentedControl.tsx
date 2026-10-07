import React, { useState } from "react";
import { cx } from "@/ui/core";

/* ---------- SegmentedControl ---------- */
export function SegmentedControl(props) {
  var opts = props.options || [
    "7 days",
    "15 days",
    "30 days",
    "6 months",
    "All",
  ];
  var st = useState(
    props.value != null
      ? props.value
      : props.defaultValue != null
        ? props.defaultValue
        : opts[opts.length - 1],
  );
  var val = props.value != null ? props.value : st[0];
  return (
    <div
      className="vl-seg"
      role="radiogroup"
      aria-label={props.label || "Date range"}
    >
      {opts.map(function (o) {
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={o === val}
            className={cx("vl-seg-opt", o === val && "is-on")}
            onClick={function () {
              st[1](o);
              if (props.onChange) props.onChange(o);
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Input ---------- */
