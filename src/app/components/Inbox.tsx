import { RejectButton } from "@/app/components/RejectButton";
import { inboxItems, openRow } from "@/app/components/utils";
import { fmtTime, hostLabel } from "@/app/lib/common";
import React, { useRef, useState } from "react";
import * as V from "@/ui";

export function Inbox(p) {
  var ctx = p.ctx,
    it = p.items || inboxItems(ctx);
  var tb = useState(function () {
    return ctx.isAdmin && it.approvals.length
      ? "Approvals"
      : it.mentions.some(function (x) {
            return x.isNew;
          })
        ? "Mentions"
        : it.mine.some(function (x) {
              return x.isNew;
            })
          ? "Mine"
          : it.due.length
            ? "Overdue & due soon"
            : it.mentions.length
              ? "Mentions"
              : it.mine.length
                ? "Mine"
                : it.regressions.length
                  ? "Regressions"
                  : "Mine";
  });
  var viewed = useRef({});
  viewed.current[tb[0]] = 1;
  function row(f, extra, key?) {
    return (
      <div
        {...Object.assign(
          {
            key: key || f.key,
          },
          openRow(ctx, f.key, "inbox-row"),
        )}
      >
        <V.SeverityBadge severity={f.sev} />
        <div className="up-main">
          <span className="up-name">{f.name}</span>
          <span className="up-meta">
            {hostLabel(f) + (extra ? " · " + extra : "")}
          </span>
        </div>
      </div>
    );
  }
  var tabs = [
    {
      label: "Approvals",
      count: it.approvals.length,
    },
    {
      label: "Mentions",
      count: it.mentions.length,
    },
    {
      label: "Mine",
      count: it.mine.length,
    },
    {
      label: "Overdue & due soon",
      count: it.due.length,
    },
    {
      label: "Regressions",
      count: it.regressions.length,
    },
  ].filter(function (t) {
    return t.label !== "Approvals" || ctx.isAdmin;
  });
  var t = tb[0],
    body;
  if (t === "Approvals")
    body = it.approvals.length ? (
      <div className="stack-tight">
        {it.approvals.length > 1 ? (
          <V.Button
            size="sm"
            variant="primary"
            onClick={function () {
              ctx.decideRequest(
                it.approvals.map(function (f) {
                  return f.key;
                }),
                true,
              );
            }}
          >
            {"Approve all " + it.approvals.length}
          </V.Button>
        ) : null}
        {it.approvals.map(function (f) {
          var g0 = ctx.gov[f.key] || {};
          return (
            <div key={f.key} className="inbox-req">
              {row(
                f,
                (g0.requestedState === "fp"
                  ? "false positive"
                  : "exception until " + (g0.until || "?")) +
                  " · by " +
                  (g0.requestedBy || g0.by || "?") +
                  (g0.reason ? " · “" + g0.reason + "”" : ""),
              )}
              <span className="row-wrap">
                <V.Button
                  size="sm"
                  variant="primary"
                  onClick={function () {
                    ctx.decideRequest([f.key], true);
                  }}
                >
                  Approve
                </V.Button>
                <RejectButton
                  onReject={function (why) {
                    ctx.decideRequest([f.key], false, why);
                  }}
                />
              </span>
            </div>
          );
        })}
      </div>
    ) : (
      <V.EmptyState title="Nothing waiting for approval." />
    );
  else if (t === "Mentions")
    body = it.mentions.length ? (
      <div className="stack-tight">
        {it.mentions.map(function (m, i) {
          return row(
            m.f,
            (m.isNew ? "NEW · " : "") +
              (m.n.user || "?") +
              ": “" +
              m.n.text.slice(0, 120) +
              "” · " +
              fmtTime(m.n.at),
            m.key + i,
          );
        })}
      </div>
    ) : (
      <V.EmptyState
        title="No one has mentioned you."
        hint={"Type @" + ctx.me.username + " in a finding's notes to try it."}
      />
    );
  else if (t === "Mine")
    body = it.mine.length ? (
      <div className="stack-tight">
        {it.mine.map(function (m, i) {
          return row(
            m.f,
            (m.isNew ? "NEW · " : "") +
              (m.st === "pending"
                ? "waiting for an administrator"
                : m.st === "rejected"
                  ? "rejected by " + m.by + (m.why ? ": “" + m.why + "”" : "")
                  : "approved by " + m.by),
            m.key + i,
          );
        })}
      </div>
    ) : (
      <V.EmptyState title="You have no open or recent requests." />
    );
  else if (t === "Overdue & due soon")
    body = it.due.length ? (
      <div className="stack-tight">
        {it.due.slice(0, 100).map(function (f) {
          return row(
            f,
            f.breached
              ? "overdue " +
                  -f.daysLeft +
                  " days" +
                  (f.slaSource ? " (" + f.slaSource + ")" : "")
              : f.daysLeft +
                  " days left" +
                  (f.slaSource ? " (" + f.slaSource + ")" : ""),
          );
        })}
      </div>
    ) : (
      <V.EmptyState title="Nothing overdue or due in the next 7 days." />
    );
  else
    body = it.regressions.length ? (
      <div className="stack-tight">
        {it.regressions.map(function (f) {
          return row(f, "marked remediated, then found again");
        })}
      </div>
    ) : (
      <V.EmptyState title="No regressions." />
    );
  return (
    <V.Drawer
      eyebrow={"Inbox · " + ctx.me.username}
      title="What needs you"
      onClose={function () {
        p.onClose(Object.keys(viewed.current));
      }}
    >
      <div className="stack">
        <V.Tabs tabs={tabs} value={t} onChange={tb[1]} />
        {body}
      </div>
    </V.Drawer>
  );
}
/* audit trail: search, filter by action or person, page through all 500 kept entries; rows about a finding open it */
