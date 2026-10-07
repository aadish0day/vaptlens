import { count } from "@/app/lib/common";

/* props that make a list row open the finding drawer (click, Enter or Space) */
export function openRow(c, key, cls) {
  return {
    className: (cls || "") + " link-row",
    role: "button",
    tabIndex: 0,
    onClick: function (e) {
      if (
        e.target.closest("button, a, input, select") &&
        e.target !== e.currentTarget
      )
        return;
      c.openFinding(key);
    },
    onKeyDown: function (e) {
      if (
        (e.key === "Enter" || e.key === " ") &&
        e.target === e.currentTarget
      ) {
        e.preventDefault();
        c.openFinding(key);
      }
    },
  };
}
/* Reject with an optional reason the requester will see */

/* ===== Inbox: what needs *me* — approvals (admins), @mentions, my requests' outcomes, SLA due soon, regressions ===== */
export function inboxItems(ctx) {
  var me0 = ctx.me.username,
    sn = ctx.inboxSeen || {},
    seenM = typeof sn === "string" ? sn : sn.Mentions || "",
    seen0 = typeof sn === "string" ? sn : sn.Mine || "",
    latestRows = {};
  ctx.data.forEach(function (x) {
    if (x.batch === ctx.latest && x.lifecycle !== "Fixed")
      latestRows[x.key] = x;
  });
  var approvals = ctx.isAdmin
    ? Object.keys(latestRows)
        .filter(function (k) {
          var g0 = ctx.gov[k];
          return g0 && g0.state === "requested";
        })
        .map(function (k) {
          return latestRows[k];
        })
    : [];
  var mentions = [],
    mine = [];
  Object.keys(ctx.gov).forEach(function (k) {
    var g0 = ctx.gov[k] || {},
      f = latestRows[k] || ctx.eng.findings[k];
    if (!f) return;
    (g0.notes || []).forEach(function (n) {
      if ((n.mentions || []).indexOf(me0) >= 0 && n.user !== me0)
        mentions.push({
          key: k,
          f: f,
          n: n,
          isNew: n.at > seenM,
        });
    });
    var asked =
      g0.requestedBy === me0 ||
      (g0.by === me0 && (g0.state === "requested" || g0.rejectedBy));
    if (asked && g0.state === "requested")
      mine.push({
        key: k,
        f: f,
        st: "pending",
        at: g0.at,
      });
    else if (asked && g0.rejectedBy && !g0.state)
      mine.push({
        key: k,
        f: f,
        st: "rejected",
        at: g0.rejectedAt,
        by: g0.rejectedBy,
        why: g0.rejectReason,
        isNew: (g0.rejectedAt || "") > seen0,
      });
    else if (g0.requestedBy === me0 && g0.approvedBy && g0.state)
      mine.push({
        key: k,
        f: f,
        st: "approved",
        at: g0.approvedAt,
        by: g0.approvedBy,
        isNew: (g0.approvedAt || "") > seen0,
      });
  });
  mentions.sort(function (a, b) {
    return a.n.at < b.n.at ? 1 : -1;
  });
  mine.sort(function (a, b) {
    return (a.at || "") < (b.at || "") ? 1 : -1;
  });
  /* overdue first, then due within 7 days */
  var due = ctx.active
    .filter(function (x) {
      return x.atRisk || x.breached;
    })
    .sort(function (a, b) {
      return a.daysLeft - b.daysLeft;
    });
  var regressions = ctx.active.filter(function (x) {
    return x.regressed;
  });
  var badge =
    approvals.length +
    count(mentions, function (x) {
      return x.isNew;
    }) +
    count(mine, function (x) {
      return x.isNew;
    });
  return {
    approvals: approvals,
    mentions: mentions,
    mine: mine,
    due: due,
    regressions: regressions,
    badge: badge,
  };
}
