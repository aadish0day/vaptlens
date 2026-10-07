import React from "react";

/* ---------- SlaTrend ---------- */
export function SlaTrend(props) {
  var m = props.months || [];
  var cur = m.length ? m[m.length - 1].pct : 0;
  function band(p) {
    return p >= 80 ? "ok" : p >= 50 ? "warn" : "danger";
  }
  return (
    <div className="vl-slatrend">
      <div className="vl-slatrend-head">
        <span className="vl-label">{props.label || "SLA compliance"}</span>
        <span className={"vl-slatrend-val vl-fg-status-" + band(cur)}>
          {cur + "%"}
        </span>
        <span className="vl-slatrend-band">
          {band(cur) === "ok"
            ? "On target"
            : band(cur) === "warn"
              ? "Below target"
              : "Critical"}
        </span>
      </div>
      <div className="vl-slatrend-bars">
        {m.map(function (x) {
          return (
            <div
              key={x.label}
              className="vl-slatrend-col"
              title={x.label + ": " + x.pct + "%"}
            >
              <div className="vl-slatrend-track">
                <span
                  className={"vl-slatrend-bar vl-bg-status-" + band(x.pct)}
                  style={{
                    height: x.pct + "%",
                  }}
                />
              </div>
              <span className="vl-slatrend-m">{x.label}</span>
            </div>
          );
        })}
      </div>
      <div className="vl-slatrend-key">
        <span>≥ 80% on target</span>
        <span>50–79% below</span>
        <span>{"< 50% critical"}</span>
      </div>
    </div>
  );
}

/* ---------- EffortMeter ---------- */
