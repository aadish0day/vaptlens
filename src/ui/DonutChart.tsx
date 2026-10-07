import React from "react";
import { ChartLegend } from "@/ui/ChartLegend";
import { cx, useSel } from "@/ui/core";

export function DonutChart(props) {
  var data = props.data || [];
  var total =
    data.reduce(function (a, d) {
      return a + d.value;
    }, 0) || 1;
  var R = 64,
    r = R * 0.58,
    C = 80,
    acc = 0;
  function arc(a0, a1) {
    var p = function (a, rad) {
      return [C + rad * Math.sin(a), C - rad * Math.cos(a)];
    };
    var large = a1 - a0 > Math.PI ? 1 : 0,
      o0 = p(a0, R),
      o1 = p(a1, R),
      i1 = p(a1, r),
      i0 = p(a0, r);
    return (
      "M" +
      o0 +
      "A" +
      R +
      "," +
      R +
      " 0 " +
      large +
      " 1 " +
      o1 +
      "L" +
      i1 +
      "A" +
      r +
      "," +
      r +
      " 0 " +
      large +
      " 0 " +
      i0 +
      "Z"
    );
  }
  var gap = 0.035,
    sel = useSel(props);
  return (
    <div className="vl-chart vl-donut">
      <svg
        viewBox="0 0 160 160"
        width={160}
        height={160}
        role="img"
        aria-label={props.label || "Donut chart"}
      >
        {data.map(function (d) {
          var a0 = (acc / total) * Math.PI * 2,
            a1 = ((acc + d.value) / total) * Math.PI * 2;
          acc += d.value;
          return (
            <path
              key={d.label}
              d={arc(a0 + gap / 2, Math.max(a0 + gap / 2 + 0.01, a1 - gap / 2))}
              className={cx(
                "vl-slice",
                d.severity && "vl-fill-" + d.severity,
                sel[0] != null && sel[0] !== d.label && "is-dim",
                sel[0] === d.label && "is-sel",
              )}
              style={
                d.color
                  ? {
                      fill: d.color,
                    }
                  : null
              }
              onClick={function () {
                sel[1](d.label);
              }}
              role={props.static ? null : "button"}
              tabIndex={props.static ? null : 0}
              aria-label={d.label + ": " + d.value}
              onKeyDown={function (e) {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  sel[1](d.label);
                }
              }}
            >
              <title>{d.label + ": " + d.value}</title>
            </path>
          );
        })}
        <text className="vl-donut-total" x={C} y={C + 4} textAnchor="middle">
          {props.total != null ? props.total : total}
        </text>
        <text className="vl-axis" x={C} y={C + 20} textAnchor="middle">
          {props.totalLabel || "active"}
        </text>
      </svg>
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
    </div>
  );
}
