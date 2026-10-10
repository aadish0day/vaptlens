import { SEV_LABEL_G } from "@/lib/data";
import React from "react";
import { ChartLegend } from "@/ui/ChartLegend";

/* ---------- BI engine: dimensions, measures, aggregate(), widget rendering ---------- */
export var DIMS = [
  ["severity", "Severity"],
  ["host", "Host"],
  ["tool", "Tool"],
  ["scanLabel", "Scan batch"],
  ["port", "Port"],
  ["cve", "CVE"],
  ["name", "Finding"],
  ["cvssBucket", "CVSS bucket"],
  ["scanMonth", "Scan month"],
  ["lifecycle", "Lifecycle"],
  ["slaStatus", "SLA status"],
  ["isExploitable", "Exploitable"],
  ["isEol", "EOL"],
  ["isZeroDay", "Zero-day"],
  ["unpatchedAge", "Unpatched age"],
  ["owaspCategory", "OWASP category"],
  ["ssvc", "SSVC decision"],
  ["tier", "Asset tier"],
  ["exposure", "Exposure"],
  ["epssBucket", "EPSS band"],
  ["cwe", "CWE"],
  ["businessUnit", "Business unit"],
  ["attackTactic", "ATT&CK tactic"],
  ["attackPath", "Attack path"],
  ["agingBucket", "Aging bucket"],
  ["subnet", "Subnet"],
  ["cisaKev", "CISA KEV"],
  ["ransomwareVector", "Ransomware"],
  ["team", "Owner team"],
];

export var DIM_LABEL = {};

DIMS.forEach(function (d) {
  DIM_LABEL[d[0]] = d[1];
});

export var TIME_DIMS = {
  scanLabel: 1,
  scanMonth: 1,
};

export var MEASURES = [
  ["count", "Count"],
  ["avgCvss", "Average CVSS"],
  ["maxCvss", "Max CVSS"],
  ["distinctHosts", "Distinct hosts"],
  ["distinctFindings", "Distinct findings"],
];

export var MEASURE_LABEL = {};

MEASURES.forEach(function (m) {
  MEASURE_LABEL[m[0]] = m[1];
});

export var CHARTS = [
  ["bar", "Bar"],
  ["donut", "Donut"],
  ["area", "Area"],
  ["line", "Line"],
  ["radar", "Radar"],
  ["treemap", "Treemap"],
  ["heatmap", "Heatmap"],
  ["scatter", "Scatter"],
  ["histogram", "Histogram"],
  ["kpi", "KPI card"],
  ["slabreach", "SLA breach card"],
  ["hostrisk", "Host risk list"],
  ["exposure", "Threat exposure"],
];

export var CHART_LABEL = {};

CHARTS.forEach(function (c) {
  CHART_LABEL[c[0]] = c[1];
});

export var ORDERS = {
  severity: ["Critical", "High", "Medium", "Low", "Info"],
  cvssBucket: ["0.0", "0.1–3.9", "4.0–6.9", "7.0–8.9", "9.0–10.0"],
  agingBucket: ["0–30 days", "31–90 days", "91–180 days", "180+ days"],
  lifecycle: ["New", "Open", "Reopened", "Fixed"],
  ssvc: ["Act", "Attend", "Track*", "Track"],
  tier: ["Tier 1", "Tier 2", "Tier 3"],
  epssBucket: ["≥ 50%", "10–50%", "1–10%", "< 1%", "No EPSS"],
};

export var MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function dimValue(f, key, ctx) {
  switch (key) {
    case "severity":
      return SEV_LABEL_G[f.sev];
    case "host":
      return f.host;
    case "tool":
      return f.tool;
    case "scanLabel":
      return ctx.batchLabel[f.batch] || "Batch " + f.batch;
    case "port":
      return f.port ? String(f.port) : "n/a";
    case "cve":
      return f.cves.length ? f.cves : ["No CVE"];
    case "name":
      return f.name;
    case "cvssBucket":
      return !f.cvss
        ? "0.0"
        : f.cvss < 4
          ? "0.1–3.9"
          : f.cvss < 7
            ? "4.0–6.9"
            : f.cvss < 9
              ? "7.0–8.9"
              : "9.0–10.0";
    case "scanMonth":
      var d = ctx.batchDate[f.batch];
      if (!d) return "n/a";
      var p = d.split("-");
      return MONTHS[+p[1] - 1] + " " + p[0];
    case "lifecycle":
      return f.lifecycle;
    case "ssvc":
      return f.ssvc ? f.ssvc.decision : "Track";
    case "businessUnit":
      return f.bu || "Unassigned";
    case "attackTactic":
      return f.attack ? f.attack.tactic : "No technique";
    case "attackPath":
      return f.onPath ? "On attack path" : "Not on a path";
    case "tier":
      return "Tier " + (f.tier || 2);
    case "exposure":
      return f.exposure === "internet" ? "Internet-facing" : "Internal";
    case "epssBucket":
      return f.epss == null
        ? "No EPSS"
        : f.epss >= 0.5
          ? "≥ 50%"
          : f.epss >= 0.1
            ? "10–50%"
            : f.epss >= 0.01
              ? "1–10%"
              : "< 1%";
    case "cwe":
      return f.cwe && f.cwe.length ? f.cwe : ["No CWE"];
    case "slaStatus":
      return f.breached ? "Breached" : "Met";
    case "isExploitable":
      return f.exploitable ? "Exploitable" : "Not exploitable";
    case "isEol":
      return f.eol ? "EOL/Obsolete" : "Supported";
    case "isZeroDay":
      return f.zeroday ? "Zero-day" : "Known";
    case "unpatchedAge":
      return f.ageDays > 180 ? "Unpatched > 6 months" : "Unpatched < 6 months";
    case "owaspCategory":
      return f.owasp || "Uncategorised";
    case "agingBucket":
      return f.ageDays <= 30
        ? "0–30 days"
        : f.ageDays <= 90
          ? "31–90 days"
          : f.ageDays <= 180
            ? "91–180 days"
            : "180+ days";
    case "subnet":
      return f.subnet;
    case "cisaKev":
      return f.kev ? "CISA KEV" : "Not in KEV";
    case "ransomwareVector":
      return f.ransomware ? "Ransomware threat" : "Standard risk";
    case "team":
      return ctx.teamOf(f);
  }
  return "n/a";
}

export function matchDim(f, key, val, ctx) {
  var v = dimValue(f, key, ctx);
  return Array.isArray(v) ? v.indexOf(val) >= 0 : v === val;
}

export function computeMeasure(rows, m) {
  if (!rows.length) return 0;
  if (m === "avgCvss")
    return (
      Math.round(
        (rows.reduce(function (a, r) {
          return a + (r.cvss || 0);
        }, 0) /
          rows.length) *
          10,
      ) / 10
    );
  if (m === "maxCvss")
    return Math.max.apply(
      null,
      rows.map(function (r) {
        return r.cvss || 0;
      }),
    );
  if (m === "distinctHosts")
    return uniqG(
      rows.map(function (r) {
        return r.host;
      }),
    ).length;
  if (m === "distinctFindings")
    return uniqG(
      rows.map(function (r) {
        return r.name.toLowerCase();
      }),
    ).length;
  return rows.length;
}

export function uniqG(a) {
  var s = {},
    o = [];
  a.forEach(function (x) {
    if (!s[x]) {
      s[x] = 1;
      o.push(x);
    }
  });
  return o;
}

export function groupRows(rows, key, ctx) {
  var g = {};
  rows.forEach(function (r) {
    [].concat(dimValue(r, key, ctx)).forEach(function (v) {
      (g[v] = g[v] || []).push(r);
    });
  });
  return g;
}

export function orderLabels(labels, key, ctx, values, sort) {
  if (ORDERS[key])
    return ORDERS[key].filter(function (l) {
      return labels.indexOf(l) >= 0;
    });
  if (TIME_DIMS[key])
    return ctx.batchOrder(key).filter(function (l) {
      return labels.indexOf(l) >= 0;
    });
  var arr = labels.slice();
  if (sort === "label")
    arr.sort(function (a, b) {
      return String(a).localeCompare(String(b), undefined, {
        numeric: true,
      });
    });
  else
    arr.sort(function (a, b) {
      return sort === "asc" ? values[a] - values[b] : values[b] - values[a];
    });
  return arr;
}
/* aggregate(findings, {group, measure, colorBy, topN, sort}) */

/* aggregate(findings, {group, measure, colorBy, topN, sort}) */
export function aggregate(rows, cfg, ctx) {
  var g = groupRows(rows, cfg.group, ctx),
    vals = {};
  Object.keys(g).forEach(function (k) {
    vals[k] = computeMeasure(g[k], cfg.measure);
  });
  var labels = orderLabels(Object.keys(g), cfg.group, ctx, vals, cfg.sort);
  var n = +cfg.topN || 0;
  if (n && labels.length > n && !ORDERS[cfg.group] && !TIME_DIMS[cfg.group])
    labels = labels.slice(0, n);
  var out: any = {
    labels: labels,
    values: labels.map(function (l) {
      return vals[l];
    }),
    groups: g,
  };
  if (cfg.colorBy && cfg.colorBy !== cfg.group) {
    var sub = groupRows(rows, cfg.colorBy, ctx),
      subVals = {};
    Object.keys(sub).forEach(function (k) {
      subVals[k] = computeMeasure(sub[k], cfg.measure);
    });
    var keys = orderLabels(
      Object.keys(sub),
      cfg.colorBy,
      ctx,
      subVals,
      "desc",
    ).slice(0, 6);
    out.series = keys.map(function (k) {
      return {
        label: k,
        severity: cfg.colorBy === "severity" ? k.toLowerCase() : undefined,
        values: labels.map(function (l) {
          return computeMeasure(
            (g[l] || []).filter(function (r) {
              return matchDim(r, cfg.colorBy, k, ctx);
            }),
            cfg.measure,
          );
        }),
      };
    });
  }
  return out;
}

/* Grouped bars (side-by-side series) */

/* Grouped bars (side-by-side series) */
export function GroupedBarChart(props) {
  var labels = props.labels || [],
    series = props.series || [];
  var W = 480,
    H = 200,
    padL = 32,
    padB = 24,
    padT = 8;
  var mx = 1;
  series.forEach(function (s) {
    s.values.forEach(function (v) {
      if (v > mx) mx = v;
    });
  });
  var nice = Math.ceil(mx / 4) * 4 || 4,
    bw = (W - padL) / Math.max(1, labels.length),
    gw = Math.min(64, bw * 0.8),
    sw = gw / Math.max(1, series.length);
  function color(s, k) {
    return (
      s.color ||
      (s.severity
        ? "var(--sev-" + s.severity + ")"
        : "var(--chart-" + ((k % 6) + 1) + ")")
    );
  }
  return (
    <div className="vl-chart">
      <svg
        viewBox={"0 0 " + W + " " + H}
        width="100%"
        role="img"
        aria-label={props.label || "Grouped bar chart"}
      >
        {[0, 0.25, 0.5, 0.75, 1].map(function (t) {
          var y = padT + (H - padB - padT) * (1 - t);
          return (
            <g key={t}>
              <line className="vl-grid" x1={padL} x2={W} y1={y} y2={y} />
              <text className="vl-axis" x={padL - 6} y={y + 4} textAnchor="end">
                {Math.round(nice * t)}
              </text>
            </g>
          );
        })}
        {labels.map(function (l, i) {
          var x0 = padL + i * bw + (bw - gw) / 2,
            sel = props.selected;
          return (
            <g
              key={l}
              className={
                "vl-bar" +
                (sel != null && sel !== l ? " is-dim" : "") +
                (sel === l ? " is-sel" : "")
              }
              onClick={function () {
                if (props.onSelect) props.onSelect(sel === l ? null : l);
              }}
            >
              {series.map(function (s, k) {
                var v = s.values[i] || 0,
                  bh = ((H - padB - padT) * v) / nice;
                return (
                  <rect
                    key={k}
                    x={x0 + k * sw + 1}
                    y={H - padB - bh}
                    width={Math.max(1, sw - 2)}
                    height={bh}
                    rx={2}
                    fill={color(s, k)}
                  >
                    <title>{l + " · " + s.label + ": " + v}</title>
                  </rect>
                );
              })}
              <text
                className="vl-axis"
                x={x0 + gw / 2}
                y={H - 8}
                textAnchor="middle"
              >
                {String(l).length > 12 ? String(l).slice(0, 11) + "…" : l}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartLegend
        items={series.map(function (s, k) {
          return {
            label: s.label,
            severity: s.severity,
            color: s.severity ? null : color(s, k),
          };
        })}
      />
    </div>
  );
}

/* ---------- Templates (17) ---------- */

/* ---------- Templates (17) ---------- */
export var TEMPLATES = [
  {
    key: "bu",
    title: "Risk by business unit",
    description: "Total finding risk per business unit.",
    cfg: {
      chart: "bar",
      group: "businessUnit",
      measure: "count",
      colorBy: "severity",
      stack: "stacked",
    },
    w: 6,
    h: 8,
  },
  {
    key: "tactic",
    title: "ATT&CK tactics",
    description:
      "What your findings let an attacker do, by MITRE ATT&CK tactic.",
    cfg: {
      chart: "donut",
      group: "attackTactic",
      measure: "count",
    },
    w: 4,
    h: 7,
  },
  {
    key: "ssvc",
    title: "SSVC decisions",
    description:
      "CISA SSVC outcome (Act, Attend, Track*, Track) per active finding.",
    cfg: {
      chart: "bar",
      group: "ssvc",
      measure: "count",
      colorBy: "severity",
      stack: "stacked",
    },
    w: 4,
    h: 7,
  },
  {
    key: "epss",
    title: "Exploit probability (EPSS)",
    description: "Active findings by EPSS band. Load the FIRST feed in Data.",
    cfg: {
      chart: "donut",
      group: "epssBucket",
      measure: "count",
    },
    w: 4,
    h: 7,
  },
  {
    key: "sev",
    title: "Severity distribution",
    description: "Active findings by severity.",
    cfg: {
      chart: "donut",
      group: "severity",
      measure: "count",
    },
    w: 4,
    h: 7,
  },
  {
    key: "sla",
    title: "SLA compliance",
    description: "Breached findings per severity window.",
    cfg: {
      chart: "slabreach",
    },
    w: 3,
    h: 7,
  },
  {
    key: "life",
    title: "Vulnerability lifecycle",
    description: "New vs open findings this scan.",
    cfg: {
      chart: "bar",
      group: "lifecycle",
      measure: "count",
      colorBy: "severity",
      stack: "stacked",
    },
    w: 4,
    h: 7,
  },
  {
    key: "hosts",
    title: "Top 10 hosts",
    description: "Hosts ranked by active findings.",
    cfg: {
      chart: "bar",
      group: "host",
      measure: "count",
      topN: 10,
      sort: "desc",
    },
    w: 6,
    h: 8,
  },
  {
    key: "recur",
    title: "Recurring findings",
    description: "Findings seen in the most scan batches.",
    cfg: {
      chart: "bar",
      group: "name",
      measure: "count",
      topN: 8,
      sort: "desc",
      history: true,
    },
    w: 6,
    h: 8,
  },
  {
    key: "ports",
    title: "Port distribution",
    description: "Findings per network port.",
    cfg: {
      chart: "bar",
      group: "port",
      measure: "count",
      topN: 10,
      sort: "desc",
    },
    w: 6,
    h: 7,
  },
  {
    key: "hist",
    title: "CVSS histogram",
    description: "Findings per CVSS band.",
    cfg: {
      chart: "histogram",
      group: "cvssBucket",
      measure: "count",
    },
    w: 4,
    h: 7,
  },
  {
    key: "tools",
    title: "Tool comparison",
    description: "Each scanner's findings by severity.",
    cfg: {
      chart: "bar",
      group: "tool",
      measure: "count",
      colorBy: "severity",
      stack: "grouped",
    },
    w: 6,
    h: 8,
  },
  {
    key: "trend",
    title: "Trend over time",
    description: "Findings per scan batch by severity.",
    cfg: {
      chart: "line",
      group: "scanLabel",
      measure: "count",
      colorBy: "severity",
    },
    w: 6,
    h: 8,
    needsDates: true,
  },
  {
    key: "heat",
    title: "Severity heatmap",
    description: "Host × severity density.",
    cfg: {
      chart: "heatmap",
      group: "host",
      topN: 8,
    },
    w: 6,
    h: 8,
  },
  {
    key: "radar",
    title: "Risk posture radar",
    description: "Threat attributes across the estate.",
    cfg: {
      chart: "radar",
      group: "posture",
      measure: "count",
    },
    w: 4,
    h: 8,
  },
  {
    key: "tree",
    title: "Treemap",
    description: "Findings by host, sized by count.",
    cfg: {
      chart: "treemap",
      group: "host",
      measure: "count",
      topN: 12,
    },
    w: 6,
    h: 8,
  },
  {
    key: "scatter",
    title: "Scatter",
    description: "CVSS per finding across top hosts.",
    cfg: {
      chart: "scatter",
      group: "host",
      topN: 6,
    },
    w: 6,
    h: 8,
  },
  {
    key: "owasp",
    title: "OWASP compliance",
    description: "OWASP Top 10 (2021) categories.",
    cfg: {
      chart: "treemap",
      group: "owaspCategory",
      measure: "count",
    },
    w: 6,
    h: 8,
  },
  {
    key: "aging",
    title: "Aging buckets",
    description: "How long findings have been open.",
    cfg: {
      chart: "bar",
      group: "agingBucket",
      measure: "count",
      colorBy: "severity",
      stack: "stacked",
    },
    w: 4,
    h: 7,
  },
  {
    key: "subnet",
    title: "Subnet density",
    description: "Findings per /24 subnet.",
    cfg: {
      chart: "bar",
      group: "subnet",
      measure: "count",
      colorBy: "severity",
      stack: "stacked",
    },
    w: 6,
    h: 7,
  },
  {
    key: "hostrisk",
    title: "Host risk leaderboard",
    description: "Top 5 hosts by weighted risk.",
    cfg: {
      chart: "hostrisk",
    },
    w: 4,
    h: 7,
  },
];

export var TEMPLATE_THUMB = {
  donut: "donut",
  line: "line",
  area: "line",
  heatmap: "heatmap",
};

export function TPL(k) {
  return TEMPLATES.find(function (t) {
    return t.key === k;
  });
}

export var DEFAULT_WIDGETS = [
  {
    i: "w-sev",
    title: "Severity distribution",
    cfg: TPL("sev").cfg,
  },
  {
    i: "w-hostrisk",
    title: "Top hosts by risk",
    cfg: TPL("hostrisk").cfg,
  },
  {
    i: "w-sla",
    title: "SLA compliance",
    cfg: TPL("sla").cfg,
  },
  {
    i: "w-trend",
    title: "Findings per scan batch",
    cfg: {
      chart: "bar",
      group: "scanLabel",
      measure: "count",
      colorBy: "severity",
      stack: "stacked",
    },
  },
  {
    i: "w-heat",
    title: "Severity heatmap · host × severity",
    cfg: TPL("heat").cfg,
  },
  {
    i: "w-owasp",
    title: "OWASP Top 10 (2021)",
    cfg: TPL("owasp").cfg,
  },
  {
    i: "w-scatter",
    title: "CVSS by host",
    cfg: TPL("scatter").cfg,
  },
];

export var DEFAULT_LAYOUT = [
  {
    i: "w-sev",
    x: 0,
    y: 0,
    w: 5,
    h: 7,
  },
  {
    i: "w-hostrisk",
    x: 5,
    y: 0,
    w: 4,
    h: 7,
  },
  {
    i: "w-sla",
    x: 9,
    y: 0,
    w: 3,
    h: 7,
  },
  {
    i: "w-trend",
    x: 0,
    y: 7,
    w: 6,
    h: 8,
  },
  {
    i: "w-heat",
    x: 6,
    y: 7,
    w: 6,
    h: 8,
  },
  {
    i: "w-owasp",
    x: 0,
    y: 15,
    w: 6,
    h: 8,
  },
  {
    i: "w-scatter",
    x: 6,
    y: 15,
    w: 6,
    h: 8,
  },
];
