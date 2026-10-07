import { openRow } from "@/app/components/utils";
import { hostLabel } from "@/app/lib/common";
import { money, riskMoneyOf } from "@/app/views/governance/utils";
import React, { useMemo } from "react";
import * as V from "@/ui";

export function RiskMoney(p) {
  var ctx = p.ctx,
    cur = (ctx.policy || {}).currency || "USD";
  var R = useMemo(
    function () {
      return riskMoneyOf(ctx);
    },
    [ctx.active, ctx.policy],
  );
  var top10 = {};
  R.items.slice(0, 10).forEach(function (x) {
    top10[x.f.key] = 1;
  });
  var after = useMemo(
    function () {
      return riskMoneyOf(ctx, top10);
    },
    [ctx.active, ctx.policy],
  );
  var maxBu = Math.max(1, R.bu.length ? R.bu[0].ale : 1);
  return (
    <div className="stack">
      <section className="kpis">
        <V.KpiCard
          label="Annualised loss exposure"
          value={money(R.total, cur)}
          sub={"estimate across " + R.hosts.length + " assets"}
          icon="gauge"
          tone="critical"
        />
        <V.KpiCard
          label="If the top 10 are fixed"
          value={money(after.total, cur)}
          sub={
            "−" +
            money(R.total - after.total, cur) +
            " (" +
            (R.total
              ? Math.round((100 * (R.total - after.total)) / R.total)
              : 0) +
            "%)"
          }
          icon="trend-down"
          tone="ok"
        />
        <V.KpiCard
          label="Biggest business unit"
          value={R.bu.length ? R.bu[0].bu : "—"}
          sub={R.bu.length ? money(R.bu[0].ale, cur) : ""}
          icon="briefcase"
        />
      </section>
      <section className="grid-2">
        <V.WidgetCard title="Exposure by business unit" draggable={false}>
          <div className="stack-tight">
            {R.bu.map(function (b) {
              return (
                <div key={b.bu} className="money-row">
                  <span className="money-l">{b.bu}</span>
                  <span className="money-bar">
                    <i
                      style={{
                        width:
                          Math.max(2, Math.round((100 * b.ale) / maxBu)) + "%",
                      }}
                    />
                  </span>
                  <span className="vl-mono money-v">{money(b.ale, cur)}</span>
                </div>
              );
            })}
          </div>
        </V.WidgetCard>
        <V.WidgetCard
          title="Top 10 findings by expected loss"
          draggable={false}
        >
          <div className="stack-tight">
            {R.items.slice(0, 10).map(function (x) {
              return (
                <div
                  {...Object.assign(
                    {
                      key: x.f.id,
                    },
                    openRow(ctx, x.f.key, "breach-item"),
                  )}
                >
                  <V.SeverityBadge severity={x.f.sev} />
                  <span className="breach-name">
                    {x.f.name + " · " + hostLabel(x.f)}
                  </span>
                  <span className="vl-mono diff-host">{money(x.ale, cur)}</span>
                </div>
              );
            })}
          </div>
        </V.WidgetCard>
      </section>
      <p className="up-help">
        {"Method (FAIR-lite): per finding, annual likelihood = the highest of EPSS, CISA KEV (0.9), zero-day (0.6), exploit indicators (0.3), a pentest confirmation (0.7) and a severity floor; impact = asset value × severity factor (critical 60%, high 35%, medium 15%, low 5%) × exposure (internet 100%, internal 60%, isolated 30%). Findings on one asset combine as 1 − Π(1 − p·impact), so an asset never loses more than its value. Asset values per tier: " +
          [1, 2, 3]
            .map(function (t) {
              return (
                "Tier " +
                t +
                " " +
                money(((ctx.policy || {}).assetValue || {})[t], cur)
              );
            })
            .join(", ") +
          " (set them under Policies). Use it to compare and prioritise, not as an insurance figure."}
      </p>
    </div>
  );
}
