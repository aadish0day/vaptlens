import { PageHead } from "@/app/components/PageHead";
import { openRow } from "@/app/components/utils";
import { hostProfiles } from "@/app/views/assets/utils";
import { subnetOf } from "@/lib/data";
import { assetBand } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

/* ================= 6. Network ================= */
export function Network(ctx) {
  var hpAll = hostProfiles(ctx),
    sel = useState(hpAll.length ? hpAll[0].host : null);
  /* the map draws the 400 riskiest hosts (plus the selected one); a 20k-node SVG helps no one */
  var hp = hpAll.length > 400 ? hpAll.slice(0, 400) : hpAll;
  if (
    sel[0] &&
    hp.indexOf(
      hpAll.find(function (x) {
        return x.host === sel[0];
      }),
    ) < 0
  ) {
    var sx = hpAll.find(function (x) {
      return x.host === sel[0];
    });
    if (sx) hp = hp.concat([sx]);
  }
  var subs = {};
  hp.forEach(function (x) {
    var s = subnetOf(x.host);
    var worst =
      ["critical", "high", "medium", "low", "info"].find(function (sv) {
        return x.rows.some(function (y) {
          return y.sev === sv;
        });
      }) || "info";
    (subs[s] = subs[s] || []).push({
      ip: x.host,
      count: x.rows.length,
      severity: worst,
    });
  });
  var prof = hp.find(function (x) {
    return x.host === sel[0];
  });
  return (
    <div className="page">
      <PageHead
        title="Network Map"
        sub={
          Object.keys(subs).length +
          " zones · " +
          hpAll.length +
          " hosts" +
          (hpAll.length > hp.length
            ? " (map shows the " + hp.length + " riskiest)"
            : "") +
          ". Node size follows finding volume; fill is the worst severity."
        }
      />
      <section className="grid-side">
        <V.WidgetCard title="Subnet topology" draggable={false}>
          <V.TopologyMap
            selected={sel[0]}
            onSelect={function (ip) {
              sel[1](ip);
            }}
            subnets={Object.keys(subs)
              .sort()
              .map(function (k) {
                return {
                  name: k,
                  hosts: subs[k],
                };
              })}
          />
        </V.WidgetCard>
        <V.WidgetCard title="Node intelligence" draggable={false}>
          {prof ? (
            <div className="stack">
              <div className="node-head">
                <span className="node-ip">{prof.host}</span>
                <V.TierBadge tier={prof.tier} short={true} />
              </div>
              <span className="node-sub">
                {prof.device + " · " + prof.os + " · " + prof.owner}
              </span>
              <V.RiskMeter
                host={"Asset risk · " + assetBand(prof.score)}
                score={prof.score}
                max={1000}
              />
              <div className="stack-tight">
                {prof.rows
                  .sort(function (p, q) {
                    return q.risk - p.risk;
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
                      </div>
                    );
                  })}
              </div>
              <V.Button
                size="sm"
                onClick={function () {
                  ctx.openHost(prof.host);
                }}
              >
                Open host triage
              </V.Button>
            </div>
          ) : (
            <V.EmptyState title="Select a host on the map." />
          )}
        </V.WidgetCard>
      </section>
    </div>
  );
}

/* ================= 7. Re-test ================= */
