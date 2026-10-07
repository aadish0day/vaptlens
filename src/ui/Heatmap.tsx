import React from "react";
import { SeverityMarker } from "@/ui/SeverityMarker";
import { SEV_LABEL, SEV_ORDER, cx, useSel } from "@/ui/core";

export function Heatmap(props) {
  var rows = props.rows || [],
    sel = useSel(props);
  var max = 1;
  rows.forEach(function (r) {
    r.values.forEach(function (v) {
      if (v > max) max = v;
    });
  });
  return (
    <div
      className="vl-heat"
      style={{
        gridTemplateColumns: "minmax(120px,auto) repeat(5, 1fr)",
      }}
    >
      <span />
      {SEV_ORDER.map(function (s) {
        return (
          <span key={s} className="vl-heat-h">
            <SeverityMarker severity={s} />
            {SEV_LABEL[s]}
          </span>
        );
      })}
      {rows.map(function (r) {
        var dim = sel[0] != null && sel[0] !== r.host;
        return [
          <button
            key={r.host}
            type="button"
            className={cx(
              "vl-heat-host",
              sel[0] === r.host && "is-sel",
              dim && "is-dim",
            )}
            onClick={function () {
              sel[1](r.host);
            }}
            aria-pressed={sel[0] === r.host}
          >
            {r.host}
          </button>,
        ].concat(
          r.values.map(function (v, i) {
            var s = SEV_ORDER[i];
            return (
              <span
                key={r.host + s}
                className={cx("vl-heat-cell", dim && "is-dim")}
                onClick={function () {
                  sel[1](r.host);
                }}
                title={r.host + " · " + SEV_LABEL[s] + ": " + v}
              >
                <span
                  className={"vl-heat-fill vl-fill-bg-" + s}
                  style={{
                    opacity: v ? 0.14 + (0.74 * v) / max : 0,
                  }}
                />
                <span
                  className={cx("vl-heat-v", v / max > 0.55 && "is-strong")}
                >
                  {v || ""}
                </span>
              </span>
            );
          }),
        );
      })}
    </div>
  );
}

/* ---------- ReportHeader ---------- */
