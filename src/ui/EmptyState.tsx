import React from "react";

/* ---------- EmptyState ---------- */
export function EmptyState(props) {
  return (
    <div className="vl-empty">
      <p className="vl-empty-title">{props.title || "Nothing here yet."}</p>
      {props.hint ? <p className="vl-empty-hint">{props.hint}</p> : null}
      {props.action || null}
    </div>
  );
}

/* ---------- Skeleton ---------- */
