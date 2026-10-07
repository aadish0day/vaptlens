import React from "react";

/* ---------- Kbd (keyboard shortcut chips; "mod" becomes ⌘ on Mac, Ctrl elsewhere) ---------- */
export function Kbd(props) {
  var mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");
  var keys = (props.keys || String(props.children || "").split("+")).map(function (k) {
    var s = String(k).trim();
    return s.toLowerCase() === "mod" ? (mac ? "⌘" : "Ctrl") : s.toLowerCase() === "shift" ? (mac ? "⇧" : "Shift") : s.toLowerCase() === "alt" ? (mac ? "⌥" : "Alt") : s;
  });
  return (
    <span className="vl-kbds">
      {keys.map(function (k, i) { return <kbd key={i} className="vl-kbd">{k}</kbd>; })}
    </span>
  );
}
