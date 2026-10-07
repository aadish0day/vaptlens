import React from "react";
import { cx } from "@/ui/core";
import { CopyButton } from "@/ui/CopyButton";

/* ---------- KeyValueList (label/value pairs; optional copy, mono, columns) ---------- */
export function KeyValueList(props) {
  var items = (props.items || []).filter(function (x) {
    return x && ((x.value != null && x.value !== "") || props.showEmpty);
  });
  return (
    <dl
      className={cx(
        "vl-kv",
        props.columns > 1 && "is-cols-" + props.columns,
        props.className,
      )}
    >
      {items.map(function (it, i) {
        return (
          <div key={it.key || it.label || i} className="vl-kv-row">
            <dt>{it.label}</dt>
            <dd className={cx(it.mono && "is-mono")}>
              <span>
                {it.value == null || it.value === "" ? "—" : it.value}
              </span>
              {it.copy ? (
                <CopyButton
                  iconOnly
                  text={
                    typeof it.copy === "string" ? it.copy : String(it.value)
                  }
                  label={"Copy " + it.label}
                />
              ) : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
