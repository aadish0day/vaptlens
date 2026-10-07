import { FieldMessage } from "@/ui/FieldMessage";
import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- NumberInput (stepper, min/max clamp, unit suffix, keyboard ↑/↓ and Shift ×10) ---------- */
export function NumberInput(props) {
  var ctrl = props.value !== undefined,
    st = useState(props.defaultValue == null ? "" : props.defaultValue);
  var v = ctrl ? props.value : st[0],
    step = props.step || 1,
    min = props.min,
    max = props.max;
  var id = React.useRef(
    "vl-num-" + Math.random().toString(36).slice(2, 8),
  ).current;
  function clamp(n) {
    if (min != null && n < min) n = min;
    if (max != null && n > max) n = max;
    return n;
  }
  function set(n) {
    if (!ctrl) st[1](n);
    if (props.onChange) props.onChange(n);
  }
  function bump(d) {
    var n = parseFloat(v);
    set(clamp((isNaN(n) ? (min != null ? min : 0) : n) + d));
  }
  var num = parseFloat(v),
    bad =
      v !== "" &&
      (isNaN(num) || (min != null && num < min) || (max != null && num > max));
  return (
    <div className={cx("vl-field", bad && "is-invalid")}>
      {props.label ? (
        <label className="vl-field-label" htmlFor={id}>
          {props.label}
        </label>
      ) : null}
      <div className="vl-num">
        <button
          type="button"
          aria-label={"Decrease " + (props.label || "")}
          disabled={props.disabled || (min != null && num <= min)}
          onClick={function () {
            bump(-step);
          }}
        >
          <Icon name="minus" size={14} />
        </button>
        <input
          id={id}
          inputMode="decimal"
          value={v}
          disabled={props.disabled}
          aria-invalid={bad || undefined}
          onChange={function (e) {
            var s = e.target.value;
            set(s === "" || s === "-" ? s : isNaN(+s) ? v : +s);
          }}
          onBlur={function () {
            if (v !== "" && !isNaN(parseFloat(v))) set(clamp(parseFloat(v)));
          }}
          onKeyDown={function (e) {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              bump(
                (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1),
              );
            }
          }}
        />
        {props.unit ? <span className="vl-num-unit">{props.unit}</span> : null}
        <button
          type="button"
          aria-label={"Increase " + (props.label || "")}
          disabled={props.disabled || (max != null && num >= max)}
          onClick={function () {
            bump(step);
          }}
        >
          <Icon name="plus" size={14} />
        </button>
      </div>
      <FieldMessage
        error={
          bad
            ? "Enter a number" +
              (min != null ? " from " + min : "") +
              (max != null ? " to " + max : "")
            : null
        }
        hint={props.hint}
      />
    </div>
  );
}
