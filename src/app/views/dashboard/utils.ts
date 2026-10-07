import { count } from "@/app/lib/common";
import { DIM_LABEL, MEASURE_LABEL } from "@/lib/dash";
import { Responsive, WidthProvider } from "react-grid-layout";

export var _grid = null;

export function GRID() {
  if (!_grid) _grid = WidthProvider(Responsive);
  return _grid;
}

export function autoTitle(c) {
  if (!c) return "Widget";
  if (c.chart === "slabreach") return "SLA compliance";
  if (c.chart === "hostrisk") return "Host risk";
  if (c.chart === "exposure") return "Threat exposure";
  if (c.chart === "heatmap") return "Severity heatmap";
  if (c.chart === "kpi") return MEASURE_LABEL[c.measure || "count"];
  return (
    (MEASURE_LABEL[c.measure || "count"] || "Count") +
    " by " +
    (DIM_LABEL[c.group] || c.group).toLowerCase() +
    (c.colorBy ? " · " + (DIM_LABEL[c.colorBy] || "").toLowerCase() : "")
  );
}

export function exposureItems(a) {
  return [
    {
      kind: "kev",
      value: count(a, function (x) {
        return x.kev;
      }),
    },
    {
      kind: "zeroday",
      value: count(a, function (x) {
        return x.zeroday;
      }),
    },
    {
      kind: "ransomware",
      value: count(a, function (x) {
        return x.ransomware;
      }),
    },
    {
      kind: "exploitable",
      value: count(a, function (x) {
        return x.exploitable;
      }),
    },
    {
      kind: "breached",
      value: count(a, function (x) {
        return x.breached;
      }),
    },
    {
      kind: "eol",
      value: count(a, function (x) {
        return x.eol;
      }),
    },
  ];
}
