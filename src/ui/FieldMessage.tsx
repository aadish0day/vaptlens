import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { BASE, EASE_OUT, NONE, useReduced } from "@/ui/motion";

/* ---------- FieldMessage (ported from interior.dev inline-validation) ----------
   Hint and error share one grid cell: the error cross-fades over the hint instead of pushing
   the form down, and fades out the same way when the value is fixed. Renders an empty
   (display: none) span when there's nothing to say, so the exit can still play. */
export function FieldMessage(p) {
  var reduced = useReduced();
  var t = reduced ? NONE : { duration: BASE, ease: EASE_OUT };
  return (
    <span className="vl-field-msg">
      {p.hint != null ? (
        <motion.span
          id={p.hintId}
          className="vl-field-hint"
          initial={false}
          animate={{ opacity: p.error ? 0 : 1 }}
          transition={t}
          aria-hidden={p.error ? true : undefined}
        >
          {p.hint}
        </motion.span>
      ) : null}
      <AnimatePresence initial={false}>
        {p.error ? (
          <motion.span
            key="e"
            id={p.errorId}
            className="vl-field-error"
            role={p.alert ? "alert" : undefined}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={t}
          >
            {p.error}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
