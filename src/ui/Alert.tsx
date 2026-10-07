import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

var ICON = { info: "info", success: "check-circle", warning: "alert-triangle", error: "x-circle" };
/* ---------- Alert (inline message: tone, title, body, actions, dismiss) ---------- */
export function Alert(props) {
  var st = useState(false);
  if (st[0]) return null;
  var tone = props.tone || "info";
  return (
    <div className={cx("vl-alert", "is-" + tone, props.className)} role={tone === "error" || tone === "warning" ? "alert" : "status"}>
      <Icon name={ICON[tone] || "info"} size={18} />
      <div className="vl-alert-main">
        {props.title ? <div className="vl-alert-title">{props.title}</div> : null}
        {props.children ? <div className="vl-alert-body">{props.children}</div> : null}
        {props.actions ? <div className="vl-alert-actions">{props.actions}</div> : null}
      </div>
      {props.dismissible ? (
        <button type="button" className="vl-alert-x" aria-label="Dismiss" onClick={function () { st[1](true); if (props.onDismiss) props.onDismiss(); }}>
          <Icon name="x" size={14} />
        </button>
      ) : null}
    </div>
  );
}
