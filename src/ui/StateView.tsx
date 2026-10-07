import React from "react";
import { Illustration } from "@/ui/Illustration";

var PRESET = {
  empty: ["no-scans", "Nothing here yet", "Import a scan to get started."],
  "no-results": [
    "no-results",
    "No matches",
    "Try removing a filter or searching for something else.",
  ],
  "all-clear": ["all-clear", "All clear", "No open findings match. Nice work."],
  error: [
    "error",
    "Something went wrong",
    "Try again. If it keeps happening, export a backup from Data.",
  ],
  forbidden: [
    "forbidden",
    "You don't have access",
    "Ask an administrator for the role that allows this.",
  ],
  "not-found": [
    "not-found",
    "Page not found",
    "The link may be old, or the item was deleted.",
  ],
  offline: [
    "offline",
    "You're offline",
    "Changes will save when the connection is back.",
  ],
  locked: ["locked", "Workspace locked", "Sign in again to unlock your data."],
};
/* ---------- StateView (illustrated empty / error / permission / offline states with an action) ---------- */
export function StateView(props) {
  var p = PRESET[props.kind] || PRESET.empty;
  return (
    <div
      className="vl-state"
      role={
        props.kind === "error" || props.kind === "offline" ? "alert" : undefined
      }
    >
      <Illustration
        name={props.illustration || p[0]}
        size={
          typeof props.size === "number"
            ? props.size
            : props.size === "sm"
              ? 88
              : props.size === "lg"
                ? 176
                : 132
        }
      />
      <h3 className="vl-state-title">{props.title || p[1]}</h3>
      <p className="vl-state-body">{props.children || p[2]}</p>
      {props.action ? (
        <div className="vl-state-actions">{props.action}</div>
      ) : null}
    </div>
  );
}
