import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- Toggle ---------- */
export function Toggle(props) {
  var ctrl = props.checked !== undefined;
  var st = useState(!!props.defaultChecked);
  var on = ctrl ? props.checked : st[0];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={props.disabled}
      title={props.title}
      className={cx("vl-toggle", on && "is-on")}
      onClick={function () {
        if (props.disabled) return;
        if (!ctrl) st[1](!on);
        if (props.onChange) props.onChange(!on);
      }}
    >
      <span className="vl-toggle-track" aria-hidden="true">
        <span className="vl-toggle-thumb" />
      </span>
      {props.icon ? <Icon name={props.icon} size={14} /> : null}
      <span>{props.label}</span>
      {props.count != null ? (
        <span className="vl-check-count">{props.count}</span>
      ) : null}
    </button>
  );
}

/* ---------- SegmentedControl ---------- */
