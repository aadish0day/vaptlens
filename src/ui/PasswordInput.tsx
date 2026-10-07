import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* rough entropy-style score 0–4: length, variety, no obvious patterns */
export function passwordStrength(p: string) {
  var s = String(p || ""), sc = 0;
  if (s.length >= 12) sc++;
  if (s.length >= 16) sc++;
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) sc++;
  if (/\d/.test(s) && /[^A-Za-z0-9]/.test(s)) sc++;
  if (/(.)\1{2,}|1234|abcd|password|qwerty/i.test(s)) sc = Math.max(0, sc - 2);
  return Math.min(4, sc);
}
/* ---------- PasswordInput (reveal toggle, Caps Lock warning, optional strength meter) ---------- */
export function PasswordInput(props) {
  var show = useState(false), caps = useState(false);
  var id = React.useRef(props.id || "vl-pw-" + Math.random().toString(36).slice(2, 8)).current;
  var sc = props.showStrength ? passwordStrength(props.value) : 0;
  var rest = {};
  for (var k in props) if (["label", "hint", "error", "showStrength", "className"].indexOf(k) < 0) rest[k] = props[k];
  function capsCheck(e) { if (e.getModifierState) caps[1](e.getModifierState("CapsLock")); }
  return (
    <div className={cx("vl-field", props.className, props.error && "is-invalid")}>
      {props.label ? <label className="vl-field-label" htmlFor={id}>{props.label}</label> : null}
      <div className="vl-pw">
        <input {...(rest as any)} id={id} type={show[0] ? "text" : "password"} autoComplete={props.autoComplete || "current-password"} spellCheck={false} onKeyUp={capsCheck} onKeyDown={capsCheck} aria-invalid={props.error ? true : undefined} />
        <button type="button" aria-label={show[0] ? "Hide password" : "Show password"} aria-pressed={show[0]} onClick={function () { show[1](!show[0]); }}>
          <Icon name={show[0] ? "eye-off" : "eye"} size={16} />
        </button>
      </div>
      {caps[0] ? <span className="vl-field-hint vl-pw-caps" role="status"><Icon name="alert-triangle" size={12} /> Caps Lock is on</span> : null}
      {props.showStrength && props.value ? (
        <div className={"vl-pw-meter is-s" + sc} aria-label={"Password strength: " + ["very weak", "weak", "fair", "good", "strong"][sc]}>
          {[0, 1, 2, 3].map(function (i) { return <i key={i} className={i < sc ? "is-on" : null} />; })}
          <span>{["Very weak", "Weak", "Fair", "Good", "Strong"][sc]}</span>
        </div>
      ) : null}
      {props.error ? <span className="vl-field-error">{props.error}</span> : props.hint ? <span className="vl-field-hint">{props.hint}</span> : null}
    </div>
  );
}
