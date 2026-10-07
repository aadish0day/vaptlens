import React, { useState } from "react";
import { cx } from "@/ui/core";

/* ---------- CodeSnippet ---------- */
export function CodeSnippet(props) {
  var tabs = props.tabs || [];
  var st = useState(0);
  var cur = tabs[st[0]] || {
    code: "",
  };
  return (
    <div className="vl-code">
      <div className="vl-code-head">
        {props.title ? (
          <span className="vl-code-title">{props.title}</span>
        ) : null}
        <div className="vl-code-tabs" role="tablist">
          {tabs.map(function (t, i) {
            return (
              <button
                key={t.label}
                type="button"
                role="tab"
                aria-selected={i === st[0]}
                className={cx("vl-code-tab", i === st[0] && "is-active")}
                onClick={function () {
                  st[1](i);
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <pre className="vl-code-pre">
        <code>{cur.code}</code>
      </pre>
    </div>
  );
}

/* ================= v2 additions ================= */
