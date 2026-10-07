import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { RACI, TEAMS, cx } from "@/ui/core";

export function TeamPicker(props) {
  var t = useState(props.team || null),
    r = useState(props.role || "R");
  var ro = !!props.readOnly;
  return (
    <div className={cx("vl-team", ro && "is-ro")}>
      <div className="vl-team-list" role="radiogroup" aria-label="Owner team">
        {TEAMS.map(function (n, i) {
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={t[0] === n}
              aria-disabled={ro || undefined}
              className={cx("vl-team-opt", t[0] === n && "is-on")}
              onClick={function () {
                if (!ro) {
                  t[1](n);
                  if (props.onChange) props.onChange(n, r[0]);
                }
              }}
            >
              <span
                className="vl-team-dot"
                style={{
                  background: "var(--chart-" + (i + 1) + ")",
                }}
              />
              {n}
            </button>
          );
        })}
      </div>
      <div className="vl-raci-pick" role="radiogroup" aria-label="RACI role">
        {RACI.map(function (x) {
          return (
            <button
              key={x[0]}
              type="button"
              role="radio"
              aria-checked={r[0] === x[0]}
              aria-disabled={ro || undefined}
              title={x[1]}
              className={cx("vl-raci-opt", r[0] === x[0] && "is-on")}
              onClick={function () {
                if (!ro) {
                  r[1](x[0]);
                  if (props.onChange) props.onChange(t[0], x[0]);
                }
              }}
            >
              <b>{x[0]}</b>
              <span>{x[1]}</span>
            </button>
          );
        })}
      </div>
      {ro ? (
        <span className="vl-team-ro">
          <Icon name="lock" size={12} />
          Security Auditors have read-only access.
        </span>
      ) : null}
    </div>
  );
}

/* ---------- RaciMatrix ---------- */
