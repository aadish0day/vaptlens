import React from "react";
import { Icon } from "@/ui/Icon";
import { SeverityBadge } from "@/ui/SeverityBadge";
import { ThreatTag } from "@/ui/ThreatTag";
import { cx } from "@/ui/core";

/* ---------- KanbanCard ---------- */
export function KanbanCard(props) {
  return (
    <article
      {...Object.assign(
        {
          className: cx("vl-kcard", props.dragging && "is-dragging"),
        },
        props.dragProps || {},
      )}
    >
      <div className="vl-kcard-top">
        <SeverityBadge severity={props.severity} />
        {props.ticket ? (
          <span className="vl-kcard-ticket">
            <Icon name="ticket" size={12} />
            {props.ticket}
          </span>
        ) : null}
      </div>
      {props.onOpen ? (
        <button
          type="button"
          className="vl-kcard-title vl-kcard-open"
          data-kmove={props.moveId ? props.moveId + ":open" : undefined}
          onClick={props.onOpen}
        >
          {props.title}
        </button>
      ) : (
        <div className="vl-kcard-title">{props.title}</div>
      )}
      <div className="vl-kcard-host">{props.host}</div>
      {props.tags && props.tags.length ? (
        <div className="vl-kcard-tags">
          {props.tags.map(function (k) {
            return <ThreatTag key={k} kind={k} />;
          })}
        </div>
      ) : null}
      <div className="vl-kcard-foot">
        <span className="vl-kcard-team">{props.team || "Unassigned"}</span>
        <span className="vl-kcard-move">
          <button
            type="button"
            className="vl-icon-btn"
            aria-label={props.backLabel || "Move back"}
            data-kmove={props.moveId ? props.moveId + ":back" : undefined}
            onClick={props.onBack}
            disabled={!props.onBack}
          >
            <Icon name="chevron-left" size={14} />
          </button>
          <button
            type="button"
            className="vl-icon-btn"
            aria-label={props.forwardLabel || "Move forward"}
            data-kmove={props.moveId ? props.moveId + ":forward" : undefined}
            onClick={props.onForward}
            disabled={!props.onForward}
          >
            <Icon name="chevron-right" size={14} />
          </button>
        </span>
      </div>
    </article>
  );
}

/* ---------- CodeSnippet ---------- */
