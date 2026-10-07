import { SEV_LABEL, cvssTxt, hostLabel, tagsOf } from "@/app/lib/common";
import { toCsv } from "@/app/lib/export";
import { SINCE_DAYS } from "@/app/lib/filters";
import { vlLabel } from "@/app/lib/integrations";
import { matchDim } from "@/lib/dash";
import { SLA_DAYS, snippetFor } from "@/lib/data";
import { AS_OF } from "@/lib/engine";

export function applyFilters(rows, f, bi, skipCross?, keepSince?) {
  var q = (f.q || "").trim().toLowerCase(),
    cross = f.cross || {};
  var sinceDays = SINCE_DAYS[f.since];
  return rows.filter(function (x) {
    if (f.sev.length && f.sev.indexOf(SEV_LABEL[x.sev]) < 0) return false;
    if (f.tools.length && f.tools.indexOf(x.tool) < 0) return false;
    if (f.hosts && f.hosts.length && f.hosts.indexOf(x.host) < 0) return false;
    if (
      f.ports &&
      f.ports.length &&
      f.ports.indexOf(x.port ? String(x.port) : "n/a") < 0
    )
      return false;
    if (
      sinceDays &&
      !keepSince &&
      (x.firstAgeDays != null ? x.firstAgeDays : x.ageDays) > sinceDays
    )
      return false;
    if (f.kev && !x.kev) return false;
    if (f.ransom && !x.ransomware) return false;
    if (f.zeroday && !x.zeroday) return false;
    if (f.eol && !x.eol) return false;
    if (f.old && !(x.ageDays > 180)) return false;
    if (f.path && !x.onPath) return false;
    if (f.kevOverdue && !(x.kev && x.kevDue && x.kevDue < AS_OF)) return false;
    if (f.bus && f.bus.length && f.bus.indexOf(x.bu || "Unassigned") < 0)
      return false;
    if (f.host && x.host !== f.host) return false;
    if (bi) {
      for (var k in cross) {
        if (k !== skipCross && !matchDim(x, k, cross[k], bi)) return false;
      }
    }
    if (q && q[0] === "#") {
      if (!bi || !bi.tagsOf || bi.tagsOf(x).indexOf(q.slice(1)) < 0)
        return false;
    } else if (
      q &&
      (
        x.name +
        " " +
        x.host +
        " " +
        x.cves.join(" ") +
        " " +
        (x.cwe || []).join(" ") +
        " " +
        (x.ssvc ? "ssvc:" + x.ssvc.decision.toLowerCase() : "")
      )
        .toLowerCase()
        .indexOf(q) < 0
    )
      return false;
    return true;
  });
}

export function lifeLabel(f, ctx) {
  var s2 = ctx.stateOf ? ctx.stateOf(f.key) : null;
  if (s2 === "fp") return "False positive";
  if (s2 === "accepted") return "Accepted";
  if (f.regressed) return "Reopened";
  if (f.unverified) return "Not re-scanned";
  return f.lifecycle;
}

export function toRow(f, ctx) {
  var gg = ctx.g(f);
  return {
    id: f.id,
    risk: f.risk,
    severity: f.sev,
    name: f.name,
    host: hostLabel(f),
    cvss: f.cvss > 0 ? f.cvss : null,
    lifecycle: lifeLabel(f, ctx),
    tool: f.tool,
    tags: tagsOf(f),
    description: f.desc,
    cves: f.cves,
    team: gg.team,
    ticket: gg.ticket,
    sla:
      f.lifecycle === "Fixed" || gg.state === "fp" || gg.state === "accepted"
        ? null
        : {
            status: f.breached ? "breached" : f.atRisk ? "at-risk" : "met",
            days: f.breached ? -f.daysLeft : f.atRisk ? f.daysLeft : undefined,
          },
    snippet: snippetFor(f.name),
    readOnly: ctx.readOnly,
    _f: f,
    /* optional table columns */
    slaLeft:
      f.lifecycle === "Fixed" || gg.state === "fp" || gg.state === "accepted"
        ? null
        : f.daysLeft,
    slaLeftTxt:
      f.lifecycle === "Fixed" || gg.state === "fp" || gg.state === "accepted"
        ? "—"
        : f.daysLeft < 0
          ? "−" + Math.abs(f.daysLeft) + "d"
          : f.daysLeft + "d",
    status: gg.fixed ? "Remediated" : gg.status,
    age: f.ageDays,
    ageTxt: f.ageDays + "d",
    epss: f.epss != null ? f.epss : null,
    epssTxt: f.epss != null ? (f.epss * 100).toFixed(1) + "%" : null,
    ssvc: f.ssvc ? f.ssvc.decision : null,
    owner: gg.team,
    riskTxt: f.risk,
  };
}

export var TABLE_COLS = [
  {
    key: "risk",
    label: "Risk",
    num: true,
    mono: true,
    w: "56px",
  },
  {
    key: "slaLeft",
    label: "SLA left",
    num: true,
    mono: true,
    w: "76px",
  },
  {
    key: "team",
    label: "Owner",
    w: "120px",
    muted: true,
  },
  {
    key: "status",
    label: "Work",
    w: "96px",
    muted: true,
  },
  {
    key: "ticket",
    label: "Ticket",
    w: "84px",
    mono: true,
  },
  {
    key: "age",
    label: "Age",
    num: true,
    mono: true,
    w: "56px",
  },
  {
    key: "epss",
    label: "EPSS",
    num: true,
    mono: true,
    w: "64px",
  },
  {
    key: "ssvc",
    label: "SSVC",
    w: "64px",
  },
];

export var SSVC_TONE = {
  Act: "critical",
  Attend: "high",
  "Track*": "medium",
  Track: "low",
};

/* yyyy-mm-dd + n days, calendar-safe in any time zone */
export function addDays(d0, n) {
  var p = String(d0).slice(0, 10).split("-"),
    d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n));
  return d.toISOString().slice(0, 10);
}
/* ===== bulk triage on selected findings (same rules as one-by-one: exceptions and false positives need an admin) ===== */

/* ===== CVSS calculator (v4.0 and v3.1): an analyst re-scores a finding in its real context ===== */
export var CVSS_DEFS = {
  "4.0": [
    [
      "Attack vector",
      "AV",
      [
        ["N", "Network"],
        ["A", "Adjacent"],
        ["L", "Local"],
        ["P", "Physical"],
      ],
    ],
    [
      "Attack complexity",
      "AC",
      [
        ["L", "Low"],
        ["H", "High"],
      ],
    ],
    [
      "Attack requirements",
      "AT",
      [
        ["N", "None"],
        ["P", "Present"],
      ],
    ],
    [
      "Privileges required",
      "PR",
      [
        ["N", "None"],
        ["L", "Low"],
        ["H", "High"],
      ],
    ],
    [
      "User interaction",
      "UI",
      [
        ["N", "None"],
        ["P", "Passive"],
        ["A", "Active"],
      ],
    ],
    [
      "Vulnerable system confidentiality",
      "VC",
      [
        ["H", "High"],
        ["L", "Low"],
        ["N", "None"],
      ],
    ],
    [
      "Vulnerable system integrity",
      "VI",
      [
        ["H", "High"],
        ["L", "Low"],
        ["N", "None"],
      ],
    ],
    [
      "Vulnerable system availability",
      "VA",
      [
        ["H", "High"],
        ["L", "Low"],
        ["N", "None"],
      ],
    ],
    [
      "Subsequent system confidentiality",
      "SC",
      [
        ["H", "High"],
        ["L", "Low"],
        ["N", "None"],
      ],
    ],
    [
      "Subsequent system integrity",
      "SI",
      [
        ["H", "High"],
        ["L", "Low"],
        ["N", "None"],
      ],
    ],
    [
      "Subsequent system availability",
      "SA",
      [
        ["H", "High"],
        ["L", "Low"],
        ["N", "None"],
      ],
    ],
    [
      "Exploit maturity (threat)",
      "E",
      [
        ["X", "Not defined"],
        ["A", "Attacked"],
        ["P", "PoC"],
        ["U", "Unreported"],
      ],
    ],
  ],
  "3.1": [
    [
      "Attack vector",
      "AV",
      [
        ["N", "Network"],
        ["A", "Adjacent"],
        ["L", "Local"],
        ["P", "Physical"],
      ],
    ],
    [
      "Attack complexity",
      "AC",
      [
        ["L", "Low"],
        ["H", "High"],
      ],
    ],
    [
      "Privileges required",
      "PR",
      [
        ["N", "None"],
        ["L", "Low"],
        ["H", "High"],
      ],
    ],
    [
      "User interaction",
      "UI",
      [
        ["N", "None"],
        ["R", "Required"],
      ],
    ],
    [
      "Scope",
      "S",
      [
        ["U", "Unchanged"],
        ["C", "Changed"],
      ],
    ],
    [
      "Confidentiality",
      "C",
      [
        ["H", "High"],
        ["L", "Low"],
        ["N", "None"],
      ],
    ],
    [
      "Integrity",
      "I",
      [
        ["H", "High"],
        ["L", "Low"],
        ["N", "None"],
      ],
    ],
    [
      "Availability",
      "A",
      [
        ["H", "High"],
        ["L", "Low"],
        ["N", "None"],
      ],
    ],
  ],
};

export function cvssVectorOf(ver, m) {
  return (
    "CVSS:" +
    ver +
    "/" +
    CVSS_DEFS[ver]
      .filter(function (d) {
        return !(d[1] === "E" && m.E === "X");
      })
      .map(function (d) {
        return d[1] + ":" + m[d[1]];
      })
      .join("/")
  );
}

export function jiraCsv(rows, ctx) {
  var pr = {
    critical: "Highest",
    high: "High",
    medium: "Medium",
    low: "Low",
    info: "Lowest",
  };
  return toCsv(
    [
      [
        "Summary",
        "Issue Type",
        "Priority",
        "Description",
        "Labels",
        "Component",
        "Due Date",
      ],
    ].concat(
      rows.map(function (x) {
        var due = addDays(
          x.slaStart || x.firstSeen,
          (x.slaDays != null ? x.slaDays : SLA_DAYS[x.sev]) +
            (x.pausedDays || 0),
        );
        if (x.kevDue && x.kevDue < due) due = x.kevDue;
        return [
          "[" + SEV_LABEL[x.sev] + "] " + x.name + " on " + hostLabel(x),
          "Bug",
          pr[x.sev],
          x.desc +
            "\n\nSolution: " +
            x.sol +
            "\n\nCVE: " +
            (x.cves.join(", ") || "none") +
            " · CVSS " +
            cvssTxt(x) +
            " · Risk " +
            x.risk +
            " · SSVC " +
            x.ssvc.decision +
            "\nFound by " +
            x.tool +
            " · first seen " +
            x.firstSeen,
          ["vaptlens", vlLabel(x.key), "sev-" + x.sev, x.kev ? "kev" : ""]
            .concat(ctx.g(x).tags)
            .filter(Boolean)
            .join(" "),
          ctx.g(x).team,
          due,
        ];
      }),
    ),
  );
}

export function snowCsv(rows, ctx) {
  var u = {
      critical: 1,
      high: 1,
      medium: 2,
      low: 3,
      info: 3,
    },
    im = {
      1: 1,
      2: 2,
      3: 3,
    };
  return toCsv(
    [
      [
        "short_description",
        "description",
        "urgency",
        "impact",
        "assignment_group",
        "cmdb_ci",
        "category",
        "u_cve",
        "u_risk_score",
      ],
    ].concat(
      rows.map(function (x) {
        return [
          SEV_LABEL[x.sev] + ": " + x.name + " (" + hostLabel(x) + ")",
          x.desc + "\n\nSolution: " + x.sol,
          u[x.sev],
          im[x.tier] || 2,
          ctx.g(x).team,
          x.host,
          "Security",
          x.cves.join(" "),
          x.risk,
        ];
      }),
    ),
  );
}
