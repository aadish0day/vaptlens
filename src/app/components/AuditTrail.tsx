import { openRow } from "@/app/components/utils";
import { fmtTime, uniq } from "@/app/lib/common";
import React, { useState } from "react";
import * as V from "@/ui";

/* audit trail: search, filter by action or person, page through all 500 kept entries; rows about a finding open it */
export function AuditTrail(p) {
  var ctx = p.ctx,
    q = useState(""),
    act = useState("All actions"),
    who = useState("Everyone"),
    pg = useState(25);
  var acts = ["All actions"].concat(
      uniq(
        ctx.audit.map(function (x) {
          return x.action.replace(/·ITEM$/, "");
        }),
      ).sort(),
    ),
    people = ["Everyone"].concat(
      uniq(
        ctx.audit.map(function (x) {
          return x.user || x.role;
        }),
      ).sort(),
    );
  var qq = q[0].trim().toLowerCase();
  var rows = ctx.audit.filter(function (x) {
    return (
      (act[0] === "All actions" || x.action === act[0]) &&
      (who[0] === "Everyone" || (x.user || x.role) === who[0]) &&
      (!qq ||
        (x.action + " " + x.detail + " " + (x.user || ""))
          .toLowerCase()
          .indexOf(qq) >= 0)
    );
  });
  return (
    <div className="stack-tight">
      <div className="row-wrap audit-filters">
        <input
          className="wb-select"
          type="search"
          placeholder="Search the audit trail"
          aria-label="Search the audit trail"
          value={q[0]}
          onChange={function (e) {
            q[1](e.target.value);
            pg[1](25);
          }}
        />
        <select
          className="wb-select"
          aria-label="Filter by action"
          value={act[0]}
          onChange={function (e) {
            act[1](e.target.value);
            pg[1](25);
          }}
        >
          {acts.map(function (a) {
            return <option key={a}>{a}</option>;
          })}
        </select>
        <select
          className="wb-select"
          aria-label="Filter by person"
          value={who[0]}
          onChange={function (e) {
            who[1](e.target.value);
            pg[1](25);
          }}
        >
          {people.map(function (a) {
            return <option key={a}>{a}</option>;
          })}
        </select>
        <span className="up-help">
          {rows.length + " of " + ctx.audit.length}
        </span>
      </div>
      <div className="audit-scroll">
        {rows.slice(0, pg[0]).map(function (x, i) {
          var key = typeof x.ref === "string" ? x.ref : null;
          var row = (
            <V.AuditLogRow
              key={i}
              action={x.action}
              detail={
                x.detail +
                (Array.isArray(x.ref) ? " (" + x.ref.length + " findings)" : "")
              }
              role={x.user ? x.user + " · " + x.role : x.role}
              at={x.at}
              time={fmtTime(x.at)}
            />
          );
          return key && ctx.eng.findings[key] ? (
            <div
              {...Object.assign(
                {
                  key: i,
                },
                openRow(ctx, key, "audit-link"),
              )}
            >
              {row}
            </div>
          ) : (
            row
          );
        })}
      </div>
      {rows.length > pg[0] ? (
        <V.Button
          size="sm"
          onClick={function () {
            pg[1](pg[0] + 50);
          }}
        >
          Show 50 more
        </V.Button>
      ) : null}
    </div>
  );
}
/* SLA calendar: what falls due each week for the next 8 weeks, with an .ics export for any calendar */
