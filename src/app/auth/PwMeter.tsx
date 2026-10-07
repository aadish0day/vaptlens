import { passwordIssues, passwordScore } from "@/lib/auth";
import React from "react";
import { motion } from "motion/react";
import { NONE, useReduced } from "@/ui/motion";

/* segments fill in sequence (interior.dev password-strength) */
var CELL = { type: "spring", stiffness: 520, damping: 34, mass: 0.45 } as const;

/* ================= Root: sign in → boot ================= */
export function PwMeter(p) {
  var sc = passwordScore(p.value || ""),
    issues = passwordIssues(p.value || "", p.username);
  var reduced = useReduced();
  return (
    <div className="pw-meter">
      <div className="pw-bars" aria-hidden="true">
        {[0, 1, 2, 3].map(function (i) {
          return (
            <span key={i} className={"s" + sc}>
              <motion.b
                initial={false}
                animate={{ scaleX: i < sc ? 1 : 0 }}
                transition={
                  reduced
                    ? NONE
                    : Object.assign({}, CELL, { delay: i < sc ? i * 0.03 : 0 })
                }
              />
            </span>
          );
        })}
      </div>
      <span className="up-help">
        {p.value
          ? issues.length
            ? "Needs " + issues.join(", ") + "."
            : ["Weak", "Weak", "Fair", "Good", "Strong"][sc] + " password."
          : "12+ characters, mixed case, and a number or symbol."}
      </span>
    </div>
  );
}
