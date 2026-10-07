import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- IconButton (label is required: it becomes aria-label and the tooltip) ---------- */
export function IconButton(props) {
  var rest = {};
  for (var k in props) if (["icon", "label", "size", "variant", "className", "pressed", "badge"].indexOf(k) < 0) rest[k] = props[k];
  return (
    <button
      type="button"
      {...(rest as any)}
      aria-label={props.label}
      title={props.label}
      aria-pressed={props.pressed === undefined ? undefined : !!props.pressed}
      className={cx("vl-ibtn", "is-" + (props.size || "md"), "is-" + (props.variant || "ghost"), props.pressed && "is-pressed", props.className)}
    >
      <Icon name={props.icon} size={props.size === "sm" ? 14 : props.size === "lg" ? 18 : 16} />
      {props.badge ? <span className="vl-ibtn-badge" aria-hidden="true">{props.badge > 99 ? "99+" : props.badge}</span> : null}
    </button>
  );
}
