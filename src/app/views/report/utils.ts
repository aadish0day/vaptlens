import { SEV_LABEL, count, cvssTxt, hostLabel } from "@/app/lib/common";
import { decisionTxt } from "@/app/views/sla/utils";
import { SEV } from "@/lib/data";
import { AS_OF, complianceOf } from "@/lib/engine";

/* ================= 8. Report ================= */
export var ENG_DEFAULT = {
  client: "",
  project: "",
  testers: "",
  start: "",
  end: "",
  scopeText: "",
  methodology: "",
  classification: "Confidential",
  reviewer: "",
  status: "Draft",
  approvedAt: "",
  logo: "",
};

export function dataUrlBytes(u) {
  var b = atob(u.split(",")[1]),
    a = new Uint8Array(b.length);
  for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
}

export function buildDocx(ctx, R) {
  return import("docx").then(function (D) {
    var e = R.eng,
      P2 = D.Paragraph,
      T = D.TextRun,
      HL = D.HeadingLevel;
    function para(text, o?) {
      return new P2(
        Object.assign(
          {
            children: [new T(String(text == null ? "" : text))],
            spacing: {
              after: 120,
            },
          },
          o || {},
        ),
      );
    }
    function head(text, lvl?) {
      return new P2({
        text: text,
        heading: lvl || HL.HEADING_1,
        spacing: {
          before: 240,
          after: 120,
        },
      });
    }
    function cell(text, bold?, shade?) {
      return new D.TableCell({
        children: [
          new P2({
            children: [
              new T({
                text: String(text == null ? "" : text),
                bold: !!bold,
                size: 18,
              }),
            ],
          }),
        ],
        shading: shade
          ? {
              fill: shade,
            }
          : undefined,
        margins: {
          top: 60,
          bottom: 60,
          left: 80,
          right: 80,
        },
      });
    }
    function table(hdr, rows) {
      return new D.Table({
        width: {
          size: 100,
          type: D.WidthType.PERCENTAGE,
        },
        rows: [
          new D.TableRow({
            tableHeader: true,
            children: hdr.map(function (x) {
              return cell(x, true, "E6E8EC");
            }),
          }),
        ].concat(
          rows.map(function (r) {
            return new D.TableRow({
              children: r.map(function (x) {
                return cell(x);
              }),
            });
          }),
        ),
      });
    }
    var kids = [];
    if (R.show(0)) {
      if (e.logo) {
        try {
          kids.push(
            new P2({
              children: [
                new D.ImageRun({
                  data: dataUrlBytes(e.logo),
                  transformation: {
                    width: 140,
                    height: 56,
                  },
                }),
              ],
            }),
          );
        } catch (x) {}
      }
      kids.push(
        new P2({
          text: R.title,
          heading: HL.TITLE,
        }),
      );
      kids.push(
        para(
          [e.client, e.project].filter(Boolean).join(" · ") ||
            "Vulnerability assessment",
        ),
      );
      kids.push(
        para(
          "Testing window: " +
            (e.start || "—") +
            " to " +
            (e.end || "—") +
            " · Testers: " +
            (e.testers || "—"),
        ),
      );
      kids.push(
        para(
          "Classification: " +
            (e.classification || "Confidential") +
            " · Status: " +
            (e.status || "Draft") +
            (e.status === "Approved" && e.reviewer
              ? " by " + e.reviewer + " on " + String(e.approvedAt).slice(0, 10)
              : "") +
            " · Generated " +
            AS_OF,
        ),
      );
      kids.push(
        para("Active Threat Index: " + R.threat + " / 100", {
          children: [
            new T({
              text: "Active Threat Index: " + R.threat + " / 100",
              bold: true,
              size: 28,
            }),
          ],
        }),
      );
    } else
      kids.push(
        new P2({
          text: R.title,
          heading: HL.TITLE,
        }),
      );
    if (R.show(1)) {
      kids.push(head("Executive summary"));
      R.summary.split(/\n\s*\n/).forEach(function (x) {
        kids.push(para(x));
      });
    }
    if (R.show(2)) {
      kids.push(head("Scope & methodology"));
      kids.push(para(e.scopeText || R.scopeDefault));
      kids.push(para(e.methodology || R.methodDefault));
    }
    if (R.show(3)) {
      kids.push(head("Vulnerability distribution"));
      kids.push(
        table(
          ["Severity", "Active", "SLA breached", "CISA KEV", "SSVC Act"],
          SEV.map(function (s) {
            var r = R.a.filter(function (x) {
              return x.sev === s;
            });
            return [
              SEV_LABEL[s],
              r.length,
              count(r, function (x) {
                return x.breached;
              }),
              count(r, function (x) {
                return x.kev;
              }),
              count(r, function (x) {
                return x.ssvc.decision === "Act";
              }),
            ];
          }),
        ),
      );
    }
    if (R.show(4)) {
      kids.push(head("SLA compliance"));
      kids.push(
        table(
          ["Severity", "SLA (days)", "Active", "Breached", "At risk ≤ 7d"],
          SEV.map(function (s) {
            var r = R.a.filter(function (x) {
              return x.sev === s;
            });
            return [
              SEV_LABEL[s],
              ctx.sla[s],
              r.length,
              count(r, function (x) {
                return x.breached;
              }),
              count(r, function (x) {
                return x.atRisk;
              }),
            ];
          }),
        ),
      );
    }
    if (R.show(5)) {
      kids.push(head("Most vulnerable hosts"));
      kids.push(
        table(
          [
            "Host",
            "Tier",
            "Exposure",
            "Open",
            "Critical",
            "Asset risk (0–1000)",
          ],
          R.hp.slice(0, 10).map(function (x) {
            return [
              x.host,
              "Tier " + x.tier,
              x.exposure,
              x.rows.length,
              x.counts.critical,
              x.score,
            ];
          }),
        ),
      );
    }
    if (R.show(6)) {
      kids.push(head("Threat-intel & exploitability trends"));
      kids.push(
        table(
          ["Scan", "Date", "CISA KEV", "Ransomware", "Zero-day", "Exploitable"],
          ctx.batches.map(function (b) {
            var r = ctx.data.filter(function (x) {
              var s2 = ctx.stateOf(x.key);
              return (
                x.batch === b.id &&
                x.lifecycle !== "Fixed" &&
                s2 !== "fp" &&
                s2 !== "accepted" &&
                !ctx.isManFixed(x)
              );
            });
            return [
              b.label,
              b.date,
              count(r, function (x) {
                return x.kev;
              }),
              count(r, function (x) {
                return x.ransomware;
              }),
              count(r, function (x) {
                return x.zeroday;
              }),
              count(r, function (x) {
                return x.exploitable;
              }),
            ];
          }),
        ),
      );
    }
    if (R.show(7)) {
      kids.push(head("RACI responsibility matrix"));
      var rc = {};
      R.a.forEach(function (x) {
        var gg = ctx.g(x),
          t = gg.team || "Unassigned";
        rc[t] = rc[t] || {
          R: 0,
          A: 0,
          C: 0,
          I: 0,
          crit: 0,
          br: 0,
        };
        rc[t][gg.raci || "R"]++;
        if (x.sev === "critical") rc[t].crit++;
        if (x.breached) rc[t].br++;
      });
      kids.push(
        table(
          [
            "Team",
            "Responsible",
            "Accountable",
            "Consulted",
            "Informed",
            "Critical",
            "SLA breached",
          ],
          Object.keys(rc)
            .sort()
            .map(function (t) {
              var o = rc[t];
              return [t, o.R, o.A, o.C, o.I, o.crit, o.br];
            }),
        ),
      );
    }
    if (R.show(8)) {
      kids.push(head("Top unpatched risks"));
      kids.push(
        table(
          ["#", "Finding", "Host", "Sev", "Risk", "SSVC", "EPSS"],
          R.top.slice(0, 20).map(function (x, i) {
            return [
              i + 1,
              x.name,
              hostLabel(x),
              SEV_LABEL[x.sev],
              x.risk,
              x.ssvc.decision,
              x.epss != null ? (x.epss * 100).toFixed(1) + "%" : "—",
            ];
          }),
        ),
      );
    }
    if (R.show(9)) {
      kids.push(head("Detailed findings"));
      if (R.top.length > 50)
        kids.push(
          para(
            "Top 50 of " +
              R.top.length +
              " by risk; the full list is in the findings CSV.",
          ),
        );
      R.top.slice(0, 50).forEach(function (x, i) {
        var cm = x.compliance || complianceOf(x);
        kids.push(head(i + 1 + ". " + x.name, HL.HEADING_2));
        kids.push(
          para(
            SEV_LABEL[x.sev] +
              " · CVSS " +
              cvssTxt(x) +
              (x.vector ? " (" + x.vector + ")" : "") +
              " · Risk " +
              x.risk +
              " · SSVC " +
              x.ssvc.decision +
              " · " +
              hostLabel(x),
          ),
        );
        kids.push(para("Description: " + x.desc));
        kids.push(para("Remediation: " + x.sol));
        kids.push(
          para(
            "References: " +
              (x.cves.concat(x.cwe || []).join(", ") || "—") +
              " · OWASP " +
              (x.owasp || "—") +
              " · PCI DSS " +
              cm.pci.join(", ") +
              " · ISO 27001 " +
              cm.iso.join(", ") +
              " · NIST " +
              cm.nist.join(", "),
          ),
        );
        var notes = ctx.g(x).notes;
        if (notes.length)
          kids.push(
            para(
              "Analyst notes: " +
                notes
                  .map(function (n) {
                    return n.text;
                  })
                  .join(" / "),
            ),
          );
      });
    }
    if (R.show(10)) {
      var m = ctx.metrics;
      kids.push(head("Program metrics"));
      kids.push(
        table(
          ["Metric", "Value"],
          [
            ["MTTR (all, days)", m.mttrAll == null ? "—" : m.mttrAll],
            [
              "SLA compliance (incl. open breaches)",
              m.slaCompliance == null ? "—" : m.slaCompliance + "%",
            ],
            ["Recurrence rate", m.recurrence + "%"],
            ["Scan coverage", m.coverage + "%"],
            ["Risk acceptance rate", m.acceptanceRate + "%"],
            ["Open / verified closed", m.open + " / " + m.closed],
          ],
        ),
      );
    }
    if (R.show(11)) {
      kids.push(head("Compliance mapping"));
      kids.push(
        table(
          [
            "OWASP category",
            "Findings",
            "PCI DSS 4.0",
            "ISO 27001:2022",
            "NIST 800-53",
          ],
          R.comp.map(function (c) {
            return [
              c.cat,
              c.n,
              c.m.pci.join(", "),
              c.m.iso.join(", "),
              c.m.nist.join(", "),
            ];
          }),
        ),
      );
    }
    if (R.show(12)) {
      kids.push(head("Risk acceptances & exceptions"));
      kids.push(
        R.exc.length
          ? table(
              ["Finding", "Host", "Decision", "Until", "Reason"],
              R.exc.map(function (x) {
                var gg = ctx.g(x);
                return [
                  x.name,
                  hostLabel(x),
                  decisionTxt(x, ctx),
                  gg.until || "—",
                  gg.reason || "",
                ];
              }),
            )
          : para("None."),
      );
    }
    if (R.show(13)) {
      kids.push(head("Sign-off"));
      kids.push(
        para(
          "Reviewer: " +
            (e.reviewer || "—") +
            " · Status: " +
            (e.status || "Draft") +
            (e.approvedAt
              ? " · Approved " + String(e.approvedAt).slice(0, 10)
              : ""),
        ),
      );
    }
    var doc = new D.Document({
      creator: "VAPTLens",
      title: R.title,
      styles: {
        default: {
          document: {
            run: {
              font: "Calibri",
              size: 21,
            },
          },
        },
      },
      sections: [
        {
          properties: {},
          headers: {
            default: new D.Header({
              children: [
                para(
                  (e.classification || "Confidential") +
                    (e.status !== "Approved" ? " · DRAFT" : ""),
                  {
                    alignment: D.AlignmentType.RIGHT,
                  },
                ),
              ],
            }),
          },
          children: kids,
        },
      ],
    });
    return D.Packer.toBlob(doc);
  });
}
