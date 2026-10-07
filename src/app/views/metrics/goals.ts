import { count } from "@/app/lib/common";
import { days } from "@/lib/data";
import { AS_OF, localDay } from "@/lib/engine";

/* ===================== v13: goals, SLA matrix, CMDB, ticket sync, evidence pack ===================== */
export var GOAL_METRICS = [
  ["count", "Open findings matching a filter (≤ target)"],
  ["kevOverdue", "KEV findings past CISA due date (≤ target)"],
  ["slaCompliance", "SLA compliance incl. open breaches (≥ target %)"],
  ["coverage", "Scan coverage (≥ target %)"],
  ["mttrAll", "MTTR in days (≤ target)"],
  ["breached", "SLA-breached findings (≤ target)"],
];

export function goalValue(g, ctx) {
  var m = ctx.metrics,
    f = g.filter || {};
  if (g.metric === "count" || g.metric === "breached")
    return count(ctx.active, function (x) {
      if (f.sev && f.sev.length && f.sev.indexOf(x.sev) < 0) return false;
      if (f.kev && !x.kev) return false;
      if (f.bu && x.bu !== f.bu) return false;
      if (f.tier && x.tier !== +f.tier) return false;
      if (f.ssvc && x.ssvc.decision !== f.ssvc) return false;
      if (f.path && !x.onPath) return false;
      return g.metric === "breached" ? x.breached : true;
    });
  return m[g.metric];
}

export function goalStatus(g, ctx) {
  var v = goalValue(g, ctx),
    higher = g.metric === "slaCompliance" || g.metric === "coverage";
  var met = v != null && (higher ? v >= g.target : v <= g.target);
  var base = g.baseline != null ? g.baseline : v,
    span = higher ? g.target - base : base - g.target;
  var done =
    v == null
      ? 0
      : span <= 0
        ? met
          ? 100
          : 0
        : Math.max(
            0,
            Math.min(
              100,
              Math.round((100 * (higher ? v - base : base - v)) / span),
            ),
          );
  var overdue = g.due && g.due < AS_OF && !met;
  var from = g.baselineAt || g.createdAt,
    elapsed =
      g.due && from
        ? Math.max(
            0,
            Math.min(
              1,
              days(localDay(from), AS_OF) /
                Math.max(1, days(localDay(from), g.due)),
            ),
          )
        : null;
  var st = met
    ? "Met"
    : overdue || g.type === "continuous"
      ? "Missed"
      : elapsed != null && done / 100 < elapsed - 0.15
        ? "At risk"
        : "On track";
  return {
    value: v,
    pct: met ? 100 : done,
    status: st,
    higher: higher,
  };
}
