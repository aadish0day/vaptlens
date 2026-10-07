import React, { useState } from "react";
import { cx } from "@/ui/core";
import { motion } from "motion/react";
import { GLIDE, NONE, useReduced } from "@/ui/motion";

/* ---------- Tabs (ported from interior.dev tabs: gliding indicator, keyboard nav) ---------- */
export function Tabs(props) {
  var tabs = props.tabs || [];
  var st = useState(props.defaultValue || (tabs[0] && tabs[0].label));
  var val = props.value != null ? props.value : st[0];
  var reduced = useReduced();
  var layoutId = React.useId();

  function select(lbl) {
    st[1](lbl);
    if (props.onChange) props.onChange(lbl);
  }

  function onKeyDown(e) {
    var curIdx = tabs.findIndex(function (t) {
      return t.label === val;
    });
    if (curIdx < 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      var next = tabs[(curIdx + 1) % tabs.length];
      if (next) select(next.label);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      var prev = tabs[(curIdx - 1 + tabs.length) % tabs.length];
      if (prev) select(prev.label);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (tabs[0]) select(tabs[0].label);
    } else if (e.key === "End") {
      e.preventDefault();
      if (tabs[tabs.length - 1]) select(tabs[tabs.length - 1].label);
    }
  }

  return (
    <div className="vl-tabs" role="tablist" onKeyDown={onKeyDown}>
      {tabs.map(function (t) {
        var on = t.label === val;
        return (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            className={cx("vl-tab", on && "is-on")}
            onClick={function () {
              select(t.label);
            }}
          >
            {on ? (
              <motion.span
                layoutId={layoutId}
                className="vl-tab-indicator"
                transition={reduced ? NONE : GLIDE}
              />
            ) : null}
            <span className="vl-tab-label">{t.label}</span>
            {t.count != null ? (
              <span className="vl-tab-count">{t.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- DropdownMenu ---------- */
