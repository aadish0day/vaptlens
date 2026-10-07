import { passwordIssues, passwordScore } from "@/lib/auth";
import React from "react";

/* ================= Root: sign in → boot ================= */
export function PwMeter(p) {
  var sc = passwordScore(p.value || ""),
    issues = passwordIssues(p.value || "", p.username);
  return (
    <div className="pw-meter">
      <div className="pw-bars" aria-hidden="true">
        {[0, 1, 2, 3].map(function (i) {
          return <span key={i} className={i < sc ? "on s" + sc : ""} />;
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
