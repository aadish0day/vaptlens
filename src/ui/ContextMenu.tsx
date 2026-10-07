import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx, menuKeys, useLayer } from "@/ui/core";
import { MenuSurface, useMenuHighlight } from "@/ui/MenuSurface";

/* ---------- ContextMenu (right-click or Shift+F10 / Menu key on the wrapped content) ---------- */
export function ContextMenu(props) {
  var pos = useState(null),
    wrap = React.useRef(null),
    menu = React.useRef(null);
  var last = React.useRef(null),
    hl = useMenuHighlight();
  if (pos[0]) last.current = pos[0];
  useLayer(
    !!pos[0],
    function () {
      pos[1](null);
    },
    menu,
  );
  function openAt(x, y) {
    pos[1]({
      x: Math.min(x, window.innerWidth - 240),
      y: Math.min(y, window.innerHeight - 40 * (props.items || []).length - 16),
    });
    setTimeout(function () {
      var b = menu.current && menu.current.querySelector("[role=menuitem]");
      if (b) b.focus();
    }, 0);
  }
  return (
    <div
      className="vl-ctx"
      ref={wrap}
      onContextMenu={function (e) {
        e.preventDefault();
        openAt(e.clientX, e.clientY);
      }}
      onKeyDown={function (e) {
        if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
          e.preventDefault();
          var r = (e.target as HTMLElement).getBoundingClientRect();
          openAt(r.left + 8, r.bottom);
        }
      }}
    >
      {props.children}
      {/* the menu keeps its last position while it animates out */}
      <MenuSurface
        open={!!pos[0]}
        ref={menu}
        className="vl-menu vl-ctx-menu has-hl"
        role="menu"
        style={
          last.current
            ? {
                position: "fixed",
                left: last.current.x,
                top: last.current.y,
                transformOrigin: "top left",
              }
            : null
        }
        onKeyDown={function (e) {
          menuKeys(e, "[role=menuitem]");
        }}
        {...hl.list}
      >
        {hl.group(
          (props.items || []).map(function (it, i) {
            return it === "-" ? (
              <div key={i} className="vl-ctx-sep" role="separator" />
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                className={cx("vl-menu-item", it.danger && "is-danger")}
                disabled={it.disabled}
                {...hl.item(i)}
                onClick={function () {
                  pos[1](null);
                  if (it.onSelect) it.onSelect();
                }}
              >
                {hl.mark(i)}
                {it.icon ? <Icon name={it.icon} size={14} /> : null}
                <span>{it.label}</span>
                {it.hint ? (
                  <span className="vl-menu-hint">{it.hint}</span>
                ) : null}
              </button>
            );
          }),
        )}
      </MenuSurface>
    </div>
  );
}
