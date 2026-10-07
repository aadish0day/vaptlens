import { digestMd } from "@/app/automation/utils";
import { PageHead } from "@/app/components/PageHead";
import { openRow } from "@/app/components/utils";
import { SEV_LABEL, count } from "@/app/lib/common";
import { saveFile, toCsv } from "@/app/lib/export";
import { EMPTY_FILTERS } from "@/app/lib/filters";
import { Goals } from "@/app/views/metrics/Goals";
import { GroupedBarChart } from "@/lib/dash";
import { SEV, days } from "@/lib/data";
import { AS_OF, MTTR_TARGET, forecastOf, localDay } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

/* ================= Metrics & KPIs ================= */
export function Metrics(ctx) {
  var m = ctx.metrics,
    sevs = ["critical", "high", "medium", "low"],
    dg = useState(null),
    fc = forecastOf(m, ctx.batches);
  var expiring = Object.keys(ctx.gov)
    .filter(function (k) {
      var g0 = ctx.gov[k];
      return (
        g0 &&
        g0.state === "accepted" &&
        g0.until &&
        g0.until >= AS_OF &&
        days(AS_OF, g0.until) <= 14
      );
    })
    .map(function (k) {
      var f = ctx.eng.findings[k] || {};
      return {
        k: k,
        g: ctx.gov[k],
        name: f.name || k,
        host: f.host || "",
      };
    });
  var sevColor = {
    critical: "var(--sev-critical)",
    high: "var(--sev-high)",
    medium: "var(--sev-medium)",
    low: "var(--sev-low)",
    info: "var(--sev-info)",
  };
  function kpi(label, value, sub, tone, icon, onClick) {
    return (
      <V.KpiCard
        label={label}
        value={value == null ? "—" : value}
        sub={sub}
        tone={tone}
        icon={icon}
        onClick={onClick}
      />
    );
  }
  function goF(f0) {
    ctx.setFilters(Object.assign({}, EMPTY_FILTERS, f0));
    ctx.showFindings();
  }
  var csv = toCsv(
    [
      ["metric", "value"],
      ["MTTR all (days)", m.mttrAll],
    ]
      .concat(
        SEV.map(function (s) {
          return ["MTTR " + s + " (days)", m.mttr[s]];
        }),
      )
      .concat([
        ["SLA compliance incl. open breaches (%)", m.slaCompliance],
        ["SLA compliance on closed only (%)", m.slaClosedCompliance],
        ["Recurrence rate (%)", m.recurrence],
        ["Risk acceptance rate (%)", m.acceptanceRate],
        ["Scan coverage (%)", m.coverage],
        ["Open findings", m.open],
        ["Closed (verified)", m.closed],
        ["Remediated, pending verification", m.manualPending],
        ["Accepted", m.accepted],
        ["False positives", m.fp],
        ["Open CVSS sum", m.cvssSum],
      ])
      .concat(
        m.flow.map(function (f) {
          return [
            "Scan " + f.label + " open/new/fixed/reopened",
            [f.open, f.added, f.fixed, f.reopened].join("/"),
          ];
        }),
      ),
  );
  return (
    <div className="page">
      <PageHead
        title={"Metrics & KPIs"}
        sub="Program health from the lifecycle engine. MTTR runs from first detection to the first scan that covered the host and no longer found the issue. SLA compliance excludes accepted risks."
        actions={[
          <V.Button
            key="d"
            icon="file"
            onClick={function () {
              dg[1](digestMd(ctx));
            }}
          >
            Weekly digest
          </V.Button>,
          <V.Button
            key="c"
            icon="download"
            onClick={function () {
              saveFile(ctx, "vaptlens-kpis-" + localDay() + ".csv", csv);
            }}
          >
            KPIs as CSV
          </V.Button>,
        ]}
      />
      {dg[0] ? (
        <V.Modal
          title="Weekly digest"
          subtitle="Markdown you can paste into Slack, Teams or email. Built in this browser."
          width="760px"
          onClose={function () {
            dg[1](null);
          }}
          footer={[
            <V.Button
              key="c"
              onClick={function () {
                try {
                  navigator.clipboard.writeText(dg[0]).then(
                    function () {
                      ctx.toast({
                        title: "Digest copied",
                      });
                    },
                    function () {
                      ctx.toast({
                        title: "Copy blocked here",
                        message: "Select the text and copy it.",
                        tone: "info",
                      });
                    },
                  );
                } catch (e) {}
              }}
            >
              Copy
            </V.Button>,
            <V.Button
              key="s"
              variant="primary"
              icon="download"
              onClick={function () {
                saveFile(ctx, "vaptlens-digest-" + localDay() + ".md", dg[0]);
              }}
            >
              Download .md
            </V.Button>,
          ]}
        >
          <pre className="csv digest">{dg[0]}</pre>
        </V.Modal>
      ) : null}
      {fc ? (
        <V.Banner
          tone={fc.net > 0 ? "danger" : "info"}
          title={
            fc.net > 0
              ? "Backlog is growing by about " + fc.net + " findings per scan"
              : fc.net < 0
                ? "Backlog is shrinking by about " +
                  -fc.net +
                  " findings per scan"
                : "Backlog is flat"
          }
        >
          {"Over the last scans " +
            fc.inflow +
            " new or reopened findings arrive and " +
            fc.outflow +
            " are fixed per scan (about every " +
            fc.gapDays +
            " days). " +
            (fc.clearIn
              ? "At this rate the backlog is cleared in about " +
                fc.clearIn +
                " scans (~" +
                fc.clearIn * fc.gapDays +
                " days)."
              : "At this rate it won't clear; add capacity or cut inflow.")}
        </V.Banner>
      ) : null}
      <section className="kpis kpis-6">
        {kpi(
          "MTTR · all",
          m.mttrAll != null ? m.mttrAll + "d" : null,
          m.cycles +
            " fix cycle" +
            (m.cycles === 1 ? "" : "s") +
            " · " +
            m.closed +
            " finding" +
            (m.closed === 1 ? "" : "s") +
            " now fixed",
          m.mttrAll != null && m.mttrAll > 60 ? "critical" : null,
          "clock",
          function () {
            ctx.go("retest");
          },
        )}
        {kpi(
          "SLA compliance",
          m.slaCompliance != null ? m.slaCompliance + "%" : null,
          "fixed within SLA, open breaches count as misses" +
            (m.openBreached ? " (" + m.openBreached + " open past SLA)" : ""),
          m.slaCompliance != null && m.slaCompliance < 80 ? "critical" : "ok",
          "shield-check",
          function () {
            ctx.go("sla");
          },
        )}
        {kpi(
          "Recurrence",
          m.recurrence + "%",
          m.reopened +
            (m.reopened === 1 ? " finding" : " findings") +
            " reopened after a fix",
          m.recurrence > 10 ? "critical" : null,
          "refresh",
          function () {
            ctx.go("retest");
          },
        )}
        {kpi(
          "Scan coverage",
          m.coverage + "%",
          m.hostsLatest +
            " of " +
            m.hostsKnown +
            " known hosts in the latest scan",
          m.coverage < 90 ? "critical" : "ok",
          "server",
          function () {
            var el = document.getElementById("coverage-gaps");
            if (el)
              el.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            else ctx.go("assets");
          },
        )}
        {kpi(
          "Risk acceptance",
          m.acceptanceRate + "%",
          m.accepted + " accepted · " + m.fp + " false positive",
          m.acceptanceRate > 20 ? "critical" : null,
          "shield",
          function () {
            ctx.showFindings("Parked");
          },
        )}
        {kpi(
          "Pending verification",
          m.manualPending,
          "marked remediated, awaiting a re-scan",
          null,
          "ticket",
          function () {
            ctx.go("remediation");
          },
        )}
        {kpi(
          "KEV past due",
          m.kevOverdue,
          "CISA KEV findings past their BOD 22-01 due date",
          m.kevOverdue ? "critical" : "ok",
          "flame",
          function () {
            goF({
              kev: true,
              kevOverdue: true,
            });
          },
        )}
        {kpi(
          "Exceptions expiring",
          expiring.length,
          "accepted risks ending in the next 14 days",
          expiring.length ? "warn" : null,
          "shield",
          expiring.length
            ? function () {
                var el = document.getElementById("expiring-list");
                if (el)
                  el.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              }
            : undefined,
        )}
        {kpi(
          "Regressions",
          count(Object.keys(ctx.gov), function (k) {
            return (ctx.gov[k] || {}).regressions;
          }),
          "marked remediated, then found again",
          null,
          "refresh",
          function () {
            ctx.go("retest");
          },
        )}
      </section>
      <Goals ctx={ctx} />
      {expiring.length ? (
        <V.WidgetCard title="Exceptions expiring soon" draggable={false}>
          <span id="expiring-list" className="anchor-top" />
          <div className="stack-tight">
            {expiring.map(function (x) {
              return (
                <div
                  {...Object.assign(
                    {
                      key: x.k,
                    },
                    openRow(ctx, x.k, "breach-item"),
                  )}
                >
                  <V.Icon name="shield" size={14} />
                  <span className="breach-name">{x.name + " · " + x.host}</span>
                  <span className="up-help">
                    {(x.g.treatment || "accept") + " · " + (x.g.reason || "")}
                  </span>
                  <V.SlaPill status="at-risk" days={days(AS_OF, x.g.until)} />
                </div>
              );
            })}
          </div>
        </V.WidgetCard>
      ) : null}
      <section className="grid-2">
        <V.WidgetCard title="MTTR by severity vs target" draggable={false}>
          <table className="ledger mttr">
            <thead>
              <tr>
                {["Severity", "MTTR", "Target", "SLA window", "Status"].map(
                  function (c) {
                    return <th key={c}>{c}</th>;
                  },
                )}
              </tr>
            </thead>
            <tbody>
              {sevs.map(function (s) {
                var v = m.mttr[s];
                return (
                  <tr key={s}>
                    <td>
                      <V.SeverityBadge severity={s} />
                    </td>
                    <td className="vl-mono">{v == null ? "—" : v + "d"}</td>
                    <td className="vl-mono">{MTTR_TARGET[s] + "d"}</td>
                    <td className="vl-mono">{ctx.sla[s] + "d"}</td>
                    <td>
                      {v == null ? (
                        <span className="up-help">no closures yet</span>
                      ) : v <= MTTR_TARGET[s] ? (
                        <V.SlaPill status="met" />
                      ) : (
                        <V.SlaPill
                          status="breached"
                          days={v - MTTR_TARGET[s]}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="up-help">
            Targets follow common guidance: Critical 15d, High 30d, Medium 90d,
            Low 180d.
          </p>
        </V.WidgetCard>
        <V.WidgetCard title="Open backlog by age" draggable={false}>
          <V.StackedBarChart
            static={true}
            labels={m.buckets.map(function (b) {
              return b.label;
            })}
            series={sevs.map(function (s, i) {
              return {
                label: SEV_LABEL[s],
                severity: s,
                color: sevColor[s],
                values: m.buckets.map(function (b) {
                  return b.values[i];
                }),
              };
            })}
            height={220}
          />
        </V.WidgetCard>
      </section>
      <section className="grid-2">
        <V.WidgetCard
          title="Burn-down · open findings per scan"
          draggable={false}
        >
          <V.LineChart
            id="burn"
            labels={m.flow
              .map(function (f) {
                return f.label;
              })
              .concat(fc ? ["+1", "+2", "+3"] : [])}
            series={(
              [
                {
                  label: "Open",
                  color: "var(--chart-1)",
                  values: m.flow
                    .map(function (f) {
                      return f.open;
                    })
                    .concat(fc ? [null, null, null] : []),
                },
              ] as any[]
            )
              .concat(
                fc
                  ? [
                      {
                        label: "Forecast",
                        color: "var(--signal)",
                        dashed: true,
                        values: m.flow
                          .map(function (f, i) {
                            return i === m.flow.length - 1 ? f.open : null;
                          })
                          .concat(fc.next),
                      },
                    ]
                  : [],
              )
              .concat([
                {
                  label: "Not re-scanned",
                  color: "var(--chart-6)",
                  dashed: true,
                  values: m.flow
                    .map(function (f) {
                      return f.unverified;
                    })
                    .concat(fc ? [null, null, null] : []),
                },
              ])}
            height={220}
          />
        </V.WidgetCard>
        <V.WidgetCard
          title="Flow per scan · new, fixed, reopened"
          draggable={false}
        >
          <GroupedBarChart
            labels={m.flow.map(function (f) {
              return f.label;
            })}
            series={[
              {
                label: "New",
                color: "var(--status-danger)",
                values: m.flow.map(function (f) {
                  return f.added;
                }),
              },
              {
                label: "Fixed",
                color: "var(--status-ok)",
                values: m.flow.map(function (f) {
                  return f.fixed;
                }),
              },
              {
                label: "Reopened",
                color: "var(--status-warn)",
                values: m.flow.map(function (f) {
                  return f.reopened;
                }),
              },
            ]}
          />
        </V.WidgetCard>
      </section>
      <V.WidgetCard
        title={
          "Coverage gaps · hosts missing from the latest scan · " +
          m.stale.length
        }
        draggable={false}
      >
        <span id="coverage-gaps" className="anchor-top" />
        {m.stale.length ? (
          <div className="scroll-x">
            <table className="ledger">
              <thead>
                <tr>
                  {["Host", "Last scanned", "Days ago", "Open findings"].map(
                    function (c) {
                      return <th key={c}>{c}</th>;
                    },
                  )}
                </tr>
              </thead>
              <tbody>
                {m.stale.map(function (x) {
                  return (
                    <tr key={x.host}>
                      <td className="vl-mono">
                        <button
                          type="button"
                          className="link-btn"
                          onClick={function () {
                            ctx.openHost(x.host);
                          }}
                        >
                          {x.host}
                        </button>
                      </td>
                      <td className="vl-mono">{x.lastScanned}</td>
                      <td className="vl-mono">{x.days}</td>
                      <td className="vl-mono">
                        {count(ctx.active, function (y) {
                          return y.host === x.host;
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <V.EmptyState title="Every known host was in the latest scan." />
        )}
      </V.WidgetCard>
      <section className="grid-2">
        <V.WidgetCard title="Remediation funnel · every finding ever seen" draggable={false}>
          <V.FunnelChart label="Remediation funnel" stages={funnelOf(ctx)} />
          <p className="up-help">Each step shows how many findings got that far and the share kept from the step before. Drop-offs show where work stalls.</p>
        </V.WidgetCard>
        <V.WidgetCard title="Team activity · last 26 weeks" draggable={false}>
          <V.CalendarHeatmap data={activityOf(ctx.audit)} unit="logged actions" label="Team activity" />
          <p className="up-help">Every decision, ticket, import and status change in the audit log, by day.</p>
        </V.WidgetCard>
      </section>
    </div>
  );
}

/* stages of the fix pipeline, counted over every unique finding key */
export function funnelOf(ctx) {
  var keys = Object.keys(ctx.eng.findings || {}),
    g = ctx.gov || {};
  function n(fn) {
    return keys.filter(function (k) {
      return fn(g[k] || {}, ctx.eng.findings[k] || {});
    }).length;
  }
  var parked = function (g0) {
    return g0.state === "fp" || g0.state === "accepted";
  };
  return [
    { label: "Found", value: keys.length, color: "var(--chart-1)" },
    { label: "Triaged", value: n(function (g0, f) { return parked(g0) || !!g0.ticket || (g0.status && g0.status !== "To Do") || !!g0.fixed || f.lifecycle === "Fixed"; }), color: "var(--chart-2)" },
    { label: "Ticketed", value: n(function (g0, f) { return !!g0.ticket || !!g0.fixed || f.lifecycle === "Fixed"; }), color: "var(--chart-3)" },
    { label: "Fixed (claimed)", value: n(function (g0, f) { return !!g0.fixed || g0.status === "Remediated" || f.lifecycle === "Fixed"; }), color: "var(--chart-4)" },
    { label: "Verified by re-scan", value: n(function (g0, f) { return f.lifecycle === "Fixed"; }), color: "var(--status-ok)" },
  ];
}
/* audit entries per local day */
export function activityOf(audit) {
  var out = {};
  (audit || []).forEach(function (e) {
    var t = e && (e.at || e.ts || e.time);
    if (!t) return;
    var d = new Date(t);
    if (isNaN(d.getTime())) return;
    var k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

/* ================= 4. Prioritization ================= */
