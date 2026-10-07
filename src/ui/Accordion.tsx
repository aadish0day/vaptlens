import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";
import { AnimatePresence, motion } from "motion/react";
import { HEIGHT, LEAVE, NONE, useReduced } from "@/ui/motion";

/* ---------- Accordion (sections: [{ id, title, meta?, content }]) ---------- */
export function Accordion(props) {
  var secs = props.sections || [];
  var reduced = useReduced();
  var st = useState(props.defaultOpen || (props.multiple ? [] : []));
  var openIds = props.open !== undefined ? props.open : st[0];
  function toggle(id) {
    var on = openIds.indexOf(id) >= 0;
    var next = props.multiple
      ? on
        ? openIds.filter(function (x) {
            return x !== id;
          })
        : openIds.concat([id])
      : on
        ? []
        : [id];
    if (props.open === undefined) st[1](next);
    if (props.onChange) props.onChange(next);
  }
  return (
    <div className="vl-acc">
      {secs.map(function (s) {
        var on = openIds.indexOf(s.id) >= 0,
          hid = "vl-acc-" + s.id;
        return (
          <section key={s.id} className={cx("vl-acc-sec", on && "is-open")}>
            <h3 className="vl-acc-h">
              <button
                type="button"
                aria-expanded={on}
                aria-controls={hid}
                onClick={function () {
                  toggle(s.id);
                }}
              >
                <Icon name="chevron-right" size={14} />
                <span className="vl-acc-title">{s.title}</span>
                {s.meta != null ? (
                  <span className="vl-acc-meta">{s.meta}</span>
                ) : null}
              </button>
            </h3>
            {/* height springs open from 0 (interior.dev accordion); padding lives inside the clip */}
            <AnimatePresence initial={false}>
              {on ? (
                <motion.div
                  key="b"
                  className="vl-acc-clip"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                    transition: reduced ? NONE : HEIGHT,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: reduced ? NONE : LEAVE,
                  }}
                >
                  <div id={hid} role="region" className="vl-acc-body">
                    {s.content}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}
