import React from "react";

/* ---------- AuditLogRow ---------- */
export function AuditLogRow(props) {
  return (
    <div className="vl-audit">
      <span
        className={
          "vl-audit-act vl-audit-" + (props.action || "PATCH").toLowerCase()
        }
      >
        {props.action || "PATCH"}
      </span>
      <div className="vl-audit-main">
        <span className="vl-audit-detail">{props.detail}</span>
        <span className="vl-audit-meta">
          {props.role}
          {" · "}
          <time dateTime={props.at}>{props.time || props.at}</time>
        </span>
      </div>
    </div>
  );
}

/* ---------- EmptyState ---------- */
