import { AuditTrail } from "@/app/components/AuditTrail";
import { PageHead } from "@/app/components/PageHead";
import { openRow } from "@/app/components/utils";
import { RO_REASON, SEV_LABEL, count } from "@/app/lib/common";
import { saveFile, toCsv } from "@/app/lib/export";
import { EMPTY_FILTERS } from "@/app/lib/filters";
import { SlaMatrix } from "@/app/views/metrics/SlaMatrix";
import { SlaCalendar } from "@/app/views/sla/SlaCalendar";
import { slaRange } from "@/app/views/sla/utils";
import { SEV, SLA_DAYS, days } from "@/lib/data";
import { AS_OF, SLA_DEFAULTS, localDay } from "@/lib/engine";
import { AUDIT } from "@/lib/store";
import React, { useState } from "react";
import * as V from "@/ui";

export function Sla(ctx) {
  var a = ctx.active,
    se = useState(null),
    vr = useState(null);
  var bd = {};
  ["critical", "high", "medium", "low", "info"].forEach(function (s) {
    bd[s] = count(a, function (x) {
      return x.sev === s && x.breached;
    });
  });
  var proj = ["critical", "high", "medium", "low", "info"]
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
              r.reduce(function (t, x) {
                return t + x.daysLeft;
              }, 0) / r.length,
            )
          : 0,
      };
    })
    .filter(function (x) {
      return x.active;
    });
  /* the trend uses the same rules as today's number: exempt findings excluded, tier SLA, KEV due dates */
  var months = ctx.batches.map(function (b) {
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
    var br = count(r, function (x) {
      return (
        days(x.slaStart || x.firstSeen, b.date) >
          (x.slaDays || SLA_DAYS[x.sev]) ||
        (x.kevDue && x.kevDue < b.date)
      );
    });
    return {
      label: b.label.replace(" 20", " ’"),
      pct: r.length ? Math.round((100 * (r.length - br)) / r.length) : 100,
    };
  });
  var cur = Math.round(
    (100 *
      (a.length -
        count(a, function (x) {
          return x.breached;
        }))) /
      Math.max(1, a.length),
  );
  if (months.length) months[months.length - 1].pct = cur;
  var raci = {};
  a.forEach(function (x) {
    var gg = ctx.g(x);
    raci[gg.team] = raci[gg.team] || {};
    raci[gg.team][gg.raci] = (raci[gg.team][gg.raci] || 0) + 1;
    raci["SecOps"] = raci["SecOps"] || {};
    if (gg.team !== "SecOps") raci["SecOps"].I = (raci["SecOps"].I || 0) + 1;
    if (x.sev === "critical") {
      raci["SecOps"].A = (raci["SecOps"].A || 0) + 1;
    }
  });
  var unassignedCrit = a.filter(function (x) {
    return x.sev === "critical" && !ctx.g(x).assigned;
  });
  var aging = [
    ["0–30 days", 0, 30, "var(--heat-2)"],
    ["31–90 days", 31, 90, "var(--heat-3)"],
    ["91–180 days", 91, 180, "var(--heat-4)"],
    ["180+ days", 181, 99999, "var(--heat-5)"],
  ].map(function (bk) {
    return {
      label: bk[0],
      color: bk[3],
      values: ctx.batches.map(function (b) {
        return count(ctx.data, function (x) {
          var age = days(x.slaStart || x.firstSeen, b.date),
            s2 = ctx.stateOf(x.key);
          return (
            x.batch === b.id &&
            x.lifecycle !== "Fixed" &&
            s2 !== "fp" &&
            s2 !== "accepted" &&
            !ctx.isManFixed(x) &&
            age >= (bk[1] as number) &&
            age <= (bk[2] as number)
          );
        });
      }),
    };
  });
  var traj = [
    ["CISA KEV", "kev", "var(--threat-kev)"],
    ["Zero-day", "zeroday", "var(--threat-zeroday)"],
    ["Ransomware", "ransomware", "var(--threat-ransomware)"],
    ["Exploitable", "exploitable", "var(--chart-2)"],
  ].map(function (t) {
    return {
      label: t[0],
      color: t[2],
      dashed: t[1] === "ransomware",
      values: ctx.batches.map(function (b) {
        return count(ctx.data, function (x) {
          var s2 = ctx.stateOf(x.key);
          return (
            x.batch === b.id &&
            x.lifecycle !== "Fixed" &&
            s2 !== "fp" &&
            s2 !== "accepted" &&
            !ctx.isManFixed(x) &&
            x[t[1]]
          );
        });
      }),
    };
  });
  function dispatch() {
    var asg = {};
    unassignedCrit.forEach(function (x) {
      asg[x.key] = ctx.nextTicket();
    });
    ctx.govUndoable(
      Object.keys(asg),
      function (k) {
        return {
          team: "Server Team",
          assigned: true,
          ticket: asg[k],
          status: "To Do",
        };
      },
      {
        title: unassignedCrit.length + " tickets dispatched",
        message: "Unassigned Critical findings → Server Team",
      },
      "TICKET",
      unassignedCrit
        .map(function (x) {
          return asg[x.key] + " " + x.name;
        })
        .join("; "),
    );
  }
  return (
    <div className="page">
      <PageHead
        title={"SLA & RACI"}
        sub={
          "SLA windows: " +
          SEV.map(function (s) {
            return SEV_LABEL[s] + " " + ctx.sla[s] + "d";
          }).join(" · ") +
          (Object.keys(ctx.slaTier || {}).some(function (t) {
            return Object.keys(ctx.slaTier[t] || {}).length;
          })
            ? " (stricter for some tiers)"
            : "") +
          ". The clock starts at first detection (or at reopening) and is measured to " +
          AS_OF +
          ". Accepted risks and false positives are exempt."
        }
        actions={[
          <V.Button
            key="e"
            icon="clock"
            restricted={!ctx.isAdmin}
            restrictedReason="SLA windows are workspace policy: only an administrator can change them."
            onClick={function () {
              se[1]({
                base: Object.assign({}, ctx.sla),
                tier: JSON.parse(JSON.stringify(ctx.slaTier || {})),
              });
            }}
          >
            Edit SLA windows
          </V.Button>,
          <V.Button
            key="d"
            variant="primary"
            icon="ticket"
            restricted={ctx.readOnly}
            restrictedReason={RO_REASON}
            disabled={!ctx.readOnly && !unassignedCrit.length}
            onClick={dispatch}
          >
            {unassignedCrit.length
              ? "Dispatch " + unassignedCrit.length + " critical tickets"
              : "No unassigned criticals"}
          </V.Button>,
        ]}
      />
      {se[0] ? (
        <V.Modal
          title="SLA windows"
          subtitle="Days to remediate by severity, optionally stricter for crown jewels. Changing them recalculates every breach, the trend and the report."
          width="760px"
          onClose={function () {
            se[1](null);
          }}
          footer={[
            <V.Button
              key="r"
              variant="ghost"
              onClick={function () {
                se[1]({
                  base: Object.assign({}, SLA_DEFAULTS),
                  tier: {},
                });
              }}
            >
              Defaults
            </V.Button>,
            <V.Button
              key="c"
              onClick={function () {
                se[1](null);
              }}
            >
              Cancel
            </V.Button>,
            <V.Button
              key="s"
              variant="primary"
              onClick={function () {
                ctx.setSla(se[0].base);
                ctx.setSlaTier(se[0].tier);
                ctx.log(
                  "SLA",
                  "Windows set to " +
                    SEV.map(function (s2) {
                      return s2 + " " + se[0].base[s2] + "d";
                    }).join(", ") +
                    "; tier overrides " +
                    JSON.stringify(se[0].tier),
                );
                se[1](null);
              }}
            >
              Save
            </V.Button>,
          ]}
        >
          <SlaMatrix
            base={se[0].base}
            tier={se[0].tier}
            onBase={function (b2) {
              se[1](
                Object.assign({}, se[0], {
                  base: b2,
                }),
              );
            }}
            onTier={function (t2) {
              se[1](
                Object.assign({}, se[0], {
                  tier: t2,
                }),
              );
            }}
          />
        </V.Modal>
      ) : null}
      <section className="grid-sla">
        <V.SlaBreachCard
          breakdown={bd}
          onSelect={function (s) {
            ctx.setFilters(
              Object.assign({}, EMPTY_FILTERS, {
                cross: {
                  severity: SEV_LABEL[s],
                  slaStatus: "Breached",
                },
              }),
            );
            ctx.showFindings();
          }}
        />
        <V.WidgetCard
          title="Open findings within SLA · by scan"
          draggable={false}
        >
          <V.SlaTrend months={months} />
        </V.WidgetCard>
        <V.WidgetCard title="Breached findings" draggable={false}>
          <div className="stack">
            {a
              .filter(function (x) {
                return x.breached;
              })
              .sort(function (p, q) {
                return p.daysLeft - q.daysLeft;
              })
              .map(function (x) {
                return (
                  <div
                    {...Object.assign(
                      {
                        key: x.id,
                      },
                      openRow(ctx, x.key, "breach-item"),
                    )}
                  >
                    <V.SeverityBadge severity={x.sev} />
                    <span className="breach-name">{x.name}</span>
                    <V.SlaPill status="breached" days={-x.daysLeft} />
                  </div>
                );
              })}
            {a.some(function (x) {
              return x.breached;
            }) ? null : (
              <V.EmptyState
                title="No findings are past their SLA."
                hint="Breached findings appear here, soonest overdue first."
              />
            )}
          </div>
        </V.WidgetCard>
      </section>
      <V.WidgetCard title="C.H.I. SLA projection" draggable={false}>
        <div className="table-bleed">
          <V.SlaProjectionTable rows={proj} />
        </div>
      </V.WidgetCard>
      <section className="grid-2">
        <V.WidgetCard title="RACI matrix · active findings" draggable={false}>
          <div className="scroll-x">
            <V.RaciMatrix data={raci} />
          </div>
        </V.WidgetCard>
        <V.WidgetCard
          title="Governance audit trail"
          draggable={false}
          actions={[
            <V.Button
              key="x"
              size="sm"
              variant="ghost"
              icon="download"
              onClick={function () {
                saveFile(
                  ctx,
                  "vaptlens-audit-log-" + localDay() + ".csv",
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
              }}
            >
              CSV
            </V.Button>,
            <V.Button
              key="v"
              size="sm"
              variant="ghost"
              icon="shield-check"
              onClick={function () {
                AUDIT.verify().then(vr[1], function (e) {
                  ctx.toast({ title: "Couldn't verify the audit log", message: e.message, tone: "danger" });
                });
              }}
            >
              {vr[0]
                ? vr[0].ok
                  ? "Chain intact · " + vr[0].n
                  : "Tampered at #" + vr[0].at
                : "Verify chain"}
            </V.Button>,
          ]}
        >
          {ctx.audit.length ? (
            <AuditTrail ctx={ctx} />
          ) : (
            <V.EmptyState
              title="No governance actions yet."
              hint="Assignments, tickets and status changes are logged here (last 500)."
            />
          )}
        </V.WidgetCard>
      </section>
      <SlaCalendar ctx={ctx} />
      <section className="grid-2">
        <V.WidgetCard title="Vulnerability aging by scan" draggable={false}>
          <div className="vl-static">
            <V.StackedBarChart
              static={true}
              labels={ctx.batches.map(function (b) {
                return b.label;
              })}
              series={aging}
              height={200}
            />
          </div>
        </V.WidgetCard>
        <V.WidgetCard title="Threat trajectories" draggable={false}>
          <V.LineChart
            static={true}
            labels={ctx.batches.map(function (b) {
              return b.label;
            })}
            series={traj}
            height={200}
          />
        </V.WidgetCard>
      </section>
    </div>
  );
}

/* ================= Metrics & KPIs ================= */
