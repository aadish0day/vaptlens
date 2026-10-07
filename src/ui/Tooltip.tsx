import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cx } from "@/ui/core";
import { LEAVE, NONE, useReduced } from "@/ui/motion";

/* ---------- Tooltip ----------
   Group behaviour ported from interior.dev tooltip-group: the first tooltip waits DELAY so a
   pointer passing over doesn't flash it; once one has shown, moving to a neighbour within
   SKIP shows it at once (the user is reading tooltips now). Keyboard focus shows immediately. */
var DELAY = 400;
var SKIP = 300;
var RISE = { type: "spring", stiffness: 560, damping: 34, mass: 0.6 } as const;
var lastHidden = 0;
var anyOpen = 0;

export function Tooltip(props) {
  var st = useState(false);
  var timer = useRef(null);
  var id = useId();
  var reduced = useReduced();
  var bottom = props.side === "bottom";
  function warm() {
    return anyOpen > 0 || Date.now() - lastHidden < SKIP;
  }
  var wasWarm = useRef(false);
  function show(now) {
    clearTimeout(timer.current);
    wasWarm.current = warm();
    if (now || wasWarm.current) st[1](true);
    else
      timer.current = setTimeout(function () {
        st[1](true);
      }, DELAY);
  }
  function hide() {
    clearTimeout(timer.current);
    st[1](false);
  }
  useEffect(
    function () {
      if (!st[0]) return;
      anyOpen++;
      function esc(e) {
        if (e.key === "Escape") hide();
      }
      document.addEventListener("keydown", esc);
      return function () {
        anyOpen--;
        lastHidden = Date.now();
        document.removeEventListener("keydown", esc);
      };
    },
    [st[0]],
  );
  useEffect(function () {
    return function () {
      clearTimeout(timer.current);
    };
  }, []);
  var instant = reduced || wasWarm.current;
  return (
    <span
      className="vl-tip-wrap"
      aria-describedby={st[0] ? id : undefined}
      onPointerEnter={function () {
        show(false);
      }}
      onPointerLeave={hide}
      onFocus={function () {
        show(true);
      }}
      onBlur={hide}
    >
      {props.children}
      <AnimatePresence>
        {st[0] ? (
          <motion.span
            key="tip"
            id={id}
            role="tooltip"
            className={cx("vl-tip is-js", bottom && "is-bottom")}
            style={{ x: "-50%" }}
            initial={
              instant
                ? { opacity: 0 }
                : { opacity: 0, y: bottom ? -4 : 4, scale: 0.97 }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: reduced ? NONE : instant ? { duration: 0.08 } : RISE,
            }}
            exit={{ opacity: 0, transition: reduced ? NONE : LEAVE }}
          >
            {props.content}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
