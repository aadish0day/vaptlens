import React from "react";
import { Icon } from "@/ui/Icon";
import { SeverityMarker } from "@/ui/SeverityMarker";
import { SEV_LABEL, SEV_ORDER } from "@/ui/core";

/* ---------- SlaBreachCard (SlaBreachKpiWidget) ---------- */
export function SlaBreachCard(props) {
  var b = props.breakdown || {};
  var total =
    props.total != null
      ? props.total
      : SEV_ORDER.reduce(function (a, s) {
          return a + (b[s] || 0);
        }, 0);
  return (
    <div className="vl-kpi vl-slab">
      <div className="vl-kpi-head">
        <span className="vl-label">SLA breached</span>
        <Icon name="clock" size={16} />
      </div>
      <div
        className="vl-kpi-value"
        style={{
          color: total ? "var(--status-danger)" : "var(--status-ok)",
        }}
      >
        {total}
      </div>
      <div className="vl-slab-list">
        {SEV_ORDER.map(function (s) {
          return (
            <button
              key={s}
              type="button"
              className="vl-slab-row"
              disabled={!b[s]}
              onClick={function () {
                if (props.onSelect) props.onSelect(s);
              }}
            >
              <SeverityMarker severity={s} />
              <span>{SEV_LABEL[s]}</span>
              <span className="vl-slab-days">
                {
                  {
                    critical: "14d",
                    high: "30d",
                    medium: "90d",
                    low: "180d",
                    info: "360d",
                  }[s]
                }
              </span>
              <span className="vl-slab-n">{b[s] || 0}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- SlaProjectionTable (C.H.I.) ---------- */
