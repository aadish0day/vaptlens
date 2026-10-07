import React, { useState } from "react";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { FindingDetail } from "@/ui/FindingDetail";
import { Icon } from "@/ui/Icon";
import { SeverityBadge } from "@/ui/SeverityBadge";
import { ThreatTag } from "@/ui/ThreatTag";
import { SEV_ORDER, cx } from "@/ui/core";

const h = React.createElement;

/* ---------- VulnTable ---------- */
export var COLS = [
  {
    key: "severity",
    label: "Severity",
    w: "112px",
  },
  {
    key: "name",
    label: "Finding",
  },
  {
    key: "host",
    label: "Host",
    w: "168px",
    mono: true,
  },
  {
    key: "cvss",
    label: "CVSS",
    w: "64px",
    mono: true,
    num: true,
  },
  {
    key: "lifecycle",
    label: "Status",
    w: "96px",
  },
  {
    key: "tool",
    label: "Tool",
    w: "96px",
  },
];

export function cmp(a, b, key, num) {
  if (key === "severity")
    return SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity);
  if (key === "cvss") return (b.cvss || 0) - (a.cvss || 0);
  if (num) {
    var x = a[key],
      y = b[key];
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return y - x;
  }
  return String(a[key] || "").localeCompare(String(b[key] || ""));
}

export function VulnTable(props) {
  var rows0 = props.rows || [];
  /* sort can be controlled (props.sort + props.onSortChange) so the app can remember it */
  var s0 = useState(
    props.sort || {
      key: "severity",
      dir: 1,
    },
  );
  var s = props.onSortChange
    ? [
        props.sort || {
          key: "severity",
          dir: 1,
        },
        props.onSortChange,
      ]
    : s0;
  /* extra columns chosen by the user: {key, label, num?, mono?, w?}; cells show row[key + "Txt"] when given */
  var cols = COLS.slice(0, 5)
    .concat(props.extraCols || [])
    .concat([COLS[5]]);
  var numKey = {};
  cols.forEach(function (c) {
    if (c.num) numKey[c.key] = true;
  });
  var ex = useState(props.defaultExpanded || null);
  /* sort everything first, then show the first `limit` rows (paging never hides the worst findings) */
  var rows = rows0.slice().sort(function (a, b) {
    return (
      cmp(a, b, s[0].key, numKey[s[0].key]) * s[0].dir ||
      (b.risk || 0) - (a.risk || 0)
    );
  });
  if (props.limit) rows = rows.slice(0, props.limit);
  /* optional multi-select: props.selectable + props.selected (array of row ids) + props.onSelectChange(ids) */
  var selOn = !!props.selectable,
    sel = {};
  (props.selected || []).forEach(function (id) {
    sel[id] = true;
  });
  var allOn =
      selOn &&
      rows.length > 0 &&
      rows.every(function (r) {
        return sel[r.id];
      }),
    someOn =
      selOn &&
      rows.some(function (r) {
        return sel[r.id];
      });
  function setSel(ids) {
    if (props.onSelectChange) props.onSelectChange(ids);
  }
  var lastSel = React.useRef(null);
  /* shift-click selects (or clears) the whole range since the last box clicked */
  function toggleRow(id, shift) {
    var ids = rows.map(function (r) {
        return r.id;
      }),
      a = ids.indexOf(lastSel.current),
      b = ids.indexOf(id);
    if (shift && a >= 0 && b >= 0) {
      var range = ids.slice(Math.min(a, b), Math.max(a, b) + 1),
        on = !sel[id];
      setSel(
        on
          ? uniqIds((props.selected || []).concat(range))
          : (props.selected || []).filter(function (x) {
              return range.indexOf(x) < 0;
            }),
      );
    } else {
      var n = (props.selected || []).filter(function (x) {
        return x !== id;
      });
      if (!sel[id]) n.push(id);
      setSel(n);
    }
    lastSel.current = id;
  }
  function toggleAll() {
    var vis = rows.map(function (r) {
      return r.id;
    });
    setSel(
      allOn
        ? (props.selected || []).filter(function (x) {
            return vis.indexOf(x) < 0;
          })
        : uniqIds((props.selected || []).concat(vis)),
    );
  }
  function uniqIds(a) {
    var o = {},
      out = [];
    a.forEach(function (x) {
      if (!o[x]) {
        o[x] = 1;
        out.push(x);
      }
    });
    return out;
  }
  return (
    <div className="vl-table-wrap" data-density={props.density}>
      <table className={"vl-table" + (selOn ? " is-selectable" : "")}>
        <thead>
          <tr>
            {selOn ? (
              <th
                style={{
                  width: "36px",
                }}
              >
                <input
                  type="checkbox"
                  className="vl-rowcheck"
                  aria-label={
                    allOn ? "Clear selection" : "Select all rows shown"
                  }
                  checked={allOn}
                  ref={function (el) {
                    if (el) el.indeterminate = !allOn && someOn;
                  }}
                  onChange={toggleAll}
                />
              </th>
            ) : null}
            <th
              style={{
                width: "32px",
              }}
            />
            {cols.map(function (c) {
              var on = s[0].key === c.key;
              return (
                <th
                  key={c.key}
                  style={
                    c.w
                      ? {
                          width: c.w,
                        }
                      : null
                  }
                  className={c.num ? "is-num" : null}
                  aria-sort={
                    on
                      ? (s[0].dir === 1) ===
                        (c.key === "severity" || c.key === "cvss" || !!c.num)
                        ? "descending"
                        : "ascending"
                      : "none"
                  }
                  title={
                    c.key === "severity" || c.key === "cvss" || c.num
                      ? "Sort: highest first, click again to reverse"
                      : "Sort: A to Z, click again to reverse"
                  }
                >
                  <button
                    type="button"
                    className={cx("vl-th-btn", on && "is-on")}
                    onClick={function () {
                      s[1]({
                        key: c.key,
                        dir: on ? -s[0].dir : 1,
                      });
                    }}
                  >
                    {c.label}
                    <Icon
                      name={
                        on && s[0].dir === -1 ? "chevron-up" : "chevron-down"
                      }
                      size={12}
                    />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(function (r) {
            var open = ex[0] === r.id;
            var cells = h.apply(
              null,
              (
                [
                  "tr",
                  {
                    key: r.id,
                    className: cx(
                      "vl-tr",
                      open && "is-open",
                      sel[r.id] && "is-selected",
                    ),
                    onClick: function () {
                      ex[1](open ? null : r.id);
                    },
                  },
                ] as any[]
              ).concat(
                [
                  selOn ? (
                    <td
                      onClick={function (e) {
                        e.stopPropagation();
                      }}
                    >
                      <input
                        type="checkbox"
                        className="vl-rowcheck"
                        aria-label={"Select " + r.name + " on " + r.host}
                        checked={!!sel[r.id]}
                        onChange={function () {}}
                        onClick={function (e) {
                          toggleRow(r.id, e.shiftKey);
                        }}
                      />
                    </td>
                  ) : null,
                  <td>
                    <button
                      type="button"
                      className="vl-row-toggle"
                      aria-expanded={open}
                      aria-label={(open ? "Collapse " : "Expand ") + r.name}
                    >
                      <Icon
                        name={open ? "chevron-down" : "chevron-right"}
                        size={14}
                      />
                    </button>
                  </td>,
                  <td>
                    <SeverityBadge severity={r.severity} />
                  </td>,
                  <td>
                    <div className="vl-td-name">
                      <span className="vl-td-title">{r.name}</span>
                      {r.merged > 1 ? (
                        <span className="vl-merged">
                          {r.merged + "x merged"}
                        </span>
                      ) : null}
                      {(r.tags || []).map(function (t) {
                        return <ThreatTag key={t} kind={t} />;
                      })}
                    </div>
                  </td>,
                  <td className="is-mono">{r.host}</td>,
                  <td className="is-mono is-num">
                    {r.cvss != null ? r.cvss.toFixed(1) : "—"}
                  </td>,
                  <td>
                    <LifecycleText value={r.lifecycle} />
                  </td>,
                ]
                  .concat(
                    (props.extraCols || []).map(function (c) {
                      var v =
                        r[c.key + "Txt"] != null ? r[c.key + "Txt"] : r[c.key];
                      return (
                        <td
                          key={c.key}
                          className={cx(
                            c.mono && "is-mono",
                            c.num && "is-num",
                            c.muted && "vl-td-muted",
                          )}
                        >
                          {v == null || v === "" ? "—" : v}
                        </td>
                      );
                    }),
                  )
                  .concat([
                    <td key="tool" className="vl-td-muted">
                      {r.tool}
                    </td>,
                  ]),
              ),
            );
            if (!open) return cells;
            return [
              cells,
              <tr key={r.id + "-d"} className="vl-tr-detail">
                <td colSpan={cols.length + 1 + (selOn ? 1 : 0)}>
                  {props.renderDetail ? (
                    props.renderDetail(r)
                  ) : (
                    <FindingDetail finding={r} />
                  )}
                </td>
              </tr>,
            ];
          })}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <EmptyState
          title="No findings match the current filters."
          action={
            props.onClearFilters ? (
              <Button variant="ghost" size="sm" onClick={props.onClearFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : null}
    </div>
  );
}

export function LifecycleText(props) {
  var v = props.value || "Open";
  return (
    <span
      className={
        "vl-life vl-life-" +
        v
          .toLowerCase()
          .replace(/[^a-z]+/g, "-")
          .replace(/-$/, "")
      }
      title={props.title}
    >
      {v}
    </span>
  );
}
