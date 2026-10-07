import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- ScannerBadge ---------- */
export function ScannerBadge(props) {
  var ok = props.matched == null || props.matched >= 2;
  return (
    <span className={cx("vl-scanner", !ok && "is-unknown")}>
      <Icon name={ok ? "check" : "info"} size={12} strokeWidth={2.5} />
      <span className="vl-scanner-name">
        {ok ? props.tool : "Unrecognised CSV"}
      </span>
      {props.matched != null ? (
        <span className="vl-scanner-meta">
          {props.matched + "/" + props.total + " headers"}
        </span>
      ) : null}
    </span>
  );
}

/* ---------- ColumnMapRow ---------- */
