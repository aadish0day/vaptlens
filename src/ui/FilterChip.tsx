import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- FilterChip ---------- */
export function FilterChip(props) {
  return (
    <span
      className={cx(
        "vl-chip",
        props.severity && "vl-chip-sev vl-sevline-" + props.severity,
      )}
    >
      {props.field ? (
        <span className="vl-chip-field">{props.field}</span>
      ) : null}
      <span className="vl-chip-value">{props.value}</span>
      <button
        type="button"
        className="vl-chip-x"
        aria-label={
          "Remove filter " +
          (props.field ? props.field + ": " : "") +
          props.value
        }
        onClick={props.onRemove}
      >
        <Icon name="x" size={12} strokeWidth={2.5} />
      </button>
    </span>
  );
}

/* ---------- KpiCard ---------- */
