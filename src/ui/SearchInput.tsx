import React, { useEffect, useState } from "react";
import { Icon } from "@/ui/Icon";
import { Kbd } from "@/ui/Kbd";
import { cx } from "@/ui/core";
import { AnimatePresence, motion } from "motion/react";
import { FAST, LEAVE, NONE, POP, useReduced } from "@/ui/motion";

/* ---------- SearchInput (ported from interior.dev expanding-search: debounced, spring clear pop, "/" shortcut) ---------- */
export function SearchInput(props) {
  var ctrl = props.value !== undefined,
    st = useState(props.defaultValue || "");
  var v = ctrl ? props.value : st[0],
    ref = React.useRef(null),
    t = React.useRef(null);
  var reduced = useReduced();
  function set(n) {
    if (!ctrl) st[1](n);
    if (props.onChange) props.onChange(n);
    clearTimeout(t.current);
    t.current = setTimeout(
      function () {
        if (props.onSearch) props.onSearch(n);
      },
      props.debounce == null ? 200 : props.debounce,
    );
  }
  useEffect(function () {
    return function () {
      clearTimeout(t.current);
    };
  }, []);
  useEffect(
    function () {
      if (!props.shortcut) return;
      function onKey(e) {
        var tg = e.target,
          typing =
            tg &&
            (tg.tagName === "INPUT" ||
              tg.tagName === "TEXTAREA" ||
              tg.isContentEditable);
        if (
          e.key === (props.shortcut === true ? "/" : props.shortcut) &&
          !typing &&
          !e.metaKey &&
          !e.ctrlKey
        ) {
          e.preventDefault();
          if (ref.current) ref.current.focus();
        }
      }
      document.addEventListener("keydown", onKey);
      return function () {
        document.removeEventListener("keydown", onKey);
      };
    },
    [props.shortcut],
  );
  return (
    <div className={cx("vl-search", props.className)} role="search">
      <Icon name="search" size={14} />
      <input
        ref={ref}
        type="search"
        value={v}
        placeholder={props.placeholder || "Search"}
        aria-label={props.label || props.placeholder || "Search"}
        onChange={function (e) {
          set(e.target.value);
        }}
        onKeyDown={function (e) {
          if (e.key === "Escape" && v) {
            e.stopPropagation();
            set("");
          }
          if (e.key === "Enter" && props.onSearch) {
            clearTimeout(t.current);
            props.onSearch(v);
          }
        }}
      />
      {props.loading ? (
        <span className="vl-search-busy" aria-label="Searching" />
      ) : null}
      <AnimatePresence initial={false}>
        {v ? (
          <motion.button
            key="clr"
            type="button"
            className="vl-search-clear"
            aria-label="Clear search"
            initial={reduced ? false : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.7, transition: LEAVE }
            }
            transition={reduced ? NONE : POP}
            onClick={function () {
              set("");
              if (ref.current) ref.current.focus();
            }}
          >
            <Icon name="x" size={12} />
          </motion.button>
        ) : props.shortcut ? (
          <motion.span
            key="kbd"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, transition: { duration: FAST } }
            }
          >
            <Kbd keys={[props.shortcut === true ? "/" : props.shortcut]} />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
