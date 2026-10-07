import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- WidgetCard ---------- */
export function WidgetCard(props) {
  return (
    <section className={cx("vl-card", props.className)} style={props.style}>
      <header
        className={cx(
          "vl-card-head",
          props.draggable !== false && "is-draggable",
        )}
      >
        {props.draggable !== false ? (
          <span className="vl-card-grip" aria-hidden="true">
            <Icon name="grip" size={14} />
          </span>
        ) : null}
        <h3 className="vl-card-title">{props.title}</h3>
        {props.actions ? (
          <div className="vl-card-actions">{props.actions}</div>
        ) : null}
      </header>
      <div className="vl-card-body">{props.children}</div>
    </section>
  );
}

/* ---------- NavTabs ---------- */
