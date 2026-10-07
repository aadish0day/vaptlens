import React from "react";
import { Icon } from "@/ui/Icon";
import { motion } from "motion/react";
import { LEAVE, NONE, POP, useReduced } from "@/ui/motion";

/* ---------- Toast (with spring entrance/exit) ---------- */
export function Toast(props) {
  var tone = props.tone || "ok";
  var reduced = useReduced();
  return (
    <motion.div
      className={"vl-toast vl-toast-" + tone}
      role={tone === "danger" ? "alert" : "status"}
      initial={reduced ? false : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        reduced
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.96, transition: LEAVE }
      }
      transition={reduced ? NONE : POP}
    >
      <Icon
        name={tone === "ok" ? "check" : tone === "danger" ? "shield" : "info"}
        size={16}
      />
      <div className="vl-toast-main">
        <span className="vl-toast-title">{props.title}</span>
        {props.message ? (
          <span className="vl-toast-msg">{props.message}</span>
        ) : null}
      </div>
      {props.action ? (
        <button
          type="button"
          className="vl-toast-action"
          onClick={props.action.onClick}
        >
          {props.action.label}
        </button>
      ) : null}
      {props.onClose ? (
        <button
          type="button"
          className="vl-chip-x"
          aria-label="Dismiss"
          onClick={props.onClose}
        >
          <Icon name="x" size={12} />
        </button>
      ) : null}
    </motion.div>
  );
}

/* ---------- Charts (token-styled SVG; the app uses Recharts with the same rules) ---------- */
