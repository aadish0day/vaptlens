import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cx } from "@/ui/core";
import { BASE, EASE_OUT, NONE, useReduced } from "@/ui/motion";

/* ---------- CopyButton (clipboard with select-text fallback, live confirmation) ----------
   Motion ported from interior.dev copy-button: every label is stacked in one grid cell so the
   button never changes width, the icons cross-fade and the check is drawn. */
var CROSSFADE = { duration: BASE, ease: EASE_OUT };
var DRAW = { duration: 0.26, ease: EASE_OUT, delay: 0.04 };

export function CopyButton(props) {
  var st = useState("idle");
  var timer = useRef(null);
  var reduced = useReduced();
  useEffect(function () {
    return function () {
      clearTimeout(timer.current);
    };
  }, []);
  /* a second click restarts the confirmation instead of cutting it short */
  function done(s) {
    clearTimeout(timer.current);
    st[1](s);
    timer.current = setTimeout(function () {
      st[1]("idle");
    }, 1600);
  }
  function fallback(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      ta.remove();
      done(ok ? "ok" : "fail");
    } catch (e) {
      done("fail");
    }
  }
  function copy() {
    var text =
      typeof props.text === "function"
        ? props.text()
        : String(props.text || "");
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(text).then(
        function () {
          done("ok");
        },
        function () {
          fallback(text);
        },
      );
    else fallback(text);
    if (props.onCopy) props.onCopy(text);
  }
  var s = st[0];
  var fade = reduced ? NONE : CROSSFADE;
  var labels = [
    ["idle", props.label || "Copy"],
    ["ok", "Copied"],
    ["fail", "Couldn't copy"],
  ];
  var label = labels.filter(function (l) {
    return l[0] === s;
  })[0][1];
  function icon(key, children) {
    return (
      <motion.svg
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="vl-copy-glyph"
        initial={false}
        animate={{ opacity: s === key ? 1 : 0, scale: s === key ? 1 : 0.92 }}
        transition={fade}
      >
        {children}
      </motion.svg>
    );
  }
  return (
    <motion.button
      type="button"
      className={cx(
        "vl-btn vl-btn-secondary vl-btn-sm vl-copy",
        s === "ok" && "is-ok",
        props.className,
      )}
      onClick={copy}
      whileTap={reduced ? undefined : { y: 1 }}
      aria-label={props.iconOnly ? label : undefined}
      title={props.iconOnly ? label : undefined}
    >
      <span className="vl-copy-icon" aria-hidden="true">
        {icon("idle", [
          <path
            key="a"
            d="M9.6 5.1V3.7A1.7 1.7 0 0 0 7.9 2H3.7A1.7 1.7 0 0 0 2 3.7v4.2a1.7 1.7 0 0 0 1.7 1.7h1.4"
          />,
          <rect key="b" x="5.1" y="5.1" width="6.9" height="6.9" rx="1.7" />,
        ])}
        {icon(
          "ok",
          <motion.path
            d="M2.9 7.4 5.6 10.1 11.1 4"
            initial={false}
            animate={{ pathLength: s === "ok" ? 1 : 0 }}
            transition={reduced ? NONE : DRAW}
          />,
        )}
        {icon("fail", [
          <path key="a" d="M3.6 3.6 10.4 10.4" />,
          <path key="b" d="M10.4 3.6 3.6 10.4" />,
        ])}
      </span>
      {props.iconOnly ? null : (
        <span className="vl-copy-labels" aria-hidden="true">
          {labels.map(function (l) {
            return (
              <motion.span
                key={l[0]}
                initial={false}
                animate={
                  l[0] === s ? { opacity: 1, y: 0 } : { opacity: 0, y: 3 }
                }
                transition={fade}
              >
                {l[1]}
              </motion.span>
            );
          })}
        </span>
      )}
      <span className="vl-sr" aria-live="polite">
        {s === "ok"
          ? "Copied to clipboard"
          : s === "fail"
            ? "Couldn't copy"
            : ""}
      </span>
    </motion.button>
  );
}
