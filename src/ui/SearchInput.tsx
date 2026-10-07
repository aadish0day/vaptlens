import React, { useEffect, useState } from "react";
import { Icon } from "@/ui/Icon";
import { Kbd } from "@/ui/Kbd";
import { cx } from "@/ui/core";

/* ---------- SearchInput (debounced onSearch, clear button, optional "/" focus shortcut) ---------- */
export function SearchInput(props) {
  var ctrl = props.value !== undefined, st = useState(props.defaultValue || "");
  var v = ctrl ? props.value : st[0], ref = React.useRef(null), t = React.useRef(null);
  function set(n) {
    if (!ctrl) st[1](n);
    if (props.onChange) props.onChange(n);
    clearTimeout(t.current);
    t.current = setTimeout(function () { if (props.onSearch) props.onSearch(n); }, props.debounce == null ? 200 : props.debounce);
  }
  useEffect(function () { return function () { clearTimeout(t.current); }; }, []);
  useEffect(function () {
    if (!props.shortcut) return;
    function onKey(e) {
      var tg = e.target, typing = tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.isContentEditable);
      if (e.key === (props.shortcut === true ? "/" : props.shortcut) && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); if (ref.current) ref.current.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return function () { document.removeEventListener("keydown", onKey); };
  }, [props.shortcut]);
  return (
    <div className={cx("vl-search", props.className)} role="search">
      <Icon name="search" size={14} />
      <input ref={ref} type="search" value={v} placeholder={props.placeholder || "Search"} aria-label={props.label || props.placeholder || "Search"} onChange={function (e) { set(e.target.value); }} onKeyDown={function (e) { if (e.key === "Escape" && v) { e.stopPropagation(); set(""); } if (e.key === "Enter" && props.onSearch) { clearTimeout(t.current); props.onSearch(v); } }} />
      {props.loading ? <span className="vl-search-busy" aria-label="Searching" /> : null}
      {v ? (
        <button type="button" className="vl-search-clear" aria-label="Clear search" onClick={function () { set(""); if (ref.current) ref.current.focus(); }}><Icon name="x" size={12} /></button>
      ) : props.shortcut ? <Kbd keys={[props.shortcut === true ? "/" : props.shortcut]} /> : null}
    </div>
  );
}
