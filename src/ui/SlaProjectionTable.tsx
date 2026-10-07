import React from "react";
import { SeverityBadge } from "@/ui/SeverityBadge";

/* ---------- SlaProjectionTable (C.H.I.) ---------- */
export function SlaProjectionTable(props) {
  var rows = props.rows || [];
  return (
    <div className="vl-table-wrap">
      <table className="vl-table vl-chi">
        <thead>
          <tr>
            {[
              "Severity",
              "SLA",
              "Active",
              "Breached",
              "At risk ≤ 7d",
              "Avg days left",
            ].map(function (c, i) {
              return (
                <th key={c} className={i > 1 ? "is-num" : null}>
                  <span className="vl-th-btn">{c}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(function (r) {
            return (
              <tr key={r.severity}>
                <td>
                  <SeverityBadge severity={r.severity} />
                </td>
                <td className="is-mono vl-td-muted">
                  {r.sla ||
                    {
                      critical: "14d",
                      high: "30d",
                      medium: "90d",
                      low: "180d",
                      info: "360d",
                    }[r.severity]}
                </td>
                <td className="is-mono is-num">{r.active}</td>
                <td className="is-mono is-num">
                  {r.breached ? (
                    <span className="vl-fg-status-danger">{r.breached}</span>
                  ) : (
                    "0"
                  )}
                </td>
                <td className="is-mono is-num">
                  {r.atRisk ? (
                    <span className="vl-fg-status-warn">{r.atRisk}</span>
                  ) : (
                    "0"
                  )}
                </td>
                <td className="is-mono is-num">
                  {r.avgDays < 0 ? (
                    <span className="vl-fg-status-danger">
                      {"−" + Math.abs(r.avgDays)}
                    </span>
                  ) : (
                    r.avgDays
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- ExposureRegistry ---------- */
