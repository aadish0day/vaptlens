import { digestMd } from "@/app/automation/utils";
import { nowIso, uniq } from "@/app/lib/common";
import { slug, toCsv } from "@/app/lib/export";
import { lifeLabel } from "@/app/views/findings/utils";
import {
  AS_OF,
  assetOf,
  assetRisk,
  canonHost,
  complianceOf,
  threatIndex,
} from "@/lib/engine";
import { AUDIT, P, WS } from "@/lib/store";
import Papa from "papaparse";

/* CMDB / asset inventory CSV: host, owner, business unit, tier, exposure, well-being, tags, device, os, retired */
export function parseAssetCsv(text, ctx) {
  ctx = ctx || {};
  var r = Papa.parse(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: true,
    transformHeader: function (x) {
      return String(x).trim().toLowerCase();
    },
  });
  var H = r.meta.fields || [];
  function col(names) {
    return H.find(function (hh) {
      return names.indexOf(hh) >= 0;
    });
  }
  var cHost = col([
    "host",
    "hostname",
    "ip",
    "ip address",
    "asset",
    "fqdn",
    "name",
    "ci",
    "cmdb_ci",
  ]);
  if (!cHost) throw new Error("no host / IP / hostname column found");
  var C = {
    owner: col([
      "owner",
      "team",
      "owner team",
      "assignment_group",
      "support group",
    ]),
    bu: col([
      "business unit",
      "bu",
      "department",
      "business_unit",
      "application",
    ]),
    tier: col([
      "tier",
      "criticality",
      "business criticality",
      "asset criticality",
      "acs",
    ]),
    exposure: col(["exposure", "internet facing", "zone", "network zone"]),
    wellbeing: col([
      "wellbeing",
      "well-being",
      "safety impact",
      "public impact",
    ]),
    tags: col(["tags", "labels"]),
    device: col(["device", "type", "class", "sys_class_name"]),
    os: col(["os", "operating system"]),
    retired: col(["retired", "decommissioned", "status"]),
  };
  var out = {};
  r.data.forEach(function (row0) {
    var hh = String(row0[cHost] || "")
      .trim()
      .toLowerCase();
    if (!hh) return;
    hh = canonHost(hh, ctx.aliases || {});
    var a: any = {};
    if (C.owner && row0[C.owner]) a.owner = String(row0[C.owner]).trim();
    if (C.bu && row0[C.bu]) a.bu = String(row0[C.bu]).trim();
    if (C.tier && row0[C.tier]) {
      /* ServiceNow busines_criticality is "1 - most critical" … "4 - not critical": the leading number wins, 1 = most critical */
      var tv = String(row0[C.tier]).toLowerCase().trim(),
        lead = /^\s*(\d)/.exec(tv),
        n = lead ? +lead[1] : parseInt(tv.replace(/\D/g, ""), 10);
      if (lead || (!isNaN(n) && /^\d+$/.test(tv)))
        a.tier = n <= 1 ? 1 : n === 2 ? 2 : 3;
      else if (/not|less|low|minimal|bronze|tier ?3\b/.test(tv)) a.tier = 3;
      else if (/somewhat|medium|moderate|support|silver|tier ?2\b/.test(tv))
        a.tier = 2;
      else if (/crown|most|critical|high|essential|gold|tier ?1\b/.test(tv))
        a.tier = 1;
    }
    if (C.exposure && row0[C.exposure]) {
      var ev = String(row0[C.exposure]).toLowerCase();
      a.exposure = /isol|segment|air/.test(ev)
        ? "isolated"
        : /yes|true|internet|external|public|dmz/.test(ev)
          ? "internet"
          : "internal";
    }
    if (C.wellbeing && row0[C.wellbeing]) {
      var wv = String(row0[C.wellbeing]).toLowerCase();
      a.wellbeing = /irrevers|catastroph|life|safety/.test(wv)
        ? "irreversible"
        : /material|significant|high/.test(wv)
          ? "material"
          : "minimal";
    }
    if (C.tags && row0[C.tags])
      a.tags = String(row0[C.tags])
        .split(/[;,|]/)
        .map(function (x) {
          return x.trim().toLowerCase();
        })
        .filter(Boolean);
    if (C.device && row0[C.device]) a.device = String(row0[C.device]).trim();
    if (C.os && row0[C.os]) a.os = String(row0[C.os]).trim();
    if (C.retired && row0[C.retired])
      a.retired = /yes|true|retired|decom|disposed/i.test(
        String(row0[C.retired]),
      );
    out[hh] = a;
  });
  return out;
}

export function assetsCsv(ctx) {
  var hosts = uniq(
    ctx.data
      .map(function (x) {
        return x.host;
      })
      .concat(Object.keys(ctx.assets)),
  ).sort();
  return toCsv(
    [
      [
        "host",
        "owner",
        "business unit",
        "tier",
        "exposure",
        "wellbeing",
        "tags",
        "device",
        "os",
        "retired",
        "asset risk",
        "open findings",
      ],
    ].concat(
      hosts.map(function (hh) {
        var a = assetOf(hh, ctx.assets),
          r = ctx.active.filter(function (x) {
            return x.host === hh;
          });
        return [
          hh,
          a.owner,
          a.bu,
          a.tier,
          a.exposure,
          a.wellbeing,
          (a.tags || []).join(";"),
          a.device,
          a.os,
          a.retired ? "yes" : "",
          assetRisk(r),
          r.length,
        ];
      }),
    ),
  );
}

/* Jira round-trip: exports carry a vl: label; importing a Jira CSV export syncs ticket keys and statuses */
/* stable 64-bit label per finding (djb2 + FNV-1a): Jira label, evidence file name and deep-link token */

/* Jira round-trip: exports carry a vl: label; importing a Jira CSV export syncs ticket keys and statuses */
/* stable 64-bit label per finding (djb2 + FNV-1a): Jira label, evidence file name and deep-link token */
export function vlLabel(k) {
  var a = 5381,
    b = 2166136261;
  for (var i = 0; i < k.length; i++) {
    var c = k.charCodeAt(i);
    a = ((a << 5) + a + c) >>> 0;
    b = Math.imul(b ^ c, 16777619) >>> 0;
  }
  return "vl-" + a.toString(36) + b.toString(36);
}

export function vlLabel32(k) {
  var h0 = 5381;
  for (var i = 0; i < k.length; i++)
    h0 = ((h0 << 5) + h0 + k.charCodeAt(i)) >>> 0;
  return "vl-" + h0.toString(36);
}

export function syncJiraCsv(text, ctx) {
  var r = Papa.parse(text.replace(/^﻿/, ""), {
      header: false,
      skipEmptyLines: true,
    }),
    rows = r.data;
  if (rows.length < 2) throw new Error("the CSV is empty");
  var H = (rows[0] as any).map(function (x) {
    return String(x).trim().toLowerCase();
  });
  var iKey = H.indexOf("issue key"),
    iStatus = H.indexOf("status"),
    iCat = H.indexOf("status category"),
    iLabels = [],
    iSum = H.indexOf("summary");
  H.forEach(function (x, i) {
    if (x === "labels" || /^labels/.test(x) || /vaptlens key/.test(x))
      iLabels.push(i);
  });
  if (iKey < 0 || iStatus < 0)
    throw new Error(
      "expected Issue key and Status columns (export from Jira as CSV, all fields)",
    );
  var byLabel = {};
  Object.keys(ctx.eng.findings).forEach(function (k) {
    [k].concat((ctx.gov[k] || {}).oldKeys || []).forEach(function (k2) {
      byLabel[vlLabel(k2)] = k;
      if (!byLabel[vlLabel32(k2)]) byLabel[vlLabel32(k2)] = k;
    });
  });
  var patches = {},
    matched = 0,
    done = 0,
    unmatched = 0;
  rows.slice(1).forEach(function (row0) {
    var labs = iLabels
        .map(function (i) {
          return String(row0[i] || "");
        })
        .join(" ")
        .split(/[\s,]+/),
      k = null;
    labs.forEach(function (l) {
      if (byLabel[l]) k = byLabel[l];
    });
    if (!k) {
      unmatched++;
      return;
    }
    matched++;
    var st = String(row0[iStatus] || "").trim().toLowerCase(),
      cat = iCat >= 0 ? String(row0[iCat] || "").trim().toLowerCase() : "",
      g0 = ctx.gov[k] || {},
      p: any = {
        ticket: String(row0[iKey]).trim(),
        assigned: true,
      };
    /* Jira's Status Category is authoritative when exported; otherwise the status must BE a done word
       ("Unresolved", "Not Done", "Incomplete", "Won't Fix" are not fixes) */
    var isDone = cat
      ? cat === "done" && !/won'?t|not|declin|duplicate|cancel/.test(st)
      : /^(done|closed|resolved|fixed|complete|completed|remediated)$/.test(st);
    if (isDone) {
      p.status = "Remediated";
      p.fixed = true;
      /* keep the original fix date: re-syncing must not move it (regressions are measured from it) */
      p.fixedAt = g0.fixed && g0.fixedAt ? g0.fixedAt : nowIso();
      done++;
    } else if (/review|\bqa\b|verif|testing/.test(st)) p.status = "In Review";
    else if (/\bin (progress|development)\b|doing|\bwip\b/.test(st))
      p.status = "In Progress";
    else p.status = "To Do";
    /* reopened in Jira: back into the active queue */
    if (p.status !== "Remediated") {
      p.fixed = false;
      p.fixedAt = null;
    }
    patches[k] = p;
  });
  return {
    patches: patches,
    matched: matched,
    done: done,
    unmatched: unmatched,
  };
}

/* Evidence pack: one ZIP an auditor can keep */

/* Evidence pack: one ZIP an auditor can keep */
export var JSZipLib;

export function buildEvidencePack(ctx) {
  return import("jszip")
    .then(function (m) {
      JSZipLib = m.default;
      return AUDIT.verify();
    })
    .then(function (chain) {
      var Z = new JSZipLib(),
        a = ctx.active,
        top = a.slice().sort(function (x, y) {
          return y.risk - x.risk;
        });
      Z.file(
        "README.txt",
        [
          "VAPTLens evidence pack",
          "Generated " +
            nowIso() +
            " by " +
            ctx.me.username +
            " (" +
            ctx.role +
            ")",
          "Workspace: " + WS.current(),
          "As of: " + AS_OF,
          "Scans: " +
            ctx.batches
              .map(function (b) {
                return b.label + " (" + b.date + ", " + b.tools + ")";
              })
              .join("; "),
          "Audit chain: " +
            (chain.ok
              ? "intact (" + chain.n + " entries)"
              : "BROKEN at entry " + chain.at + " — " + chain.reason),
          "",
          "Files:",
          " findings-active.csv   every open finding with risk, SSVC, SLA and compliance mapping",
          " findings-history.csv  every finding's lifecycle across scans",
          " exceptions.csv        accepted risks and false positives with approver and reason",
          " scans.csv             scan batches, dates, tools and host scope",
          " audit-log.csv         governance audit trail with SHA-256 chain",
          " kpis.csv              program metrics",
          " digest.md             weekly digest",
          " evidence/             screenshots attached to findings",
        ].join("\r\n"),
      );
      Z.file(
        "findings-active.csv",
        toCsv(
          [
            [
              "key",
              "severity",
              "finding",
              "host",
              "port",
              "cvss",
              "vector",
              "epss",
              "kev",
              "risk",
              "ssvc",
              "lifecycle",
              "first_seen",
              "sla_days",
              "days_left",
              "breached",
              "owner",
              "ticket",
              "status",
              "cves",
              "cwe",
              "owasp",
              "pci_dss",
              "iso_27001",
              "nist_800_53",
              "tool",
            ],
          ].concat(
            top.map(function (x) {
              var gg = ctx.g(x),
                cm = x.compliance || complianceOf(x);
              return [
                x.key,
                x.sev,
                x.name,
                x.host,
                x.port,
                x.cvss || "",
                x.vector || "",
                x.epss != null ? x.epss : "",
                x.kev ? "yes" : "",
                x.risk,
                x.ssvc.decision,
                lifeLabel(x, ctx),
                x.firstSeen,
                x.slaDays,
                x.daysLeft,
                x.breached ? "yes" : "",
                gg.team,
                gg.ticket || "",
                gg.status,
                x.cves.join(" "),
                (x.cwe || []).join(" "),
                x.owasp || "",
                cm.pci.join(" "),
                cm.iso.join(" "),
                cm.nist.join(" "),
                x.tool,
              ];
            }),
          ),
        ),
      );
      Z.file(
        "findings-history.csv",
        toCsv(
          [
            [
              "key",
              "finding",
              "host",
              "first_seen",
              "last_seen",
              "state",
              "reopened",
              "fix_cycles",
              "history",
            ],
          ].concat(
            Object.keys(ctx.eng.findings).map(function (k) {
              var f = ctx.eng.findings[k];
              return [
                k,
                f.name,
                f.host,
                f.firstSeen,
                f.lastSeen,
                f.state,
                f.reopenCount,
                (f.cycles || [])
                  .map(function (c) {
                    return c.start + "→" + c.end;
                  })
                  .join(" "),
                f.history
                  .map(function (x) {
                    return x[1];
                  })
                  .join(" > "),
              ];
            }),
          ),
        ),
      );
      Z.file(
        "exceptions.csv",
        toCsv(
          [
            [
              "key",
              "finding",
              "host",
              "decision",
              "in_latest_scan",
              "treatment",
              "reason",
              "requested_by",
              "approved_by",
              "until",
              "at",
            ],
          ].concat(
            Object.keys(ctx.gov)
              .filter(function (k) {
                var x = ctx.gov[k];
                return (
                  x &&
                  (x.state === "fp" ||
                    x.state === "accepted" ||
                    x.state === "requested")
                );
              })
              .map(function (k) {
                var x = ctx.gov[k],
                  f = ctx.eng.findings[k] || {};
                return [
                  k,
                  f.name || "",
                  f.host || "",
                  x.state === "requested"
                    ? "pending " + (x.requestedState || "accepted")
                    : ctx.stateOf(k) || x.state,
                  f.lastBatch === ctx.latest ? "yes" : "no",
                  x.treatment || "",
                  x.reason || "",
                  x.by || "",
                  x.approvedBy || "",
                  x.until || "",
                  x.at || "",
                ];
              }),
          ),
        ),
      );
      Z.file(
        "scans.csv",
        toCsv(
          [
            [
              "id",
              "label",
              "date",
              "tools",
              "file",
              "full_scope",
              "hosts_in_scope",
              "imported_at",
              "imported_by",
            ],
          ].concat(
            ctx.batches.map(function (b) {
              return [
                b.id,
                b.label,
                b.date,
                b.tools,
                b.file || "",
                b.full ? "yes" : "",
                Object.keys(ctx.eng.scope[b.id] || {}).length,
                b.importedAt || "",
                b.importedBy || "",
              ];
            }),
          ),
        ),
      );
      Z.file(
        "audit-log.csv",
        toCsv(
          [
            [
              "at",
              "user",
              "role",
              "action",
              "detail",
              "ref_json",
              "prev_hash",
              "hash",
            ],
          ].concat(
            ctx.audit
              .slice()
              .reverse()
              .map(function (x) {
                return [
                  x.at,
                  x.user || "",
                  x.role,
                  x.action,
                  x.detail,
                  x.ref ? JSON.stringify(x.ref) : "",
                  x.prev || "",
                  x.hash || "",
                ];
              }),
          ),
        ),
      );
      var m = ctx.metrics;
      Z.file(
        "kpis.csv",
        toCsv([
          ["metric", "value"],
          ["mttr_days", m.mttrAll],
          ["sla_compliance_pct", m.slaCompliance],
          ["recurrence_pct", m.recurrence],
          ["coverage_pct", m.coverage],
          ["acceptance_rate_pct", m.acceptanceRate],
          ["kev_overdue", m.kevOverdue],
          ["open", m.open],
          ["verified_closed", m.closed],
          ["threat_index", threatIndex(a)],
        ]),
      );
      Z.file("digest.md", digestMd(ctx));
      /* every evidence set in the workspace, read from the server (not only the ones opened this session) */
      return P.evidenceKeys()
        .then(function (keys) {
          var jobs = keys
            .map(function (ek) {
              return "ev:" + ek;
            })
            .map(function (k) {
              return P.evidence(k.slice(3)).then(function (list) {
                (list || []).forEach(function (e, i) {
                  var b64s = String(e.url).split(",")[1];
                  if (b64s)
                    Z.file(
                      "evidence/" +
                        slug(k.slice(3)).slice(0, 48) +
                        "-" +
                        vlLabel(k.slice(3)).slice(3) +
                        "-" +
                        (i + 1) +
                        ".jpg",
                      b64s,
                      {
                        base64: true,
                      },
                    );
                });
              });
            });
          return Promise.all(jobs);
        })
        .then(function () {
          return Z.generateAsync({
            type: "blob",
            compression: "DEFLATE",
          });
        });
    });
}
