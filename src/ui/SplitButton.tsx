import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx, menuKeys, useLayer } from "@/ui/core";

/* ---------- SplitButton (primary action + menu of alternatives, e.g. Export PDF ▾ CSV/Word/HTML) ---------- */
export function SplitButton(props) {
  var open = useState(false), wrap = React.useRef(null), trig = React.useRef(null);
  useLayer(open[0], function (why) { open[1](false); if (why === "escape" && trig.current) trig.current.focus(); }, wrap);
  var v = props.variant || "primary";
  return (
    <div className="vl-split" ref={wrap}>
      <button type="button" className={cx("vl-btn", "vl-btn-" + v, "vl-split-main")} onClick={props.onClick} disabled={props.disabled}>
        {props.icon ? <Icon name={props.icon} size={14} /> : null}<span>{props.label}</span>
      </button>
      <button type="button" ref={trig} className={cx("vl-btn", "vl-btn-" + v, "vl-split-arrow")} aria-label={props.menuLabel || "More options"} aria-haspopup="menu" aria-expanded={open[0]} disabled={props.disabled} onClick={function () { open[1](!open[0]); }}>
        <Icon name="chevron-down" size={14} />
      </button>
      {open[0] ? (
        <div className="vl-menu is-right" role="menu" onKeyDown={function (e) { menuKeys(e, "[role=menuitem]"); }}>
          {(props.items || []).map(function (it, i) {
            return (
              <button key={i} type="button" role="menuitem" autoFocus={i === 0} className={cx("vl-menu-item", it.danger && "is-danger")} disabled={it.disabled} onClick={function () { open[1](false); if (it.onSelect) it.onSelect(); }}>
                {it.icon ? <Icon name={it.icon} size={14} /> : null}<span>{it.label}</span>{it.hint ? <span className="vl-menu-hint">{it.hint}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
