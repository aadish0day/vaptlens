import React, { useState } from "react";
import { cx } from "@/ui/core";
import { motion } from "motion/react";
import { GLIDE, NONE, useReduced } from "@/ui/motion";

/* ---------- NavTabs (with gliding indicator) ---------- */
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
  var reduced = useReduced();
  var layoutId = React.useId();

  function select(t) {
    st[1](t);
    if (props.onChange) props.onChange(t);
  }

  return (
    <nav className="vl-nav" aria-label="Views">
      {tabs.map(function (t) {
        var on = t === active;
        return (
          <button
            key={t}
            type="button"
            className={cx("vl-nav-tab", on && "is-active")}
            aria-current={on ? "page" : undefined}
            onClick={function () {
              select(t);
            }}
          >
            {on ? (
              <motion.span
                layoutId={layoutId}
                className="vl-nav-indicator"
                transition={reduced ? NONE : GLIDE}
              />
            ) : null}
            <span className="vl-nav-label">{t}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- RiskMeter ---------- */
