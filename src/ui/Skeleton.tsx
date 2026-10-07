import React from "react";
import { motion } from "motion/react";
import { BASE, EASE_OUT, NONE, useReduced } from "@/ui/motion";

/* rows wait DELAY before fading in, so a fast load never flashes a skeleton (interior.dev skeleton-swap) */
var DELAY = 0.12;

/* ---------- Skeleton ---------- */
export function Skeleton(props) {
  var reduced = useReduced();
  if (props.variant === "rows") {
    var n = props.rows || 4,
      out = [];
    for (var i = 0; i < n; i++)
      out.push(
        <div key={i} className="vl-skel-row">
          <span
            className="vl-skel"
            style={{
              width: "72px",
            }}
          />
          <span
            className="vl-skel"
            style={{
              flex: 1,
            }}
          />
          <span
            className="vl-skel"
            style={{
              width: "96px",
            }}
          />
        </div>,
      );
    return (
      <motion.div
        className="vl-skel-rows"
        aria-busy="true"
        aria-label="Loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduced ? NONE : { duration: BASE, ease: EASE_OUT, delay: DELAY }
        }
      >
        {out}
      </motion.div>
    );
  }
  return (
    <span
      className="vl-skel"
      style={{
        width: props.width || "100%",
        height: props.height || "12px",
      }}
      aria-hidden="true"
    />
  );
}

/* ---------- Toast ---------- */
