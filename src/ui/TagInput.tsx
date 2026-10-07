import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- TagInput (tokens: Enter / comma / paste to add, Backspace to remove) ---------- */
export function TagInput(props) {
  var ctrl = props.value !== undefined;
  var st = useState(props.defaultValue || []);
  var tags = ctrl ? props.value : st[0];
  var txt = useState(""), err = useState("");
  var input = React.useRef(null);
  function set(n) { if (!ctrl) st[1](n); if (props.onChange) props.onChange(n); }
  function add(raw) {
    var parts = String(raw).split(/[,\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!parts.length) return;
    var next = tags.slice(), bad = [];
    parts.forEach(function (p) {
      if (props.validate && props.validate(p) !== true) { bad.push(p); return; }
      if (next.indexOf(p) < 0 && (!props.max || next.length < props.max)) next.push(p);
    });
    err[1](bad.length ? (typeof props.validate(bad[0]) === "string" ? props.validate(bad[0]) : "Not valid: " + bad.join(", ")) : "");
    set(next);
    txt[1]("");
  }
  return (
    <div className={cx("vl-field", props.className, err[0] && "is-invalid")}>
      {props.label ? <span className="vl-field-label">{props.label}</span> : null}
      <div className="vl-tags" onClick={function () { if (input.current) input.current.focus(); }}>
        {tags.map(function (t) {
          return (
            <span key={t} className="vl-tag">
              <span>{t}</span>
              <button type="button" aria-label={"Remove " + t} onClick={function (e) { e.stopPropagation(); set(tags.filter(function (x) { return x !== t; })); }}>
                <Icon name="x" size={12} />
              </button>
            </span>
          );
        })}
        <input
          ref={input}
          value={txt[0]}
          placeholder={tags.length ? "" : props.placeholder || "Type and press Enter"}
          aria-label={props.label || props.placeholder || "Add item"}
          disabled={props.disabled}
          onChange={function (e) { txt[1](e.target.value); }}
          onKeyDown={function (e) {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(txt[0]); }
            else if (e.key === "Backspace" && !txt[0] && tags.length) set(tags.slice(0, -1));
          }}
          onPaste={function (e) {
            var t = e.clipboardData.getData("text");
            if (/[,\n]/.test(t)) { e.preventDefault(); add(t); }
          }}
          onBlur={function () { if (txt[0].trim()) add(txt[0]); }}
        />
      </div>
      {err[0] ? <span className="vl-field-error" role="alert">{err[0]}</span> : props.hint ? <span className="vl-field-hint">{props.hint}</span> : null}
    </div>
  );
}
