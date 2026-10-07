import React from "react";

/* ---------- Sparkline ---------- */
export function Sparkline(props) {
  var v = props.values || [];
  var W = props.width || 96,
    H = props.height || 24;
  var mx = Math.max.apply(null, v.concat([1])),
    mn = Math.min.apply(null, v.concat([0]));
  var pts = v.map(function (y, i) {
    return [
      (i / Math.max(1, v.length - 1)) * (W - 4) + 2,
      H - 2 - ((y - mn) / Math.max(1, mx - mn)) * (H - 4),
    ];
  });
  var d = pts
    .map(function (p, i) {
      return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
    })
    .join("");
  var last = pts[pts.length - 1];
  return (
    <svg
      className={"vl-spark vl-spark-" + (props.tone || "lens")}
      width={W}
      height={H}
      viewBox={"0 0 " + W + " " + H}
      role="img"
      aria-label={props.label || "Trend: " + v.join(", ")}
    >
      <path
        d={d}
        fill="none"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last ? <circle cx={last[0]} cy={last[1]} r={2.5} /> : null}
    </svg>
  );
}

/* ---------- SlaTrend ---------- */
