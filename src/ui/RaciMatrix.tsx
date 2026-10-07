import React from "react";
import { RACI, TEAMS, cx } from "@/ui/core";

/* ---------- RaciMatrix ---------- */
export function RaciMatrix(props) {
  var data = props.data || {};
  var max = 1;
  TEAMS.forEach(function (tm) {
    RACI.forEach(function (x) {
      var v = (data[tm] || {})[x[0]] || 0;
      if (v > max) max = v;
    });
  });
  return (
    <table className="vl-raci">
      <thead>
        <tr>
          <th>Team</th>
          {RACI.map(function (x) {
            return (
              <th key={x[0]}>
                <b>{x[0]}</b> {x[1]}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {TEAMS.map(function (tm, i) {
          return (
            <tr key={tm}>
              <th scope="row">
                <span
                  className="vl-team-dot"
                  style={{
                    background: "var(--chart-" + (i + 1) + ")",
                  }}
                />
                {tm}
              </th>
              {RACI.map(function (x) {
                var v = (data[tm] || {})[x[0]] || 0;
                var step = v
                  ? [1, 2, 4, 5][Math.min(3, Math.floor((4 * v) / max))]
                  : 0;
                return (
                  <td
                    key={x[0]}
                    className={cx(
                      "vl-raci-cell",
                      "heat-" + step,
                      step >= 4 && "is-strong",
                    )}
                  >
                    {v || "·"}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ---------- Sparkline ---------- */
