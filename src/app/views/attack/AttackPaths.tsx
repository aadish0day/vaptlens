import { PageHead } from "@/app/components/PageHead";
import { openRow } from "@/app/components/utils";
import {
  dupCampaignToast,
  openRemTab,
  sameCampaign,
} from "@/app/lib/campaigns";
import { nowIso } from "@/app/lib/common";
import { EMPTY_FILTERS } from "@/app/lib/filters";
import { TACTIC_ORDER } from "@/app/views/attack/utils";
import { addDays } from "@/app/views/findings/utils";
import { localDay } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

/* ---------- Attack Paths view ---------- */
export function AttackPaths(ctx) {
  var g = ctx.attack,
    sp = useState(0),
    pm = useState(false),
    selP = g.paths[sp[0]] || null;
  var W = 1100,
    colX = [70, 360, 700, 1010],
    H = 0;
  /* layout: column by hop distance from Internet (0 = Internet, 1 = entry, 2 = pivot, 3 = crown jewel) */
  var col = {};
  g.paths.forEach(function (p) {
    p.hosts.forEach(function (hh, i) {
      var c = i === 0 ? 1 : ctx.attack.hosts[hh].tier === 1 ? 3 : 2;
      col[hh] = Math.max(col[hh] || 0, c);
    });
  });
  g.jewels.forEach(function (j) {
    if (!col[j]) col[j] = 3;
  });
  var byCol = {
    1: [],
    2: [],
    3: [],
  };
  Object.keys(col).forEach(function (hh) {
    byCol[col[hh]].push(hh);
  });
  Object.keys(byCol).forEach(function (c) {
    byCol[c].sort();
  });
  var maxN = Math.max(1, byCol[1].length, byCol[2].length, byCol[3].length);
  H = Math.max(280, maxN * 64 + 70);
  var pos = {
    Internet: {
      x: colX[0],
      y: H / 2,
    },
  };
  [1, 2, 3].forEach(function (c) {
    var n = byCol[c].length;
    byCol[c].forEach(function (hh, i) {
      pos[hh] = {
        x: colX[c],
        y: (H / (n + 1)) * (i + 1),
      };
    });
  });
  var edges = {};
  g.paths.forEach(function (p, pi) {
    var prev = "Internet";
    p.steps.forEach(function (s) {
      var k = prev + ">" + s.host;
      var e =
        edges[k] ||
        (edges[k] = {
          a: prev,
          b: s.host,
          n: 0,
          tech: s.attack ? s.attack.id : "",
          on: false,
        });
      e.n++;
      if (pi === sp[0]) e.on = true;
      prev = s.host;
    });
  });
  var maxE = Math.max(
    1,
    Object.keys(edges).reduce(function (m, k) {
      return Math.max(m, edges[k].n);
    }, 1),
  );
  var onHosts = {};
  if (selP)
    selP.hosts.forEach(function (hh) {
      onHosts[hh] = 1;
    });
  var tactics = TACTIC_ORDER.map(function (t) {
    return {
      t: t,
      list: g.techniques
        .filter(function (x) {
          return x.tactic === t;
        })
        .sort(function (a, b) {
          return b.n - a.n;
        }),
    };
  });
  function campaignFrom(ch) {
    var dup = sameCampaign(ctx, [ch.key]);
    if (dup) return dupCampaignToast(ctx, dup);
    var id = "c-" + Date.now().toString(36);
    ctx.setCampaigns(
      ctx.campaigns.concat([
        {
          id: id,
          name: "Break attack paths: " + ch.finding.name.slice(0, 40),
          owner: ctx.g(ch.finding).team,
          due: addDays(localDay(), 14),
          keys: [ch.key],
          createdAt: nowIso(),
          createdBy: ctx.me.username,
          source: "choke point",
        },
      ]),
    );
    ctx.log("CAMPAIGN", "Created from choke point " + ch.finding.name);
    ctx.toast({
      title: "Campaign created",
      message: "Under Remediation → Campaigns.",
      action: {
        label: "Open campaigns",
        onClick: function () {
          openRemTab(ctx, "Campaigns");
        },
      },
    });
  }
  return (
    <div className="page">
      <PageHead
        title="Attack Paths"
        sub="How an attacker gets from the internet to your crown jewels (Tier 1 assets) using the findings you have now. Entry points are internet-facing hosts with an initial-access finding; internal hosts are treated as reachable from each other unless you mark them isolated."
        actions={
          <V.Button
            icon="sparkles"
            onClick={function () {
              ctx.openAssistant({
                preset: "paths",
              });
            }}
          >
            Explain with Claude
          </V.Button>
        }
      />
      <section className="kpis">
        <V.KpiCard
          label="Entry points"
          value={g.entry.length}
          sub="internet-facing hosts with a way in · filter"
          icon="globe"
          tone={g.entry.length ? "critical" : "ok"}
          onClick={
            g.entry.length
              ? function () {
                  ctx.setFilters(
                    Object.assign({}, EMPTY_FILTERS, {
                      hosts: g.entry.slice(),
                    }),
                  );
                  ctx.showFindings();
                }
              : undefined
          }
        />
        <V.KpiCard
          label="Crown jewels reachable"
          value={g.reached.length + " / " + g.jewels.length}
          sub={
            "Tier 1 assets on at least one path" +
            (g.reached.length ? " · filter" : "")
          }
          icon="target"
          tone={g.reached.length ? "critical" : "ok"}
          onClick={
            g.reached.length
              ? function () {
                  ctx.setFilters(
                    Object.assign({}, EMPTY_FILTERS, {
                      hosts: g.reached.slice(),
                    }),
                  );
                  ctx.showFindings();
                }
              : undefined
          }
        />
        <V.KpiCard
          label="Attack paths"
          value={g.paths.length}
          sub="shortest, highest-risk first (max 60)"
          icon="route"
        />
        <V.KpiCard
          label="Top choke point"
          value={g.chokes[0] ? g.chokes[0].paths : 0}
          sub={
            g.chokes[0]
              ? "paths cut by fixing " + g.chokes[0].finding.name.slice(0, 32)
              : "no paths"
          }
          icon="shield"
        />
      </section>
      {g.paths.length ? (
        <React.Fragment>
          <V.WidgetCard title="Attack graph" draggable={false}>
            <div className="scroll-x">
              <svg
                className="ap-svg"
                viewBox={"0 0 " + W + " " + H}
                width="100%"
                role="img"
                aria-label="Attack graph from the internet to crown jewels"
              >
                {["Internet", "Entry points", "Pivots", "Crown jewels"].map(
                  function (t, i) {
                    return (
                      <text
                        key={t}
                        className="ap-colh"
                        x={colX[i]}
                        y={16}
                        textAnchor="middle"
                      >
                        {t.toUpperCase()}
                      </text>
                    );
                  },
                )}
                {Object.keys(edges).map(function (k) {
                  var e = edges[k],
                    A = pos[e.a],
                    B = pos[e.b];
                  if (!A || !B) return null;
                  var mx = (A.x + B.x) / 2;
                  return (
                    <g
                      key={k}
                      className={
                        "ap-edge" +
                        (e.on ? " is-on" : "") +
                        (selP && !e.on ? " is-dim" : "")
                      }
                    >
                      <path
                        d={
                          "M" +
                          (A.x + 14) +
                          "," +
                          A.y +
                          " C" +
                          mx +
                          "," +
                          A.y +
                          " " +
                          mx +
                          "," +
                          B.y +
                          " " +
                          (B.x - 14) +
                          "," +
                          B.y
                        }
                        strokeWidth={1 + (3 * e.n) / maxE}
                      />
                      {e.tech &&
                      (e.on ||
                        e.a === "Internet" ||
                        Object.keys(edges).length <= 10) ? (
                        <text
                          x={mx}
                          y={(A.y + B.y) / 2 - 5}
                          textAnchor="middle"
                          className="ap-tech"
                        >
                          {e.tech}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
                <g className="ap-node ap-inet">
                  <circle cx={pos.Internet.x} cy={pos.Internet.y} r={16} />
                  <text
                    x={pos.Internet.x}
                    y={pos.Internet.y + 32}
                    textAnchor="middle"
                  >
                    Internet
                  </text>
                </g>
                {Object.keys(col).map(function (hh) {
                  var P0 = pos[hh],
                    n = ctx.attack.hosts[hh],
                    jew = n.tier === 1,
                    reach = g.reached.indexOf(hh) >= 0;
                  return (
                    <g
                      key={hh}
                      className={
                        "ap-node" +
                        (jew ? " is-jewel" : "") +
                        (reach && jew ? " is-hit" : "") +
                        (selP && !onHosts[hh] ? " is-dim" : "") +
                        (onHosts[hh] ? " is-on" : "")
                      }
                      onClick={function () {
                        ctx.openHost(hh);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={function (e) {
                        if (e.key === "Enter") ctx.openHost(hh);
                      }}
                    >
                      {jew ? (
                        <rect
                          x={P0.x - 13}
                          y={P0.y - 13}
                          width={26}
                          height={26}
                          rx={5}
                          transform={"rotate(45 " + P0.x + " " + P0.y + ")"}
                        />
                      ) : (
                        <circle cx={P0.x} cy={P0.y} r={13} />
                      )}
                      <text x={P0.x} y={P0.y + 30} textAnchor="middle">
                        {hh.length > 20 ? hh.slice(0, 19) + "…" : hh}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="up-help">
              {
                "Edge thickness = how many paths use that hop; label = the ATT&CK technique. Diamonds are Tier 1 crown jewels. Click a host to triage it."
              }
            </p>
          </V.WidgetCard>
          <section className="grid-2 ap-grid">
            <V.WidgetCard
              title="Choke points · fix these first"
              draggable={false}
            >
              <div className="stack-tight">
                {g.chokes.slice(0, 8).map(function (c, i) {
                  return (
                    <div
                      {...Object.assign(
                        {
                          key: c.key,
                        },
                        openRow(ctx, c.key, "choke"),
                      )}
                    >
                      <span className="choke-n">{i + 1}</span>
                      <div className="triage-main">
                        <span className="triage-t">{c.finding.name}</span>
                        <span className="triage-m">
                          {c.host +
                            " · " +
                            (c.attack
                              ? c.attack.id + " " + c.attack.name
                              : "") +
                            " · risk " +
                            c.finding.risk}
                        </span>
                      </div>
                      <span
                        className="choke-cut"
                        title="Attack paths that go through this finding"
                      >
                        <b>
                          {Math.round((100 * c.paths) / g.paths.length) + "%"}
                        </b>
                        {" of paths"}
                      </span>
                      {ctx.readOnly ? null : (
                        <button
                          type="button"
                          className="up-edit"
                          onClick={function () {
                            campaignFrom(c);
                          }}
                        >
                          Campaign
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </V.WidgetCard>
            <V.WidgetCard title={"Paths · " + g.paths.length} draggable={false}>
              <div className="ap-paths">
                {g.paths.slice(0, pm[0] ? 60 : 8).map(function (p, i) {
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={"ap-path" + (i === sp[0] ? " is-on" : "")}
                      onClick={function () {
                        sp[1](i);
                      }}
                    >
                      <span className="ap-score">{p.score}</span>
                      <span className="ap-chain">
                        <span className="ap-hop">Internet</span>
                        {p.steps.map(function (s, j) {
                          return (
                            <React.Fragment key={j}>
                              <span className="ap-arrow">
                                {"→ " + (s.attack ? s.attack.id : "")}
                              </span>
                              <span
                                className={
                                  "ap-hop" +
                                  (ctx.attack.hosts[s.host].tier === 1
                                    ? " is-jewel"
                                    : "")
                                }
                              >
                                {s.host}
                                <small>
                                  {s.finding ? s.finding.name.slice(0, 38) : ""}
                                </small>
                              </span>
                            </React.Fragment>
                          );
                        })}
                      </span>
                    </button>
                  );
                })}
                {g.paths.length > 8 ? (
                  <button
                    type="button"
                    className="up-edit"
                    onClick={function () {
                      pm[1](!pm[0]);
                    }}
                  >
                    {pm[0] ? "Show fewer" : "Show all " + g.paths.length}
                  </button>
                ) : null}
              </div>
            </V.WidgetCard>
          </section>
        </React.Fragment>
      ) : (
        <V.Banner
          tone="info"
          title="No path from the internet to a Tier 1 asset"
        >
          {g.entry.length
            ? "There are entry points, but no lateral-movement finding reaches a crown jewel."
            : "No internet-facing host has an initial-access finding. Mark internet-facing hosts in Asset Inventory to model exposure."}
        </V.Banner>
      )}
      <V.WidgetCard
        title={"MITRE ATT&CK coverage · techniques your findings enable"}
        draggable={false}
      >
        <div className="attck">
          {tactics.map(function (t) {
            return (
              <div key={t.t} className="attck-col">
                <span className="attck-h">{t.t}</span>
                {t.list.length ? (
                  t.list.map(function (x) {
                    return (
                      <a
                        key={x.id}
                        className="attck-cell"
                        href={
                          "https://attack.mitre.org/techniques/" + x.id + "/"
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          ["--w" as any]: Math.min(1, x.n / 6),
                        }}
                      >
                        <b>{x.id}</b>
                        <span>{x.name}</span>
                        <small>
                          {x.n + " findings · " + x.hostN + " hosts"}
                        </small>
                      </a>
                    );
                  })
                ) : (
                  <span className="attck-none">—</span>
                )}
              </div>
            );
          })}
        </div>
      </V.WidgetCard>
    </div>
  );
}

/* ---------- Remediation: Top fixes, Campaigns, Rules ---------- */
