import React, { useEffect, useState } from "react";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { cx, menuKeys, useLayer } from "@/ui/core";
import { MenuSurface, useMenuHighlight } from "@/ui/MenuSurface";

/* ---------- DropdownMenu ---------- */
export function DropdownMenu(props) {
  var o = useState(!!props.defaultOpen),
    wrap = React.useRef(null);
  var hl = useMenuHighlight();
  function focusTrigger() {
    var b = wrap.current && wrap.current.querySelector("[aria-haspopup]");
    if (b) b.focus();
  }
  useLayer(
    o[0],
    function (why) {
      o[1](false);
      if (why === "escape") focusTrigger();
    },
    wrap,
  );
  useEffect(
    function () {
      if (o[0] && wrap.current) {
        var f = wrap.current.querySelector('[role="menuitem"]');
        if (f && wrap.current.contains(document.activeElement)) f.focus();
      }
    },
    [o[0]],
  );
  return (
    <div className="vl-menu-wrap" ref={wrap}>
      <Button
        variant={props.variant || "secondary"}
        size={props.size}
        icon={props.icon}
        aria-haspopup="menu"
        aria-expanded={o[0]}
        onClick={function () {
          o[1](!o[0]);
        }}
        onKeyDown={function (e) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            o[1](true);
          }
        }}
      >
        {props.label}
        <Icon name="chevron-down" size={14} />
      </Button>
      <MenuSurface
        open={o[0]}
        className={cx("vl-menu has-hl", props.align === "right" && "is-right")}
        style={{
          transformOrigin: props.align === "right" ? "top right" : "top left",
        }}
        role="menu"
        onKeyDown={function (e) {
          menuKeys(e, '[role="menuitem"]');
        }}
        {...hl.list}
      >
        {hl.group(
          (props.items || []).map(function (it, i) {
            if (it === "-")
              return <div key={i} className="vl-menu-sep" role="separator" />;
            return (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                className={cx("vl-menu-item", it.danger && "is-danger")}
                {...hl.item(i)}
                onClick={function () {
                  o[1](false);
                  focusTrigger();
                  if (it.onSelect) it.onSelect();
                }}
              >
                {hl.mark(i)}
                {it.icon ? (
                  <Icon name={it.icon} size={14} />
                ) : (
                  <span className="vl-menu-gap" />
                )}
                <span className="vl-menu-label">{it.label}</span>
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

/* ---------- Banner ---------- */
