import React from "react";
import { SeverityMarker } from "@/ui/SeverityMarker";
import { SEV_LABEL, cx } from "@/ui/core";

export function SeverityBadge(props) {
  var s = (props.severity || "info").toLowerCase();
  return (
    <span className={cx("vl-sev", "vl-sev-" + s, props.solid && "is-solid")}>
      <SeverityMarker severity={s} size={8} />
      {SEV_LABEL[s] || s}
      {props.count != null ? (
        <span className="vl-sev-count">{props.count}</span>
      ) : null}
    </span>
  );
}

/* ---------- ThreatTag ---------- */
