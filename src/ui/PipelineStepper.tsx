import React from "react";
import { cx } from "@/ui/core";

/* ---------- PipelineStepper ---------- */
export var STAGES = [
  "Unassigned",
  "Assigned",
  "In Progress",
  "Pending Verification",
  "Resolved",
];

export function PipelineStepper(props) {
  var counts = props.counts || [0, 0, 0, 0, 0];
  var cur = props.current;
  return (
    <ol className="vl-steps">
      {(props.labels || STAGES).map(function (s, i) {
        return (
          <li
            key={s}
            className={cx(
              "vl-step",
              cur === i && "is-current",
              i === 4 && "is-done",
            )}
          >
            <span className="vl-step-count">{counts[i]}</span>
            <span className="vl-step-label">{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- DiffBadge ---------- */
