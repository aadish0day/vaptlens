import { ApprovalsModal } from "@/app/automation/ApprovalsModal";
import { RO_REASON, count, nowIso, uniq } from "@/app/lib/common";
import { saveFile } from "@/app/lib/export";
import { biCtx } from "@/app/lib/filters";
import { syncJiraCsv } from "@/app/lib/integrations";
import { BulkBar } from "@/app/views/findings/BulkBar";
import { Detail } from "@/app/views/findings/Detail";
import { LibraryModal } from "@/app/views/findings/LibraryModal";
import {
  TABLE_COLS,
  applyFilters,
  jiraCsv,
  snowCsv,
  toRow,
} from "@/app/views/findings/utils";
import { localDay } from "@/lib/engine";
import { readFileText } from "@/lib/store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AS_OF } from "@/lib/engine";
import * as V from "@/ui";

var ADV_KEY = "vaptlens.advfilter.v1";
/* fields the advanced filter can test; values come from advField so derived data (owner, CVE list) works too */
export var ADV_FIELDS = [
  { key: "sev", label: "Severity", type: "enum", options: [{ value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }, { value: "info", label: "Info" }] },
  { key: "cvss", label: "CVSS", type: "number" },
  { key: "risk", label: "Risk score", type: "number" },
  { key: "epss", label: "EPSS %", type: "number" },
  { key: "kev", label: "CISA KEV", type: "bool" },
  { key: "ransomware", label: "Ransomware use", type: "bool" },
  { key: "exploitable", label: "Exploit available", type: "bool" },
  { key: "exposure", label: "Exposure", type: "enum", options: [{ value: "internet", label: "Internet" }, { value: "internal", label: "Internal" }] },
  { key: "tier", label: "Asset tier", type: "enum", options: [{ value: 1, label: "Tier 1" }, { value: 2, label: "Tier 2" }, { value: 3, label: "Tier 3" }] },
  { key: "ssvc", label: "SSVC decision", type: "enum", options: ["Act", "Attend", "Track*", "Track"] },
  { key: "host", label: "Host", type: "text" },
  { key: "name", label: "Finding", type: "text" },
  { key: "cve", label: "CVE", type: "text" },
  { key: "tool", label: "Scanner", type: "text" },
  { key: "owner", label: "Owner team", type: "text" },
  { key: "ageDays", label: "Age (days)", type: "number" },
  { key: "daysLeft", label: "SLA days left", type: "number" },
  { key: "firstSeen", label: "First seen", type: "date" },
];
export function advField(f, k, ctx) {
  switch (k) {
    case "epss":
      return f.epss == null ? null : Math.round(f.epss * 1000) / 10;
    case "ssvc":
      return f.ssvc ? f.ssvc.decision : "";
    case "cve":
      return (f.cves || []).join(" ");
    case "owner":
      return ctx.g ? ctx.g(f).team : "";
    default:
      return f[k];
  }
}

export function Findings(p) {
  var ctx = p.ctx,
    gn = useState(false),
    dn = useState("default"),
    ra = useState(false),
    pg = useState(100),
    lib = useState(false),
    sv = [ctx.queue || "Active", ctx.setQueue],
    apv = useState(false),
    jin = useRef(null),
    sel = useState([]),
    adv = useState(false),
    qry = useState(function () {
      try {
        return JSON.parse(localStorage.getItem(ADV_KEY) || "null") || { match: "all", rules: [] };
      } catch (e) {
        return { match: "all", rules: [] };
      }
    });
  function setQry(q) {
    qry[1](q);
    try {
      localStorage.setItem(ADV_KEY, JSON.stringify(q));
    } catch (e) {}
  }
  function jiraSync(file) {
    if (!file) return;
    readFileText(file)
      .then(function (t) {
        var r = syncJiraCsv(t, ctx),
          ks = Object.keys(r.patches);
        ctx.setGov(function (o) {
          var n = Object.assign({}, o);
          ks.forEach(function (k) {
            var pt = Object.assign({}, r.patches[k]);
            if (o[k] && o[k].fixed && pt.fixed) {
              delete pt.fixed;
              delete pt.fixedAt;
            }
            n[k] = Object.assign({}, o[k] || {}, pt);
          });
          return n;
        });
        ctx.log(
          "TICKET-SYNC",
          file.name +
            ": " +
            r.matched +
            " issues matched, " +
            r.done +
            " done (pending re-scan), " +
            r.unmatched +
            " not from VAPTLens",
          Object.keys(r.patches).slice(0, 50),
        );
        ctx.toast({
          title: "Jira statuses synced",
          message:
            r.matched +
            " matched · " +
            r.done +
            " done → pending verification · " +
            r.unmatched +
            " ignored",
        });
      })
      .catch(function (e) {
        ctx.toast({
          title: "Couldn't read that Jira export",
          message: e.message,
          tone: "danger",
        });
      });
  }
  var reqN = count(ctx.data, function (f) {
    var g0 = ctx.gov[f.key];
    return (
      f.batch === ctx.latest &&
      f.lifecycle !== "Fixed" &&
      g0 &&
      g0.state === "requested"
    );
  });
  /* the Accepted & FP queue honours the same dashboard filters as the active one */
  var parkedF = useMemo(
    function () {
      return applyFilters(ctx.parked, ctx.filters, biCtx(ctx));
    },
    [ctx.parked, ctx.filters],
  );
  var src0 = sv[0] === "Active" ? p.rows : parkedF;
  var advN = (qry[0].rules || []).filter(V.qbComplete).length;
  var src = useMemo(
    function () {
      return advN
        ? src0.filter(function (f) {
            return V.qbMatch(qry[0], f, function (x, k) {
              return advField(x, k, ctx);
            }, AS_OF);
          })
        : src0;
    },
    [src0, qry[0], advN],
  );
  useEffect(function () {
    sel[1]([]);
  }, [sv[0], ctx.filters, qry[0]]);
  function remediateAll() {
    var keys = uniq(
        p.rows.map(function (x) {
          return x.key;
        }),
      ),
      at = nowIso();
    ctx.govUndoable(
      keys,
      function () {
        return {
          fixed: true,
          fixedAt: at,
          status: "Remediated",
          assigned: true,
        };
      },
      {
        title: keys.length + " findings remediated",
        message:
          "Pending verification: the next scan that still finds one reopens it.",
      },
      "PATCH",
      keys.length +
        " findings marked remediated (Remediate all) — pending re-scan verification",
    );
    ra[1](false);
  }
  var rows = src.map(function (f) {
    return toRow(f, ctx);
  });
  if (gn[0]) {
    var by = {},
      hs = {};
    rows.forEach(function (r) {
      var k = r.name.toLowerCase(),
        hh = r._f ? r._f.host : r.host;
      if (!by[k]) {
        by[k] = Object.assign({}, r, {
          merged: 1,
        });
        hs[k] = {};
        hs[k][hh] = 1;
      } else {
        by[k].merged += 1;
        hs[k][hh] = 1;
        var nh = Object.keys(hs[k]).length;
        by[k].host = nh > 1 ? nh + " hosts" : by[k].host;
      }
    });
    rows = Object.values(by);
  }
  var shown = rows.slice(
    0,
    pg[0],
  ); /* for the "Showing N of M" line; the table itself sorts all rows, then shows the first pg[0] */
  return (
    <V.WidgetCard
      title={
        sv[0] === "Active"
          ? p.title || "Findings"
          : "Accepted & false positives · " + parkedF.length
      }
      draggable={false}
      actions={[
        <V.SegmentedControl
          key="v"
          label="Queue"
          options={["Active", "Accepted & FP · " + parkedF.length]}
          value={
            sv[0] === "Active" ? "Active" : "Accepted & FP · " + parkedF.length
          }
          onChange={function (x) {
            sv[1](x === "Active" ? "Active" : "Parked");
          }}
        />,
        <V.DropdownMenu
          key="x"
          label="Tickets"
          icon="ticket"
          align="right"
          items={[
            {
              label: "Jira import CSV",
              hint: ".csv",
              onSelect: function () {
                saveFile(
                  ctx,
                  "vaptlens-jira-" + localDay() + ".csv",
                  jiraCsv(src, ctx),
                );
              },
            },
            {
              label: "ServiceNow import CSV",
              hint: ".csv",
              onSelect: function () {
                saveFile(
                  ctx,
                  "vaptlens-servicenow-" + localDay() + ".csv",
                  snowCsv(src, ctx),
                );
              },
            },
            "-",
            {
              label: "Sync statuses from a Jira CSV export…",
              onSelect: function () {
                if (ctx.readOnly) {
                  ctx.toast({
                    title: RO_REASON,
                    tone: "info",
                  });
                  return;
                }
                if (jin.current) jin.current.click();
              },
            },
          ]}
        />,
        <V.Button
          key="adv"
          size="sm"
          variant={adv[0] || advN ? "secondary" : "ghost"}
          icon="filter"
          aria-expanded={adv[0]}
          aria-controls="adv-filter"
          onClick={function () {
            adv[1](!adv[0]);
          }}
        >
          {"Advanced filter"}
          {advN ? <V.CountBadge count={advN} tone="signal" label="rules" /> : null}
        </V.Button>,
        <V.Button
          key="l"
          size="sm"
          variant="ghost"
          icon="book"
          onClick={function () {
            lib[1](true);
          }}
        >
          {"Library · " + ctx.library.length}
        </V.Button>,
        ctx.isAdmin && reqN ? (
          <V.Button
            key="ap"
            size="sm"
            variant="secondary"
            icon="shield"
            onClick={function () {
              apv[1](true);
            }}
          >
            {"Approvals · " + reqN}
          </V.Button>
        ) : null,
        sv[0] === "Active" ? (
          <V.Button
            key="r"
            size="sm"
            variant="danger"
            restricted={ctx.readOnly}
            restrictedReason={RO_REASON}
            disabled={!ctx.readOnly && !p.rows.length}
            onClick={function () {
              ra[1](true);
            }}
          >
            Remediate all
          </V.Button>
        ) : null,
        <V.MultiSelect
          key="cols"
          label="Columns"
          value={TABLE_COLS.filter(function (c) {
            return (ctx.cols || []).indexOf(c.key) >= 0;
          }).map(function (c) {
            return c.label;
          })}
          options={TABLE_COLS.map(function (c) {
            return c.label;
          })}
          onChange={function (v) {
            ctx.setCols(
              TABLE_COLS.filter(function (c) {
                return v.indexOf(c.label) >= 0;
              }).map(function (c) {
                return c.key;
              }),
            );
          }}
        />,
        <V.Toggle
          key="g"
          label="Group noise"
          checked={gn[0]}
          onChange={gn[1]}
        />,
        <V.SegmentedControl
          key="d"
          label="Row density"
          options={["Compact", "Default", "Comfortable"]}
          value={
            {
              compact: "Compact",
              default: "Default",
              comfortable: "Comfortable",
            }[dn[0]]
          }
          onChange={function (x) {
            dn[1](x.toLowerCase());
          }}
        />,
      ]}
    >
      <span
        id="findings-top"
        className="anchor-top"
        tabIndex={-1}
        aria-label="Findings table"
      />
      {ra[0] ? (
        <div className="ra-confirm">
          <V.Banner
            tone="danger"
            title={
              "Mark " +
              uniq(
                p.rows.map(function (x) {
                  return x.key;
                }),
              ).length +
              " findings in this view as remediated?"
            }
            action={
              <span className="row-wrap">
                <V.Button
                  size="sm"
                  onClick={function () {
                    ra[1](false);
                  }}
                >
                  Cancel
                </V.Button>
                <V.Button size="sm" variant="danger" onClick={remediateAll}>
                  Remediate
                </V.Button>
              </span>
            }
          >
            They move to Resolved and leave the active posture until a later
            scan still finds them, which reopens them as regressions. Each
            change is logged.
          </V.Banner>
        </div>
      ) : null}
      {adv[0] ? (
        <div className="adv-filter" id="adv-filter">
          <V.QueryBuilder fields={ADV_FIELDS} value={qry[0]} onChange={setQry} count={src.length} />
        </div>
      ) : advN ? (
        <div className="adv-summary" role="status">
          <span className="up-help">Advanced filter: {V.qbSummary(qry[0], ADV_FIELDS)}</span>
          <button type="button" className="up-edit" onClick={function () { adv[1](true); }}>Edit</button>
          <button type="button" className="up-edit" onClick={function () { setQry({ match: qry[0].match, rules: [] }); }}>Clear</button>
        </div>
      ) : null}
      {!ctx.readOnly && !gn[0] && sel[0].length ? (
        <BulkBar
          ctx={ctx}
          picked={(function () {
            var S = new Set(sel[0]);
            return src.filter(function (f) {
              return S.has(f.id);
            });
          })()}
          total={src.length}
          onSelectAll={function () {
            sel[1](
              src.map(function (f) {
                return f.id;
              }),
            );
          }}
          onDone={function () {
            sel[1]([]);
          }}
        />
      ) : null}
      <div className="table-bleed">
        <V.VulnTable
          rows={rows}
          limit={pg[0]}
          extraCols={TABLE_COLS.filter(function (c) {
            return (ctx.cols || []).indexOf(c.key) >= 0;
          })}
          sort={
            ctx.sortPref &&
            (["severity", "name", "host", "cvss", "lifecycle", "tool"].indexOf(
              ctx.sortPref.key,
            ) >= 0 ||
              (ctx.cols || []).indexOf(ctx.sortPref.key) >= 0)
              ? ctx.sortPref
              : undefined
          }
          onSortChange={ctx.setSortPref}
          selectable={!ctx.readOnly && !gn[0]}
          selected={sel[0]}
          onSelectChange={sel[1]}
          density={dn[0] === "default" ? undefined : dn[0]}
          renderDetail={function (r) {
            return <Detail row={r} ctx={ctx} />;
          }}
          onClearFilters={p.onClear}
        />
      </div>
      {rows.length > shown.length ? (
        <div className="more-row">
          <span className="up-help">
            {"Showing " + shown.length + " of " + rows.length}
          </span>
          <V.Button
            size="sm"
            onClick={function () {
              pg[1](pg[0] + 200);
            }}
          >
            Show 200 more
          </V.Button>
          <V.Button
            size="sm"
            variant="ghost"
            onClick={function () {
              pg[1](1e9);
            }}
          >
            Show all
          </V.Button>
        </div>
      ) : null}
      {lib[0] ? (
        <LibraryModal
          ctx={ctx}
          onClose={function () {
            lib[1](false);
          }}
        />
      ) : null}
      <input
        ref={jin}
        type="file"
        accept=".csv"
        hidden={true}
        onChange={function (e) {
          jiraSync(e.target.files[0]);
          e.target.value = "";
        }}
      />
      {apv[0] ? (
        <ApprovalsModal
          ctx={ctx}
          onClose={function () {
            apv[1](false);
          }}
        />
      ) : null}
    </V.WidgetCard>
  );
}
