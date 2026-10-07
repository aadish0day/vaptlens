import { fmtTime } from "@/app/lib/common";
import { localDay } from "@/lib/engine";
import React, { useState } from "react";

/* one timeline per finding: scans that saw it, every governance action, notes, newest first */
export function Timeline(p) {
  var f = p.f,
    ctx = p.ctx,
    all = useState(false),
    keys = [f.key].concat((ctx.gov[f.key] || {}).oldKeys || []);
  function mine(e) {
    return (
      e.ref &&
      (typeof e.ref === "string"
        ? keys.indexOf(e.ref) >= 0
        : e.ref.some(function (k) {
            return keys.indexOf(k) >= 0;
          }))
    );
  }
  var ev = [];
  p.fi.history.forEach(function (x) {
    var bb = ctx.batches.find(function (y) {
      return y.id === x[0];
    });
    if (bb)
      ev.push({
        at:
          bb.importedAt && localDay(bb.importedAt) === bb.date
            ? bb.importedAt
            : bb.date + "T00:00:00",
        kind: "scan",
        who: bb.tools,
        what: x[1] + " in " + bb.label,
      });
  });
  ctx.audit.forEach(function (e) {
    if (mine(e) && e.action !== "NOTE")
      ev.push({
        at: e.at,
        kind: e.action.toLowerCase(),
        who: e.user || e.role,
        what:
          e.action.replace(/-/g, " ").toLowerCase() +
          (e.detail && e.detail.indexOf(f.name) !== 0
            ? " · " + e.detail
            : e.detail
              ? " · " + e.detail.slice(f.name.length).replace(/^[\s:—-]+/, "")
              : ""),
      });
  });
  (p.notes || []).forEach(function (n) {
    ev.push({
      at: n.at,
      kind: "note",
      who: n.user || n.role,
      what: "“" + n.text.slice(0, 160) + (n.text.length > 160 ? "…" : "") + "”",
    });
  });
  ev.sort(function (a, b) {
    return a.at < b.at ? 1 : a.at > b.at ? -1 : 0;
  });
  var shown = all[0] ? ev : ev.slice(0, 8);
  return (
    <section className="dt-box">
      <span className="vl-label">{"Activity · " + ev.length}</span>
      {ev.length ? (
        <ol className="timeline">
          {shown.map(function (x, i) {
            return (
              <li
                key={i}
                className={
                  "tl-" +
                  (x.kind === "scan"
                    ? "scan"
                    : x.kind === "note"
                      ? "note"
                      : "act")
                }
              >
                <span className="tl-when vl-mono">
                  {x.at.length > 10 && x.kind !== "scan"
                    ? fmtTime(x.at)
                    : x.at.slice(0, 10)}
                </span>
                <span className="tl-what">{x.what}</span>
                <span className="tl-who">{x.who}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="up-help">No activity yet.</p>
      )}
      {ev.length > 8 ? (
        <button
          type="button"
          className="up-edit"
          onClick={function () {
            all[1](!all[0]);
          }}
        >
          {all[0] ? "Show fewer" : "Show all " + ev.length}
        </button>
      ) : null}
    </section>
  );
}
/* ===== Inbox: what needs *me* — approvals (admins), @mentions, my requests' outcomes, SLA due soon, regressions ===== */
