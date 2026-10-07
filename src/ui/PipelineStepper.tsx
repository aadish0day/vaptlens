import React from "react";
import { cx } from "@/ui/core";
import { ValueRoll } from "@/ui/KpiCard";

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
            {/* counts roll when cards move between stages (interior.dev task-steps / value-flash) */}
            <span className="vl-step-count">
              <ValueRoll value={counts[i]} />
            </span>
            <span className="vl-step-label">{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- DiffBadge ---------- */
