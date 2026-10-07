import React, { useEffect, useState } from "react";

export function cx(...args: any[]) {
  var out = [];
  for (var i = 0; i < arguments.length; i++)
    if (arguments[i]) out.push(arguments[i]);
  return out.join(" ");
}

/* Lucide icon geometry (ISC), 24px grid, stroke 2 */

/* ---------- SeverityBadge ---------- */
export var SEV_LABEL = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export var SEV_ORDER = ["critical", "high", "medium", "low", "info"];

export var SEV_SHAPE = {
  critical: "◆",
  high: "▲",
  medium: "●",
  low: "▼",
  info: "○",
};

/* ---------- SeverityMarker ---------- */

/* ---------- Modal ---------- */
/* controlled-or-internal chart selection: pass selected + onSelect(labelOrNull) to cross-filter */
/* Enter / Space activate an SVG mark the way a click does */
export function kbd(fn) {
  return function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };
}

export function useSel(props) {
  var st = useState(props.selected || null);
  if (props.static) return [null, function () {}];
  var cur = props.onSelect
    ? props.selected == null
      ? null
      : props.selected
    : st[0];
  return [
    cur,
    function (v) {
      var n = cur === v ? null : v;
      if (props.onSelect) props.onSelect(n);
      else st[1](n);
    },
  ];
}
/* dialog behaviour: Esc closes, focus moves in and is trapped, returns on close */
/* one stack for every open dialog, drawer and menu: Escape and focus trapping belong to the top layer only */

/* dialog behaviour: Esc closes, focus moves in and is trapped, returns on close */
/* one stack for every open dialog, drawer and menu: Escape and focus trapping belong to the top layer only */
export var LAYERS = [];

export function isTopLayer(t) {
  return LAYERS[LAYERS.length - 1] === t;
}

export function useLayer(open, onClose, wrapRef) {
  var cb = React.useRef(onClose);
  cb.current = onClose;
  useEffect(
    function () {
      if (!open) return;
      var token = {};
      LAYERS.push(token);
      function onKey(e) {
        if (e.key === "Escape" && isTopLayer(token)) {
          e.stopPropagation();
          e.preventDefault();
          cb.current("escape");
        }
      }
      function onDown(e) {
        if (wrapRef && wrapRef.current && !wrapRef.current.contains(e.target))
          cb.current("outside");
      }
      document.addEventListener("keydown", onKey, true);
      document.addEventListener("mousedown", onDown, true);
      return function () {
        var i = LAYERS.indexOf(token);
        if (i >= 0) LAYERS.splice(i, 1);
        document.removeEventListener("keydown", onKey, true);
        document.removeEventListener("mousedown", onDown, true);
      };
    },
    [open],
  );
}

export function useDialog(onClose) {
  var ref = React.useRef(null);
  var cb = React.useRef(onClose);
  cb.current = onClose;
  useEffect(function () {
    var prev: any = document.activeElement,
      el = ref.current,
      token = {};
    LAYERS.push(token);
    function focusables() {
      return el
        ? Array.prototype.filter.call(
            el.querySelectorAll(
              'button:not([disabled]),[href],input:not([disabled]):not([type="hidden"]),select,textarea,[tabindex]:not([tabindex="-1"])',
            ),
            function (x) {
              return x.offsetParent !== null;
            },
          )
        : [];
    }
    var f = focusables();
    if (el && !el.contains(document.activeElement))
      (f[1] || f[0] || el).focus();
    function onKey(e) {
      if (!isTopLayer(token)) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        /* first Esc leaves a field you're typing in (nothing is lost); the next one closes */
        var ae: any = document.activeElement;
        if (
          ae &&
          el &&
          el.contains(ae) &&
          (ae.tagName === "TEXTAREA" ||
            (ae.tagName === "INPUT" &&
              /^(text|search|email|url|)$/.test(ae.type || ""))) &&
          ae.value &&
          !ae.hasAttribute("data-esc-closes")
        ) {
          ae.blur();
          try {
            el.focus();
          } catch (er) {}
          return;
        }
        if (cb.current) cb.current();
        return;
      }
      if (e.key !== "Tab") return;
      var list = focusables();
      if (!list.length) return;
      var first = list[0],
        last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return function () {
      var i = LAYERS.indexOf(token);
      if (i >= 0) LAYERS.splice(i, 1);
      document.removeEventListener("keydown", onKey, true);
      if (prev && prev.focus)
        try {
          prev.focus();
        } catch (e) {}
    };
  }, []);
  return ref;
}
/* arrow-key roving focus inside a menu or listbox */

/* arrow-key roving focus inside a menu or listbox */
export function menuKeys(e, sel) {
  var items = Array.prototype.slice.call(e.currentTarget.querySelectorAll(sel));
  if (!items.length) return;
  var i = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown") {
    e.preventDefault();
    items[(i + 1) % items.length].focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    items[(i - 1 + items.length) % items.length].focus();
  } else if (e.key === "Home") {
    e.preventDefault();
    items[0].focus();
  } else if (e.key === "End") {
    e.preventDefault();
    items[items.length - 1].focus();
  }
}

/* ---------- TeamPicker ---------- */
export var TEAMS = [
  "Server Team",
  "DevOps / Cloud",
  "Database DBAs",
  "SecOps",
  "Application Dev",
];

export var RACI = [
  ["R", "Responsible"],
  ["A", "Accountable"],
  ["C", "Consulted"],
  ["I", "Informed"],
];

/* ================= v3b: remaining spec engines ================= */
export function chartFrame(W, H, padL, padB, padT, max, ticks) {
  return ticks.map(function (t) {
    var y = padT + (H - padB - padT) * (1 - t);
    return (
      <g key={"g" + t}>
        <line className="vl-grid" x1={padL} x2={W} y1={y} y2={y} />
        <text className="vl-axis" x={padL - 6} y={y + 4} textAnchor="end">
          {Math.round(max * t)}
        </text>
      </g>
    );
  });
}

export function seriesColor(s, i) {
  return s.severity
    ? "var(--sev-" + s.severity + ")"
    : s.color || "var(--chart-" + ((i % 6) + 1) + ")";
}

/* ---------- LineChart (line + area) ---------- */

/* ---------- Treemap (squarified, 1 level) ---------- */
export function fit(t, px) {
  var n = Math.floor(px / 6.6);
  return t.length <= n ? t : t.slice(0, Math.max(1, n - 1)) + "…";
}
