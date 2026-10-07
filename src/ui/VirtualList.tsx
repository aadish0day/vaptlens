import React, { useState } from "react";

/* ---------- VirtualList (windowed rendering for long lists: only visible rows are in the DOM) ---------- */
export function VirtualList(props) {
  var items = props.items || [],
    rh = props.rowHeight || 36,
    h = props.height || 400,
    over = props.overscan || 6;
  var top = useState(0);
  var start = Math.max(0, Math.floor(top[0] / rh) - over),
    end = Math.min(items.length, Math.ceil((top[0] + h) / rh) + over);
  var rows = [];
  for (var i = start; i < end; i++)
    rows.push(
      <div
        key={props.getKey ? props.getKey(items[i], i) : i}
        role="listitem"
        className="vl-vlist-row"
        style={{
          position: "absolute",
          top: i * rh,
          height: rh,
          left: 0,
          right: 0,
        }}
      >
        {props.renderItem(items[i], i)}
      </div>,
    );
  return (
    <div
      className="vl-vlist"
      role="list"
      aria-label={props.label}
      aria-rowcount={items.length}
      style={{ height: h, overflow: "auto", position: "relative" }}
      onScroll={function (e) {
        top[1]((e.target as HTMLElement).scrollTop);
      }}
      tabIndex={0}
    >
      <div style={{ height: items.length * rh, position: "relative" }}>
        {rows}
      </div>
    </div>
  );
}
