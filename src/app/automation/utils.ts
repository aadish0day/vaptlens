import { count, hostLabel } from "@/app/lib/common";
import { campaignStats } from "@/app/views/remediation/utils";
import { AS_OF, threatIndex } from "@/lib/engine";

/* ===================== v12: exposure management features ===================== */
export var DEFAULT_RULES = [
  {
    id: "r-kev-edge",
    name: "Known-exploited on internet-facing hosts → SecOps, ticket",
    enabled: true,
    when: {
      kev: true,
      exposure: "internet",
    },
    then: {
      team: "SecOps",
      tag: "kev-edge",
      ticket: true,
    },
  },
  {
    id: "r-act",
    name: "SSVC Act → tag act-now, Accountable",
    enabled: true,
    when: {
      ssvc: ["Act"],
    },
    then: {
      tag: "act-now",
      raci: "A",
    },
  },
  {
    id: "r-db",
    name: "Database findings → Database DBAs",
    enabled: false,
    when: {
      name: "MySQL",
    },
    then: {
      team: "Database DBAs",
    },
  },
];

/* ---------- digest ---------- */
export function digestMd(ctx) {
  var a = ctx.active,
    m = ctx.metrics,
    last = ctx.batches[ctx.batches.length - 1],
    top = a
      .slice()
      .sort(function (x, y) {
        return y.risk - x.risk;
      })
      .slice(0, 5);
  var nw = a.filter(function (x) {
      return x.lifecycle === "New";
    }),
    re = a.filter(function (x) {
      return x.lifecycle === "Reopened";
    }),
    fixed = ctx.data.filter(function (x) {
      return x.batch === ctx.latest && x.lifecycle === "Fixed";
    });
  var L = [
    "# VAPTLens digest · " + AS_OF,
    "",
    "Scan **" +
      last.label +
      "** (" +
      last.date +
      ") · " +
      a.length +
      " active findings · threat index " +
      threatIndex(a) +
      "/100",
    "",
    "- New: " +
      nw.length +
      " · Reopened: " +
      re.length +
      " · Verified fixed: " +
      fixed.length,
    "- SLA breached: " +
      count(a, function (x) {
        return x.breached;
      }) +
      " · at risk ≤7d: " +
      count(a, function (x) {
        return x.atRisk;
      }),
    "- CISA KEV: " +
      count(a, function (x) {
        return x.kev;
      }) +
      " · SSVC Act: " +
      count(a, function (x) {
        return x.ssvc.decision === "Act";
      }) +
      " · on an attack path: " +
      count(a, function (x) {
        return x.onPath;
      }),
    "- MTTR: " +
      (m.mttrAll == null ? "—" : m.mttrAll + " days") +
      " · coverage " +
      m.coverage +
      "%",
    "",
    "## Top 5 risks",
    "",
  ];
  top.forEach(function (x, i) {
    L.push(
      i +
        1 +
        ". **" +
        x.name +
        "** on `" +
        hostLabel(x) +
        "` — risk " +
        x.risk +
        ", SSVC " +
        x.ssvc.decision +
        (x.kev ? ", KEV" : "") +
        (x.breached ? ", SLA breached" : ""),
    );
  });
  if (ctx.attack.chokes[0]) {
    L.push(
      "",
      "## Attack paths",
      "",
      ctx.attack.paths.length +
        " paths reach " +
        ctx.attack.reached.length +
        " crown jewels. Fixing **" +
        ctx.attack.chokes[0].finding.name +
        "** on `" +
        ctx.attack.chokes[0].host +
        "` cuts " +
        ctx.attack.chokes[0].paths +
        " of them.",
    );
  }
  var cs = ctx.campaigns.map(function (c) {
    return [c, campaignStats(c, ctx)];
  });
  if (cs.length) {
    L.push("", "## Campaigns", "");
    cs.forEach(function (x) {
      L.push(
        "- " +
          x[0].name +
          " — " +
          x[1].pct +
          "% done, due " +
          x[0].due +
          (x[1].overdue ? " (**overdue**)" : ""),
      );
    });
  }
  L.push("", "_Generated locally by VAPTLens; no data left this browser._");
  return L.join("\n");
}

/* ---------- Command palette ---------- */
