import React from "react";
import { cx } from "@/ui/core";

/* ---------- ColumnMapRow ---------- */
export function ColumnMapRow(props) {
  var mapped = !!props.header;
  return (
    <div className={cx("vl-cmap", !mapped && props.required && "is-missing")}>
      <div className="vl-cmap-field">
        <span className="vl-mono">{props.field}</span>
        {props.required ? <span className="vl-cmap-req">required</span> : null}
      </div>
      <div className="vl-cmap-pick">
        <select
          className="vl-cmap-select"
          aria-label={"Column for " + props.field}
          value={props.onChange ? props.header || "" : undefined}
          defaultValue={props.onChange ? undefined : props.header || ""}
          onChange={function (e) {
            if (props.onChange) props.onChange(e.target.value || null);
          }}
        >
          <option value="">Not mapped</option>
          {(props.options || []).map(function (o) {
            return (
              <option key={o} value={o}>
                {o}
              </option>
            );
          })}
        </select>
      </div>
      <div className="vl-cmap-sample">
        {mapped
          ? props.sample
          : props.required
            ? "Map a column to continue"
            : "Optional"}
      </div>
    </div>
  );
}

/* ---------- Tabs ---------- */
