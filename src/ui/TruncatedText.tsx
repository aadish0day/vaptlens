import React, { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cx } from "@/ui/core";
import { NONE, useReduced } from "@/ui/motion";

/* ---------- TruncatedText (clamp to N lines with Show more / less) ----------
   Ported from interior.dev show-more: the clamp is a measured height (line-height × lines)
   that springs open to the full height, instead of a line-clamp that snaps. Text that fits
   gets no toggle at all. */
var DISCLOSE = {
  type: "spring",
  stiffness: 190,
  damping: 30,
  mass: 1,
} as const;

export function TruncatedText(props) {
  var st = useState(false),
    txt = String(props.children || props.text || "");
  var lines = props.lines || 3;
  var ref = useRef(null);
  var m = useState(null);
  var reduced = useReduced();
  useLayoutEffect(function () {
    var el = ref.current;
    if (!el) return;
    function read() {
      var cs = getComputedStyle(el);
      var lh = parseFloat(cs.lineHeight);
      var line = isFinite(lh) ? lh : parseFloat(cs.fontSize) * 1.5;
      var full = el.scrollHeight;
      m[1](function (p) {
        return p && p.line === line && p.full === full
          ? p
          : { line: line, full: full };
      });
    }
    read();
    if (typeof ResizeObserver === "undefined") return;
    var ro = new ResizeObserver(read);
    ro.observe(el);
    return function () {
      ro.disconnect();
    };
  }, []);
  var met = m[0];
  var clamp = met ? Math.min(met.line * lines, met.full) : null;
  /* before the first measurement fall back to the character threshold */
  var long = met
    ? met.full - met.line * lines > 1
    : txt.length > (props.threshold || 240);
  var open = st[0] && long;
  return (
    <div className={cx("vl-trunc", !open && long && "is-faded")}>
      <motion.div
        className="vl-trunc-clip"
        initial={false}
        animate={{ height: met && long ? (open ? met.full : clamp) : "auto" }}
        transition={reduced ? NONE : DISCLOSE}
      >
        <div ref={ref} className="vl-trunc-body">
          {txt}
        </div>
      </motion.div>
      {long ? (
        <button
          type="button"
          className="vl-trunc-more"
          aria-expanded={open}
          onClick={function () {
            st[1](!st[0]);
          }}
        >
          {open ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
