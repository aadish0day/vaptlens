import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- Input ---------- */
export function Input(props) {
  var rest = {};
  for (var k in props)
    if (k !== "icon" && k !== "className") rest[k] = props[k];
  return (
    <span className={cx("vl-input", props.className)}>
      {props.icon !== false ? (
        <Icon name={props.icon || "search"} size={14} />
      ) : null}
      <input
        {...Object.assign(
          {
            type: "text",
          },
          rest,
        )}
      />
    </span>
  );
}

/* ---------- MultiSelect ---------- */
