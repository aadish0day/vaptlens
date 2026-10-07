import { FieldMessage } from "@/ui/FieldMessage";
import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- InlineEdit (click / Enter to edit; Enter saves, Esc cancels; async save with error) ---------- */
export function InlineEdit(props) {
  var ed = useState(false),
    draft = useState(props.value || ""),
    busy = useState(false),
    err = useState("");
  var input = React.useRef(null);
  function start() {
    if (props.readOnly) return;
    draft[1](props.value || "");
    err[1]("");
    ed[1](true);
    setTimeout(function () {
      if (input.current) {
        input.current.focus();
        input.current.select();
      }
    }, 0);
  }
  function save() {
    var v = draft[0].trim();
    if (props.required && !v) return err[1]("Can't be empty");
    if (props.validate) {
      var r = props.validate(v);
      if (r !== true) return err[1](r || "Not valid");
    }
    if (v === (props.value || "")) return ed[1](false);
    var p = props.onSave ? props.onSave(v) : null;
    if (p && p.then) {
      busy[1](true);
      p.then(
        function () {
          busy[1](false);
          ed[1](false);
        },
        function (e) {
          busy[1](false);
          err[1]((e && e.message) || "Couldn't save");
        },
      );
    } else ed[1](false);
  }
  if (!ed[0])
    return (
      <button
        type="button"
        className={cx(
          "vl-iedit",
          props.readOnly && "is-ro",
          !props.value && "is-empty",
        )}
        onClick={start}
        aria-label={(props.label || "Edit") + ": " + (props.value || "empty")}
        disabled={props.readOnly}
      >
        <span>{props.value || props.placeholder || "Add…"}</span>
        {props.readOnly ? null : <Icon name="edit" size={12} />}
      </button>
    );
  return (
    <span className={cx("vl-iedit-form", err[0] && "is-invalid")}>
      <input
        ref={input}
        value={draft[0]}
        aria-label={props.label}
        disabled={busy[0]}
        aria-invalid={err[0] ? true : undefined}
        onChange={function (e) {
          draft[1](e.target.value);
          err[1]("");
        }}
        onKeyDown={function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          } else if (e.key === "Escape") {
            e.stopPropagation();
            ed[1](false);
          }
        }}
        onBlur={function () {
          if (!busy[0]) save();
        }}
      />
      <FieldMessage error={err[0]} alert={true} />
    </span>
  );
}
