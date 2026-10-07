import { count } from "@/app/lib/common";
import { assetOf, assetRisk } from "@/lib/engine";

/* ================= 2. Assets ================= */
/* host profiles are reused until the active findings or asset profiles change (20k-row workspaces open drawers instantly) */
export function hostProfiles(ctx) {
  var c = (hostProfiles as any)._c;
  if (c && c.a === ctx.active && c.s === ctx.assets && c.d === ctx.data)
    return c.v;
  var v = hostProfilesRaw(ctx);
  (hostProfiles as any)._c = {
    a: ctx.active,
    s: ctx.assets,
    d: ctx.data,
    v: v,
  };
  return v;
}

export function hostProfilesRaw(ctx) {
  var byHost = {};
  ctx.active.forEach(function (x) {
    (byHost[x.host] = byHost[x.host] || []).push(x);
  });
  return Object.keys(byHost)
    .map(function (hh) {
      var r = byHost[hh],
        p = assetOf(hh, ctx.assets);
      var crit = count(r, function (x) {
          return x.sev === "critical";
        }),
        high = count(r, function (x) {
          return x.sev === "high";
        });
      return {
        host: hh,
        device: p.device,
        os: p.os,
        owner: p.owner,
        tier: p.tier,
        exposure: p.exposure,
        eol: r.some(function (x) {
          return x.eol;
        }),
        counts: {
          critical: crit,
          high: high,
          medium: count(r, function (x) {
            return x.sev === "medium";
          }),
        },
        score: assetRisk(r),
        bu: p.bu,
        tags: p.tags,
        onPath: r.some(function (x) {
          return x.onPath;
        }),
        rows: r,
      };
    })
    .sort(function (a, b) {
      return b.score - a.score;
    });
}
