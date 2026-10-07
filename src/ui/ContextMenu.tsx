import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx, menuKeys, useLayer } from "@/ui/core";

/* ---------- ContextMenu (right-click or Shift+F10 / Menu key on the wrapped content) ---------- */
export function ContextMenu(props) {
  var pos = useState(null), wrap = React.useRef(null), menu = React.useRef(null);
  useLayer(!!pos[0], function () { pos[1](null); }, menu);
  function openAt(x, y) { pos[1]({ x: Math.min(x, window.innerWidth - 240), y: Math.min(y, window.innerHeight - 40 * (props.items || []).length - 16) }); setTimeout(function () { var b = menu.current && menu.current.querySelector("[role=menuitem]"); if (b) b.focus(); }, 0); }
  return (
    <div className="vl-ctx" ref={wrap}
      onContextMenu={function (e) { e.preventDefault(); openAt(e.clientX, e.clientY); }}
      onKeyDown={function (e) { if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) { e.preventDefault(); var r = (e.target as HTMLElement).getBoundingClientRect(); openAt(r.left + 8, r.bottom); } }}>
      {props.children}
      {pos[0] ? (
        <div ref={menu} className="vl-menu vl-ctx-menu" role="menu" style={{ position: "fixed", left: pos[0].x, top: pos[0].y }} onKeyDown={function (e) { menuKeys(e, "[role=menuitem]"); }}>
          {(props.items || []).map(function (it, i) {
            return it === "-" ? <div key={i} className="vl-ctx-sep" role="separator" /> : (
              <button key={i} type="button" role="menuitem" className={cx("vl-menu-item", it.danger && "is-danger")} disabled={it.disabled} onClick={function () { pos[1](null); if (it.onSelect) it.onSelect(); }}>
                {it.icon ? <Icon name={it.icon} size={14} /> : null}<span>{it.label}</span>{it.hint ? <span className="vl-menu-hint">{it.hint}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
