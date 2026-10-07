import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

const h = React.createElement;

/* ---------- KpiCard ---------- */
export function KpiCard(props) {
  return h(
    props.onClick ? "button" : "div",
    {
      type: props.onClick ? "button" : undefined,
      className: cx(
        "vl-kpi",
        props.active && "is-active",
        props.tone && "vl-kpi-" + props.tone,
      ),
      onClick: props.onClick,
      "aria-pressed": props.onClick ? !!props.active : undefined,
    },
    <div className="vl-kpi-head">
      <span className="vl-label">{props.label}</span>
      {props.icon ? <Icon name={props.icon} size={16} /> : null}
    </div>,
    <div className="vl-kpi-value">{props.value}</div>,
    props.sub ? <div className="vl-kpi-sub">{props.sub}</div> : null,
  );
}

/* ---------- WidgetCard ---------- */
