import React, { useId, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { LEAVE, NONE, useReduced } from "@/ui/motion";

/* ---------- MenuSurface + menu highlight (ported from interior.dev dropdown / popover) ----------
   Floating surfaces grow from their trigger and leave faster than they arrive; one highlight
   slides between items instead of every row flashing its own hover colour. */
var OPEN = { type: "spring", stiffness: 620, damping: 38, mass: 0.6 } as const;
var NUDGE = { type: "spring", stiffness: 700, damping: 46, mass: 0.5 } as const;

export var MenuSurface = React.forwardRef(function MenuSurface(p: any, ref) {
  var reduced = useReduced();
  var rest = {};
  for (var k in p)
    if (["open", "from", "children"].indexOf(k) < 0) rest[k] = p[k];
  var dy = p.from === "bottom" ? 4 : -4;
  return (
    <AnimatePresence>
      {p.open ? (
        <motion.div
          key="surface"
          ref={ref as any}
          {...(rest as any)}
          initial={
            reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: dy }
          }
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            transition: reduced ? NONE : OPEN,
          }}
          exit={
            reduced
              ? { opacity: 0, transition: NONE }
              : { opacity: 0, scale: 0.98, transition: LEAVE }
          }
        >
          {p.children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});

/* const hl = useMenuHighlight(); <div {...hl.list}> … <button {...hl.item(i)}>{hl.mark(i)}…</button> */
export function useMenuHighlight() {
  var id = useId();
  var st = useState(-1);
  var reduced = useReduced();
  return {
    group: function (children) {
      return <LayoutGroup id={id}>{children}</LayoutGroup>;
    },
    list: {
      onMouseLeave: function () {
        st[1](-1);
      },
    },
    item: function (i) {
      return {
        onMouseEnter: function () {
          st[1](i);
        },
        onFocus: function () {
          st[1](i);
        },
      };
    },
    mark: function (i) {
      return st[0] === i ? (
        <motion.span
          layoutId="hl"
          className="vl-menu-hl"
          aria-hidden="true"
          transition={reduced ? NONE : NUDGE}
        />
      ) : null;
    },
  };
}
