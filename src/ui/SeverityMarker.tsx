import React from "react";
import { SEV_LABEL } from "@/ui/core";

/* ---------- SeverityMarker ---------- */
export function SeverityMarker(props) {
  var s = props.severity || "info";
  var size = props.size || 10;
  var shapes = {
    critical: <path d="M5 0 10 5 5 10 0 5Z" />,
    high: <path d="M5 0.5 10 9.5H0Z" />,
    medium: <circle cx={5} cy={5} r={4.5} />,
    low: <path d="M0 0.5H10L5 9.5Z" />,
    info: (
      <circle
        cx={5}
        cy={5}
        r={3.75}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    ),
  };
  return (
    <svg
      className={"vl-marker vl-fg-" + s}
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="currentColor"
      role={props.label ? "img" : undefined}
      aria-label={props.label ? SEV_LABEL[s] : undefined}
      aria-hidden={props.label ? undefined : "true"}
    >
      {shapes[s]}
    </svg>
  );
}

/* ---------- Tooltip ---------- */
