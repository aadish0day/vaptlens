import React, { useState } from "react";
import { ChartLegend } from "@/ui/ChartLegend";
import { chartFrame, seriesColor } from "@/ui/core";

const h = React.createElement;

/* ---------- LineChart (line + area) ---------- */
export function LineChart(props) {
  var labels = props.labels || [],
    series = props.series || [];
  var W = props.width || 480,
    H = props.height || 200,
    padL = 32,
    padB = 24,
    padT = 8;
  var mx = 1;
  series.forEach(function (s) {
    s.values.forEach(function (v) {
      if (v > mx) mx = v;
    });
  });
  var nice = Math.ceil(mx / 4) * 4 || 4;
  var hov = useState(null);
  function X(i) {
    return padL + 8 + (i * (W - padL - 16)) / Math.max(1, labels.length - 1);
  }
  function Y(v) {
    return padT + (H - padB - padT) * (1 - v / nice);
  }
  function path(vals) {
    // monotone-ish smoothing
    /* null / undefined values are gaps: the line breaks and resumes */
    return vals
      .map(function (v, i) {
        if (v == null) return "";
        var pv = i ? vals[i - 1] : null;
        if (pv == null) return "M" + X(i) + " " + Y(v);
        var x0 = X(i - 1),
          y0 = Y(pv),
          x1 = X(i),
          y1 = Y(v),
          cx = (x0 + x1) / 2;
        return "C" + cx + " " + y0 + " " + cx + " " + y1 + " " + x1 + " " + y1;
      })
      .join("");
  }
  return (
    <div className="vl-chart">
      <svg
        viewBox={"0 0 " + W + " " + H}
        width="100%"
        role="img"
        aria-label={props.label || "Line chart"}
        onMouseLeave={function () {
          hov[1](null);
        }}
      >
        <defs>
          {series.map(function (s, i) {
            return h(
              "linearGradient",
              {
                key: i,
                id: "vl-ag-" + i + (props.id || ""),
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 1,
              },
              <stop
                offset="0%"
                stopColor={seriesColor(s, i)}
                stopOpacity={0.28}
              />,
              <stop
                offset="100%"
                stopColor={seriesColor(s, i)}
                stopOpacity={0}
              />,
            );
          })}
        </defs>
        {chartFrame(W, H, padL, padB, padT, nice, [0, 0.25, 0.5, 0.75, 1])}
        {labels.map(function (l, i) {
          return (
            <text
              key={"x" + i}
              className="vl-axis"
              x={X(i)}
              y={H - 8}
              textAnchor="middle"
            >
              {l}
            </text>
          );
        })}
        {hov[0] != null ? (
          <line
            className="vl-crosshair"
            x1={X(hov[0])}
            x2={X(hov[0])}
            y1={padT}
            y2={H - padB}
          />
        ) : null}
        {series.map(function (s, i) {
          var d = path(s.values);
          return (
            <g key={s.label}>
              {props.area ? (
                <path
                  d={
                    d +
                    "L" +
                    X(s.values.length - 1) +
                    " " +
                    (H - padB) +
                    "L" +
                    X(0) +
                    " " +
                    (H - padB) +
                    "Z"
                  }
                  fill={"url(#vl-ag-" + i + (props.id || "") + ")"}
                />
              ) : null}
              <path
                d={d}
                fill="none"
                stroke={seriesColor(s, i)}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "5 4" : null}
              />
              {s.values.map(function (v, j) {
                return v == null ? null : (
                  <circle
                    key={j}
                    cx={X(j)}
                    cy={Y(v)}
                    r={hov[0] === j ? 4.5 : 2.5}
                    fill={seriesColor(s, i)}
                    stroke="var(--surface-100)"
                    strokeWidth={1.5}
                  />
                );
              })}
            </g>
          );
        })}
        {labels.map(function (l, i) {
          return (
            <rect
              key={"hit" + i}
              x={X(i) - 12}
              y={padT}
              width={24}
              height={H - padB - padT}
              fill="transparent"
              onMouseEnter={function () {
                hov[1](i);
              }}
            />
          );
        })}
      </svg>
      <ChartLegend
        items={series.map(function (s, i) {
          return {
            label: s.label,
            severity: s.severity,
            color: s.severity ? null : seriesColor(s, i),
            value:
              hov[0] != null
                ? s.values[hov[0]]
                : s.values
                    .filter(function (v) {
                      return v != null;
                    })
                    .slice(-1)[0],
          };
        })}
      />
    </div>
  );
}

/* ---------- StackedBarChart ---------- */
