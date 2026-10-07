import React from "react";
import { ChartLegend } from "@/ui/ChartLegend";
import { seriesColor } from "@/ui/core";

/* ---------- RadarChart ---------- */
export function RadarChart(props) {
  var axes = props.axes || [],
    series = props.series || [];
  var C = 110,
    R = 80,
    n = axes.length || 1,
    max = props.max || 10;
  function pt(i, v) {
    var a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [
      C + ((R * v) / max) * Math.cos(a),
      C + ((R * v) / max) * Math.sin(a),
    ];
  }
  var rings = [0.25, 0.5, 0.75, 1];
  return (
    <div className="vl-chart vl-donut">
      <svg
        viewBox="-50 -6 320 232"
        width={320}
        height={232}
        role="img"
        aria-label={props.label || "Radar chart"}
      >
        {rings.map(function (r) {
          return (
            <polygon
              key={r}
              className="vl-radar-ring"
              points={axes
                .map(function (_, i) {
                  return pt(i, max * r).join(",");
                })
                .join(" ")}
            />
          );
        })}
        {axes.map(function (a, i) {
          var p = pt(i, max),
            q = pt(i, max * 1.22);
          return (
            <g key={a}>
              <line className="vl-grid" x1={C} y1={C} x2={p[0]} y2={p[1]} />
              <text
                className="vl-axis"
                x={q[0]}
                y={q[1] + 4}
                textAnchor={
                  Math.abs(q[0] - C) < 8 ? "middle" : q[0] > C ? "start" : "end"
                }
              >
                {a}
              </text>
            </g>
          );
        })}
        {series.map(function (s, k) {
          var pts = s.values.map(function (v, i) {
            return pt(i, v);
          });
          return (
            <g key={s.label}>
              <polygon
                points={pts
                  .map(function (p) {
                    return p.join(",");
                  })
                  .join(" ")}
                fill={seriesColor(s, k)}
                fillOpacity={0.18}
                stroke={seriesColor(s, k)}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "5 4" : null}
              />
              {pts.map(function (p, i) {
                return (
                  <circle
                    key={i}
                    cx={p[0]}
                    cy={p[1]}
                    r={3}
                    fill={seriesColor(s, k)}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <ChartLegend
        items={series.map(function (s, k) {
          return {
            label: s.label,
            color: seriesColor(s, k),
          };
        })}
      />
    </div>
  );
}

/* ---------- Treemap (squarified, 1 level) ---------- */
