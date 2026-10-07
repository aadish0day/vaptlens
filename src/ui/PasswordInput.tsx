import { FieldMessage } from "@/ui/FieldMessage";
import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";
import { motion } from "motion/react";
import { BASE, EASE_OUT, NONE, useReduced } from "@/ui/motion";

/* rough entropy-style score 0–4: length, variety, no obvious patterns */
export function passwordStrength(p: string) {
  var s = String(p || ""),
    sc = 0;
  if (s.length >= 12) sc++;
  if (s.length >= 16) sc++;
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) sc++;
  if (/\d/.test(s) && /[^A-Za-z0-9]/.test(s)) sc++;
  if (/(.)\1{2,}|1234|abcd|password|qwerty/i.test(s)) sc = Math.max(0, sc - 2);
  return Math.min(4, sc);
}
/* ---------- PasswordInput (reveal toggle, Caps Lock warning, optional strength meter) ---------- */
export function PasswordInput(props) {
  var show = useState(false),
    caps = useState(false);
  var reduced = useReduced();
  var id = React.useRef(
    props.id || "vl-pw-" + Math.random().toString(36).slice(2, 8),
  ).current;
  var sc = props.showStrength ? passwordStrength(props.value) : 0;
  var rest = {};
  for (var k in props)
    if (["label", "hint", "error", "showStrength", "className"].indexOf(k) < 0)
      rest[k] = props[k];
  function capsCheck(e) {
    if (e.getModifierState) caps[1](e.getModifierState("CapsLock"));
  }
  return (
    <div
      className={cx("vl-field", props.className, props.error && "is-invalid")}
    >
      {props.label ? (
        <label className="vl-field-label" htmlFor={id}>
          {props.label}
        </label>
      ) : null}
      <div className="vl-pw">
        <input
          {...(rest as any)}
          id={id}
          type={show[0] ? "text" : "password"}
          autoComplete={props.autoComplete || "current-password"}
          spellCheck={false}
          onKeyUp={capsCheck}
          onKeyDown={capsCheck}
          aria-invalid={props.error ? true : undefined}
        />
        <button
          type="button"
          aria-label={show[0] ? "Hide password" : "Show password"}
          aria-pressed={show[0]}
          onClick={function () {
            show[1](!show[0]);
          }}
        >
          <Icon name={show[0] ? "eye-off" : "eye"} size={16} />
        </button>
      </div>
      {caps[0] ? (
        <span className="vl-field-hint vl-pw-caps" role="status">
          <Icon name="alert-triangle" size={12} /> Caps Lock is on
        </span>
      ) : null}
      {props.showStrength && props.value ? (
        <div
          className={"vl-pw-meter is-s" + sc}
          role="img"
          aria-label={
            "Password strength: " +
            ["very weak", "weak", "fair", "good", "strong"][sc]
          }
        >
          {/* ported from interior.dev password-strength: segments fill in sequence, labels share one cell */}
          {[0, 1, 2, 3].map(function (i) {
            return (
              <i key={i}>
                <motion.b
                  initial={false}
                  animate={{ scaleX: i < sc ? 1 : 0 }}
                  transition={
                    reduced
                      ? NONE
                      : {
                          type: "spring",
                          stiffness: 520,
                          damping: 34,
                          mass: 0.45,
                          delay: i < sc ? i * 0.03 : 0,
                        }
                  }
                />
              </i>
            );
          })}
          <span className="vl-pw-labels" aria-hidden="true">
            {["Very weak", "Weak", "Fair", "Good", "Strong"].map(
              function (t, i) {
                return (
                  <motion.span
                    key={t}
                    initial={false}
                    animate={{ opacity: i === sc ? 1 : 0 }}
                    transition={
                      reduced ? NONE : { duration: BASE, ease: EASE_OUT }
                    }
                  >
                    {t}
                  </motion.span>
                );
              },
            )}
          </span>
        </div>
      ) : null}
      <FieldMessage error={props.error} hint={props.hint} />
    </div>
  );
}
