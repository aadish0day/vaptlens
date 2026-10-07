import { FieldMessage } from "@/ui/FieldMessage";
import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";
import { AnimatePresence, motion } from "motion/react";
import { LEAVE, NONE, POP, useReduced } from "@/ui/motion";

/* ---------- TagInput (ported from interior.dev tag-input: spring chips, armed delete, duplicate flash) ---------- */
export function TagInput(props) {
  var ctrl = props.value !== undefined;
  var st = useState(props.defaultValue || []);
  var tags = ctrl ? props.value : st[0];
  var txt = useState(""),
    err = useState("");
  var armed = useState(-1);
  var flashed = useState(null);
  var reduced = useReduced();
  var input = React.useRef(null);
  var flashTimer = React.useRef(null);

  function set(n) {
    if (!ctrl) st[1](n);
    if (props.onChange) props.onChange(n);
  }

  function add(raw) {
    var parts = String(raw)
      .split(/[,\n]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    if (!parts.length) return;
    var next = tags.slice(),
      bad = [],
      dup = null;
    parts.forEach(function (p) {
      if (props.validate && props.validate(p) !== true) {
        bad.push(p);
        return;
      }
      if (next.indexOf(p) >= 0) {
        dup = p;
        return;
      }
      if (!props.max || next.length < props.max) next.push(p);
    });
    if (dup && !bad.length) {
      flashed[1](dup);
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(function () {
        flashed[1](null);
      }, 500);
    }
    err[1](
      bad.length
        ? typeof props.validate(bad[0]) === "string"
          ? props.validate(bad[0])
          : "Not valid: " + bad.join(", ")
        : "",
    );
    armed[1](-1);
    set(next);
    txt[1]("");
  }

  return (
    <div className={cx("vl-field", props.className, err[0] && "is-invalid")}>
      {props.label ? (
        <span className="vl-field-label">{props.label}</span>
      ) : null}
      <div
        className="vl-tags"
        onClick={function () {
          if (input.current) input.current.focus();
        }}
      >
        <AnimatePresence initial={false}>
          {tags.map(function (t, i) {
            var isArmed = i === armed[0];
            var isFlashed = t === flashed[0];
            return (
              <motion.span
                key={t}
                layout
                className={cx(
                  "vl-tag",
                  isArmed && "is-armed",
                  isFlashed && "is-flashed",
                )}
                initial={reduced ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: isFlashed ? [1, 1.08, 1] : 1 }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.8, transition: LEAVE }
                }
                transition={reduced ? NONE : POP}
              >
                <span>{t}</span>
                <button
                  type="button"
                  aria-label={"Remove " + t}
                  onClick={function (e) {
                    e.stopPropagation();
                    armed[1](-1);
                    set(
                      tags.filter(function (x) {
                        return x !== t;
                      }),
                    );
                  }}
                >
                  <Icon name="x" size={12} />
                </button>
              </motion.span>
            );
          })}
        </AnimatePresence>
        <input
          ref={input}
          value={txt[0]}
          placeholder={
            tags.length ? "" : props.placeholder || "Type and press Enter"
          }
          aria-label={props.label || props.placeholder || "Add item"}
          disabled={props.disabled}
          onChange={function (e) {
            armed[1](-1);
            txt[1](e.target.value);
          }}
          onKeyDown={function (e) {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(txt[0]);
            } else if (e.key === "Backspace" && !txt[0] && tags.length) {
              if (armed[0] === tags.length - 1) {
                set(tags.slice(0, -1));
                armed[1](-1);
              } else {
                armed[1](tags.length - 1);
              }
            } else {
              armed[1](-1);
            }
          }}
          onPaste={function (e) {
            var t = e.clipboardData.getData("text");
            if (/[,\n]/.test(t)) {
              e.preventDefault();
              add(t);
            }
          }}
          onBlur={function () {
            armed[1](-1);
            if (txt[0].trim()) add(txt[0]);
          }}
        />
      </div>
      <FieldMessage error={err[0]} hint={props.hint} alert={true} />
    </div>
  );
}
