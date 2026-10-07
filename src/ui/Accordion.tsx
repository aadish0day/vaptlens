import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- Accordion (sections: [{ id, title, meta?, content }]) ---------- */
export function Accordion(props) {
  var secs = props.sections || [];
  var st = useState(props.defaultOpen || (props.multiple ? [] : []));
  var openIds = props.open !== undefined ? props.open : st[0];
  function toggle(id) {
    var on = openIds.indexOf(id) >= 0;
    var next = props.multiple ? (on ? openIds.filter(function (x) { return x !== id; }) : openIds.concat([id])) : on ? [] : [id];
    if (props.open === undefined) st[1](next);
    if (props.onChange) props.onChange(next);
  }
  return (
    <div className="vl-acc">
      {secs.map(function (s) {
        var on = openIds.indexOf(s.id) >= 0, hid = "vl-acc-" + s.id;
        return (
          <section key={s.id} className={cx("vl-acc-sec", on && "is-open")}>
            <h3 className="vl-acc-h">
              <button type="button" aria-expanded={on} aria-controls={hid} onClick={function () { toggle(s.id); }}>
                <Icon name="chevron-right" size={14} />
                <span className="vl-acc-title">{s.title}</span>
                {s.meta != null ? <span className="vl-acc-meta">{s.meta}</span> : null}
              </button>
            </h3>
            <div id={hid} role="region" className="vl-acc-body" hidden={!on}>{on ? s.content : null}</div>
          </section>
        );
      })}
    </div>
  );
}
