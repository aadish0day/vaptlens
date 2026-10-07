import React from "react";
import { Icon } from "@/ui/Icon";

/* ---------- Banner ---------- */
export function Banner(props) {
  var tone = props.tone || "info";
  var icon = {
    info: "info",
    warn: "clock",
    danger: "shield",
    privacy: "shield-check",
  }[tone];
  return (
    <div
      className={"vl-banner vl-banner-" + tone}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon name={icon} size={16} />
      <div className="vl-banner-main">
        {props.title ? (
          <span className="vl-banner-title">{props.title}</span>
        ) : null}
        {props.children ? (
          <span className="vl-banner-body">{props.children}</span>
        ) : null}
      </div>
      {props.action || null}
      {props.onClose ? (
        <button
          type="button"
          className="vl-chip-x"
          aria-label="Dismiss"
          onClick={props.onClose}
        >
          <Icon name="x" size={12} />
        </button>
      ) : null}
    </div>
  );
}

/* ---------- RoleSwitcher ---------- */
