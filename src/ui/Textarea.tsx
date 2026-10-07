import React from "react";
import { cx } from "@/ui/core";

/* ---------- Textarea (label, hint, error, character counter) ---------- */
export function Textarea(props) {
  var id = React.useRef(props.id || "vl-ta-" + Math.random().toString(36).slice(2, 8)).current;
  var len = String(props.value || "").length,
    over = props.maxLength && len > props.maxLength;
  var rest = {};
  for (var k in props) if (["label", "hint", "error", "className", "showCount"].indexOf(k) < 0) rest[k] = props[k];
  var desc = [props.hint ? id + "-h" : "", props.error ? id + "-e" : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("vl-field", props.className, props.error && "is-invalid")}>
      {props.label ? <label className="vl-field-label" htmlFor={id}>{props.label}{props.required ? <span aria-hidden="true"> *</span> : null}</label> : null}
      <textarea {...(rest as any)} id={id} className="vl-textarea" aria-invalid={props.error ? true : undefined} aria-describedby={desc} />
      <div className="vl-field-foot">
        {props.error ? <span id={id + "-e"} className="vl-field-error">{props.error}</span> : props.hint ? <span id={id + "-h"} className="vl-field-hint">{props.hint}</span> : <span />}
        {props.showCount || props.maxLength ? <span className={cx("vl-field-count", over && "is-over")}>{len}{props.maxLength ? " / " + props.maxLength : ""}</span> : null}
      </div>
    </div>
  );
}
