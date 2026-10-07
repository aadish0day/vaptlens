import React from "react";
import { Icon } from "@/ui/Icon";
import { Tooltip } from "@/ui/Tooltip";
import { cx } from "@/ui/core";

/* ---------- TemplateCard ---------- */
export function TemplateCard(props) {
  var locked = !!props.locked;
  var card = (
    <button
      type="button"
      className={cx("vl-tpl", locked && "is-locked")}
      aria-disabled={locked || undefined}
      onClick={function (e) {
        if (locked) {
          e.preventDefault();
          return;
        }
        if (props.onAdd) props.onAdd();
      }}
    >
      <span className="vl-tpl-thumb" aria-hidden="true">
        <TplThumb kind={props.chart || "bar"} />
      </span>
      <span className="vl-tpl-title">
        {locked ? <Icon name="lock" size={12} /> : null}
        {props.title}
      </span>
      <span className="vl-tpl-desc">{props.description}</span>
      <span className="vl-tpl-meta">{props.chartLabel || props.chart}</span>
    </button>
  );
  return locked ? (
    <Tooltip
      content={props.lockReason || "Needs at least 2 dated scan batches."}
    >
      {card}
    </Tooltip>
  ) : (
    card
  );
}

export function TplThumb(props) {
  var k = props.kind;
  if (k === "donut")
    return (
      <svg viewBox="0 0 80 44">
        <circle
          cx={40}
          cy={22}
          r={15}
          fill="none"
          strokeWidth={8}
          className="vl-thumb-a"
          strokeDasharray="40 100"
        />
        <circle
          cx={40}
          cy={22}
          r={15}
          fill="none"
          strokeWidth={8}
          className="vl-thumb-b"
          strokeDasharray="30 100"
          strokeDashoffset={-42}
        />
        <circle
          cx={40}
          cy={22}
          r={15}
          fill="none"
          strokeWidth={8}
          className="vl-thumb-c"
          strokeDasharray="20 100"
          strokeDashoffset={-74}
        />
      </svg>
    );
  if (k === "line")
    return (
      <svg viewBox="0 0 80 44">
        <path
          d="M4 34 20 26 34 30 50 14 64 18 76 8"
          fill="none"
          strokeWidth={2.5}
          className="vl-thumb-line"
        />
      </svg>
    );
  if (k === "heatmap") {
    var cs = [];
    for (var y = 0; y < 3; y++)
      for (var x = 0; x < 5; x++)
        cs.push(
          <rect
            key={x + "-" + y}
            x={6 + x * 14}
            y={4 + y * 13}
            width={12}
            height={11}
            rx={2}
            className="vl-thumb-a"
            opacity={0.2 + ((x * 3 + y * 5) % 7) / 9}
          />,
        );
    return <svg viewBox="0 0 80 44">{cs}</svg>;
  }
  return (
    <svg viewBox="0 0 80 44">
      {[18, 30, 12, 24, 8].map(function (v, i) {
        return (
          <rect
            key={i}
            x={8 + i * 14}
            y={40 - v}
            width={10}
            height={v}
            rx={2}
            className={i === 1 ? "vl-thumb-a" : "vl-thumb-b"}
          />
        );
      })}
    </svg>
  );
}

/* ================= v3b: remaining spec engines ================= */
