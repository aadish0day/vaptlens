import React, { useState } from "react";
import { cx } from "@/ui/core";

/* ---------- Tabs ---------- */
export function Tabs(props) {
  var tabs = props.tabs || [];
  var st = useState(props.defaultValue || (tabs[0] && tabs[0].label));
  var val = props.value != null ? props.value : st[0];
  return (
    <div className="vl-tabs" role="tablist">
      {tabs.map(function (t) {
        var on = t.label === val;
        return (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={on}
            className={cx("vl-tab", on && "is-on")}
            onClick={function () {
              st[1](t.label);
              if (props.onChange) props.onChange(t.label);
            }}
          >
            {t.label}
            {t.count != null ? (
              <span className="vl-tab-count">{t.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- DropdownMenu ---------- */
