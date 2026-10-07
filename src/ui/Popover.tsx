import React, { useState } from "react";
import { cx, useLayer } from "@/ui/core";
import { MenuSurface } from "@/ui/MenuSurface";

/* ---------- Popover (click-triggered, dismissible, focus returns to trigger) ---------- */
export function Popover(props) {
  var st = useState(false);
  var open = props.open !== undefined ? props.open : st[0];
  var wrap = React.useRef(null),
    trig = React.useRef(null);
  function set(v) {
    if (props.open === undefined) st[1](v);
    if (props.onOpenChange) props.onOpenChange(v);
  }
  useLayer(
    open,
    function (why) {
      set(false);
      if (why === "escape" && trig.current) trig.current.focus();
    },
    wrap,
  );
  return (
    <span className="vl-pop-wrap" ref={wrap}>
      <button
        type="button"
        ref={trig}
        className={props.triggerClassName || "vl-pop-trigger"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={function () {
          set(!open);
        }}
      >
        {props.trigger}
      </button>
      <MenuSurface
        open={open}
        from={props.side === "top" ? "bottom" : "top"}
        className={cx(
          "vl-pop",
          "is-" + (props.side || "bottom"),
          props.align === "end" && "is-end",
        )}
        style={{
          transformOrigin:
            (props.side === "top" ? "bottom " : "top ") +
            (props.align === "end" ? "right" : "left"),
        }}
        role="dialog"
        aria-label={props.title || undefined}
      >
        {props.title ? <div className="vl-pop-title">{props.title}</div> : null}
        <div className="vl-pop-body">
          {typeof props.children === "function"
            ? props.children(function () {
                set(false);
              })
            : props.children}
        </div>
      </MenuSurface>
    </span>
  );
}
