import React, { useState } from "react";
import { cx } from "@/ui/core";

/* ---------- NavTabs ---------- */
export var VIEWS = [
  "Dashboard",
  "Asset Inventory",
  "SLA & RACI",
  "Prioritization Matrix",
  "Remediation Board",
  "Network Map",
  "Re-Test Verification",
  "Executive Report",
];

export function NavTabs(props) {
  var tabs = props.tabs || VIEWS;
  var st = useState(props.active || tabs[0]);
  var active = props.active != null && props.onChange ? props.active : st[0];
  return (
    <nav className="vl-nav" aria-label="Views">
      {tabs.map(function (t) {
        return (
          <button
            key={t}
            type="button"
            className={cx("vl-nav-tab", t === active && "is-active")}
            aria-current={t === active ? "page" : undefined}
            onClick={function () {
              st[1](t);
              if (props.onChange) props.onChange(t);
            }}
          >
            {t}
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- RiskMeter ---------- */
