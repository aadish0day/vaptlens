import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";
import { AnimatePresence, motion } from "motion/react";
import { NONE, useReduced } from "@/ui/motion";

const h = React.createElement;

/* ---------- KpiCard ---------- */
export function KpiCard(props) {
  return h(
    props.onClick ? "button" : "div",
    {
      type: props.onClick ? "button" : undefined,
      className: cx(
        "vl-kpi",
        props.active && "is-active",
        props.tone && "vl-kpi-" + props.tone,
      ),
      onClick: props.onClick,
      "aria-pressed": props.onClick ? !!props.active : undefined,
    },
    <div className="vl-kpi-head">
      <span className="vl-label">{props.label}</span>
      {props.icon ? <Icon name={props.icon} size={16} /> : null}
    </div>,
    <div className="vl-kpi-value">
      <ValueRoll value={props.value} />
    </div>,
    props.sub ? <div className="vl-kpi-sub">{props.sub}</div> : null,
  );
}

/* ---------- ValueRoll (ported from interior.dev value-flash) ----------
   A changed number rolls in from the direction it moved (up from below, down from above).
   No green/red tint: whether "up" is good depends on the metric. */
var ROLL = { type: "spring", stiffness: 460, damping: 32, mass: 0.55 } as const;
var DROP = { duration: 0.14, ease: [0.4, 0, 1, 1] } as const;
function num(v) {
  var n =
    typeof v === "number"
      ? v
      : typeof v === "string"
        ? parseFloat(v.replace(/[^0-9.-]/g, ""))
        : NaN;
  return isFinite(n) ? n : null;
}
export function ValueRoll(props) {
  var reduced = useReduced();
  var v = props.value;
  var plain = typeof v === "string" || typeof v === "number";
  var prev = React.useRef(v);
  var dir = React.useRef(1);
  if (plain && prev.current !== v) {
    var a = num(prev.current),
      b = num(v);
    dir.current = a != null && b != null && b < a ? -1 : 1;
    prev.current = v;
  }
  if (!plain) return v == null ? null : v;
  var d = dir.current;
  return (
    <span className="vl-roll">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={String(v)}
          initial={
            reduced
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: d > 0 ? "0.8em" : "-0.8em",
                  filter: "blur(4px)",
                }
          }
          animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
          exit={
            reduced
              ? { opacity: 0, transition: NONE }
              : {
                  opacity: 0,
                  y: d > 0 ? "-0.7em" : "0.7em",
                  filter: "blur(3px)",
                  transition: DROP,
                }
          }
          transition={reduced ? NONE : ROLL}
        >
          {v}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ---------- WidgetCard ---------- */
