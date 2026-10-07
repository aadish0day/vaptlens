import React from "react";
import { ThreatTag } from "@/ui/ThreatTag";
import { cx, kbd } from "@/ui/core";

/* ---------- BreachList ---------- */
export function BreachList(props) {
  var items = props.items || [];
  return (
    <ol className="vl-breach">
      {items.map(function (it, i) {
        var sel = props.onSelect
          ? function () {
              props.onSelect(it, i);
            }
          : null;
        return (
          <li
            key={i}
            className={cx("vl-breach-row", sel && "is-link")}
            role={sel ? "button" : null}
            tabIndex={sel ? 0 : null}
            onClick={sel}
            onKeyDown={sel ? kbd(sel) : null}
            aria-label={
              sel ? it.title + " on " + it.host + ", risk " + it.risk : null
            }
          >
            <span className="vl-breach-rank">{i + 1}</span>
            <div className="vl-breach-main">
              <span className="vl-breach-title">{it.title}</span>
              <span className="vl-breach-host">{it.host}</span>
            </div>
            <span className="vl-breach-tags">
              {(it.tags || []).map(function (t) {
                return <ThreatTag key={t} kind={t} />;
              })}
            </span>
            <span className="vl-breach-risk">{it.risk}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- ExposureBars ---------- */
