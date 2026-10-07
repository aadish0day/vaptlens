import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- SlaPill ---------- */
export function SlaPill(props) {
  var st = props.status || "met";
  var d = props.days;
  var text =
    st === "met"
      ? "Met"
      : st === "at-risk"
        ? d != null
          ? d + "d left"
          : "At risk"
        : d != null
          ? "Breached +" + d + "d"
          : "Breached";
  return (
    <span className={cx("vl-sla", "vl-sla-" + st)}>
      <Icon
        name={st === "met" ? "check" : "clock"}
        size={12}
        strokeWidth={2.5}
      />
      {text}
    </span>
  );
}

/* ---------- FilterChip ---------- */
