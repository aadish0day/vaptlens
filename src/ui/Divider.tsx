import React from "react";

/* ---------- Divider (horizontal rule, optional centred label) ---------- */
export function Divider(props) {
  return props.label ? (
    <div
      className="vl-divider has-label"
      role="separator"
      aria-label={props.label}
    >
      <span>{props.label}</span>
    </div>
  ) : (
    <hr className="vl-divider" />
  );
}
