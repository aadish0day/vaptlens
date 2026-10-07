import { hostLabel, mustRequest, nowIso, uniq } from "@/app/lib/common";
import { addDays } from "@/app/views/findings/utils";
import { TEAMS } from "@/lib/data";
import { localDay } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

/* ===== bulk triage on selected findings (same rules as one-by-one: exceptions and false positives need an admin) ===== */
export function BulkBar(p) {
  var ctx = p.ctx,
    rows = p.picked,
    keys = uniq(
      rows.map(function (f) {
        return f.key;
      }),
    ),
    n = keys.length,
    form = useState(null),
    why = useState(""),
    camp = useState("");
  if (!n) return null;
  /* every bulk change goes through govUndoable: one toast with Undo that reverts only what it changed */
  var pend = null;
  function patchAll(fn, onlyKeys?) {
    pend = {
      fn: fn,
      keys: onlyKeys || keys,
    };
  }
  function done(title, logA, logD) {
    var d =
      logD +
      " · " +
      n +
      " findings: " +
      rows
        .slice(0, 5)
        .map(function (f) {
          return f.name + " @ " + hostLabel(f);
        })
        .join("; ") +
      (n > 5 ? " …" : "");
    if (pend && pend.keys.length)
      ctx.govUndoable(
        pend.keys,
        pend.fn,
        {
          title: title,
        },
        logA,
        d,
      );
    else {
      ctx.log(logA, d);
      ctx.toast({
        title: title,
      });
    }
    pend = null;
    form[1](null);
    why[1]("");
    p.onDone();
  }
  function team(t) {
    patchAll(function () {
      return {
        team: t,
        manualTeam: true,
        assigned: true,
      };
    });
    done(n + " findings → " + t, "ASSIGN", "Bulk assigned to " + t);
  }
  function status(st) {
    patchAll(function () {
      return st === "Remediated"
        ? {
            status: st,
            fixed: true,
            fixedAt: nowIso(),
            assigned: true,
          }
        : {
            status: st,
            fixed: false,
            fixedAt: null,
            assigned: true,
          };
    });
    done(
      n +
        " findings → " +
        st +
        (st === "Remediated" ? " (pending re-scan)" : ""),
      "STATUS",
      "Bulk status " + st,
    );
  }
  function tickets() {
    var asg = {};
    keys.forEach(function (k) {
      if (!(ctx.gov[k] || {}).ticket) asg[k] = ctx.nextTicket();
    });
    var ks = Object.keys(asg);
    patchAll(function (k, g0) {
      return {
        ticket: asg[k],
        status: g0.status || "To Do",
        assigned: true,
      };
    }, ks);
    done(
      ks.length +
        " tickets raised" +
        (n - ks.length ? " · " + (n - ks.length) + " already had one" : ""),
      "TICKET",
      "Bulk tickets " +
        ks
          .map(function (k) {
            return asg[k];
          })
          .join(", "),
    );
  }
  function validation(v) {
    patchAll(function () {
      return {
        validation: v,
        validatedBy: ctx.me.username,
        validatedAt: nowIso(),
      };
    });
    done(
      n +
        " findings " +
        (v === "confirmed" ? "confirmed exploitable" : "not reproducible"),
      "VALIDATE",
      "Bulk validation " + v,
    );
  }
  function exception(kind) {
    if (!why[0].trim()) {
      ctx.toast({
        title: "Give a reason first",
        tone: "danger",
      });
      return;
    }
    var byKey = {};
    rows.forEach(function (f) {
      byKey[f.key] = f;
    });
    /* non-admins can only ask about undecided findings; admin decisions and pending requests are left alone */
    var elig = keys.filter(function (k) {
        var g0 = ctx.gov[k] || {};
        return ctx.isAdmin
          ? g0.state !== "requested"
          : !g0.state || ctx.stateOf(k) === "expired";
      }),
      skipped = n - elig.length;
    if (!elig.length) {
      ctx.toast({
        title: "Nothing to change",
        message:
          "All selected findings already have a decision or a pending request.",
        tone: "info",
      });
      return;
    }
    var me0 = ctx.me.username,
      pol = ctx.policy || {};
    pend = {
      keys: elig,
      fn: function (k) {
        var f = byKey[k] || {},
          until = addDays(
            localDay(),
            Math.min(90, (pol.maxDays || {})[f.sev] || 90),
          );
        var second = ctx.isAdmin && mustRequest(ctx, f);
        if (ctx.isAdmin && !second)
          return kind === "fp"
            ? {
                state: "fp",
                reason: why[0],
                by: me0,
                approvedBy: me0,
                at: nowIso(),
                rejectedBy: null,
                rejectedAt: null,
                rejectReason: null,
              }
            : {
                state: "accepted",
                treatment: "accept",
                until: until,
                reason: why[0],
                by: me0,
                approvedBy: me0,
                at: nowIso(),
                rejectedBy: null,
                rejectedAt: null,
                rejectReason: null,
              };
        return {
          state: "requested",
          requestedState: kind === "fp" ? "fp" : "accepted",
          requestedBy: me0,
          until: kind === "fp" ? null : until,
          reason: why[0],
          by: me0,
          at: nowIso(),
          rejectedBy: null,
          rejectedAt: null,
          rejectReason: null,
        };
      },
    };
    done(
      (ctx.isAdmin
        ? elig.length +
          (kind === "fp"
            ? " marked false positive"
            : " risks accepted (or sent for a second approval)")
        : elig.length + " requests sent for approval") +
        (skipped ? " · " + skipped + " skipped (already decided)" : ""),
      kind === "fp"
        ? ctx.isAdmin
          ? "FALSE-POSITIVE"
          : "FP-REQUEST"
        : ctx.isAdmin
          ? "ACCEPT"
          : "ACCEPT-REQUEST",
      "Bulk — " + why[0],
    );
  }
  function toCampaign() {
    var id = camp[0];
    if (id === "__new__" || !id) {
      var nid = "c-" + Date.now().toString(36);
      ctx.setCampaigns(
        ctx.campaigns.concat([
          {
            id: nid,
            name: why[0].trim() || "Campaign · " + rows[0].name.slice(0, 40),
            owner: ctx.g(rows[0]).team,
            due: addDays(localDay(), 30),
            keys: keys,
            createdAt: nowIso(),
            createdBy: ctx.me.username,
            source: "bulk",
          },
        ]),
      );
      done(
        "Campaign created with " + n + " findings",
        "CAMPAIGN",
        "Created from selection",
      );
      return;
    }
    ctx.setCampaigns(
      ctx.campaigns.map(function (c) {
        return c.id === id
          ? Object.assign({}, c, {
              keys: uniq((c.keys || []).concat(keys)),
            })
          : c;
      }),
    );
    done(
      n + " findings added to campaign",
      "CAMPAIGN",
      "Added to " +
        ((
          ctx.campaigns.find(function (c) {
            return c.id === id;
          }) || {}
        ).name || id),
    );
  }
  return (
    <div className="bulk-bar" role="region" aria-label="Bulk actions">
      <span className="up-count">
        {n + " selected"}
        {p.total > rows.length ? (
          <button type="button" className="up-edit" onClick={p.onSelectAll}>
            {"Select all " + p.total + " in this view"}
          </button>
        ) : null}
      </span>
      <V.DropdownMenu
        label="Assign team"
        icon="user"
        items={TEAMS.map(function (t) {
          return {
            label: t,
            onSelect: function () {
              team(t);
            },
          };
        })}
      />
      <V.DropdownMenu
        label="Status"
        icon="workflow"
        items={["To Do", "In Progress", "In Review", "Remediated"].map(
          function (t) {
            return {
              label: t,
              onSelect: function () {
                status(t);
              },
            };
          },
        )}
      />
      <V.Button size="sm" icon="ticket" onClick={tickets}>
        Raise tickets
      </V.Button>
      <V.DropdownMenu
        label="Validate"
        icon="target"
        items={[
          {
            label: "Confirmed exploitable",
            onSelect: function () {
              validation("confirmed");
            },
          },
          {
            label: "Not reproducible",
            onSelect: function () {
              validation("not_reproducible");
            },
          },
        ]}
      />
      <V.DropdownMenu
        label="More"
        icon="flag"
        align="right"
        items={[
          {
            label: ctx.isAdmin
              ? "Accept risk (90 days)…"
              : "Request exception…",
            onSelect: function () {
              form[1]("accept");
            },
          },
          {
            label: ctx.isAdmin
              ? "Mark false positive…"
              : "Request false positive…",
            onSelect: function () {
              form[1]("fp");
            },
          },
          {
            label: "Add to campaign…",
            onSelect: function () {
              form[1]("camp");
            },
          },
        ]}
      />
      <V.Button size="sm" variant="ghost" onClick={p.onDone}>
        Clear
      </V.Button>
      {form[0] ? (
        <form
          className="sv-form bulk-form"
          onSubmit={function (e) {
            e.preventDefault();
            if (form[0] === "camp") toCampaign();
            else exception(form[0]);
          }}
        >
          {form[0] === "camp" ? (
            <select
              className="wb-select"
              value={camp[0]}
              aria-label="Campaign"
              onChange={function (e) {
                camp[1](e.target.value);
              }}
            >
              {[
                <option key="n" value="__new__">
                  New campaign
                </option>,
              ].concat(
                ctx.campaigns.map(function (c) {
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  );
                }),
              )}
            </select>
          ) : null}
          <input
            className="wb-select"
            autoFocus={true}
            value={why[0]}
            placeholder={
              form[0] === "camp"
                ? "Name for a new campaign (optional)"
                : "Reason (required, goes in the audit log)"
            }
            aria-label={form[0] === "camp" ? "Campaign name" : "Reason"}
            onChange={function (e) {
              why[1](e.target.value);
            }}
          />
          <V.Button size="sm" variant="primary" type="submit">
            {form[0] === "camp"
              ? "Add"
              : ctx.isAdmin
                ? "Apply to " + n
                : "Send " + n + " for approval"}
          </V.Button>
          <button
            type="button"
            className="up-edit"
            onClick={function () {
              form[1](null);
            }}
          >
            Cancel
          </button>
        </form>
      ) : null}
    </div>
  );
}
/* ===== CVSS calculator (v4.0 and v3.1): an analyst re-scores a finding in its real context ===== */
