import { Sel } from "@/app/views/dashboard/Sel";
import { WidgetBody } from "@/app/views/dashboard/WidgetBody";
import { autoTitle } from "@/app/views/dashboard/utils";
import {
  CHARTS,
  DIMS,
  DIM_LABEL,
  MEASURES,
  ORDERS,
  TIME_DIMS,
} from "@/lib/dash";
import React, { useState } from "react";
import * as V from "@/ui";

export function WidgetBuilder(p) {
  var w = useState(p.widget),
    cur = w[0],
    setW = w[1],
    c = cur.cfg;
  function setC(k, v) {
    var n = Object.assign({}, cur, {
      cfg: Object.assign({}, c),
    });
    if (v === "" || v == null) delete n.cfg[k];
    else n.cfg[k] = v;
    setW(n);
  }
  var needsGroup =
    ["kpi", "slabreach", "hostrisk", "exposure", "heatmap"].indexOf(c.chart) <
      0 && !(c.chart === "radar" && c.group === "posture");
  var fixedGroup = c.chart === "histogram";
  if (fixedGroup && c.group !== "cvssBucket")
    setTimeout(function () {
      setC("group", "cvssBucket");
    }, 0);
  var dimOpts = DIMS.map(function (d) {
    return [d[0], d[1]];
  });
  return (
    <V.Modal
      title={p.widget.title ? "Edit widget" : "Widget builder"}
      subtitle="Pick a chart, what to group by and what to measure. The preview is live against the current filters."
      width="960px"
      onClose={p.onClose}
      footer={[
        <V.Button key="c" onClick={p.onClose}>
          Cancel
        </V.Button>,
        <V.Button
          key="s"
          variant="primary"
          onClick={function () {
            p.onSave(cur);
          }}
        >
          Save widget
        </V.Button>,
      ]}
    >
      <div className="wb">
        <div className="wb-form">
          <label className="wb-field">
            <span className="vl-label">Title</span>
            <input
              className="wb-select"
              id="wb-title"
              placeholder={autoTitle(c)}
              value={cur.title || ""}
              onChange={function (e) {
                setW(
                  Object.assign({}, cur, {
                    title: e.target.value,
                  }),
                );
              }}
            />
          </label>
          <Sel
            id="wb-chart"
            label="Chart type"
            value={c.chart}
            options={CHARTS}
            onChange={function (v) {
              setC("chart", v);
            }}
          />
          {needsGroup ? (
            <Sel
              id="wb-group"
              label="Group by"
              value={fixedGroup ? "cvssBucket" : c.group}
              options={dimOpts}
              onChange={function (v) {
                setC("group", v);
              }}
            />
          ) : null}
          {needsGroup || c.chart === "kpi" ? (
            <Sel
              id="wb-measure"
              label="Measure"
              value={c.measure || "count"}
              options={MEASURES}
              onChange={function (v) {
                setC("measure", v);
              }}
            />
          ) : null}
          {["bar", "line", "area"].indexOf(c.chart) >= 0 ? (
            <Sel
              id="wb-color"
              label="Split by (colour)"
              value={c.colorBy || ""}
              options={[["", "None"]].concat(
                dimOpts.filter(function (d) {
                  return d[0] !== c.group;
                }),
              )}
              onChange={function (v) {
                setC("colorBy", v);
              }}
            />
          ) : null}
          {c.chart === "bar" && c.colorBy ? (
            <div className="wb-field">
              <span className="vl-label">Layout</span>
              <V.SegmentedControl
                label="Layout"
                options={["Stacked", "Grouped"]}
                value={c.stack === "grouped" ? "Grouped" : "Stacked"}
                onChange={function (v) {
                  setC("stack", v.toLowerCase());
                }}
              />
            </div>
          ) : null}
          {needsGroup || c.chart === "heatmap" ? (
            <Sel
              id="wb-top"
              label="Show top"
              value={String(c.topN || "")}
              options={[
                ["", "All"],
                ["5", "5"],
                ["8", "8"],
                ["10", "10"],
                ["20", "20"],
              ]}
              onChange={function (v) {
                setC("topN", v ? +v : "");
              }}
            />
          ) : null}
          {needsGroup ? (
            <Sel
              id="wb-sort"
              label="Sort"
              value={c.sort || "desc"}
              options={[
                ["desc", "Value, high to low"],
                ["asc", "Value, low to high"],
                ["label", "Label, A to Z"],
              ]}
              onChange={function (v) {
                setC("sort", v);
              }}
            />
          ) : null}
          {ORDERS[c.group] || TIME_DIMS[c.group] ? (
            <p className="up-help">
              {(DIM_LABEL[c.group] || "") + " keeps its natural order."}
            </p>
          ) : null}
        </div>
        <div className="wb-preview">
          <V.WidgetCard title={cur.title || autoTitle(c)} draggable={false}>
            <WidgetBody cfg={c} rows={p.rows} hist={p.hist} dc={p.dc} />
          </V.WidgetCard>
        </div>
      </div>
    </V.Modal>
  );
}
