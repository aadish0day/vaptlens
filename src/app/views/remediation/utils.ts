import { count } from "@/app/lib/common";
import { AS_OF } from "@/lib/engine";

export function campaignStats(c, ctx) {
  var act = {};
  ctx.active.forEach(function (f) {
    act[f.key] = f;
  });
  var open = c.keys.filter(function (k) {
    return act[k];
  });
  /* done = verified fixed by a re-scan; excepted and orphaned keys are reported, not counted as progress */
  var done = count(c.keys, function (k) {
    var fi = ctx.eng.findings[k];
    return fi && fi.state === "fixed";
  });
  var excepted = count(c.keys, function (k) {
      var s2 = ctx.stateOf(k);
      return !act[k] && (s2 === "fp" || s2 === "accepted");
    }),
    orphan = count(c.keys, function (k) {
      return !ctx.eng.findings[k];
    });
  var pct = c.keys.length ? Math.round((100 * done) / c.keys.length) : 0,
    overdue = c.due && c.due < AS_OF && open.length > 0;
  return {
    open: open.map(function (k) {
      return act[k];
    }),
    done: done,
    excepted: excepted,
    orphan: orphan,
    pct: pct,
    overdue: overdue,
    risk: open.reduce(function (t, k) {
      return t + act[k].risk;
    }, 0),
  };
}
