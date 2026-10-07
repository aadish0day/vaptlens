import React from "react";
import { SeverityMarker } from "@/ui/SeverityMarker";

/* ---------- Charts (token-styled SVG; the app uses Recharts with the same rules) ---------- */
export function ChartLegend(props) {
  return (
    <div className="vl-legend">
      {props.items.map(function (it) {
        return (
          <span key={it.label} className="vl-legend-item">
            {it.severity ? (
              <SeverityMarker severity={it.severity} />
            ) : (
              <span
                className="vl-legend-sw"
                style={{
                  background: it.color,
                }}
              />
            )}
            {it.label}
            {it.value != null ? (
              <span className="vl-legend-v">{it.value}</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
