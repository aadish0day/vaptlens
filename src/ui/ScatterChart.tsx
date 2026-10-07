import React from "react";
import { ChartLegend } from "@/ui/ChartLegend";
import { SeverityMarker } from "@/ui/SeverityMarker";
import { SEV_LABEL, SEV_ORDER, cx, useSel } from "@/ui/core";

/* ---------- ScatterChart ---------- */
export function ScatterChart(props) {
  var cats = props.categories || [],
    pts = props.points || [];
  var W = props.width || 480,
    rowH = 30,
    padL = 132,
    padT = 8,
    padB = 28,
    H = padT + cats.length * rowH + padB;
  function X(v) {
    return padL + ((W - padL - 12) * v) / 10;
  }
  var sel = useSel(props);
  return (
    <div className="vl-chart">
      <svg
        viewBox={"0 0 " + W + " " + H}
        width="100%"
        role="img"
        aria-label={props.label || "CVSS scatter"}
      >
        {[0, 2, 4, 6, 8, 10].map(function (t) {
          return (
            <g key={t}>
              <line
                className="vl-grid"
                x1={X(t)}
                x2={X(t)}
                y1={padT}
                y2={H - padB}
              />
              <text className="vl-axis" x={X(t)} y={H - 10} textAnchor="middle">
                {t}
              </text>
            </g>
          );
        })}
        {[4, 7, 9].map(function (t) {
          return (
            <line
              key={"b" + t}
              className="vl-band"
              x1={X(t)}
              x2={X(t)}
              y1={padT}
              y2={H - padB}
            />
          );
        })}
        {cats.map(function (c, i) {
          return (
            <text
              key={c}
              className="vl-axis vl-axis-mono"
              x={padL - 10}
              y={padT + i * rowH + rowH / 2 + 4}
              textAnchor="end"
            >
              {c}
            </text>
          );
        })}
        {pts.map(function (p, i) {
          var cy =
            padT +
            cats.indexOf(p.category) * rowH +
            rowH / 2 +
            ((i % 3) - 1) * 5;
          return (
            <g
              key={i}
              transform={"translate(" + X(p.cvss) + " " + cy + ")"}
              className={cx(
                "vl-pt",
                "vl-fg-" + p.severity,
                sel[0] != null && sel[0] !== p.category && "is-dim",
              )}
              onClick={function () {
                sel[1](p.category);
              }}
            >
              <g transform="translate(-5 -5)">
                <SeverityMarker severity={p.severity} size={10} />
              </g>
              <title>{p.category + " · " + p.name + " · CVSS " + p.cvss}</title>
            </g>
          );
        })}
      </svg>
      <ChartLegend
        items={SEV_ORDER.map(function (s) {
          return {
            label: SEV_LABEL[s],
            severity: s,
          };
        })}
      />
    </div>
  );
}

/* ---------- SlaBreachCard (SlaBreachKpiWidget) ---------- */
