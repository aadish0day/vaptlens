import React from "react";
import { cx } from "@/ui/core";

/* ---------- Tooltip ---------- */
export function Tooltip(props) {
  return (
    <span className="vl-tip-wrap">
      {props.children}
      <span
        className={cx("vl-tip", props.side === "bottom" && "is-bottom")}
        role="tooltip"
      >
        {props.content}
      </span>
    </span>
  );
}

/* ---------- Checkbox ---------- */
