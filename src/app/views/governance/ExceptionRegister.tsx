import { SEV_LABEL, count, hostLabel, mustRequest, nowIso } from "@/app/lib/common";
import { findingByKey, saveFile, toCsv } from "@/app/lib/export";
import { addDays } from "@/app/views/findings/utils";
import { SEV, days } from "@/lib/data";
import { AS_OF, localDay } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

/* exception register: every decision with its policy status, renewals and approver chain */
export function ExceptionRegister(p) {
  var ctx = p.ctx,
    flt = useState("All"),
    sel = useState([]),
    why = useState(""),
    pol = ctx.policy || {};
  var rows = Object.keys(ctx.gov)
    .map(function (k) {
      var g0 = ctx.gov[k] || {},
        f = findingByKey(ctx, k) || ctx.eng.findings[k];
      if (!f) return null;
      var st =
        g0.state === "requested"
          ? "Pending"
          : ctx.stateOf(k) === "expired"
            ? "Expired"
            : g0.state === "accepted"
              ? "Accepted"
              : g0.state === "fp"
                ? "False positive"
                : g0.rejectedBy
                  ? "Rejected"
                  : null;
      if (!st) return null;
      var left = g0.until ? days(AS_OF, g0.until) : null,
        max = (pol.maxDays || {})[f.sev] || 365,
        len = g0.until && g0.at ? days(localDay(g0.at), g0.until) : null;
      var issue =
        st === "Accepted" && len != null && len > max
          ? "Longer than the " + max + "-day policy"
          : (st === "Accepted" || st === "False positive") &&
              (!g0.reason || !(g0.approvedBy || g0.by))
            ? "Missing reason or approver"
            : st === "Accepted" && left != null && left <= 14
              ? "Expires in " + left + " days"
              : st === "Expired"
                ? "Expired — back in the queue"
                : "";
      return {
        k: k,
        f: f,
        g: g0,
        st: st,
        left: left,
        issue: issue,
      };
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return (
        (a.issue ? 0 : 1) - (b.issue ? 0 : 1) ||
        (a.left == null ? 1e9 : a.left) - (b.left == null ? 1e9 : b.left)
      );
    });
  var list =
    flt[0] === "All"
      ? rows
      : flt[0] === "Needs attention"
        ? rows.filter(function (r) {
            return r.issue;
          })
        : rows.filter(function (r) {
            return r.st === flt[0];
          });
  var renewable = sel[0].filter(function (k) {
    var r = rows.find(function (x) {
      return x.k === k;
    });
    return r && (r.st === "Accepted" || r.st === "Expired");
  });
  function renew(e) {
    e.preventDefault();
    if (!why[0].trim() || !renewable.length) return;
    ctx.govUndoable(
      renewable,
      function (k, g0) {
        var f =
          (
            rows.find(function (x) {
              return x.k === k;
            }) || {}
          ).f || {};
        var d = Math.min(90, (pol.maxDays || {})[f.sev] || 90);
        if (mustRequest(ctx, f))
          return {
            state: "requested",
            requestedState: "accepted",
            requestedBy: ctx.me.username,
            until: addDays(localDay(), d),
            at: nowIso(),
            by: ctx.me.username,
            renewals: (g0.renewals || 0) + 1,
            reason:
              (g0.reason ? g0.reason + " · " : "") +
              "Renewal requested: " +
              why[0].trim(),
            approvedBy: null,
          };
        return {
          state: "accepted",
          until: addDays(localDay(), d),
          at: nowIso(),
          renewals: (g0.renewals || 0) + 1,
          reason:
            (g0.reason ? g0.reason + " · " : "") + "Renewed: " + why[0].trim(),
          approvedBy: ctx.me.username,
        };
      },
      {
        title: renewable.length + " exception(s) renewed",
      },
      "ACCEPT-RENEW",
      why[0].trim(),
    );
    sel[1]([]);
    why[1]("");
  }
  function csv() {
    saveFile(
      ctx,
      "vaptlens-exception-register-" + localDay() + ".csv",
      toCsv(
        [
          [
            "finding",
            "host",
            "severity",
            "status",
            "reason",
            "requested_by",
            "approved_by",
            "decided_at",
            "until",
            "days_left",
            "renewals",
            "policy_issue",
          ],
        ].concat(
          rows.map(function (r) {
            return [
              r.f.name,
              hostLabel(r.f),
              r.f.sev,
              r.st,
              r.g.reason || r.g.rejectReason || "",
              r.g.requestedBy || r.g.by || "",
              r.g.approvedBy || r.g.rejectedBy || "",
              r.g.approvedAt || r.g.at || r.g.rejectedAt || "",
              r.g.until || "",
              r.left == null ? "" : r.left,
              r.g.renewals || 0,
              r.issue,
            ];
          }),
        ),
      ),
    );
  }
  var opts = [
    "All",
    "Needs attention",
    "Accepted",
    "False positive",
    "Pending",
    "Expired",
    "Rejected",
  ];
  return (
    <V.WidgetCard
      title={"Exception register · " + rows.length}
      draggable={false}
      actions={[
        <V.SegmentedControl
          key="f"
          label="Show"
          options={opts.map(function (o) {
            var n =
              o === "All"
                ? rows.length
                : o === "Needs attention"
                  ? count(rows, function (r) {
                      return r.issue;
                    })
                  : count(rows, function (r) {
                      return r.st === o;
                    });
            return o + " · " + n;
          })}
          value={
            opts
              .map(function (o) {
                return o;
              })
              .indexOf(flt[0]) >= 0
              ? flt[0] +
                " · " +
                (flt[0] === "All"
                  ? rows.length
                  : flt[0] === "Needs attention"
                    ? count(rows, function (r) {
                        return r.issue;
                      })
                    : count(rows, function (r) {
                        return r.st === flt[0];
                      }))
              : flt[0]
          }
          onChange={function (v) {
            flt[1](v.split(" · ")[0]);
          }}
        />,
        <V.Button
          key="x"
          size="sm"
          variant="ghost"
          icon="download"
          onClick={csv}
        >
          CSV
        </V.Button>,
      ]}
    >
      <p className="up-help">
        {"Policy: exceptions last at most " +
          SEV.map(function (s2) {
            return SEV_LABEL[s2] + " " + (pol.maxDays || {})[s2] + "d";
          }).join(" · ") +
          (pol.sod !== false ? " · requesters can't approve their own" : "") +
          (pol.twoPerson
            ? " · Critical/KEV acceptances need a second administrator"
            : "") +
          ". Change it under Policies."}
      </p>
      {ctx.isAdmin && renewable.length ? (
        <form className="sv-form bulk-form" onSubmit={renew}>
          <span className="up-count">{renewable.length + " selected"}</span>
          <input
            className="wb-select"
            value={why[0]}
            placeholder="Why renew? (required, goes in the audit log)"
            aria-label="Renewal reason"
            onChange={function (e) {
              why[1](e.target.value);
            }}
          />
          <V.Button
            size="sm"
            variant="primary"
            type="submit"
            disabled={!why[0].trim()}
          >
            Renew up to policy limit
          </V.Button>
        </form>
      ) : null}
      {list.length ? (
        <div className="scroll-x">
          <table className="ledger exc-table">
            <thead>
              <tr>
                {[
                  ctx.isAdmin ? "" : null,
                  "Finding",
                  "Status",
                  "Until",
                  "Requested · approved",
                  "Reason",
                  "Policy",
                ]
                  .filter(function (x) {
                    return x !== null;
                  })
                  .map(function (c, i) {
                    return <th key={i}>{c}</th>;
                  })}
              </tr>
            </thead>
            <tbody>
              {list.slice(0, 300).map(function (r) {
                var on = sel[0].indexOf(r.k) >= 0;
                return (
                  <tr key={r.k} className={r.issue ? "has-issue" : ""}>
                    {ctx.isAdmin ? (
                      <td>
                        <input
                          type="checkbox"
                          className="vl-rowcheck"
                          checked={on}
                          aria-label={"Select " + r.f.name}
                          onChange={function () {
                            sel[1](
                              on
                                ? sel[0].filter(function (x) {
                                    return x !== r.k;
                                  })
                                : sel[0].concat([r.k]),
                            );
                          }}
                        />
                      </td>
                    ) : null}
                    <td>
                      <button
                        type="button"
                        className="inline-link"
                        onClick={function () {
                          ctx.openFinding(r.k);
                        }}
                      >
                        {r.f.name}
                      </button>
                      <div className="up-meta">
                        {SEV_LABEL[r.f.sev] + " · " + hostLabel(r.f)}
                      </div>
                    </td>
                    <td>
                      {r.st +
                        (r.g.renewals
                          ? " · renewed " + r.g.renewals + "×"
                          : "")}
                    </td>
                    <td className="vl-mono">
                      {r.g.until
                        ? r.g.until +
                          (r.left != null ? " (" + r.left + "d)" : "")
                        : "—"}
                    </td>
                    <td>
                      {(r.g.requestedBy || r.g.by || "—") +
                        " · " +
                        (r.g.approvedBy || r.g.rejectedBy || "—")}
                    </td>
                    <td>{r.g.reason || r.g.rejectReason || "—"}</td>
                    <td className={r.issue ? "is-issue" : ""}>
                      {r.issue || "OK"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <V.EmptyState
          title="No exceptions match."
          hint="Accept risk or mark a false positive from a finding's detail; it appears here with its approver and end date."
        />
      )}
    </V.WidgetCard>
  );
}
/* FAIR-lite: annualised loss exposure from asset value × likelihood × impact. An order-of-magnitude estimate. */
