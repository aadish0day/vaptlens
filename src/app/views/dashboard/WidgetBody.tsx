import { SEV_LABEL, count } from "@/app/lib/common";
import { exposureItems } from "@/app/views/dashboard/utils";
import { applyFilters } from "@/app/views/findings/utils";
import {
  GroupedBarChart,
  MEASURE_LABEL,
  TIME_DIMS,
  aggregate,
  computeMeasure,
  dimValue,
} from "@/lib/dash";
import { SEV } from "@/lib/data";
import React from "react";
import * as V from "@/ui";

export function WidgetBody(p) {
  var c = p.cfg || {},
    dc = p.dc,
    bi = dc.bi,
    ctx = dc.ctx,
    f = dc.f;
  var own = c.group,
    src = c.history || TIME_DIMS[c.group] ? p.hist : p.rows;
  /* a chart ignores the cross-filter on its own dimension so it keeps showing every category */
  if (own && f.cross[own] != null)
    src = applyFilters(
      c.history || TIME_DIMS[c.group]
        ? ctx.data.filter(function (x) {
            return x.lifecycle !== "Fixed";
          })
        : ctx.active,
      f,
      bi,
      own,
      !!(c.history || TIME_DIMS[c.group]),
    );
  var xf =
    own &&
    !(
      c.history || TIME_DIMS[own]
    ); /* trend charts span every batch, so they do not cross-filter the latest scan */
  var sel = xf ? f.cross[own] : null,
    onSel = xf
      ? function (v) {
          dc.setCross(own, v);
        }
      : undefined;
  if (
    !src.length &&
    ["slabreach", "hostrisk", "exposure", "kpi"].indexOf(c.chart) < 0
  )
    return <V.EmptyState title="No findings match the current filters." />;
  var isSev = c.group === "severity";
  function colorOf(l, i) {
    return isSev ? undefined : "var(--chart-" + ((i % 6) + 1) + ")";
  }
  switch (c.chart) {
    case "kpi":
      return (
        <div className="w-kpi">
          <span className="w-kpi-v">
            {computeMeasure(p.rows, c.measure || "count")}
          </span>
          <span className="vl-label">
            {MEASURE_LABEL[c.measure || "count"] +
              " · " +
              p.rows.length +
              " findings in view"}
          </span>
        </div>
      );
    case "slabreach":
      var bd = {};
      SEV.forEach(function (s) {
        bd[s] = count(p.rows, function (x) {
          return x.sev === s && x.breached;
        });
      });
      return (
        <V.SlaBreachCard
          breakdown={bd}
          onSelect={function (s) {
            dc.setCross("severity", SEV_LABEL[s]);
          }}
        />
      );
    case "hostrisk":
      var hm = {};
      p.rows.forEach(function (x) {
        var o =
          hm[x.host] ||
          (hm[x.host] = {
            host: x.host,
            score: 0,
            crit: 0,
          });
        o.score += x.risk;
        if (x.sev === "critical") o.crit++;
      });
      var hs = Object.keys(hm)
        .map(function (k) {
          return hm[k];
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .slice(0, 5);
      return (
        <div className="stack">
          {hs.map(function (x) {
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
                  max={hs[0].score}
                  criticals={x.crit}
                />
              </button>
            );
          })}
        </div>
      );
    case "exposure":
      return (
        <V.ExposureBars
          total={Math.max(1, p.rows.length)}
          items={exposureItems(p.rows)}
        />
      );
    case "heatmap":
      var ag = aggregate(
        src,
        {
          group: "host",
          measure: "count",
          topN: c.topN || 8,
          sort: "desc",
        },
        bi,
      );
      return (
        <div className="scroll-x">
          <V.Heatmap
            selected={f.cross.host}
            onSelect={function (v) {
              dc.setCross("host", v);
            }}
            rows={ag.labels.map(function (hh) {
              var r = ag.groups[hh];
              return {
                host: hh,
                values: SEV.map(function (s) {
                  return count(r, function (x) {
                    return x.sev === s;
                  });
                }),
              };
            })}
          />
        </div>
      );
    case "scatter":
      var agS = aggregate(
        src,
        {
          group: c.group || "host",
          measure: "count",
          topN: c.topN || 6,
          sort: "desc",
        },
        bi,
      );
      return (
        <V.ScatterChart
          categories={agS.labels}
          selected={sel}
          onSelect={onSel}
          points={src
            .filter(function (x) {
              return (
                agS.labels.indexOf(
                  [].concat(dimValue(x, c.group || "host", bi))[0],
                ) >= 0
              );
            })
            .map(function (x) {
              return {
                category: [].concat(dimValue(x, c.group || "host", bi))[0],
                cvss: x.cvss || 0,
                severity: x.sev,
                name: x.name,
              };
            })}
        />
      );
    case "radar":
      if (c.group === "posture") {
        var ax = [
            "Exploitable",
            "KEV",
            "Zero-day",
            "Ransomware",
            "EOL",
            "SLA breach",
          ],
          keys = [
            "exploitable",
            "kev",
            "zeroday",
            "ransomware",
            "eol",
            "breached",
          ];
        var ser = ctx.batches.slice(-2).map(function (b, i, arr) {
          var r = p.hist.filter(function (x) {
            return x.batch === b.id;
          });
          return {
            label: b.label,
            dashed: i < arr.length - 1,
            color: i < arr.length - 1 ? "var(--chart-6)" : "var(--chart-1)",
            values: keys.map(function (k) {
              return count(r, function (x) {
                return x[k];
              });
            }),
          };
        });
        var mx = Math.max.apply(
          null,
          [4].concat(
            ser.map(function (s) {
              return Math.max.apply(null, s.values);
            }),
          ),
        );
        return (
          <V.RadarChart axes={ax} series={ser} max={Math.ceil(mx / 2) * 2} />
        );
      }
      var agR = aggregate(src, c, bi);
      var mxR = Math.max.apply(null, [1].concat(agR.values));
      return (
        <V.RadarChart
          axes={agR.labels.slice(0, 8)}
          series={[
            {
              label: MEASURE_LABEL[c.measure || "count"],
              values: agR.values.slice(0, 8),
            },
          ]}
          max={Math.ceil(mxR)}
        />
      );
  }
  var a: any = aggregate(src, c, bi);
  if (c.chart === "donut")
    return (
      <V.DonutChart
        selected={sel}
        onSelect={onSel}
        totalLabel={(MEASURE_LABEL[c.measure || "count"] || "").toLowerCase()}
        total={
          c.measure && c.measure !== "count"
            ? computeMeasure(src, c.measure)
            : undefined
        }
        data={a.labels.slice(0, 6).map(function (l, i) {
          return {
            label: l,
            value: a.values[i],
            severity: isSev ? String(l).toLowerCase() : undefined,
            color: colorOf(l, i),
          };
        })}
      />
    );
  if (c.chart === "treemap")
    return (
      <V.Treemap
        selected={sel}
        onSelect={onSel}
        height={240}
        data={a.labels.map(function (l, i) {
          return {
            label: l,
            value: a.values[i],
            severity: isSev ? String(l).toLowerCase() : undefined,
          };
        })}
      />
    );
  if (c.chart === "line" || c.chart === "area")
    return (
      <V.LineChart
        id={"w" + Math.random().toString(36).slice(2, 6)}
        area={c.chart === "area"}
        labels={a.labels}
        series={
          a.series || [
            {
              label: MEASURE_LABEL[c.measure || "count"],
              values: a.values,
            },
          ]
        }
        height={200}
      />
    );
  if (a.series)
    return c.stack === "grouped" ? (
      <GroupedBarChart
        labels={a.labels}
        series={a.series}
        selected={sel}
        onSelect={onSel}
      />
    ) : (
      <V.StackedBarChart
        labels={a.labels}
        series={a.series}
        selected={sel}
        onSelect={onSel}
        height={200}
      />
    );
  return (
    <V.BarChart
      selected={sel}
      onSelect={onSel}
      height={190}
      data={a.labels.map(function (l, i) {
        return {
          label: l,
          value: a.values[i],
          severity: isSev ? String(l).toLowerCase() : undefined,
          color: colorOf(l, i),
        };
      })}
    />
  );
}
