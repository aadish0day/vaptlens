import { days } from "@/lib/data";
import { AS_OF, assetOf, familiesOf, localDay } from "@/lib/engine";

/* ===================== Risk & Compliance center ===================== */
/* Framework checks are computed from your own data. They show where you stand against each control's
     vulnerability-management requirement; they are evidence for an auditor, not a certification. */
export var CUR = {
  USD: ["$", "en-US"],
  INR: ["₹", "en-IN"],
  EUR: ["€", "de-DE"],
  GBP: ["£", "en-GB"],
};

export function money(v, cur) {
  var c = CUR[cur] || CUR.USD;
  var n = Math.round(v || 0);
  return c[0] + n.toLocaleString(c[1]);
}

export function govFacts(ctx) {
  var a = ctx.active,
    m = ctx.metrics,
    pol = ctx.policy || {};
  function olderThan(sevs, d) {
    return a.filter(function (x) {
      return (
        sevs.indexOf(x.sev) >= 0 && days(x.slaStart || x.firstSeen, AS_OF) > d
      );
    });
  }
  var lastScanBy = {};
  ctx.batches.forEach(function (b) {
    Object.keys(ctx.eng.scope[b.id] || {}).forEach(function (hh) {
      lastScanBy[hh] = b.date;
    });
  });
  var hosts = Object.keys(lastScanBy).filter(function (hh) {
    return !(ctx.assets[hh] && ctx.assets[hh].retired);
  });
  function notScanned(d, pred) {
    return hosts
      .filter(function (hh) {
        return (!pred || pred(hh)) && days(lastScanBy[hh], AS_OF) > d;
      })
      .map(function (hh) {
        return {
          host: hh,
          last: lastScanBy[hh],
        };
      });
  }
  var internet = function (hh) {
    return assetOf(hh, ctx.assets).exposure === "internet";
  };
  var tier1 = function (hh) {
    return assetOf(hh, ctx.assets).tier === 1;
  };
  var webTools = /burp|zap|nuclei|nikto|wapiti|acunetix|manual|pentest/i;
  var lastPentest =
    ctx.batches
      .filter(function (b) {
        return webTools.test(b.tools || "");
      })
      .map(function (b) {
        return b.date;
      })
      .sort()
      .pop() || null;
  var decisions = Object.keys(ctx.gov).filter(function (k) {
    var g0 = ctx.gov[k];
    return g0 && (g0.state === "accepted" || g0.state === "fp");
  });
  var undocumented = decisions.filter(function (k) {
    var g0 = ctx.gov[k];
    return (
      !g0.reason ||
      !(g0.approvedBy || g0.by) ||
      (g0.state === "accepted" && !g0.until)
    );
  });
  var tooLong = decisions.filter(function (k) {
    var g0 = ctx.gov[k],
      f = ctx.eng.findings[k] || {};
    return (
      g0.state === "accepted" &&
      g0.until &&
      g0.at &&
      days(localDay(g0.at), g0.until) > ((pol.maxDays || {})[f.sev] || 365)
    );
  });
  var expired = Object.keys(ctx.gov).filter(function (k) {
    return ctx.stateOf(k) === "expired";
  });
  var feeds = !!(ctx.intel && ctx.intel.kevCount),
    epss = !!(ctx.intel && ctx.intel.epssCount);
  return {
    a: a,
    m: m,
    olderThan: olderThan,
    notScanned: notScanned,
    internet: internet,
    tier1: tier1,
    lastPentest: lastPentest,
    undocumented: undocumented,
    tooLong: tooLong,
    expired: expired,
    feeds: feeds,
    epss: epss,
    eol: a.filter(function (x) {
      return x.eol;
    }),
    kevOver: a.filter(function (x) {
      return x.kev && x.kevDue && x.kevDue < AS_OF;
    }),
    kevNet: a.filter(function (x) {
      return x.kev && x.exposure === "internet";
    }),
    vexN: (ctx.vexList || []).length,
    hostsN: hosts.length,
  };
}
/* each check returns { st: pass|warn|fail|info, txt, rows (findings), hosts (stale hosts) } */

/* each check returns { st: pass|warn|fail|info, txt, rows (findings), hosts (stale hosts) } */
export function ck(cond, txtOk, txtBad, rows, warnOnly?) {
  return cond
    ? {
        st: "pass",
        txt: txtOk,
      }
    : {
        st: warnOnly ? "warn" : "fail",
        txt: txtBad,
        rows: rows,
      };
}

export var FRAMEWORKS = [
  {
    id: "pci",
    name: "PCI DSS 4.0.1",
    region: "Global · card data",
    preset: {
      critical: 30,
      high: 30,
      medium: 90,
      low: 180,
      info: 360,
    },
    presetNote: "Critical security patches within one month (6.3.3).",
    controls: [
      [
        "6.3.1",
        "Vulnerabilities are identified and ranked by risk",
        function (F) {
          return {
            st: "pass",
            txt: "Every finding has CVSS, EPSS/KEV context, a 0–100 risk score and an SSVC decision.",
          };
        },
      ],
      [
        "6.3.3",
        "Critical security patches installed within one month",
        function (F) {
          var r = F.olderThan(["critical"], 30);
          return ck(
            !r.length,
            "No critical finding has been open more than 30 days.",
            r.length + " critical finding(s) open more than 30 days.",
            r,
          );
        },
      ],
      [
        "11.3.1",
        "Internal vulnerability scans at least every three months",
        function (F) {
          var h0 = F.notScanned(92, function (hh) {
            return !F.internet(hh);
          });
          return h0.length
            ? {
                st: "fail",
                txt:
                  h0.length +
                  " internal host(s) not scanned in the last 3 months.",
                hosts: h0,
              }
            : {
                st: "pass",
                txt: "Every internal host was scanned in the last 3 months.",
              };
        },
      ],
      [
        "11.3.1",
        "High-risk and critical findings resolved, then rescanned",
        function (F) {
          var r = F.a.filter(function (x) {
            return (x.sev === "critical" || x.sev === "high") && x.breached;
          });
          return ck(
            !r.length && !F.m.manualPending,
            "No high or critical finding past its SLA, and nothing awaiting a rescan.",
            r.length +
              " high/critical past SLA" +
              (F.m.manualPending
                ? " · " +
                  F.m.manualPending +
                  " marked fixed but not yet rescanned"
                : "") +
              ".",
            r,
          );
        },
      ],
      [
        "11.3.2",
        "External scans at least every three months (ASV)",
        function (F) {
          var h0 = F.notScanned(92, F.internet);
          return h0.length
            ? {
                st: "fail",
                txt:
                  h0.length +
                  " internet-facing host(s) not scanned in 3 months. Quarterly external scans must be run by a PCI SSC Approved Scanning Vendor.",
                hosts: h0,
              }
            : {
                st: "pass",
                txt: "Every internet-facing host was scanned in the last 3 months (confirm the scans came from your ASV).",
              };
        },
      ],
      [
        "11.4.1",
        "Penetration testing at least once every 12 months",
        function (F) {
          return F.lastPentest && days(F.lastPentest, AS_OF) <= 365
            ? {
                st: "pass",
                txt:
                  "Last application/penetration test scan: " +
                  F.lastPentest +
                  ".",
              }
            : {
                st: "warn",
                txt: F.lastPentest
                  ? "Last pentest-type scan was " +
                    F.lastPentest +
                    " (over 12 months)."
                  : "No penetration-test results imported (Burp, ZAP, Nuclei…).",
              };
        },
      ],
    ],
  },
  {
    id: "iso",
    name: "ISO/IEC 27001:2022",
    region: "Global",
    controls: [
      [
        "A.8.8",
        "Technical vulnerabilities: timely identification",
        function (F) {
          return ck(
            F.m.coverage >= 90,
            "Scan coverage " +
              F.m.coverage +
              "% of known hosts in the latest scan.",
            "Scan coverage is " + F.m.coverage + "% (below 90%).",
            null,
            true,
          );
        },
      ],
      [
        "A.8.8",
        "Exposure evaluated and appropriate measures taken",
        function (F) {
          return ck(
            F.m.slaCompliance == null || F.m.slaCompliance >= 80,
            "SLA compliance " +
              (F.m.slaCompliance == null ? "n/a" : F.m.slaCompliance + "%") +
              ".",
            "SLA compliance is " + F.m.slaCompliance + "% (below 80%).",
            F.a.filter(function (x) {
              return x.breached;
            }),
          );
        },
      ],
      [
        "A.5.9",
        "Asset inventory with owners",
        function (F) {
          return {
            st: "info",
            txt:
              F.hostsN +
              " hosts known. Import owners and tiers from your CMDB (Asset Inventory → CMDB) so every finding routes to an accountable owner.",
          };
        },
      ],
      [
        "A.8.8 / A.5.36",
        "Risk acceptances documented and approved",
        function (F) {
          return ck(
            !F.undocumented.length && !F.expired.length,
            "Every exception has a reason, an approver and an end date.",
            F.undocumented.length +
              " exception(s) missing reason/approver/end date · " +
              F.expired.length +
              " expired.",
            null,
          );
        },
      ],
    ],
  },
  {
    id: "nist",
    name: "NIST CSF 2.0",
    region: "US · global",
    controls: [
      [
        "ID.RA-01",
        "Vulnerabilities in assets are identified and recorded",
        function (F) {
          return ck(
            F.m.coverage >= 90,
            "Coverage " + F.m.coverage + "%.",
            "Coverage " +
              F.m.coverage +
              "% — " +
              F.m.stale.length +
              " host(s) missing from the latest scan.",
            null,
            true,
          );
        },
      ],
      [
        "ID.RA-02",
        "Cyber threat intelligence is received",
        function (F) {
          return ck(
            F.feeds && F.epss,
            "CISA KEV and FIRST EPSS feeds loaded.",
            "Load the full CISA KEV" +
              (F.epss ? "" : " and FIRST EPSS") +
              " feed in Data → Threat intel.",
            null,
            true,
          );
        },
      ],
      [
        "ID.RA-05",
        "Threats, vulnerabilities, likelihoods and impacts are used to prioritise",
        function () {
          return {
            st: "pass",
            txt: "Risk score combines severity, EPSS/KEV likelihood and asset tier/exposure; SSVC decisions per finding.",
          };
        },
      ],
      [
        "ID.RA-08",
        "Processes for receiving and responding to vulnerability disclosures",
        function (F) {
          return {
            st: F.vexN ? "pass" : "info",
            txt: F.vexN
              ? F.vexN + " VEX statements on file and applied to every scan."
              : "No VEX statements yet; import CycloneDX/OpenVEX from suppliers to record disclosures.",
          };
        },
      ],
      [
        "PR.PS-02",
        "Software is maintained, replaced and removed commensurate with risk",
        function (F) {
          return ck(
            !F.eol.length,
            "No end-of-life software in the active findings.",
            F.eol.length + " end-of-life software finding(s).",
            F.eol,
            true,
          );
        },
      ],
    ],
  },
  {
    id: "soc2",
    name: "SOC 2 (TSC 2017)",
    region: "US · global",
    controls: [
      [
        "CC7.1",
        "Detection procedures identify vulnerabilities (regular scanning)",
        function (F) {
          var h0 = F.notScanned(31);
          return h0.length
            ? {
                st: "warn",
                txt: h0.length + " host(s) not scanned in the last 31 days.",
                hosts: h0,
              }
            : {
                st: "pass",
                txt: "Every host scanned in the last month.",
              };
        },
      ],
      [
        "CC7.1",
        "Identified vulnerabilities are remediated timely",
        function (F) {
          return ck(
            F.m.slaCompliance == null || F.m.slaCompliance >= 80,
            "SLA compliance " +
              (F.m.slaCompliance == null ? "n/a" : F.m.slaCompliance + "%") +
              ".",
            "SLA compliance " + F.m.slaCompliance + "%.",
            F.a.filter(function (x) {
              return x.breached;
            }),
          );
        },
      ],
      [
        "CC4.1",
        "Monitoring evidence is complete and tamper-evident",
        function (F, A) {
          return A
            ? A.ok
              ? {
                  st: "pass",
                  txt:
                    "Governance audit trail hash chain verifies (" +
                    A.n +
                    " entries).",
                }
              : {
                  st: "fail",
                  txt:
                    "Audit chain broken at entry " +
                    A.at +
                    " (" +
                    A.reason +
                    ").",
                }
            : {
                st: "info",
                txt: "Verifying the audit chain…",
              };
        },
      ],
    ],
  },
  {
    id: "cis",
    name: "CIS Controls v8.1",
    region: "Global",
    controls: [
      [
        "7.5",
        "Automated scans of internal assets — quarterly or more often",
        function (F) {
          var h0 = F.notScanned(92, function (hh) {
            return !F.internet(hh);
          });
          return h0.length
            ? {
                st: "fail",
                txt: h0.length + " internal host(s) not scanned in 3 months.",
                hosts: h0,
              }
            : {
                st: "pass",
                txt: "Internal assets scanned within the quarter.",
              };
        },
      ],
      [
        "7.6",
        "Automated scans of externally exposed assets — monthly or more often",
        function (F) {
          var h0 = F.notScanned(31, F.internet);
          return h0.length
            ? {
                st: "fail",
                txt:
                  h0.length +
                  " internet-facing host(s) not scanned in the last month.",
                hosts: h0,
              }
            : {
                st: "pass",
                txt: "Every internet-facing host scanned this month.",
              };
        },
      ],
      [
        "7.7",
        "Remediate detected vulnerabilities — monthly or more often, risk-based",
        function (F) {
          var r = F.olderThan(["critical", "high"], 31);
          return ck(
            !r.length,
            "No critical or high finding open more than a month.",
            r.length + " critical/high finding(s) open more than a month.",
            r,
            true,
          );
        },
      ],
    ],
  },
  {
    id: "sebi",
    name: "SEBI CSCRF",
    region: "India · capital markets",
    preset: {
      critical: 7,
      high: 7,
      medium: 90,
      low: 90,
      info: 90,
    },
    presetNote:
      "High-severity patch flaws within one week; every VAPT finding within three months of the report.",
    controls: [
      [
        "VAPT closure",
        "High-severity (patch-related) vulnerabilities fixed within one week",
        function (F) {
          var r = F.olderThan(["critical", "high"], 7);
          return ck(
            !r.length,
            "No critical/high finding open more than 7 days.",
            r.length + " critical/high finding(s) open more than 7 days.",
            r,
          );
        },
      ],
      [
        "VAPT closure",
        "Every VAPT finding closed within three months of the report",
        function (F) {
          var r = F.a.filter(function (x) {
            return days(x.firstSeen, AS_OF) > 90 && x.sev !== "info";
          });
          return ck(
            !r.length,
            "Nothing open beyond 3 months.",
            r.length +
              " finding(s) open beyond 3 months — these need IT Committee approval and documented justification.",
            r,
          );
        },
      ],
      [
        "VAPT cycle",
        "VAPT half-yearly (MIIs, Qualified Stock Brokers) or annually (others), and after major releases",
        function (F) {
          return F.lastPentest && days(F.lastPentest, AS_OF) <= 183
            ? {
                st: "pass",
                txt:
                  "Last VAPT-type scan " +
                  F.lastPentest +
                  " (within 6 months).",
              }
            : F.lastPentest && days(F.lastPentest, AS_OF) <= 365
              ? {
                  st: "warn",
                  txt:
                    "Last VAPT-type scan " +
                    F.lastPentest +
                    ": fine for an annual cycle, overdue for half-yearly entities.",
                }
              : {
                  st: "fail",
                  txt: "No VAPT results in the last 12 months.",
                };
        },
      ],
      [
        "Auditor",
        "VAPT by a CERT-In empanelled auditor",
        function (F, A, ctx) {
          var e = ctx.engagement || {};
          return {
            st: e.client || e.testers ? "info" : "warn",
            txt:
              "Record the empanelled auditing organisation in the engagement details (Executive Report → Engagement)." +
              (e.testers ? " Testers: " + e.testers + "." : ""),
          };
        },
      ],
    ],
  },
  {
    id: "rbi",
    name: "RBI cyber security (banks / NBFCs)",
    region: "India · banking",
    controls: [
      [
        "Risk-based VAPT",
        "Periodic VAPT of critical systems on a risk-based cycle",
        function (F) {
          var h0 = F.notScanned(183, F.tier1);
          return h0.length
            ? {
                st: "warn",
                txt:
                  h0.length +
                  " crown-jewel (Tier 1) host(s) not assessed in 6 months.",
                hosts: h0,
              }
            : {
                st: "pass",
                txt: "Every Tier 1 host assessed in the last 6 months.",
              };
        },
      ],
      [
        "Patch management",
        "Critical patches applied on a risk-based timeline",
        function (F) {
          var r = F.a.filter(function (x) {
            return (
              x.tier === 1 && (x.sev === "critical" || x.kev) && x.breached
            );
          });
          return ck(
            !r.length,
            "No critical/KEV finding on a crown jewel past its SLA.",
            r.length + " critical/KEV finding(s) on crown jewels past SLA.",
            r,
          );
        },
      ],
      [
        "Note",
        "The framework sets risk-based periodicity rather than fixed day counts",
        function () {
          return {
            st: "info",
            txt: "Set your board-approved timelines in SLA windows; these checks use them.",
          };
        },
      ],
    ],
  },
  {
    id: "dora",
    name: "EU DORA",
    region: "EU · financial entities",
    controls: [
      [
        "Art. 9",
        "ICT security: patch and update procedures",
        function (F) {
          return ck(
            F.m.slaCompliance == null || F.m.slaCompliance >= 80,
            "SLA compliance " +
              (F.m.slaCompliance == null ? "n/a" : F.m.slaCompliance + "%") +
              ".",
            "SLA compliance " + F.m.slaCompliance + "%.",
            F.a.filter(function (x) {
              return x.breached;
            }),
            true,
          );
        },
      ],
      [
        "Art. 24–25",
        "Vulnerability assessments and scans at least yearly on systems supporting critical functions",
        function (F) {
          var h0 = F.notScanned(365, F.tier1);
          return h0.length
            ? {
                st: "fail",
                txt: h0.length + " Tier 1 host(s) not assessed in 12 months.",
                hosts: h0,
              }
            : {
                st: "pass",
                txt: "Every Tier 1 host assessed within 12 months.",
              };
        },
      ],
      [
        "Art. 26",
        "Threat-led penetration testing (TLPT) every 3 years for significant entities",
        function (F) {
          return {
            st: "info",
            txt:
              'Record TLPT engagements as scans (tool "Manual pentest") so the cycle is tracked.' +
              (F.lastPentest
                ? " Last pentest-type scan " + F.lastPentest + "."
                : ""),
          };
        },
      ],
    ],
  },
  {
    id: "nis2",
    name: "EU NIS2",
    region: "EU · essential & important entities",
    controls: [
      [
        "Art. 21(2)(e)",
        "Vulnerability handling",
        function (F) {
          return ck(
            !F.kevOver.length,
            "No known-exploited (KEV) finding past its due date.",
            F.kevOver.length + " KEV finding(s) past the CISA due date.",
            F.kevOver,
          );
        },
      ],
      [
        "Art. 21(2)(e)",
        "Vulnerability disclosure from suppliers recorded",
        function (F) {
          return {
            st: F.vexN ? "pass" : "info",
            txt: F.vexN
              ? F.vexN + " supplier VEX statements on file."
              : "No supplier VEX statements yet.",
          };
        },
      ],
      [
        "Art. 21(2)(d)",
        "Supply-chain security",
        function (F) {
          var r = F.a.filter(function (x) {
            return (
              familiesOf(x.tool).indexOf("sca") >= 0 &&
              (x.sev === "critical" || x.kev)
            );
          });
          return ck(
            !r.length,
            "No critical or KEV vulnerability in third-party components.",
            r.length + " critical/KEV dependency finding(s) (SCA).",
            r,
            true,
          );
        },
      ],
    ],
  },
  {
    id: "certin",
    name: "CERT-In Directions (2022)",
    region: "India",
    controls: [
      [
        "Incident reporting",
        "Exploited vulnerabilities on internet-facing systems can become reportable incidents (6-hour window)",
        function (F) {
          return F.kevNet.length
            ? {
                st: "warn",
                txt:
                  F.kevNet.length +
                  " known-exploited (KEV) finding(s) on internet-facing hosts. If any was exploited, report to CERT-In within 6 hours of noticing.",
                rows: F.kevNet,
              }
            : {
                st: "pass",
                txt: "No known-exploited finding on an internet-facing host.",
              };
        },
      ],
      [
        "Logs",
        "ICT system logs kept for 180 days",
        function () {
          return {
            st: "info",
            txt: "Outside a vulnerability tool's scope; keep the governance audit export with your log archive.",
          };
        },
      ],
    ],
  },
];

export function runFramework(fw, F, A, ctx) {
  return fw.controls.map(function (c) {
    var r = c[2](F, A, ctx) || {
      st: "info",
      txt: "",
    };
    return {
      id: c[0],
      title: c[1],
      st: r.st,
      txt: r.txt,
      rows: r.rows || [],
      hosts: r.hosts || [],
    };
  });
}

export var ST_LABEL = {
  pass: "Pass",
  warn: "Attention",
  fail: "Gap",
  info: "Info",
};

/* FAIR-lite: annualised loss exposure from asset value × likelihood × impact. An order-of-magnitude estimate. */
export function riskMoneyOf(ctx, skip?) {
  var pol = ctx.policy || {},
    av = pol.assetValue || {
      1: 5000000,
      2: 1000000,
      3: 150000,
    };
  var IMP = {
      critical: 0.6,
      high: 0.35,
      medium: 0.15,
      low: 0.05,
      info: 0,
    },
    EXPO = {
      internet: 1,
      internal: 0.6,
      isolated: 0.3,
    },
    BASE = {
      critical: 0.2,
      high: 0.1,
      medium: 0.04,
      low: 0.01,
      info: 0,
    };
  var byHost = {},
    items = [];
  ctx.active.forEach(function (x) {
    if (skip && skip[x.key]) return;
    var pr = Math.min(
      0.95,
      Math.max(
        BASE[x.sev] || 0,
        x.epss || 0,
        x.kev ? 0.9 : 0,
        x.zeroday ? 0.6 : 0,
        x.exploitable ? 0.3 : 0,
        x.validation === "confirmed" ? 0.7 : 0,
      ) * (x.validation === "not_reproducible" ? 0.3 : 1),
    );
    var val = av[x.tier] || av[2],
      loss = pr * (IMP[x.sev] || 0) * (EXPO[x.exposure] || 0.6);
    byHost[x.host] = byHost[x.host] || {
      host: x.host,
      bu: x.bu || "Unassigned",
      val: val,
      keep: 1,
      n: 0,
    };
    byHost[x.host].keep *= 1 - loss;
    byHost[x.host].n++;
    items.push({
      f: x,
      ale: loss * val,
    });
  });
  var hosts = Object.keys(byHost)
    .map(function (hh) {
      var o = byHost[hh];
      o.ale = o.val * (1 - o.keep);
      return o;
    })
    .sort(function (a, b) {
      return b.ale - a.ale;
    });
  var total = hosts.reduce(function (t, o) {
      return t + o.ale;
    }, 0),
    bu = {};
  hosts.forEach(function (o) {
    bu[o.bu] = (bu[o.bu] || 0) + o.ale;
  });
  return {
    total: total,
    hosts: hosts,
    bu: Object.keys(bu)
      .map(function (k) {
        return {
          bu: k,
          ale: bu[k],
        };
      })
      .sort(function (a, b) {
        return b.ale - a.ale;
      }),
    items: items.sort(function (a, b) {
      return b.ale - a.ale;
    }),
  };
}
