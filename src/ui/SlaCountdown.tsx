import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- SlaCountdown (days to due date, from a due ISO date and "today"; tone by urgency) ---------- */
export function SlaCountdown(props) {
  if (!props.due) return <span className="vl-slacd is-none">No due date</span>;
  var t = props.today
    ? new Date(props.today + "T00:00:00")
    : new Date(new Date().toDateString());
  var d = Math.round(
    (new Date(props.due + "T00:00:00").getTime() - t.getTime()) / 864e5,
  );
  var tone = props.paused
    ? "paused"
    : d < 0
      ? "danger"
      : d <= (props.warnDays || 7)
        ? "warn"
        : "ok";
  var txt = props.paused
    ? "Paused"
    : d < 0
      ? -d + "d overdue"
      : d === 0
        ? "Due today"
        : d + "d left";
  return (
    <span className={cx("vl-slacd", "is-" + tone)} title={"Due " + props.due}>
      <Icon
        name={props.paused ? "pause" : d < 0 ? "alert-triangle" : "clock"}
        size={12}
      />
      <span>{txt}</span>
    </span>
  );
}
