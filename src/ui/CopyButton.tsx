import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- CopyButton (clipboard with select-text fallback, live confirmation) ---------- */
export function CopyButton(props) {
  var st = useState("idle");
  function done(s) { st[1](s); setTimeout(function () { st[1]("idle"); }, 1600); }
  function fallback(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand("copy"); ta.remove();
      done(ok ? "ok" : "fail");
    } catch (e) { done("fail"); }
  }
  function copy() {
    var text = typeof props.text === "function" ? props.text() : String(props.text || "");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done("ok"); }, function () { fallback(text); });
    else fallback(text);
    if (props.onCopy) props.onCopy(text);
  }
  var label = st[0] === "ok" ? "Copied" : st[0] === "fail" ? "Couldn't copy" : props.label || "Copy";
  return (
    <button type="button" className={cx("vl-btn vl-btn-secondary vl-btn-sm vl-copy", st[0] === "ok" && "is-ok", props.className)} onClick={copy} aria-label={props.iconOnly ? label : undefined} title={props.iconOnly ? label : undefined}>
      <Icon name={st[0] === "ok" ? "check" : "file"} size={14} />
      {props.iconOnly ? null : <span>{label}</span>}
      <span className="vl-sr" aria-live="polite">{st[0] === "ok" ? "Copied to clipboard" : ""}</span>
    </button>
  );
}
