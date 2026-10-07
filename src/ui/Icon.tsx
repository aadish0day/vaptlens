import React from "react";
import { cx } from "@/ui/core";
import { ICONS } from "@/ui/icons";
import "@/ui/icons-extra";

const h = React.createElement;

export function Icon(props) {
  var size = props.size || 16;
  var parts = ICONS[props.name] || [];
  return (
    <svg
      className={cx("vl-icon", props.className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {parts.map(function (p, i) {
        return h(
          p[0],
          Object.assign(
            {
              key: i,
            },
            p[1],
          ),
        );
      })}
    </svg>
  );
}

/* ---------- Logo ---------- */
