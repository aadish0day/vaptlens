import React from "react";

/* Original line illustrations for empty / error states. Colours come from tokens so they
   follow every theme: --ill-line (strokes), --ill-fill (soft shapes), --ill-accent (one highlight). */
var S = {
  fill: "none",
  stroke: "var(--ill-line)",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
var F = { fill: "var(--ill-fill)" };
var A = {
  fill: "none",
  stroke: "var(--ill-accent)",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

var ART: Record<string, any> = {
  "no-scans": (
    <g>
      <rect x="22" y="14" width="76" height="64" rx="8" {...F} />
      <rect x="22" y="14" width="76" height="64" rx="8" {...S} />
      <path d="M22 30h76" {...S} />
      <circle cx="31" cy="22" r="2" fill="var(--ill-line)" />
      <circle cx="38" cy="22" r="2" fill="var(--ill-line)" />
      <path d="M60 44v20" {...A} />
      <path d="m52 52 8-8 8 8" {...A} />
      <path d="M34 70h52" {...S} strokeDasharray="3 5" />
    </g>
  ),
  "no-results": (
    <g>
      <rect x="18" y="20" width="60" height="58" rx="6" {...F} />
      <path d="M28 34h40M28 46h28M28 58h34" {...S} />
      <circle cx="78" cy="58" r="16" fill="var(--ill-bg)" {...S} />
      <path d="m90 70 12 12" {...S} strokeWidth="3" />
      <path d="m73 53 10 10M83 53 73 63" {...A} />
    </g>
  ),
  "all-clear": (
    <g>
      <path d="M60 10s26 8 26 8v22c0 22-26 36-26 36S34 62 34 40V18z" {...F} />
      <path d="M60 10s26 8 26 8v22c0 22-26 36-26 36S34 62 34 40V18z" {...S} />
      <path d="m48 42 9 9 16-18" {...A} />
      <path
        d="M14 70h18M88 70h18M20 80h10M92 80h8"
        {...S}
        strokeDasharray="2 6"
      />
    </g>
  ),
  "not-found": (
    <g>
      <circle cx="60" cy="46" r="32" {...F} />
      <path d="M44 34v8M76 34v8" {...S} strokeWidth="3" />
      <path d="M46 62c8-6 20-6 28 0" {...S} />
      <path d="M18 84h84" {...S} strokeDasharray="4 6" />
      <text
        x="60"
        y="94"
        textAnchor="middle"
        fill="var(--ill-line)"
        style={{ font: "600 9px var(--font-mono)" }}
      >
        404
      </text>
    </g>
  ),
  forbidden: (
    <g>
      <rect x="36" y="40" width="48" height="40" rx="6" {...F} />
      <rect x="36" y="40" width="48" height="40" rx="6" {...S} />
      <path d="M46 40V30a14 14 0 0 1 28 0v10" {...S} />
      <circle cx="60" cy="58" r="4" {...A} />
      <path d="M60 62v6" {...A} />
    </g>
  ),
  error: (
    <g>
      <rect x="20" y="18" width="80" height="54" rx="6" {...F} />
      <rect x="20" y="18" width="80" height="54" rx="6" {...S} />
      <path d="M44 84h32M60 72v12" {...S} />
      <path d="M60 32 46 58h28z" {...A} />
      <path d="M60 42v6M60 52v.5" {...A} />
    </g>
  ),
  offline: (
    <g>
      <path
        d="M30 62a14 14 0 0 1 2-28 20 20 0 0 1 38-6 14 14 0 0 1 20 12 11 11 0 0 1-2 22H36"
        {...F}
      />
      <path
        d="M30 62a14 14 0 0 1 2-28 20 20 0 0 1 38-6 14 14 0 0 1 20 12 11 11 0 0 1-2 22H36"
        {...S}
      />
      <path d="m24 18 72 66" {...A} />
    </g>
  ),
  "inbox-zero": (
    <g>
      <path
        d="M22 50 34 22h52l12 28v24a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z"
        {...F}
      />
      <path
        d="M22 50 34 22h52l12 28v24a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z"
        {...S}
      />
      <path d="M22 50h22l4 8h24l4-8h22" {...S} />
      <path d="m50 36 7 7 13-13" {...A} />
    </g>
  ),
  upload: (
    <g>
      <rect x="16" y="16" width="88" height="66" rx="10" {...F} />
      <rect
        x="16"
        y="16"
        width="88"
        height="66"
        rx="10"
        {...S}
        strokeDasharray="6 6"
      />
      <path d="M48 30h18l8 8v24H48z" fill="var(--ill-bg)" {...S} />
      <path d="M66 30v8h8" {...S} />
      <path d="M61 56V44m-5 5 5-5 5 5" {...A} />
    </g>
  ),
  locked: (
    <g>
      <circle cx="60" cy="48" r="34" {...F} />
      <rect x="44" y="46" width="32" height="26" rx="4" {...S} />
      <path d="M50 46v-8a10 10 0 0 1 20 0v8" {...S} />
      <path d="M60 56v6" {...A} />
    </g>
  ),
};
export var ILLUSTRATIONS = Object.keys(ART);

/* ---------- Illustration ---------- */
export function Illustration(props) {
  var art = ART[props.name] || ART["no-results"];
  var w = props.size || 120;
  return (
    <svg
      className={"vl-ill" + (props.className ? " " + props.className : "")}
      width={w}
      height={(w * 96) / 120}
      viewBox="0 0 120 96"
      role={props.title ? "img" : undefined}
      aria-hidden={props.title ? undefined : true}
      aria-label={props.title}
    >
      {art}
    </svg>
  );
}
