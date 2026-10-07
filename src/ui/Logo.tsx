import React from "react";

/* ---------- Logo ---------- */
export function Logo(props) {
  var size = props.size || 24;
  var mark = (
    <svg
      className="vl-logo-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden={props.wordmark === false ? undefined : "true"}
      role={props.wordmark === false ? "img" : undefined}
      aria-label={props.wordmark === false ? "VAPTLens" : undefined}
    >
      <circle
        cx={16}
        cy={16}
        r={10.5}
        stroke="currentColor"
        strokeWidth={2.5}
      />
      <circle cx={16} cy={16} r={4} fill="currentColor" />
      <path
        d="M16 2v4.5M16 25.5V30M2 16h4.5M25.5 16H30"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
  if (props.wordmark === false) return <span className="vl-logo">{mark}</span>;
  return (
    <span
      className="vl-logo"
      style={{
        fontSize: Math.round(size * 0.75) + "px",
      }}
    >
      {mark}
      <span className="vl-logo-word">
        VAPT<span className="vl-logo-lens">Lens</span>
      </span>
    </span>
  );
}

/* ---------- Button (with RestrictedButton behaviour) ---------- */
