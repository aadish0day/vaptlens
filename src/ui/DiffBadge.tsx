import React from "react";
import { Icon } from "@/ui/Icon";

/* ---------- DiffBadge ---------- */
export var DIFF = {
  fixed: ["Verified fixed", "check"],
  new: ["New risk", "zap"],
  persistent: ["Persistent", "clock"],
  reopened: ["Reopened", "flame"],
  unverified: ["Not re-tested", "lock"],
  accepted: ["Risk accepted", "shield"],
};

export function DiffBadge(props) {
  var d = DIFF[props.kind] || DIFF.persistent;
  return (
    <span className={"vl-diff vl-diff-" + props.kind}>
      <Icon name={d[1]} size={12} strokeWidth={2.5} />
      {props.label || d[0]}
      {props.count != null ? (
        <span className="vl-sev-count">{props.count}</span>
      ) : null}
    </span>
  );
}

/* ---------- QuadrantTile ---------- */
