import { uniq } from "@/app/lib/common";
import { SLA_DAYS } from "@/lib/data";

export function decisionTxt(x, ctx) {
  var g0 = ctx.gov[x.key] || {},
    st = ctx.stateOf(x.key);
  return g0.state === "requested"
    ? "Pending approval (" +
        (g0.requestedState === "fp" ? "false positive" : "exception") +
        ")"
    : st === "fp"
      ? "False positive"
      : st === "expired"
        ? "Expired " + (g0.until || "")
        : "Accepted";
}
/* pause the SLA clock while waiting on a vendor or a change window; every pause has a reason and shows in the timeline */

/* ================= 3. SLA & RACI ================= */
/* SLA label for a severity: the base window, or a range when tier overrides apply to some findings */
export function slaRange(r, s, ctx) {
  var v = uniq(
    r
      .map(function (x) {
        return x.slaDays;
      })
      .filter(function (x) {
        return x != null;
      }),
  ).sort(function (a, b) {
    return a - b;
  });
  if (!v.length) return ((ctx.sla && ctx.sla[s]) || SLA_DAYS[s]) + "d";
  return v.length === 1 ? v[0] + "d" : v[0] + "–" + v[v.length - 1] + "d";
}
