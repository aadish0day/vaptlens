import React from "react";
import { ChartLegend } from "@/ui/ChartLegend";
import { cx, fit, useSel } from "@/ui/core";

export function BarChart(props) {
  var data = props.data || [];
  var H = props.height || 180,
    W = props.width || 420,
    padL = 32,
    padB = 24,
    padT = 8;
  var max = Math.max.apply(
    null,
    data
      .map(function (d) {
        return d.value;
      })
      .concat([1]),
  );
  var nice = Math.ceil(max / 5) * 5,
    bw = (W - padL) / data.length;
  var sel = useSel(props),
    rot = data.length > 8;
  if (rot) {
    padB = 64;
    H = (props.height || 180) + 40;
  }
  var ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="vl-chart">
      <svg
        viewBox={"0 0 " + W + " " + H}
        width="100%"
        role="img"
        aria-label={props.label || "Bar chart"}
      >
        {ticks.map(function (t) {
          var y = padT + (H - padB - padT) * (1 - t);
          return (
            <g key={t}>
              <line className="vl-grid" x1={padL} x2={W} y1={y} y2={y} />
              <text className="vl-axis" x={padL - 6} y={y + 4} textAnchor="end">
                {Math.round(nice * t)}
              </text>
            </g>
          );
        })}
        {data.map(function (d, i) {
          var bh = ((H - padB - padT) * d.value) / nice,
            x = padL + i * bw + bw * 0.18,
            w = Math.min(48, bw * 0.64);
          var dim = sel[0] != null && sel[0] !== d.label,
            lx = x + w / 2;
          return (
            <g
              key={d.label}
              className={cx(
                "vl-bar",
                dim && "is-dim",
                sel[0] === d.label && "is-sel",
              )}
              onClick={function () {
                sel[1](d.label);
              }}
              role={props.static ? null : "button"}
              tabIndex={props.static ? null : 0}
              aria-pressed={sel[0] === d.label}
              aria-label={d.label + ": " + d.value}
              onKeyDown={function (e) {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  sel[1](d.label);
                }
              }}
            >
              <rect
                x={x}
                y={H - padB - bh}
                width={w}
                height={Math.max(bh, d.value ? 1 : 0)}
                rx={3}
                className={d.severity ? "vl-fill-" + d.severity : null}
                style={
                  d.color
                    ? {
                        fill: d.color,
                      }
                    : null
                }
              />
              <title>{d.label + ": " + d.value}</title>
              {rot ? (
                <text
                  className="vl-axis"
                  x={lx}
                  y={H - padB + 12}
                  textAnchor="end"
                  transform={"rotate(-35 " + lx + " " + (H - padB + 12) + ")"}
                >
                  {fit(String(d.label), 90)}
                </text>
              ) : (
                <text className="vl-axis" x={lx} y={H - 8} textAnchor="middle">
                  {fit(String(d.label), bw - 4)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {props.legend ? (
        <ChartLegend
          items={data.map(function (d) {
            return {
              label: d.label,
              severity: d.severity,
              color: d.color,
              value: d.value,
            };
          })}
        />
      ) : null}
    </div>
  );
}
