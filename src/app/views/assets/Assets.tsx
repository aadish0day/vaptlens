import { PageHead } from "@/app/components/PageHead";
import { RO_REASON, count, uniq } from "@/app/lib/common";
import { saveFile } from "@/app/lib/export";
import { assetsCsv, parseAssetCsv } from "@/app/lib/integrations";
import { hostProfiles } from "@/app/views/assets/utils";
import { assetBand, assetRisk, localDay } from "@/lib/engine";
import { readFileText } from "@/lib/store";
import React, { useRef, useState } from "react";
import * as V from "@/ui";

export function Assets(ctx) {
  var hp0 = hostProfiles(ctx),
    max = 1000,
    bf = useState("All"),
    ain = useRef(null),
    lim = useState(200);
  var busAll = uniq(
    hp0.map(function (x) {
      return x.bu || "Unassigned";
    }),
  ).sort();
  var hp =
    bf[0] === "All"
      ? hp0
      : hp0.filter(function (x) {
          return (x.bu || "Unassigned") === bf[0];
        });
  var buStats = busAll
    .map(function (b) {
      var r = hp0.filter(function (x) {
        return (x.bu || "Unassigned") === b;
      });
      var rows = [].concat.apply(
        [],
        r.map(function (x) {
          return x.rows;
        }),
      );
      return {
        bu: b,
        hosts: r.length,
        score: assetRisk(rows),
        open: rows.length,
        crit: count(rows, function (x) {
          return x.sev === "critical";
        }),
        jewels: count(r, function (x) {
          return x.tier === 1;
        }),
      };
    })
    .sort(function (a, b) {
      return b.score - a.score;
    });
  var reg = [];
  ctx.active
    .filter(function (x) {
      return x.zeroday;
    })
    .forEach(function (x) {
      reg.push({
        kind: "zeroday",
        name: x.name,
        detail: x.cves.join(", ") || "No CVE yet",
        hosts: 1,
        criticals: x.sev === "critical" ? 1 : 0,
      });
    });
  var eolBy = {};
  ctx.active
    .filter(function (x) {
      return x.eol;
    })
    .forEach(function (x) {
      var n = x.name.replace(/ \(EOL\)| End-of-Life|Outdated /g, "").trim();
      (eolBy[n] = eolBy[n] || {
        hosts: [],
        crit: 0,
      }).hosts.push(x.host);
      if (x.sev === "critical") eolBy[n].crit++;
    });
  Object.keys(eolBy).forEach(function (n) {
    reg.push({
      kind: "eol",
      name: n,
      detail: "End of life",
      hosts: uniq(eolBy[n].hosts).length,
      criticals: eolBy[n].crit,
    });
  });
  return (
    <div className="page">
      <PageHead
        title="Asset Inventory"
        sub={
          hp0.length +
          " hosts · " +
          count(hp0, function (x) {
            return x.tier === 1;
          }) +
          " crown jewels · asset risk 0–1000 (Severe 850+, High 700+, Medium 500+)."
        }
        actions={[
          <V.SegmentedControl
            key="b"
            label="Business unit"
            options={["All"].concat(busAll)}
            value={bf[0]}
            onChange={bf[1]}
          />,
          <V.DropdownMenu
            key="c"
            label="CMDB"
            icon="database"
            align="right"
            items={[
              {
                label: "Import assets CSV…",
                hint: "owner, BU, tier",
                onSelect: function () {
                  if (ctx.readOnly) {
                    ctx.toast({
                      title: RO_REASON,
                      tone: "info",
                    });
                    return;
                  }
                  if (ain.current) ain.current.click();
                },
              },
              {
                label: "Export assets CSV",
                hint: ".csv",
                onSelect: function () {
                  saveFile(
                    ctx,
                    "vaptlens-assets-" + localDay() + ".csv",
                    assetsCsv(ctx),
                  );
                },
              },
            ]}
          />,
        ]}
      />
      <input
        ref={ain}
        type="file"
        accept=".csv"
        hidden={true}
        onChange={function (e) {
          var f0 = e.target.files[0];
          e.target.value = "";
          if (!f0) return;
          readFileText(f0)
            .then(function (t) {
              var got = parseAssetCsv(t, ctx),
                n = Object.assign({}, ctx.assets),
                k = Object.keys(got);
              k.forEach(function (hh) {
                n[hh] = Object.assign({}, n[hh] || {}, got[hh]);
              });
              ctx.setAssets(n);
              ctx.log(
                "CMDB",
                f0.name +
                  ": " +
                  k.length +
                  " assets imported (owner, business unit, tier, exposure)",
              );
              ctx.toast({
                title: k.length + " assets imported",
                message: "Risk, SSVC and attack paths recalculated.",
              });
            })
            .catch(function (er) {
              ctx.toast({
                title: "Couldn't import assets",
                message: er.message,
                tone: "danger",
              });
            });
        }}
      />
      <V.WidgetCard title="Business units" draggable={false}>
        <div className="bu-grid">
          {buStats.map(function (b) {
            return (
              <button
                key={b.bu}
                type="button"
                className={"bu-card" + (bf[0] === b.bu ? " is-on" : "")}
                onClick={function () {
                  bf[1](bf[0] === b.bu ? "All" : b.bu);
                }}
              >
                <span className="bu-name">{b.bu}</span>
                <span
                  className={"bu-score bu-" + assetBand(b.score).toLowerCase()}
                >
                  {b.score}
                </span>
                <span className="bu-band">{assetBand(b.score)}</span>
                <span className="up-meta">
                  {b.hosts +
                    " hosts · " +
                    b.open +
                    " open · " +
                    b.crit +
                    " critical · " +
                    b.jewels +
                    " crown jewels"}
                </span>
              </button>
            );
          })}
        </div>
      </V.WidgetCard>
      <section className="grid-side">
        <V.WidgetCard
          title="Hosts"
          draggable={false}
          actions={
            hp.length > lim[0] ? (
              <V.Button
                size="sm"
                onClick={function () {
                  lim[1](lim[0] + 500);
                }}
              >
                {"Showing " + lim[0] + " of " + hp.length + " · show 500 more"}
              </V.Button>
            ) : null
          }
        >
          <div className="table-bleed scroll-x">
            <div className="asset-list">
              {hp.slice(0, lim[0]).map(function (x) {
                return (
                  <V.AssetRow
                    key={x.host}
                    host={x.host}
                    device={x.device}
                    os={x.os}
                    eol={x.eol}
                    tier={x.tier}
                    owner={x.owner}
                    counts={x.counts}
                    score={x.score}
                    onClick={function () {
                      ctx.openHost(x.host);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </V.WidgetCard>
        <div className="stack">
          <V.WidgetCard title="Host risk leaderboard" draggable={false}>
            <div className="stack">
              {hp.slice(0, 8).map(function (x) {
                return (
                  <button
                    key={x.host}
                    type="button"
                    className="meter-btn"
                    onClick={function () {
                      ctx.openHost(x.host);
                    }}
                  >
                    <V.RiskMeter
                      host={x.host}
                      score={x.score}
                      max={max}
                      criticals={x.counts.critical}
                    />
                  </button>
                );
              })}
            </div>
          </V.WidgetCard>
          <V.WidgetCard title="Tier mix" draggable={false}>
            <div className="tier-mix">
              {[1, 2, 3].map(function (t) {
                return (
                  <div key={t} className="tier-cell">
                    <V.TierBadge tier={t} />
                    <span className="tier-n">
                      {count(hp, function (x) {
                        return x.tier === t;
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </V.WidgetCard>
        </div>
      </section>
      <V.WidgetCard
        title={"Exposure registry · EOL & Zero-day"}
        draggable={false}
      >
        <V.ExposureRegistry items={reg} />
      </V.WidgetCard>
    </div>
  );
}
