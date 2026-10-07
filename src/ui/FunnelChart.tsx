import React from "react";
import { cx, kbd } from "@/ui/core";

/* ---------- FunnelChart (stages with drop-off %: e.g. found → triaged → ticketed → fixed → verified) ---------- */
export function FunnelChart(props) {
  var st = props.stages || [],
    top = st.length ? Math.max(1, st[0].value) : 1;
  return (
    <ol className="vl-funnel" aria-label={props.label || "Funnel"}>
      {st.map(function (s, i) {
        var pct = (100 * s.value) / top,
          prev = i ? st[i - 1].value : null,
          conv = prev ? Math.round((100 * s.value) / Math.max(1, prev)) : null;
        var on = props.selected === s.label;
        var row = (
          <>
            <span className="vl-funnel-label">{s.label}</span>
            <span className="vl-funnel-track">
              <span
                className="vl-funnel-bar"
                style={{
                  width: Math.max(2, pct) + "%",
                  background: s.color || "var(--chart-1)",
                }}
              />
            </span>
            <span className="vl-funnel-n">{s.value}</span>
            <span className="vl-funnel-conv">
              {conv == null ? "" : conv + "%"}
            </span>
          </>
        );
        return (
          <li key={s.label} className={cx("vl-funnel-row", on && "is-on")}>
            {props.onSelect ? (
              <button
                type="button"
                aria-pressed={on}
                onClick={function () {
                  props.onSelect(on ? null : s.label);
                }}
                onKeyDown={kbd(function () {
                  props.onSelect(on ? null : s.label);
                })}
              >
                {row}
              </button>
            ) : (
              <div>{row}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
