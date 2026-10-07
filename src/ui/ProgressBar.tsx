import React from "react";
import { cx } from "@/ui/core";
import { motion } from "motion/react";
import { NONE, useReduced } from "@/ui/motion";

/* the fill springs to each new value (interior.dev progress-bar) */
export var FILL = {
  type: "spring",
  stiffness: 210,
  damping: 34,
  mass: 0.9,
} as const;
export function ProgressFill(props) {
  var reduced = useReduced();
  if (props.pct == null) return <span className="vl-progress-fill" />;
  return (
    <motion.span
      className="vl-progress-fill is-scaled"
      initial={false}
      animate={{ scaleX: props.pct / 100 }}
      transition={reduced ? NONE : FILL}
    />
  );
}

/* ---------- ProgressBar (determinate or indeterminate, with label and status) ---------- */
export function ProgressBar(props) {
  var max = props.max || 100,
    v = props.value;
  var pct = v == null ? null : Math.max(0, Math.min(100, (100 * v) / max));
  return (
    <div
      className={cx(
        "vl-progress",
        props.tone && "is-" + props.tone,
        pct == null && "is-indeterminate",
      )}
    >
      {props.label || props.showValue ? (
        <div className="vl-progress-head">
          <span>{props.label}</span>
          {pct != null && props.showValue !== false ? (
            <span className="vl-progress-val">
              {props.valueText || Math.round(pct) + "%"}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        className="vl-progress-track"
        role="progressbar"
        aria-label={props.label || props.ariaLabel || "Progress"}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={v == null ? undefined : v}
        aria-valuetext={props.valueText}
      >
        <ProgressFill pct={pct} />
      </div>
      {props.description ? (
        <div className="vl-progress-desc">{props.description}</div>
      ) : null}
    </div>
  );
}
