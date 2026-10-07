import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- Button (with RestrictedButton behaviour) ---------- */
export function Button(props) {
  var variant = props.variant || "secondary";
  var size = props.size || "md";
  var restricted = !!props.restricted;
  var rest = {};
  for (var k in props)
    if (
      [
        "variant",
        "size",
        "restricted",
        "restrictedReason",
        "icon",
        "className",
        "children",
        "onClick",
      ].indexOf(k) < 0
    )
      rest[k] = props[k];
  var btn = (
    <button
      {...(Object.assign(
        {
          type: "button",
        },
        rest,
        {
          className: cx(
            "vl-btn",
            "vl-btn-" + variant,
            "vl-btn-" + size,
            restricted && "is-restricted",
            props.className,
          ),
          "aria-disabled": restricted ? "true" : undefined,
          onClick: function (e) {
            if (restricted) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            if (props.onClick) props.onClick(e);
          },
        },
      ) as any)}
    >
      {restricted ? (
        <Icon name="lock" size={14} />
      ) : props.icon ? (
        <Icon name={props.icon} size={14} />
      ) : null}
      {props.children}
    </button>
  );
  if (!restricted) return btn;
  return (
    <span className="vl-tip-wrap">
      {btn}
      <span className="vl-tip" role="tooltip">
        {props.restrictedReason || "Your role can't perform this action."}
      </span>
    </span>
  );
}

/* ---------- SeverityBadge ---------- */
