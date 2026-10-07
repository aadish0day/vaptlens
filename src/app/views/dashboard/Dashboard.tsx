import { PageHead } from "@/app/components/PageHead";
import { SearchBox } from "@/app/components/SearchBox";
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
import { EMPTY_FILTERS, biCtx } from "@/app/lib/filters";
import { SavedViews } from "@/app/views/dashboard/SavedViews";
import { WidgetBody } from "@/app/views/dashboard/WidgetBody";
import { WidgetBuilder } from "@/app/views/dashboard/WidgetBuilder";
import { GRID, autoTitle, exposureItems } from "@/app/views/dashboard/utils";
import { Findings } from "@/app/views/findings/Findings";
import { applyFilters } from "@/app/views/findings/utils";
import {
  CHART_LABEL,
  DEFAULT_LAYOUT,
  DEFAULT_WIDGETS,
  DIM_LABEL,
  TEMPLATES,
  TEMPLATE_THUMB,
} from "@/lib/dash";
import { AS_OF } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

export function Dashboard(ctx) {
  var f = ctx.filters,
    setF = ctx.setFilters,
    bi = biCtx(ctx);
  function set(k, v) {
    var o = Object.assign({}, f);
    o[k] = v;
    setF(o);
  }
  function setCross(field, val) {
    var c = Object.assign({}, f.cross);
    if (val == null) delete c[field];
    else c[field] = val;
    set("cross", c);
  }
  var rows = applyFilters(ctx.active, f, bi);
  var hist = applyFilters(
    ctx.data.filter(function (x) {
      return x.lifecycle !== "Fixed";
    }),
    f,
    bi,
    null,
    true,
  );
  var hostN = {},
    portN = {};
  ctx.active.forEach(function (x) {
    hostN[x.host] = (hostN[x.host] || 0) + 1;
    var pk = x.port ? String(x.port) : "n/a";
    portN[pk] = (portN[pk] || 0) + 1;
  });
  var tools = uniq(
      ctx.active.map(function (x) {
        return x.tool;
      }),
    ),
    hostsAll = uniq(
      ctx.active.map(function (x) {
        return x.host;
      }),
    ),
    portsAll = uniq(
      ctx.active.map(function (x) {
        return x.port ? String(x.port) : "n/a";
      }),
    );
  var chips = [];
  f.sev.forEach(function (s) {
    chips.push(
      <V.FilterChip
        key={"s" + s}
        field="Severity"
        value={s}
        severity={s.toLowerCase()}
        onRemove={function () {
          set(
            "sev",
            f.sev.filter(function (x) {
              return x !== s;
            }),
          );
        }}
      />,
    );
  });
  f.tools.forEach(function (s) {
    chips.push(
      <V.FilterChip
        key={"t" + s}
        field="Tool"
        value={s}
        onRemove={function () {
          set(
            "tools",
            f.tools.filter(function (x) {
              return x !== s;
            }),
          );
        }}
      />,
    );
  });
  f.hosts.forEach(function (s) {
    chips.push(
      <V.FilterChip
        key={"h" + s}
        field="Host"
        value={s}
        onRemove={function () {
          set(
            "hosts",
            f.hosts.filter(function (x) {
              return x !== s;
            }),
          );
        }}
      />,
    );
  });
  f.ports.forEach(function (s) {
    chips.push(
      <V.FilterChip
        key={"p" + s}
        field="Port"
        value={s}
        onRemove={function () {
          set(
            "ports",
            f.ports.filter(function (x) {
              return x !== s;
            }),
          );
        }}
      />,
    );
  });
  if (f.since !== "All")
    chips.push(
      <V.FilterChip
        key="since"
        field="First seen"
        value={"last " + f.since}
        onRemove={function () {
          set("since", "All");
        }}
      />,
    );
  (f.bus || []).forEach(function (s2) {
    chips.push(
      <V.FilterChip
        key={"bu" + s2}
        field="Business unit"
        value={s2}
        onRemove={function () {
          set(
            "bus",
            f.bus.filter(function (x) {
              return x !== s2;
            }),
          );
        }}
      />,
    );
  });
  [
    ["kev", "CISA KEV"],
    ["ransom", "Ransomware"],
    ["zeroday", "0-Day"],
    ["eol", "EOL"],
    ["old", "> 6 months"],
    ["path", "Attack path"],
  ].forEach(function (x) {
    if (f[x[0]])
      chips.push(
        <V.FilterChip
          key={x[0]}
          value={x[1]}
          onRemove={function () {
            set(x[0], false);
          }}
        />,
      );
  });
  if (f.host)
    chips.push(
      <V.FilterChip
        key="hh"
        field="Host"
        value={f.host}
        onRemove={function () {
          set("host", null);
        }}
      />,
    );
  Object.keys(f.cross).forEach(function (k) {
    chips.push(
      <V.FilterChip
        key={"c" + k}
        field={DIM_LABEL[k] || k}
        value={f.cross[k]}
        severity={
          k === "severity" ? String(f.cross[k]).toLowerCase() : undefined
        }
        onRemove={function () {
          setCross(k, null);
        }}
      />,
    );
  });
  if (f.q)
    chips.push(
      <V.FilterChip
        key="q"
        field="Search"
        value={f.q}
        onRemove={function () {
          set("q", "");
        }}
      />,
    );
  function clear() {
    setF(EMPTY_FILTERS);
  }
  var breach = ctx.active
    .filter(function (x) {
      return x.exploitable || x.kev || x.zeroday;
    })
    .sort(function (a, b) {
      return b.risk - a.risk;
    })
    .slice(0, 10);
  var breached = count(rows, function (x) {
    return x.breached;
  });
  var bd = useState(null),
    builder = bd[0],
    setBuilder = bd[1];
  var gl = useState(false),
    gallery = gl[0],
    setGallery = gl[1];
  var dashCtx = {
    ctx: ctx,
    bi: bi,
    f: f,
    setCross: setCross,
  };
  function saveWidget(w) {
    var ws = ctx.dash.widgets.slice(),
      idx = ws.findIndex(function (x) {
        return x.i === w.i;
      }),
      lay = ctx.dash.layout.slice();
    if (idx >= 0) ws[idx] = w;
    else {
      ws.push(w);
      lay.push({
        i: w.i,
        x: 0,
        y: 999,
        w: w.w || 6,
        h: w.h || 8,
      });
    }
    ctx.setDash({
      v: 2,
      widgets: ws,
      layout: lay,
    });
  }
  function removeWidget(id) {
    var prev = ctx.dash;
    ctx.setDash({
      v: 2,
      widgets: ctx.dash.widgets.filter(function (x) {
        return x.i !== id;
      }),
      layout: ctx.dash.layout.filter(function (x) {
        return x.i !== id;
      }),
    });
    return prev;
  }
  var Grid = GRID();
  var dated = uniq(
    ctx.batches.map(function (b) {
      return b.date;
    }),
  ).length;
  return (
    <div className="page">
      <PageHead
        title="Dashboard"
        sub={
          "Latest scan: " +
          ctx.batches[ctx.batches.length - 1].label +
          " (" +
          ctx.batches[ctx.batches.length - 1].date +
          ") · " +
          ctx.batches[ctx.batches.length - 1].tools +
          ". Drag widgets by their header, resize from the corner, click any chart mark to filter."
        }
        actions={[
          <V.Button
            key="g"
            icon="template"
            onClick={function () {
              setGallery(true);
            }}
          >
            Templates
          </V.Button>,
          <V.Button
            key="b"
            variant="secondary"
            icon="trend-up"
            onClick={function () {
              setBuilder({
                i: "w-" + Date.now().toString(36),
                title: "",
                cfg: {
                  chart: "bar",
                  group: "host",
                  measure: "count",
                  topN: 10,
                  sort: "desc",
                },
              });
            }}
          >
            New widget
          </V.Button>,
          <V.DropdownMenu
            key="e"
            label="Export"
            icon="download"
            align="right"
            items={[
              {
                label: "Dashboard as PNG",
                icon: "download",
                hint: "2x",
                onSelect: function () {
                  var el = document.querySelector(".main .page");
                  ctx.toast({
                    title: "Capturing dashboard…",
                    tone: "info",
                  });
                  setTimeout(function () {
                    captureCanvas(
                      el,
                      getComputedStyle(document.body).backgroundColor,
                    )
                      .then(function (cv) {
                        return new Promise(function (res) {
                          cv.toBlob(res, "image/png");
                        });
                      })
                      .then(function (b) {
                        return saveFile(
                          ctx,
                          "vaptlens-dashboard-" +
                            slug(ctx.batches[ctx.batches.length - 1].label) +
                            ".png",
                          b,
                        );
                      })
                      .catch(function (e) {
                        ctx.toast({
                          title: "Couldn't capture the dashboard",
                          message: e.message,
                          tone: "danger",
                        });
                      });
                  }, 60);
                },
              },
              {
                label: "Dashboard as PDF",
                icon: "file",
                hint: ".pdf",
                onSelect: function () {
                  var el = document.querySelector(".main .page");
                  ctx.toast({
                    title: "Building PDF…",
                    tone: "info",
                  });
                  setTimeout(function () {
                    captureCanvas(
                      el,
                      getComputedStyle(document.body).backgroundColor,
                    )
                      .then(function (cv) {
                        return saveFile(
                          ctx,
                          "vaptlens-dashboard-" +
                            slug(ctx.batches[ctx.batches.length - 1].label) +
                            ".pdf",
                          canvasToPdfBlob(cv, true),
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
                label: "Filtered findings",
                icon: "download",
                hint: ".csv",
                onSelect: function () {
                  saveFile(
                    ctx,
                    "vaptlens-findings-filtered.csv",
                    toCsv(
                      [
                        [
                          "severity",
                          "finding",
                          "host",
                          "port",
                          "cvss",
                          "risk",
                          "lifecycle",
                          "tool",
                          "cves",
                        ],
                      ].concat(
                        rows.map(function (x) {
                          return [
                            SEV_LABEL[x.sev],
                            x.name,
                            x.host,
                            x.port,
                            cvssTxt(x),
                            x.risk,
                            x.lifecycle,
                            x.tool,
                            x.cves.join(" "),
                          ];
                        }),
                      ),
                    ),
                  );
                },
              },
              "-",
              {
                label: "Reset layout",
                onSelect: function () {
                  ctx.setDash({
                    v: 2,
                    widgets: DEFAULT_WIDGETS,
                    layout: DEFAULT_LAYOUT,
                  });
                  ctx.toast({
                    title: "Layout reset",
                  });
                },
              },
            ]}
          />,
        ]}
      />
      <section className="grid-2 breach-row">
        <V.WidgetCard title="Top critical breach risks" draggable={false}>
          {breach.length ? (
            <V.BreachList
              onSelect={function (it, i) {
                ctx.openFinding(breach[i].key);
              }}
              items={breach.map(function (x) {
                return {
                  title: x.name,
                  host: hostLabel(x),
                  risk: x.risk,
                  tags: tagsOf(x)
                    .filter(function (t) {
                      return t !== "exploitable" && t !== "breached";
                    })
                    .slice(0, 2),
                };
              })}
            />
          ) : (
            <V.EmptyState title="No exploitable findings in the latest scan." />
          )}
        </V.WidgetCard>
        <V.WidgetCard title="Threat exposure" draggable={false}>
          <V.ExposureBars
            total={Math.max(1, ctx.active.length)}
            items={exposureItems(ctx.active)}
          />
        </V.WidgetCard>
      </section>
      <section className="slicer">
        <div className="slicer-row">
          <SearchBox
            value={f.q}
            onChange={function (v) {
              setF(function (prev) {
                return Object.assign({}, prev, {
                  q: v,
                });
              });
            }}
          />
          <SavedViews
            key="sv"
            filters={f}
            setFilters={setF}
            toast={ctx.toast}
            views={ctx.views}
            setViews={ctx.setViews}
          />
          <V.MultiSelect
            label="Severity"
            value={f.sev}
            onChange={function (v) {
              set("sev", v);
            }}
            options={["critical", "high", "medium", "low", "info"].map(
              function (s) {
                return {
                  value: SEV_LABEL[s],
                  severity: s,
                  count: count(ctx.active, function (x) {
                    return x.sev === s;
                  }),
                };
              },
            )}
          />
          <V.MultiSelect
            label="Tool"
            value={f.tools}
            onChange={function (v) {
              set("tools", v);
            }}
            options={tools.map(function (t) {
              return {
                value: t,
                count: count(ctx.active, function (x) {
                  return x.tool === t;
                }),
              };
            })}
          />
          <V.MultiSelect
            label="Host"
            value={f.hosts}
            onChange={function (v) {
              set("hosts", v);
            }}
            options={hostsAll.slice(0, 500).map(function (t) {
              return {
                value: t,
                count: hostN[t],
              };
            })}
          />
          <V.MultiSelect
            label="Business unit"
            value={f.bus || []}
            onChange={function (v) {
              set("bus", v);
            }}
            options={uniq(
              ctx.active.map(function (x) {
                return x.bu || "Unassigned";
              }),
            )
              .sort()
              .map(function (t) {
                return {
                  value: t,
                  count: count(ctx.active, function (x) {
                    return (x.bu || "Unassigned") === t;
                  }),
                };
              })}
          />
          <V.MultiSelect
            label="Port"
            value={f.ports}
            onChange={function (v) {
              set("ports", v);
            }}
            options={portsAll
              .sort(function (a, b) {
                return (+a || 1e9) - (+b || 1e9);
              })
              .slice(0, 300)
              .map(function (t) {
                return {
                  value: t,
                  count: portN[t],
                };
              })}
          />
        </div>
        <div className="slicer-row">
          <V.Toggle
            label="CISA KEV"
            icon="flame"
            checked={f.kev}
            count={count(ctx.active, function (x) {
              return x.kev;
            })}
            onChange={function (v) {
              set("kev", v);
            }}
          />
          <V.Toggle
            label="Ransomware"
            icon="skull"
            checked={f.ransom}
            count={count(ctx.active, function (x) {
              return x.ransomware;
            })}
            onChange={function (v) {
              set("ransom", v);
            }}
          />
          <V.Toggle
            label="0-Day"
            icon="zap"
            checked={f.zeroday}
            count={count(ctx.active, function (x) {
              return x.zeroday;
            })}
            onChange={function (v) {
              set("zeroday", v);
            }}
          />
          <V.Toggle
            label="EOL"
            icon="clock"
            checked={f.eol}
            count={count(ctx.active, function (x) {
              return x.eol;
            })}
            onChange={function (v) {
              set("eol", v);
            }}
          />
          <V.Toggle
            label="Attack path"
            icon="route"
            checked={!!f.path}
            count={count(ctx.active, function (x) {
              return x.onPath;
            })}
            onChange={function (v) {
              set("path", v);
            }}
          />
          <V.Toggle
            label="KEV overdue"
            icon="flame"
            checked={!!f.kevOverdue}
            count={count(ctx.active, function (x) {
              return x.kev && x.kevDue && x.kevDue < AS_OF;
            })}
            onChange={function (v) {
              set("kevOverdue", v);
            }}
          />
          <V.Toggle
            label={"> 6 months"}
            checked={f.old}
            count={count(ctx.active, function (x) {
              return x.ageDays > 180;
            })}
            onChange={function (v) {
              set("old", v);
            }}
          />
          <span className="slicer-since">
            <span className="vl-label">First seen</span>
            <V.SegmentedControl
              label="First seen"
              options={["7 days", "15 days", "30 days", "6 months", "All"]}
              value={f.since}
              onChange={function (v) {
                set("since", v);
              }}
            />
          </span>
        </div>
        {chips.length ? (
          <div className="chips">
            {chips}
            {chips.length > 1 ? (
              <V.Button variant="ghost" size="sm" onClick={clear}>
                Clear all
              </V.Button>
            ) : null}
          </div>
        ) : null}
      </section>
      <section className="kpis">
        <V.KpiCard
          label="Active findings"
          value={rows.length}
          sub={
            count(rows, function (x) {
              return x.lifecycle === "New";
            }) + " new this scan · click for the list"
          }
          icon="shield"
          onClick={function () {
            ctx.showFindings();
          }}
        />
        <V.KpiCard
          label="Critical"
          value={count(rows, function (x) {
            return x.sev === "critical";
          })}
          tone="critical"
          sub="Click to filter"
          active={f.cross.severity === "Critical"}
          onClick={function () {
            setCross(
              "severity",
              f.cross.severity === "Critical" ? null : "Critical",
            );
          }}
        />
        <V.KpiCard
          label="SLA breached"
          value={breached}
          tone={breached ? "critical" : "ok"}
          sub={
            count(rows, function (x) {
              return x.atRisk;
            }) + " at risk ≤ 7 days"
          }
          icon="clock"
          active={f.cross.slaStatus === "Breached"}
          onClick={function () {
            setCross(
              "slaStatus",
              f.cross.slaStatus === "Breached" ? null : "Breached",
            );
          }}
        />
        <V.KpiCard
          label="Hosts affected"
          value={
            uniq(
              rows.map(function (x) {
                return x.host;
              }),
            ).length
          }
          sub={
            uniq(
              rows.map(function (x) {
                return x.subnet;
              }),
            ).length + " subnets · open Assets"
          }
          icon="server"
          onClick={function () {
            ctx.go("assets");
          }}
        />
      </section>
      {Grid ? (
        <Grid
          className="dash-grid"
          layouts={{
            lg: ctx.dash.layout,
          }}
          breakpoints={{
            lg: 900,
            sm: 0,
          }}
          cols={{
            lg: 12,
            sm: 1,
          }}
          rowHeight={36}
          margin={[16, 16]} /* = --gap-grid, so dashboard gutters match every other view */
          containerPadding={[0, 0]}
          draggableHandle=".vl-card-head"
          draggableCancel="button, a, input, select"
          compactType="vertical"
          onLayoutChange={function (cur, all) {
            if (all && all.lg && all.lg.length === ctx.dash.widgets.length) {
              var changed =
                JSON.stringify(
                  all.lg.map(function (l) {
                    return [l.i, l.x, l.y, l.w, l.h];
                  }),
                ) !==
                JSON.stringify(
                  ctx.dash.layout.map(function (l) {
                    return [l.i, l.x, l.y, l.w, l.h];
                  }),
                );
              if (changed)
                ctx.setDash({
                  v: 2,
                  widgets: ctx.dash.widgets,
                  layout: all.lg.map(function (l) {
                    return {
                      i: l.i,
                      x: l.x,
                      y: l.y,
                      w: l.w,
                      h: l.h,
                    };
                  }),
                });
            }
          }}
        >
          {ctx.dash.widgets.map(function (w) {
            return (
              <div
                key={w.i}
                data-grid={
                  ctx.dash.layout.find(function (l) {
                    return l.i === w.i;
                  }) || {
                    x: 0,
                    y: 999,
                    w: 6,
                    h: 8,
                  }
                }
              >
                <V.WidgetCard
                  title={w.title || autoTitle(w.cfg)}
                  actions={[
                    <button
                      key="e"
                      type="button"
                      className="vl-icon-btn w-btn"
                      aria-label={"Edit " + (w.title || "widget")}
                      onClick={function () {
                        setBuilder(JSON.parse(JSON.stringify(w)));
                      }}
                    >
                      <V.Icon name="ellipsis" size={14} />
                    </button>,
                    <button
                      key="x"
                      type="button"
                      className="vl-icon-btn w-btn"
                      aria-label={"Remove " + (w.title || "widget")}
                      onClick={function () {
                        var prevD = removeWidget(w.i),
                          tid;
                        tid = ctx.toast({
                          action: {
                            label: "Undo",
                            onClick: function () {
                              ctx.setDash(prevD);
                              ctx.dropToast(tid);
                            },
                          },
                          title: "Widget removed",
                          message: w.title || autoTitle(w.cfg),
                        });
                      }}
                    >
                      <V.Icon name="x" size={14} />
                    </button>,
                  ]}
                >
                  <WidgetBody
                    cfg={w.cfg}
                    rows={rows}
                    hist={hist}
                    dc={dashCtx}
                  />
                </V.WidgetCard>
              </div>
            );
          })}
        </Grid>
      ) : (
        <V.Banner tone="warn" title="Layout engine didn't load">
          Widgets can't be arranged in this view.
        </V.Banner>
      )}
      {ctx.dash.widgets.length === 0 ? (
        <V.EmptyState
          title="No widgets on the canvas."
          action={
            <V.Button
              size="sm"
              onClick={function () {
                setGallery(true);
              }}
            >
              Add from templates
            </V.Button>
          }
        />
      ) : null}
      <Findings
        ctx={ctx}
        rows={rows}
        onClear={clear}
        title={"Findings · " + rows.length}
      />
      {builder ? (
        <WidgetBuilder
          widget={builder}
          rows={rows}
          hist={hist}
          dc={dashCtx}
          onClose={function () {
            setBuilder(null);
          }}
          onSave={function (w) {
            saveWidget(w);
            setBuilder(null);
            ctx.toast({
              title: "Widget saved",
              message: w.title || autoTitle(w.cfg),
            });
          }}
        />
      ) : null}
      {gallery ? (
        <V.Modal
          title="Template gallery"
          subtitle={
            TEMPLATES.length +
            " security widgets. Click one to add it to the bottom of the canvas."
          }
          width="900px"
          onClose={function () {
            setGallery(false);
          }}
        >
          <div className="tpl-grid">
            {TEMPLATES.map(function (t) {
              var locked = t.needsDates && dated < 2;
              return (
                <V.TemplateCard
                  key={t.key}
                  title={t.title}
                  description={t.description}
                  chart={
                    TEMPLATE_THUMB[t.cfg.chart] ||
                    (t.cfg.chart === "treemap" ? "heatmap" : "bar")
                  }
                  chartLabel={CHART_LABEL[t.cfg.chart]}
                  locked={locked}
                  lockReason="Needs at least 2 dated scan batches."
                  onAdd={function () {
                    saveWidget({
                      i: "w-" + t.key + "-" + Date.now().toString(36),
                      title: t.title,
                      cfg: t.cfg,
                      w: t.w,
                      h: t.h,
                    });
                    setGallery(false);
                    (setTimeout(function () {
                      var els = document.querySelectorAll(
                        ".dash-grid .react-grid-item",
                      );
                      var last = els[els.length - 1];
                      if (last)
                        last.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                    }, 200),
                      ctx.toast({
                        title: t.title + " added",
                        message: "Scrolled to it at the end of the canvas.",
                      }));
                  }}
                />
              );
            })}
          </div>
        </V.Modal>
      ) : null}
    </div>
  );
}
