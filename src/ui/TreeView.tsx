import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- TreeView (WAI-ARIA tree: ↑↓ move, → expand/enter, ← collapse/parent, Enter select) ---------- */
/* nodes: [{ id, label, icon?, meta?, children? }] — e.g. Business unit → Host → Port/service */
export function TreeView(props) {
  var ex = useState(props.defaultExpanded || []), focus = useState(null);
  var ref = React.useRef(null);
  var flat = [];
  (function walk(ns, depth, parent) {
    (ns || []).forEach(function (n) {
      flat.push({ n: n, depth: depth, parent: parent });
      if (n.children && n.children.length && ex[0].indexOf(n.id) >= 0) walk(n.children, depth + 1, n.id);
    });
  })(props.nodes, 0, null);
  var fid = focus[0] || (flat[0] && flat[0].n.id);
  function toggle(id) { ex[1](ex[0].indexOf(id) >= 0 ? ex[0].filter(function (x) { return x !== id; }) : ex[0].concat([id])); }
  function go(id) { focus[1](id); setTimeout(function () { var el = ref.current && ref.current.querySelector('[data-id="' + id + '"]'); if (el) el.focus(); }, 0); }
  function keys(e, i) {
    var it = flat[i], n = it.n, has = n.children && n.children.length, open = ex[0].indexOf(n.id) >= 0;
    if (e.key === "ArrowDown" && flat[i + 1]) { e.preventDefault(); go(flat[i + 1].n.id); }
    else if (e.key === "ArrowUp" && flat[i - 1]) { e.preventDefault(); go(flat[i - 1].n.id); }
    else if (e.key === "ArrowRight") { e.preventDefault(); if (has && !open) toggle(n.id); else if (has && flat[i + 1]) go(flat[i + 1].n.id); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); if (has && open) toggle(n.id); else if (it.parent) go(it.parent); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (props.onSelect) props.onSelect(n); else if (has) toggle(n.id); }
    else if (e.key === "Home") { e.preventDefault(); go(flat[0].n.id); } else if (e.key === "End") { e.preventDefault(); go(flat[flat.length - 1].n.id); }
  }
  return (
    <ul className="vl-tree" role="tree" aria-label={props.label} ref={ref}>
      {flat.map(function (it, i) {
        var n = it.n, has = n.children && n.children.length, open = ex[0].indexOf(n.id) >= 0;
        return (
          <li key={n.id} role="treeitem" data-id={n.id} aria-level={it.depth + 1} aria-expanded={has ? open : undefined} aria-selected={props.selected === n.id}
            tabIndex={n.id === fid ? 0 : -1} className={cx("vl-tree-item", props.selected === n.id && "is-on")} style={{ paddingLeft: "calc(var(--space-2) + " + it.depth * 18 + "px)" }}
            onKeyDown={function (e) { keys(e, i); }} onClick={function () { focus[1](n.id); if (has) toggle(n.id); if (props.onSelect) props.onSelect(n); }}>
            <span className="vl-tree-caret" aria-hidden="true">{has ? <Icon name={open ? "chevron-down" : "chevron-right"} size={12} /> : null}</span>
            {n.icon ? <Icon name={n.icon} size={14} /> : null}
            <span className="vl-tree-label">{n.label}</span>
            {n.meta != null ? <span className="vl-tree-meta">{n.meta}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
