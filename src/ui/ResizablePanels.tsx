import React, { useState } from "react";

/* ---------- ResizablePanels (two panes + draggable / keyboard-resizable separator) ---------- */
export function ResizablePanels(props) {
  var st = useState(props.defaultSize || 50), min = props.min || 20, max = props.max || 80;
  var box = React.useRef(null);
  function clamp(n) { return Math.max(min, Math.min(max, n)); }
  function set(n) { var c = clamp(n); st[1](c); if (props.onResize) props.onResize(c); }
  function down(e) {
    e.preventDefault();
    function mv(ev) { var r = box.current.getBoundingClientRect(), x = (ev.touches ? ev.touches[0].clientX : ev.clientX); set((100 * (x - r.left)) / r.width); }
    function up() { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); }
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
  }
  return (
    <div className="vl-panes" ref={box} style={{ gridTemplateColumns: st[0] + "% 8px minmax(0, 1fr)" }}>
      <div className="vl-pane">{props.left}</div>
      <div className="vl-pane-sep" role="separator" aria-orientation="vertical" aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(st[0])} aria-label={props.label || "Resize panels"} tabIndex={0}
        onPointerDown={down}
        onKeyDown={function (e) { if (e.key === "ArrowLeft") { e.preventDefault(); set(st[0] - 5); } else if (e.key === "ArrowRight") { e.preventDefault(); set(st[0] + 5); } else if (e.key === "Home") set(min); else if (e.key === "End") set(max); }}
        onDoubleClick={function () { set(props.defaultSize || 50); }} />
      <div className="vl-pane">{props.right}</div>
    </div>
  );
}
