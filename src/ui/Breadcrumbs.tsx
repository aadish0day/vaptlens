import React from "react";
import { Icon } from "@/ui/Icon";

/* ---------- Breadcrumbs ---------- */
/* items: [{ label, onClick? }]; the last item is the current page */
export function Breadcrumbs(props) {
  var items = props.items || [];
  return (
    <nav className="vl-crumbs" aria-label={props.label || "Breadcrumb"}>
      <ol>
        {items.map(function (it, i) {
          var last = i === items.length - 1;
          return (
            <li key={i}>
              {last || !it.onClick ? (
                <span aria-current={last ? "page" : undefined} className={last ? "is-current" : null}>
                  {it.label}
                </span>
              ) : (
                <button type="button" className="vl-crumb-link" onClick={it.onClick}>
                  {it.label}
                </button>
              )}
              {last ? null : <Icon name="chevron-right" size={12} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
