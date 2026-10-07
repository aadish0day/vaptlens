import React from "react";
import { ChartLegend } from "@/ui/ChartLegend";
import { chartFrame, cx, fit, kbd, seriesColor, useSel } from "@/ui/core";

/* ---------- StackedBarChart ---------- */
export function StackedBarChart(props) {
  var labels = props.labels || [],
    series = props.series || [];
  var W = props.width || 480,
    H = props.height || 200,
    padL = 32,
    padB = 24,
    padT = 8;
  var totals = labels.map(function (_, i) {
    return series.reduce(function (a, s) {
      return a + (s.values[i] || 0);
    }, 0);
  });
  var nice = Math.ceil(Math.max.apply(null, totals.concat([1])) / 4) * 4;
  var bw = (W - padL) / labels.length,
    w = Math.min(48, bw * 0.6),
    sel = useSel(props);
  return (
    <div className="vl-chart">
      <svg
        viewBox={"0 0 " + W + " " + H}
        width="100%"
        role="img"
        aria-label={props.label || "Stacked bar chart"}
      >
        {chartFrame(W, H, padL, padB, padT, nice, [0, 0.25, 0.5, 0.75, 1])}
        {labels.map(function (l, i) {
          var x = padL + i * bw + (bw - w) / 2,
            acc = 0;
          return (
            <g
              key={l}
              className={cx(
                "vl-bar",
                sel[0] != null && sel[0] !== l && "is-dim",
                sel[0] === l && "is-sel",
              )}
              onClick={function () {
                sel[1](l);
              }}
              onKeyDown={kbd(function () {
                sel[1](l);
              })}
              role={props.static ? null : "button"}
              tabIndex={props.static ? null : 0}
              aria-pressed={sel[0] === l}
            >
              <title>
                {l +
                  ": " +
                  series
                    .map(function (s) {
                      return s.label + " " + (s.values[i] || 0);
                    })
                    .join(", ")}
              </title>
              {series.map(function (s, k) {
                var v = s.values[i] || 0,
                  hh = ((H - padB - padT) * v) / nice,
                  y = H - padB - acc - hh;
                acc += hh;
                return v ? (
                  <rect
                    key={k}
                    x={x}
                    y={y}
                    width={w}
                    height={Math.max(0, hh - 1)}
                    fill={seriesColor(s, k)}
                    rx={k === series.length - 1 ? 3 : 0}
                  />
                ) : null;
              })}
              <text
                className="vl-axis"
                x={x + w / 2}
                y={H - 8}
                textAnchor="middle"
              >
                {fit(String(l), bw - 4)}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartLegend
        items={series.map(function (s, k) {
          return {
            label: s.label,
            severity: s.severity,
            color: s.severity ? null : seriesColor(s, k),
          };
        })}
      />
    </div>
  );
}

/* ---------- RadarChart ---------- */
