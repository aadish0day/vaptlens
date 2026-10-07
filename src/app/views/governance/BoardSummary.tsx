import { openRow } from "@/app/components/utils";
import { SEV_LABEL, count, hostLabel } from "@/app/lib/common";
import {
  FRAMEWORKS,
  money,
  riskMoneyOf,
  runFramework,
} from "@/app/views/governance/utils";
import { AS_OF } from "@/lib/engine";
import React, { useMemo } from "react";
import * as V from "@/ui";

export function BoardSummary(p) {
  var ctx = p.ctx,
    F = p.F,
    m = ctx.metrics,
    cur = (ctx.policy || {}).currency || "USD",
    R = useMemo(
      function () {
        return riskMoneyOf(ctx);
      },
      [ctx.active, ctx.policy],
    );
  var series = ctx.batches.map(function (b) {
    var r = ctx.data.filter(function (x) {
      var s2 = ctx.stateOf(x.key);
      return (
        x.batch === b.id &&
        x.lifecycle !== "Fixed" &&
        s2 !== "fp" &&
        s2 !== "accepted" &&
        !ctx.isManFixed(x) &&
        (x.sev === "critical" || x.sev === "high")
      );
    });
    return {
      label: b.label,
      n: r.length,
    };
  });
  var first = series.length ? series[0].n : 0,
    last = series.length ? series[series.length - 1].n : 0;
  var top = ctx.active
    .slice()
    .sort(function (a, b) {
      return b.risk - a.risk;
    })
    .slice(0, 5);
  var fwGaps = FRAMEWORKS.map(function (fw) {
    var r = runFramework(fw, F, null, ctx);
    return {
      name: fw.name,
      gaps: count(r, function (x) {
        return x.st === "fail";
      }),
    };
  }).filter(function (x) {
    return x.gaps;
  });
  var lines = [
    "Cyber exposure — " + AS_OF,
    "Estimated annualised loss exposure: " +
      money(R.total, cur) +
      (R.bu.length
        ? " (largest: " + R.bu[0].bu + " " + money(R.bu[0].ale, cur) + ")"
        : ""),
    "Critical + high open: " +
      last +
      (series.length > 1
        ? " (was " + first + " at " + series[0].label + ")"
        : ""),
    "SLA compliance: " +
      (m.slaCompliance == null ? "n/a" : m.slaCompliance + "%") +
      " · MTTR " +
      (m.mttrAll == null ? "n/a" : m.mttrAll + " days") +
      " · known-exploited past due: " +
      m.kevOverdue,
    "Top risks: " +
      top
        .map(function (x) {
          return x.name + " (" + (x.bu || hostLabel(x)) + ")";
        })
        .join("; "),
    "Compliance gaps: " +
      (fwGaps.length
        ? fwGaps
            .map(function (x) {
              return x.name + " " + x.gaps;
            })
            .join(", ")
        : "none on the vulnerability-management controls"),
    "Exceptions: " + m.accepted + " accepted, " + m.fp + " false positives.",
  ];
  function copy() {
    var t = lines.join("\n");
    try {
      navigator.clipboard.writeText(t).then(
        function () {
          ctx.toast({
            title: "Board summary copied",
          });
        },
        function () {
          ctx.toast({
            title: "Select the text to copy it",
            tone: "info",
          });
        },
      );
    } catch (e) {
      ctx.toast({
        title: "Select the text to copy it",
        tone: "info",
      });
    }
  }
  return (
    <V.WidgetCard
      title="Board summary · one page"
      draggable={false}
      actions={[
        <V.Button key="c" size="sm" icon="paperclip" onClick={copy}>
          Copy text
        </V.Button>,
        <V.Button
          key="r"
          size="sm"
          variant="ghost"
          icon="file"
          onClick={function () {
            ctx.go("report");
          }}
        >
          Full report
        </V.Button>,
      ]}
    >
      <section className="kpis">
        <V.KpiCard
          label="Loss exposure (est.)"
          value={money(R.total, cur)}
          sub="per year"
          icon="gauge"
          tone="critical"
        />
        <V.KpiCard
          label="Critical + high open"
          value={last}
          sub={
            series.length > 1
              ? (last <= first ? "down from " + first : "up from " + first) +
                " since " +
                series[0].label
              : ""
          }
          icon={last <= first ? "trend-down" : "trend-up"}
          tone={last > first ? "critical" : "ok"}
        />
        <V.KpiCard
          label="SLA compliance"
          value={m.slaCompliance == null ? "—" : m.slaCompliance + "%"}
          sub={"MTTR " + (m.mttrAll == null ? "—" : m.mttrAll + "d")}
          icon="clock"
          tone={
            m.slaCompliance != null && m.slaCompliance < 80 ? "critical" : "ok"
          }
        />
        <V.KpiCard
          label="Compliance gaps"
          value={fwGaps.reduce(function (t, x) {
            return t + x.gaps;
          }, 0)}
          sub={
            fwGaps.length
              ? fwGaps
                  .map(function (x) {
                    return x.name.split(" ")[0];
                  })
                  .join(", ")
              : "none"
          }
          icon="shield-check"
          tone={fwGaps.length ? "critical" : "ok"}
          onClick={function () {
            p.setTab("Frameworks");
          }}
        />
      </section>
      <h3 className="board-h">Top 5 risks in business terms</h3>
      <ol className="board-top">
        {top.map(function (x) {
          return (
            <li
              {...Object.assign(
                {
                  key: x.id,
                },
                openRow(ctx, x.key, ""),
              )}
            >
              <b>{x.name}</b>
              {" on "}
              {x.bu ? x.bu + " (" + hostLabel(x) + ")" : hostLabel(x)}
              {" · "}
              {x.kev
                ? "known to be exploited"
                : x.exploitable
                  ? "exploit available"
                  : SEV_LABEL[x.sev].toLowerCase() + " severity"}
              {x.breached ? " · past its fix deadline" : ""}
            </li>
          );
        })}
      </ol>
      <pre className="board-text" aria-label="Board summary text">
        {lines.join("\n")}
      </pre>
    </V.WidgetCard>
  );
}
