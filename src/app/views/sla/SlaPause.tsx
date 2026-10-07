import { days } from "@/lib/data";
import { AS_OF } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

/* pause the SLA clock while waiting on a vendor or a change window; every pause has a reason and shows in the timeline */
export function SlaPause(p) {
  var f = p.f,
    ctx = p.ctx,
    g0 = ctx.gov[f.key] || {},
    open = (g0.pauses || []).find(function (x) {
      return !x.to;
    }),
    r = useState(""),
    o = useState(false);
  if (f.lifecycle === "Fixed") return null;
  function pause(e) {
    e.preventDefault();
    if (!r[0].trim()) return;
    var ps = (g0.pauses || []).concat([
      {
        from: AS_OF,
        reason: r[0].trim(),
        by: ctx.me.username,
      },
    ]);
    ctx.govUndoable(
      [f.key],
      function () {
        return {
          pauses: ps,
        };
      },
      {
        title: "SLA paused",
        message: r[0].trim(),
      },
      "SLA-PAUSE",
      f.name + " — " + r[0].trim(),
    );
    o[1](false);
    r[1]("");
  }
  function resume() {
    var ps = (g0.pauses || []).map(function (x) {
      return x.to
        ? x
        : Object.assign({}, x, {
            to: AS_OF,
            resumedBy: ctx.me.username,
          });
    });
    ctx.govUndoable(
      [f.key],
      function () {
        return {
          pauses: ps,
        };
      },
      {
        title: "SLA resumed",
      },
      "SLA-RESUME",
      f.name + " after " + (open ? days(open.from, AS_OF) : 0) + " day(s)",
    );
  }
  if (open)
    return (
      <V.Banner
        tone="warn"
        title={"SLA paused since " + open.from + " by " + open.by}
        action={
          p.ro ? null : (
            <V.Button size="sm" onClick={resume}>
              Resume
            </V.Button>
          )
        }
      >
        {open.reason +
          (f.pausedDays
            ? " · " + f.pausedDays + " day(s) paused this cycle"
            : "")}
      </V.Banner>
    );
  if (p.ro)
    return f.pausedDays ? (
      <span className="up-help">
        {f.pausedDays + " day(s) paused this cycle"}
      </span>
    ) : null;
  return o[0] ? (
    <form className="sv-form" onSubmit={pause}>
      <input
        className="wb-select"
        autoFocus={true}
        value={r[0]}
        placeholder="Why? e.g. waiting on vendor patch (CASE-1234)"
        aria-label="Reason for pausing the SLA"
        onChange={function (e) {
          r[1](e.target.value);
        }}
      />
      <V.Button size="sm" type="submit" disabled={!r[0].trim()}>
        Pause
      </V.Button>
      <button
        type="button"
        className="up-edit"
        onClick={function () {
          o[1](false);
        }}
      >
        Cancel
      </button>
    </form>
  ) : (
    <button
      type="button"
      className="up-edit"
      onClick={function () {
        o[1](true);
      }}
    >
      {"Pause SLA clock…" +
        (f.pausedDays ? " (" + f.pausedDays + "d paused so far)" : "")}
    </button>
  );
}
/* ===================== Risk & Compliance center ===================== */
/* Framework checks are computed from your own data. They show where you stand against each control's
   vulnerability-management requirement; they are evidence for an auditor, not a certification. */
