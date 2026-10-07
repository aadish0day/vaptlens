import React from "react";
import { Icon } from "@/ui/Icon";

/* ---------- Toast ---------- */
export function Toast(props) {
  var tone = props.tone || "ok";
  return (
    <div
      className={"vl-toast vl-toast-" + tone}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon
        name={tone === "ok" ? "check" : tone === "danger" ? "shield" : "info"}
        size={16}
      />
      <div className="vl-toast-main">
        <span className="vl-toast-title">{props.title}</span>
        {props.message ? (
          <span className="vl-toast-msg">{props.message}</span>
        ) : null}
      </div>
      {props.action ? (
        <button
          type="button"
          className="vl-toast-action"
          onClick={props.action.onClick}
        >
          {props.action.label}
        </button>
      ) : null}
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

/* ---------- Charts (token-styled SVG; the app uses Recharts with the same rules) ---------- */
