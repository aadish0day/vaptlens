import { PageHead } from "@/app/components/PageHead";
import {
  SEV_LABEL,
  count,
  cvssTxt,
  hostLabel,
  tagsOf,
  uniq,
} from "@/app/lib/common";
import {
  canvasToPdfBlob,
  captureCanvas,
  saveFile,
  slug,
  toCsv,
} from "@/app/lib/export";
import { buildEvidencePack } from "@/app/lib/integrations";
import { hostProfiles } from "@/app/views/assets/utils";
import { EngagementModal } from "@/app/views/report/EngagementModal";
import { ENG_DEFAULT, buildDocx } from "@/app/views/report/utils";
import { decisionTxt, slaRange } from "@/app/views/sla/utils";
import { SEV } from "@/lib/data";
import { AS_OF, COMPLIANCE, complianceOf, threatIndex } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

export function Report(ctx) {
  var t0 = useState((ctx.report && ctx.report.theme) || "Slate"),
    a = ctx.active,
    eo = useState(false);
  var t = [
    t0[0],
    function (v) {
      t0[1](v);
      if (!ctx.readOnly)
        ctx.setReport(
          Object.assign({}, ctx.report || {}, {
            theme: v,
          }),
          true,
        );
    },
  ];
  var theme = t[0].toLowerCase(),
    eng = Object.assign({}, ENG_DEFAULT, ctx.engagement || {});
  var crit = count(a, function (x) {
      return x.sev === "critical";
    }),
    br = count(a, function (x) {
      return x.breached;
    });
  var threat = threatIndex(a);
  var top = a.slice().sort(function (x, y) {
    return y.risk - x.risk;
  });
  var hp = hostProfiles(ctx);
  var tools = uniq(
    ctx.data.map(function (x) {
      return x.tool;
    }),
  );
  var toolsTxt =
    tools.length > 1
      ? tools.slice(0, -1).join(", ") + " and " + tools[tools.length - 1]
      : tools[0] || "the uploaded tools";
  var kevN = count(a, function (x) {
      return x.kev;
    }),
    zdN = count(a, function (x) {
      return x.zeroday;
    }),
    actN = count(a, function (x) {
      return x.ssvc.decision === "Act";
    });
  var defSummary =
    "The latest assessment found " +
    a.length +
    " active findings across " +
    hp.length +
    " hosts, " +
    crit +
    " of them Critical. " +
    br +
    " findings are past their remediation SLA" +
    (top[0] ? ", led by " + top[0].name + " on " + hostLabel(top[0]) : "") +
    ".\n\n" +
    kevN +
    " findings match the CISA Known Exploited Vulnerabilities list and " +
    actN +
    ' reach the SSVC "Act" decision' +
    (zdN
      ? "; " +
        zdN +
        (zdN === 1 ? " has" : " have") +
        " no vendor patch yet and need compensating controls now."
      : ".");
  var rep = ctx.report || {};
  function setRep(n) {
    if (ctx.readOnly) return;
    ctx.setReport(Object.assign({}, rep, n));
  }
  var hidden = rep.hidden || {},
    summary = rep.summary != null ? rep.summary : defSummary,
    ed = useState(false);
  function show(i) {
    return !hidden[i];
  }
  var sections = [
    "Cover Page & Active Threat Index",
    "Executive Summary",
    "Scope & Methodology",
    "Vulnerability Distribution",
    "SLA Compliance & C.H.I. Projection",
    "Most Vulnerable Hosts",
    "Threat-Intel & Exploitability Trends",
    "RACI Responsibility Matrix",
    "Top 20 Unpatched Risks",
    "Detailed Findings Ledger",
    "Program Metrics",
    "Compliance Mapping",
    "Risk Acceptances & Exceptions",
    "Sign-off",
  ];
  var scopeDefault =
    "Scans from " +
    toolsTxt +
    " covering " +
    (function (n) {
      return n + (n === 1 ? " host" : " hosts");
    })(Object.keys(ctx.eng.scope[ctx.latest] || {}).length) +
    " in the latest batch (" +
    ctx.batches.length +
    " batches in total, " +
    ctx.batches[0].date +
    " to " +
    ctx.batches[ctx.batches.length - 1].date +
    ").";
  var methodDefault =
    "Findings were parsed, de-duplicated and scored entirely in the analyst's browser; no scan data, hostnames or credentials left the device. Risk combines CVSS severity, exploit likelihood (CISA KEV, FIRST EPSS, exploit signals) and asset criticality; priority follows the CISA SSVC decision tree.";
  var comp = uniq(
    a.map(function (x) {
      return x.owasp || "Unmapped";
    }),
  )
    .map(function (c) {
      return {
        cat: c,
        n: count(a, function (x) {
          return (x.owasp || "Unmapped") === c;
        }),
        m: COMPLIANCE[c] || {
          pci: ["11.3.1"],
          iso: ["A.8.8"],
          nist: ["RA-5"],
        },
      };
    })
    .sort(function (x, y) {
      return y.n - x.n;
    });
  /* exceptions register for the report: current, pending and expired decisions on findings in the latest scan */
  var exc = ctx.data.filter(function (x) {
    if (x.batch !== ctx.latest || x.lifecycle === "Fixed") return false;
    var g0 = ctx.gov[x.key] || {};
    return (
      g0.state === "fp" || g0.state === "accepted" || g0.state === "requested"
    );
  });
  var title =
    "Vulnerability Assessment · " +
    (eng.client || ctx.batches[ctx.batches.length - 1].label);
  var R = {
    eng: eng,
    title: title,
    threat: threat,
    show: show,
    summary: summary,
    a: a,
    hp: hp,
    top: top,
    comp: comp,
    exc: exc,
    scopeDefault: scopeDefault,
    methodDefault: methodDefault,
  };
  var base =
    "vaptlens-report-" +
    slug(eng.client || ctx.batches[ctx.batches.length - 1].label);
  var m = ctx.metrics;
  return (
    <div className="page">
      <PageHead
        title="Executive Report"
        sub="Prints on white in the light palette whatever the app theme. Fill in the engagement details, untick sections you don't need, then download as Word, PDF or HTML."
        actions={[
          <V.Button
            key="e"
            icon="briefcase"
            onClick={function () {
              eo[1](true);
            }}
          >
            Engagement
          </V.Button>,
          <V.SegmentedControl
            key="t"
            label="Report theme"
            options={["Slate", "Navy", "Crimson"]}
            value={t[0]}
            onChange={t[1]}
          />,
          <V.DropdownMenu
            key="d"
            label="Download"
            variant="primary"
            icon="download"
            align="right"
            items={[
              {
                label: "Report as Word",
                icon: "file",
                hint: ".docx",
                onSelect: function () {
                  ctx.toast({
                    title: "Building Word document…",
                    tone: "info",
                  });
                  buildDocx(ctx, R)
                    .then(function (b) {
                      return saveFile(ctx, base + ".docx", b);
                    })
                    .catch(function (e) {
                      ctx.toast({
                        title: "Couldn't build the Word file",
                        message: e.message,
                        tone: "danger",
                      });
                    });
                },
              },
              {
                label: "Report as PDF",
                icon: "file",
                hint: ".pdf",
                onSelect: function () {
                  ctx.toast({
                    title: "Building PDF…",
                    tone: "info",
                  });
                  setTimeout(function () {
                    captureCanvas(document.querySelector(".paper"), "#ffffff")
                      .then(function (cv) {
                        return saveFile(
                          ctx,
                          base + ".pdf",
                          canvasToPdfBlob(cv),
                        );
                      })
                      .catch(function (e) {
                        ctx.toast({
                          title: "Couldn't build the PDF",
                          message: e.message,
                          tone: "danger",
                        });
                      });
                  }, 60);
                },
              },
              {
                label: "Report as HTML",
                icon: "file",
                hint: ".html",
                onSelect: function () {
                  var css = Array.prototype.map
                    .call(document.querySelectorAll("style"), function (x) {
                      return x.textContent;
                    })
                    .join("\n");
                  var doc =
                    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
                    title.replace(/</g, "&lt;") +
                    "</title><style>" +
                    css +
                    " body{background:#e9ebee;padding:32px 16px;margin:0} .paper{margin:0 auto}</style></head><body>" +
                    (function () {
                      var c: any = document
                        .querySelector(".paper")
                        .cloneNode(true);
                      Array.prototype.forEach.call(
                        c.querySelectorAll("[data-html2canvas-ignore]"),
                        function (n) {
                          n.remove();
                        },
                      );
                      return c.outerHTML;
                    })() +
                    "</body></html>";
                  saveFile(ctx, base + ".html", doc).catch(function (e) {
                    ctx.toast({
                      title: "Couldn't save HTML report",
                      message: e.message,
                      tone: "danger",
                    });
                  });
                },
              },
              {
                label: "Evidence pack for auditors",
                icon: "file",
                hint: ".zip",
                onSelect: function () {
                  ctx.toast({
                    title: "Building evidence pack…",
                    tone: "info",
                  });
                  buildEvidencePack(ctx).then(
                    function (b) {
                      return saveFile(ctx, base + "-evidence-pack.zip", b);
                    },
                    function (e) {
                      ctx.toast({
                        title: "Couldn't build the evidence pack",
                        message: e.message,
                        tone: "danger",
                      });
                    }
                  ).catch(function(e) {
                    ctx.toast({
                      title: "Couldn't save the evidence pack",
                      message: e.message,
                      tone: "danger",
                    });
                  });
                },
              },
              "-",
              {
                label: "Findings ledger",
                icon: "download",
                hint: ".csv",
                onSelect: function () {
                  saveFile(
                    ctx,
                    base + "-findings.csv",
                    toCsv(
                      [
                        [
                          "rank",
                          "severity",
                          "finding",
                          "host",
                          "port",
                          "cvss",
                          "vector",
                          "epss",
                          "risk",
                          "ssvc",
                          "sla",
                          "cves",
                          "cwe",
                          "owasp",
                          "pci_dss",
                          "iso_27001",
                          "nist_800_53",
                          "tool",
                          "owner",
                          "first_seen",
                        ],
                      ].concat(
                        top.map(function (x, i) {
                          var cm = x.compliance || complianceOf(x);
                          return [
                            i + 1,
                            SEV_LABEL[x.sev],
                            x.name,
                            x.host,
                            x.port,
                            cvssTxt(x),
                            x.vector || "",
                            x.epss != null ? x.epss : "",
                            x.risk,
                            x.ssvc.decision,
                            x.breached
                              ? "Breached"
                              : x.atRisk
                                ? "At risk"
                                : "Met",
                            x.cves.join(" "),
                            (x.cwe || []).join(" "),
                            x.owasp || "",
                            cm.pci.join(" "),
                            cm.iso.join(" "),
                            cm.nist.join(" "),
                            x.tool,
                            ctx.g(x).team,
                            x.firstSeen,
                          ];
                        }),
                      ),
                    ),
                  );
                },
              },
            ]}
          />,
        ]}
      />
      {eo[0] ? (
        <EngagementModal
          ctx={ctx}
          onClose={function () {
            eo[1](false);
          }}
        />
      ) : null}
      {!ctx.engagement ? (
        <V.Banner
          tone="info"
          title="Add the engagement details"
          action={
            <V.Button
              size="sm"
              onClick={function () {
                eo[1](true);
              }}
            >
              Engagement
            </V.Button>
          }
        >
          Client, testing window, scope, methodology and reviewer go on the
          cover and into the Word export.
        </V.Banner>
      ) : null}
      <section className="report-wrap">
        <nav className="report-toc" aria-label="Report sections">
          <span className="vl-label">Sections</span>
          <ol>
            {sections.map(function (s, i) {
              return (
                <li key={s} className={show(i) ? "" : "is-off"}>
                  {i ? (
                    <input
                      type="checkbox"
                      className="toc-chk"
                      disabled={ctx.readOnly}
                      checked={show(i)}
                      aria-label={"Include " + s}
                      onChange={function () {
                        var hd = Object.assign({}, hidden);
                        if (hd[i]) delete hd[i];
                        else hd[i] = true;
                        setRep({
                          hidden: hd,
                        });
                      }}
                    />
                  ) : (
                    <span className="toc-chk-sp" />
                  )}
                  <a
                    href="#report"
                    onClick={function (e) {
                      e.preventDefault();
                      var el = document.getElementById("rs-" + i);
                      if (el)
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                  >
                    {s}
                  </a>
                </li>
              );
            })}
          </ol>
          <p className="toc-help">
            Unticked sections are left out of the Word, PDF and HTML.
          </p>
        </nav>
        <article
          className={"paper" + (eng.status !== "Approved" ? " is-draft" : "")}
          data-vt-paper="1"
          data-watermark={eng.status === "In review" ? "IN REVIEW" : "DRAFT"}
        >
          <div id="rs-0">
            <V.ReportHeader
              theme={theme}
              title={title}
              meta={[
                eng.project,
                eng.start && eng.end ? eng.start + " → " + eng.end : null,
                hp.length + " hosts",
                "Generated " + AS_OF,
                eng.classification || "Confidential",
                eng.status +
                  (eng.status === "Approved" && eng.reviewer
                    ? " by " + eng.reviewer
                    : ""),
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          </div>
          <div className="paper-body">
            {eng.logo ? (
              <div className="rep-brand">
                <img src={eng.logo} alt={(eng.client || "Client") + " logo"} />
                <span>{eng.client}</span>
              </div>
            ) : null}
            <div className="threat-index">
              <span className="vl-label">Active Threat Index</span>
              <span className="ti-v">{threat}</span>
              <span className="ti-of">/ 100</span>
            </div>
            {show(1) ? (
              <section id="rs-1" className="psec">
                <div className="psec-h">
                  <h2>Executive summary</h2>
                  {ctx.readOnly ? null : (
                    <span className="psec-tools" data-html2canvas-ignore="true">
                      {ed[0] ? (
                        <button
                          type="button"
                          className="up-edit"
                          onClick={function () {
                            ed[1](false);
                          }}
                        >
                          Done
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="up-edit"
                          onClick={function () {
                            ed[1](true);
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {rep.summary != null ? (
                        <button
                          type="button"
                          className="up-edit"
                          onClick={function () {
                            var v = Object.assign({}, rep);
                            delete v.summary;
                            ctx.setReport(v);
                          }}
                        >
                          Reset
                        </button>
                      ) : null}
                    </span>
                  )}
                </div>
                {ed[0] ? (
                  <textarea
                    className="sum-edit"
                    aria-label="Executive summary"
                    value={summary}
                    rows={8}
                    onChange={function (e) {
                      setRep({
                        summary: e.target.value,
                      });
                    }}
                  />
                ) : (
                  summary.split(/\n\s*\n/).map(function (para, i) {
                    return <p key={i}>{para}</p>;
                  })
                )}
              </section>
            ) : null}
            {show(2) && (
              <section id="rs-2" className="psec">
                <h2>{"Scope & methodology"}</h2>
                <p>{eng.scopeText || scopeDefault}</p>
                <p>{eng.methodology || methodDefault}</p>
                {eng.testers ? <p>{"Testers: " + eng.testers}</p> : null}
              </section>
            )}
            {show(3) && (
              <section id="rs-3" className="psec">
                <h2>Vulnerability distribution</h2>
                <V.DonutChart
                  static={true}
                  data={SEV.map(function (s) {
                    return {
                      label: SEV_LABEL[s],
                      severity: s,
                      value: count(a, function (x) {
                        return x.sev === s;
                      }),
                    };
                  }).filter(function (x) {
                    return x.value;
                  })}
                  totalLabel="active"
                />
              </section>
            )}
            {show(4) && (
              <section id="rs-4" className="psec">
                <h2>{"SLA compliance & C.H.I. projection"}</h2>
                <V.SlaProjectionTable
                  rows={["critical", "high", "medium", "low"]
                    .map(function (s) {
                      var r = a.filter(function (x) {
                        return x.sev === s;
                      });
                      return {
                        severity: s,
                        sla: slaRange(r, s, ctx),
                        active: r.length,
                        breached: count(r, function (x) {
                          return x.breached;
                        }),
                        atRisk: count(r, function (x) {
                          return x.atRisk;
                        }),
                        avgDays: r.length
                          ? Math.round(
                              r.reduce(function (t2, x) {
                                return t2 + x.daysLeft;
                              }, 0) / r.length,
                            )
                          : 0,
                      };
                    })
                    .filter(function (x) {
                      return x.active;
                    })}
                />
              </section>
            )}
            {show(5) && (
              <section id="rs-5" className="psec">
                <h2>Most vulnerable hosts</h2>
                <div className="stack">
                  {hp.slice(0, 5).map(function (x) {
                    return (
                      <V.RiskMeter
                        key={x.host}
                        host={x.host}
                        score={x.score}
                        max={hp[0].score}
                        criticals={x.counts.critical}
                      />
                    );
                  })}
                </div>
              </section>
            )}
            {show(6) && (
              <section id="rs-6" className="psec">
                <h2>{"Threat-intel & exploitability trends"}</h2>
                <V.LineChart
                  id="rep"
                  labels={ctx.batches.map(function (b) {
                    return b.label;
                  })}
                  series={[
                    ["CISA KEV", "kev", "var(--threat-kev)"],
                    ["Zero-day", "zeroday", "var(--threat-zeroday)"],
                    ["Ransomware", "ransomware", "var(--threat-ransomware)"],
                    ["Exploitable", "exploitable", "var(--chart-2)"],
                  ].map(function (t2) {
                    return {
                      label: t2[0],
                      color: t2[2],
                      values: ctx.batches.map(function (b) {
                        return count(ctx.data, function (x) {
                          var s2 = ctx.stateOf(x.key);
                          return (
                            x.batch === b.id &&
                            x.lifecycle !== "Fixed" &&
                            s2 !== "fp" &&
                            s2 !== "accepted" &&
                            !ctx.isManFixed(x) &&
                            x[t2[1]]
                          );
                        });
                      }),
                    };
                  })}
                  height={180}
                />
              </section>
            )}
            {show(7) && (
              <section id="rs-7" className="psec">
                <h2>RACI responsibility matrix</h2>
                <div className="scroll-x">
                  <V.RaciMatrix
                    data={(function () {
                      var r2 = {};
                      a.forEach(function (x) {
                        var gg = ctx.g(x);
                        r2[gg.team] = r2[gg.team] || {};
                        r2[gg.team][gg.raci] = (r2[gg.team][gg.raci] || 0) + 1;
                      });
                      return r2;
                    })()}
                  />
                </div>
              </section>
            )}
            {show(8) && (
              <section id="rs-8" className="psec">
                <h2>Top unpatched risks</h2>
                <V.BreachList
                  items={top.slice(0, 20).map(function (x) {
                    return {
                      title: x.name,
                      host: hostLabel(x) + " · SSVC " + x.ssvc.decision,
                      risk: x.risk,
                      tags: tagsOf(x).slice(0, 2),
                    };
                  })}
                />
              </section>
            )}
            {show(9) && (
              <section id="rs-9" className="psec">
                <h2>Detailed findings ledger</h2>
                <div className="scroll-x">
                  <table className="ledger">
                    <thead>
                      <tr>
                        {[
                          "#",
                          "Severity",
                          "Finding",
                          "Host",
                          "CVSS",
                          "EPSS",
                          "Risk",
                          "SSVC",
                          "SLA",
                        ].map(function (c) {
                          return <th key={c}>{c}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {top.slice(0, 50).map(function (x, i) {
                        return (
                          <tr key={x.id}>
                            <td>{i + 1}</td>
                            <td>
                              <V.SeverityBadge severity={x.sev} />
                            </td>
                            <td>{x.name}</td>
                            <td className="vl-mono">{hostLabel(x)}</td>
                            <td className="vl-mono">{cvssTxt(x)}</td>
                            <td className="vl-mono">
                              {x.epss != null
                                ? (x.epss * 100).toFixed(0) + "%"
                                : "—"}
                            </td>
                            <td className="vl-mono">{x.risk}</td>
                            <td>{x.ssvc.decision}</td>
                            <td>
                              {x.breached
                                ? "Breached"
                                : x.atRisk
                                  ? "At risk"
                                  : "Met"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {show(10) && (
              <section id="rs-10" className="psec">
                <h2>Program metrics</h2>
                <table className="ledger">
                  <tbody>
                    {[
                      [
                        "Mean time to remediate",
                        m.mttrAll == null ? "—" : m.mttrAll + " days",
                      ],
                      [
                        "SLA compliance (incl. open breaches)",
                        m.slaCompliance == null ? "—" : m.slaCompliance + "%",
                      ],
                      ["Recurrence rate", m.recurrence + "%"],
                      ["Scan coverage (latest)", m.coverage + "%"],
                      ["Risk acceptance rate", m.acceptanceRate + "%"],
                      [
                        "Open · verified closed · pending verification",
                        m.open + " · " + m.closed + " · " + m.manualPending,
                      ],
                    ].map(function (r2) {
                      return (
                        <tr key={r2[0]}>
                          <td>{r2[0]}</td>
                          <td className="vl-mono">{r2[1]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}
            {show(11) && (
              <section id="rs-11" className="psec">
                <h2>Compliance mapping</h2>
                <div className="scroll-x">
                  <table className="ledger">
                    <thead>
                      <tr>
                        {[
                          "OWASP category",
                          "Findings",
                          "PCI DSS 4.0",
                          "ISO 27001:2022",
                          "NIST 800-53",
                        ].map(function (c) {
                          return <th key={c}>{c}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {comp.map(function (c) {
                        return (
                          <tr key={c.cat}>
                            <td>{c.cat}</td>
                            <td className="vl-mono">{c.n}</td>
                            <td className="vl-mono">{c.m.pci.join(", ")}</td>
                            <td className="vl-mono">{c.m.iso.join(", ")}</td>
                            <td className="vl-mono">{c.m.nist.join(", ")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {show(12) && (
              <section id="rs-12" className="psec">
                <h2>{"Risk acceptances & exceptions"}</h2>
                {exc.length ? (
                  <table className="ledger">
                    <thead>
                      <tr>
                        {["Finding", "Host", "Decision", "Until", "Reason"].map(
                          function (c) {
                            return <th key={c}>{c}</th>;
                          },
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {exc.map(function (x) {
                        var gg = ctx.g(x);
                        return (
                          <tr key={x.id}>
                            <td>{x.name}</td>
                            <td className="vl-mono">{hostLabel(x)}</td>
                            <td>{decisionTxt(x, ctx)}</td>
                            <td className="vl-mono">{gg.until || "—"}</td>
                            <td>{gg.reason || ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p>No accepted risks, false positives or pending requests.</p>
                )}
              </section>
            )}
            {show(13) && (
              <section id="rs-13" className="psec signoff">
                <h2>Sign-off</h2>
                <dl className="kv">
                  <dt>Prepared by</dt>
                  <dd>{eng.testers || "—"}</dd>
                  <dt>Reviewed by</dt>
                  <dd>{eng.reviewer || "—"}</dd>
                  <dt>Status</dt>
                  <dd>
                    {eng.status +
                      (eng.approvedAt
                        ? " · " + String(eng.approvedAt).slice(0, 10)
                        : "")}
                  </dd>
                </dl>
              </section>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

/* ================= Upload (multi-file, multi-format) ================= */
/* scanner presets drift between versions: keep the preset's columns that exist, fill the rest by name */
