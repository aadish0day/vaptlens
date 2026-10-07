import React from "react";

/* ---------- Skeleton ---------- */
export function Skeleton(props) {
  if (props.variant === "rows") {
    var n = props.rows || 4,
      out = [];
    for (var i = 0; i < n; i++)
      out.push(
        <div key={i} className="vl-skel-row">
          <span
            className="vl-skel"
            style={{
              width: "72px",
            }}
          />
          <span
            className="vl-skel"
            style={{
              flex: 1,
            }}
          />
          <span
            className="vl-skel"
            style={{
              width: "96px",
            }}
          />
        </div>,
      );
    return (
      <div className="vl-skel-rows" aria-busy="true" aria-label="Loading">
        {out}
      </div>
    );
  }
  return (
    <span
      className="vl-skel"
      style={{
        width: props.width || "100%",
        height: props.height || "12px",
      }}
      aria-hidden="true"
    />
  );
}

/* ---------- Toast ---------- */
