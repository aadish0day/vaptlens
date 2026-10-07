import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@/ui/Icon";
import { SeverityMarker } from "@/ui/SeverityMarker";
import { cx } from "@/ui/core";

/* ---------- Checkbox ---------- */
export function Checkbox(props) {
  var ctrl = props.checked !== undefined;
  var st = useState(!!props.defaultChecked);
  var checked = ctrl ? props.checked : st[0];
  var ref = useRef(null);
  useEffect(function () {
    if (ref.current) ref.current.indeterminate = !!props.indeterminate;
  });
  return (
    <label className={cx("vl-check", props.disabled && "is-disabled")}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={props.disabled}
        onChange={function (e) {
          if (!ctrl) st[1](e.target.checked);
          if (props.onChange) props.onChange(e.target.checked);
        }}
      />
      <span className="vl-check-box" aria-hidden="true">
        <Icon
          name={props.indeterminate ? "minus" : "check"}
          size={12}
          strokeWidth={3}
        />
      </span>
      {props.severity ? <SeverityMarker severity={props.severity} /> : null}
      <span className="vl-check-label">{props.label}</span>
      {props.count != null ? (
        <span className="vl-check-count">{props.count}</span>
      ) : null}
    </label>
  );
}

/* ---------- Toggle ---------- */
