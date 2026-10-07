import React from "react";
import { cx } from "@/ui/core";

var ORDER = ["critical", "high", "medium", "low", "info"], LABEL = { critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info" };
/* ---------- SeverityBar (one stacked bar of severity counts, with an accessible text equivalent) ---------- */
export function SeverityBar(props) {
  var c = props.counts || {}, total = ORDER.reduce(function (t, s) { return t + (c[s] || 0); }, 0);
  var text = ORDER.filter(function (s) { return c[s]; }).map(function (s) { return c[s] + " " + LABEL[s].toLowerCase(); }).join(", ") || "no findings";
  return (
    <div className={cx("vl-sevbar", props.compact && "is-compact")}>
      <div className="vl-sevbar-track" role="img" aria-label={"Severity: " + text}>
        {total ? ORDER.map(function (s) { return c[s] ? <span key={s} className={"is-" + s} style={{ flexGrow: c[s] }} title={LABEL[s] + ": " + c[s]} /> : null; }) : <span className="is-empty" style={{ flexGrow: 1 }} />}
      </div>
      {props.compact ? null : (
        <ul className="vl-sevbar-legend" aria-hidden="true">
          {ORDER.map(function (s) { return c[s] ? <li key={s}><i className={"is-" + s} />{LABEL[s]} <b>{c[s]}</b></li> : null; })}
        </ul>
      )}
    </div>
  );
}
