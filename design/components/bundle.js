/* @ds-bundle: {"format":4,"namespace":"VAPTLens","components":[{"name":"Logo"},{"name":"Button"},{"name":"SeverityBadge"},{"name":"ThreatTag"},{"name":"SlaPill"},{"name":"FilterChip"},{"name":"KpiCard"},{"name":"WidgetCard"},{"name":"NavTabs"},{"name":"RiskMeter"},{"name":"KanbanCard"},{"name":"CodeSnippet"},{"name":"SeverityMarker"},{"name":"Tooltip"},{"name":"Checkbox"},{"name":"Toggle"},{"name":"SegmentedControl"},{"name":"Input"},{"name":"MultiSelect"},{"name":"Modal"},{"name":"Drawer"},{"name":"VulnTable"},{"name":"PipelineStepper"},{"name":"DiffBadge"},{"name":"QuadrantTile"},{"name":"AuditLogRow"},{"name":"EmptyState"},{"name":"Skeleton"},{"name":"Toast"},{"name":"BarChart"},{"name":"DonutChart"},{"name":"Heatmap"},{"name":"ReportHeader"},{"name":"FileDropzone"},{"name":"ScannerBadge"},{"name":"ColumnMapRow"},{"name":"Tabs"},{"name":"DropdownMenu"},{"name":"Banner"},{"name":"RoleSwitcher"},{"name":"TeamPicker"},{"name":"RaciMatrix"},{"name":"Sparkline"},{"name":"SlaTrend"},{"name":"EffortMeter"},{"name":"TierBadge"},{"name":"AssetRow"},{"name":"BreachList"},{"name":"ExposureBars"},{"name":"RiskDelta"},{"name":"TopologyMap"},{"name":"TemplateCard"},{"name":"LineChart"},{"name":"StackedBarChart"},{"name":"RadarChart"},{"name":"Treemap"},{"name":"ScatterChart"},{"name":"SlaBreachCard"},{"name":"SlaProjectionTable"},{"name":"ExposureRegistry"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++)
      if (arguments[i]) out.push(arguments[i]);
    return out.join(" ");
  }

  /* Lucide icon geometry (ISC), 24px grid, stroke 2 */
  var ICONS = {
    x: [
      ["path", { d: "M18 6 6 18" }],
      ["path", { d: "m6 6 12 12" }],
    ],
    "chevron-left": [["path", { d: "m15 18-6-6 6-6" }]],
    "chevron-right": [["path", { d: "m9 18 6-6-6-6" }]],
    grip: [
      ["circle", { cx: 9, cy: 12, r: 1 }],
      ["circle", { cx: 9, cy: 5, r: 1 }],
      ["circle", { cx: 9, cy: 19, r: 1 }],
      ["circle", { cx: 15, cy: 12, r: 1 }],
      ["circle", { cx: 15, cy: 5, r: 1 }],
      ["circle", { cx: 15, cy: 19, r: 1 }],
    ],
    lock: [
      ["rect", { width: 18, height: 11, x: 3, y: 11, rx: 2 }],
      ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }],
    ],
    flame: [
      [
        "path",
        {
          d: "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",
        },
      ],
    ],
    skull: [
      ["path", { d: "m12.5 17-.5-1-.5 1h1z" }],
      [
        "path",
        {
          d: "M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z",
        },
      ],
      ["circle", { cx: 15, cy: 12, r: 1 }],
      ["circle", { cx: 9, cy: 12, r: 1 }],
    ],
    zap: [
      [
        "path",
        {
          d: "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z",
        },
      ],
    ],
    clock: [
      ["path", { d: "M12 6v6l4 2" }],
      ["path", { d: "M20 12v5" }],
      ["path", { d: "M20 21h.01" }],
      ["path", { d: "M21.25 8.2A10 10 0 1 0 16 21.16" }],
    ],
    shield: [
      [
        "path",
        {
          d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        },
      ],
      ["path", { d: "M12 8v4" }],
      ["path", { d: "M12 16h.01" }],
    ],
    ticket: [
      [
        "path",
        {
          d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",
        },
      ],
      ["path", { d: "M13 5v2" }],
      ["path", { d: "M13 17v2" }],
      ["path", { d: "M13 11v2" }],
    ],
    check: [["path", { d: "M20 6 9 17l-5-5" }]],
  };

  function Icon(props) {
    var size = props.size || 16;
    var parts = ICONS[props.name] || [];
    return h(
      "svg",
      {
        className: cx("vl-icon", props.className),
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: props.strokeWidth || 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
      },
      parts.map(function (p, i) {
        return h(p[0], Object.assign({ key: i }, p[1]));
      }),
    );
  }

  /* ---------- Logo ---------- */
  function Logo(props) {
    var size = props.size || 24;
    var mark = h(
      "svg",
      {
        className: "vl-logo-mark",
        width: size,
        height: size,
        viewBox: "0 0 32 32",
        fill: "none",
        "aria-hidden": props.wordmark === false ? undefined : "true",
        role: props.wordmark === false ? "img" : undefined,
        "aria-label": props.wordmark === false ? "VAPTLens" : undefined,
      },
      h("circle", {
        cx: 16,
        cy: 16,
        r: 10.5,
        stroke: "currentColor",
        strokeWidth: 2.5,
      }),
      h("circle", { cx: 16, cy: 16, r: 4, fill: "currentColor" }),
      h("path", {
        d: "M16 2v4.5M16 25.5V30M2 16h4.5M25.5 16H30",
        stroke: "currentColor",
        strokeWidth: 2.5,
        strokeLinecap: "round",
      }),
    );
    if (props.wordmark === false)
      return h("span", { className: "vl-logo" }, mark);
    return h(
      "span",
      {
        className: "vl-logo",
        style: { fontSize: Math.round(size * 0.75) + "px" },
      },
      mark,
      h(
        "span",
        { className: "vl-logo-word" },
        "VAPT",
        h("span", { className: "vl-logo-lens" }, "Lens"),
      ),
    );
  }

  /* ---------- Button (with RestrictedButton behaviour) ---------- */
  function Button(props) {
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
    var btn = h(
      "button",
      Object.assign({ type: "button" }, rest, {
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
      }),
      restricted
        ? h(Icon, { name: "lock", size: 14 })
        : props.icon
          ? h(Icon, { name: props.icon, size: 14 })
          : null,
      props.children,
    );
    if (!restricted) return btn;
    return h(
      "span",
      { className: "vl-tip-wrap" },
      btn,
      h(
        "span",
        { className: "vl-tip", role: "tooltip" },
        props.restrictedReason || "Your role can't perform this action.",
      ),
    );
  }

  /* ---------- SeverityBadge ---------- */
  var SEV_LABEL = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    info: "Info",
  };
  function SeverityBadge(props) {
    var s = (props.severity || "info").toLowerCase();
    return h(
      "span",
      { className: cx("vl-sev", "vl-sev-" + s, props.solid && "is-solid") },
      h(SeverityMarker, { severity: s, size: 8 }),
      SEV_LABEL[s] || s,
      props.count != null
        ? h("span", { className: "vl-sev-count" }, props.count)
        : null,
    );
  }

  /* ---------- ThreatTag ---------- */
  var THREAT = {
    kev: { label: "CISA KEV", icon: "flame" },
    zeroday: { label: "Zero-day", icon: "zap" },
    ransomware: { label: "Ransomware", icon: "skull" },
    exploitable: { label: "Exploitable", icon: "shield" },
    eol: { label: "EOL", icon: "clock" },
    breached: { label: "SLA Breached", icon: "clock" },
  };
  function ThreatTag(props) {
    var t = THREAT[props.kind] || THREAT.exploitable;
    return h(
      "span",
      { className: cx("vl-threat", "vl-threat-" + props.kind) },
      h(Icon, { name: t.icon, size: 12, strokeWidth: 2.25 }),
      props.label || t.label,
    );
  }

  /* ---------- SlaPill ---------- */
  function SlaPill(props) {
    var st = props.status || "met";
    var d = props.days;
    var text =
      st === "met"
        ? "Met"
        : st === "at-risk"
          ? d != null
            ? d + "d left"
            : "At risk"
          : d != null
            ? "Breached +" + d + "d"
            : "Breached";
    return h(
      "span",
      { className: cx("vl-sla", "vl-sla-" + st) },
      h(Icon, {
        name: st === "met" ? "check" : "clock",
        size: 12,
        strokeWidth: 2.5,
      }),
      text,
    );
  }

  /* ---------- FilterChip ---------- */
  function FilterChip(props) {
    return h(
      "span",
      {
        className: cx(
          "vl-chip",
          props.severity && "vl-chip-sev vl-sevline-" + props.severity,
        ),
      },
      props.field
        ? h("span", { className: "vl-chip-field" }, props.field)
        : null,
      h("span", { className: "vl-chip-value" }, props.value),
      h(
        "button",
        {
          type: "button",
          className: "vl-chip-x",
          "aria-label":
            "Remove filter " +
            (props.field ? props.field + ": " : "") +
            props.value,
          onClick: props.onRemove,
        },
        h(Icon, { name: "x", size: 12, strokeWidth: 2.5 }),
      ),
    );
  }

  /* ---------- KpiCard ---------- */
  function KpiCard(props) {
    return h(
      props.onClick ? "button" : "div",
      {
        type: props.onClick ? "button" : undefined,
        className: cx(
          "vl-kpi",
          props.active && "is-active",
          props.tone && "vl-kpi-" + props.tone,
        ),
        onClick: props.onClick,
        "aria-pressed": props.onClick ? !!props.active : undefined,
      },
      h(
        "div",
        { className: "vl-kpi-head" },
        h("span", { className: "vl-label" }, props.label),
        props.icon ? h(Icon, { name: props.icon, size: 16 }) : null,
      ),
      h("div", { className: "vl-kpi-value" }, props.value),
      props.sub ? h("div", { className: "vl-kpi-sub" }, props.sub) : null,
    );
  }

  /* ---------- WidgetCard ---------- */
  function WidgetCard(props) {
    return h(
      "section",
      { className: cx("vl-card", props.className), style: props.style },
      h(
        "header",
        {
          className: cx(
            "vl-card-head",
            props.draggable !== false && "is-draggable",
          ),
        },
        props.draggable !== false
          ? h(
              "span",
              { className: "vl-card-grip", "aria-hidden": "true" },
              h(Icon, { name: "grip", size: 14 }),
            )
          : null,
        h("h3", { className: "vl-card-title" }, props.title),
        props.actions
          ? h("div", { className: "vl-card-actions" }, props.actions)
          : null,
      ),
      h("div", { className: "vl-card-body" }, props.children),
    );
  }

  /* ---------- NavTabs ---------- */
  var VIEWS = [
    "Dashboard",
    "Asset Inventory",
    "SLA & RACI",
    "Prioritization Matrix",
    "Remediation Board",
    "Network Map",
    "Re-Test Verification",
    "Executive Report",
  ];
  function NavTabs(props) {
    var tabs = props.tabs || VIEWS;
    var st = useState(props.active || tabs[0]);
    var active = props.active != null && props.onChange ? props.active : st[0];
    return h(
      "nav",
      { className: "vl-nav", "aria-label": "Views" },
      tabs.map(function (t) {
        return h(
          "button",
          {
            key: t,
            type: "button",
            className: cx("vl-nav-tab", t === active && "is-active"),
            "aria-current": t === active ? "page" : undefined,
            onClick: function () {
              st[1](t);
              if (props.onChange) props.onChange(t);
            },
          },
          t,
        );
      }),
    );
  }

  /* ---------- RiskMeter ---------- */
  function RiskMeter(props) {
    var max = props.max || 100;
    var pct = Math.max(0, Math.min(100, (props.score / max) * 100));
    var band =
      pct >= 75
        ? "critical"
        : pct >= 50
          ? "high"
          : pct >= 25
            ? "medium"
            : "low";
    return h(
      "div",
      { className: "vl-risk" },
      h(
        "div",
        { className: "vl-risk-top" },
        h("span", { className: "vl-risk-host" }, props.host),
        props.criticals
          ? h("span", { className: "vl-risk-crit" }, props.criticals + " crit")
          : null,
        h("span", { className: "vl-risk-score" }, props.score),
      ),
      h(
        "div",
        {
          className: "vl-risk-track",
          role: "meter",
          "aria-valuemin": 0,
          "aria-valuemax": max,
          "aria-valuenow": props.score,
          "aria-label": "Risk score for " + props.host,
        },
        h("div", {
          className: "vl-risk-fill vl-bg-" + band,
          style: { width: pct + "%" },
        }),
      ),
    );
  }

  /* ---------- KanbanCard ---------- */
  function KanbanCard(props) {
    return h(
      "article",
      Object.assign(
        { className: cx("vl-kcard", props.dragging && "is-dragging") },
        props.dragProps || {},
      ),
      h(
        "div",
        { className: "vl-kcard-top" },
        h(SeverityBadge, { severity: props.severity }),
        props.ticket
          ? h(
              "span",
              { className: "vl-kcard-ticket" },
              h(Icon, { name: "ticket", size: 12 }),
              props.ticket,
            )
          : null,
      ),
      props.onOpen
        ? h(
            "button",
            {
              type: "button",
              className: "vl-kcard-title vl-kcard-open",
              onClick: props.onOpen,
            },
            props.title,
          )
        : h("div", { className: "vl-kcard-title" }, props.title),
      h("div", { className: "vl-kcard-host" }, props.host),
      props.tags && props.tags.length
        ? h(
            "div",
            { className: "vl-kcard-tags" },
            props.tags.map(function (k) {
              return h(ThreatTag, { key: k, kind: k });
            }),
          )
        : null,
      h(
        "div",
        { className: "vl-kcard-foot" },
        h("span", { className: "vl-kcard-team" }, props.team || "Unassigned"),
        h(
          "span",
          { className: "vl-kcard-move" },
          h(
            "button",
            {
              type: "button",
              className: "vl-icon-btn",
              "aria-label": "Move back",
              onClick: props.onBack,
              disabled: !props.onBack,
            },
            h(Icon, { name: "chevron-left", size: 14 }),
          ),
          h(
            "button",
            {
              type: "button",
              className: "vl-icon-btn",
              "aria-label": "Move forward",
              onClick: props.onForward,
              disabled: !props.onForward,
            },
            h(Icon, { name: "chevron-right", size: 14 }),
          ),
        ),
      ),
    );
  }

  /* ---------- CodeSnippet ---------- */
  function CodeSnippet(props) {
    var tabs = props.tabs || [];
    var st = useState(0);
    var cur = tabs[st[0]] || { code: "" };
    return h(
      "div",
      { className: "vl-code" },
      h(
        "div",
        { className: "vl-code-head" },
        props.title
          ? h("span", { className: "vl-code-title" }, props.title)
          : null,
        h(
          "div",
          { className: "vl-code-tabs", role: "tablist" },
          tabs.map(function (t, i) {
            return h(
              "button",
              {
                key: t.label,
                type: "button",
                role: "tab",
                "aria-selected": i === st[0],
                className: cx("vl-code-tab", i === st[0] && "is-active"),
                onClick: function () {
                  st[1](i);
                },
              },
              t.label,
            );
          }),
        ),
      ),
      h("pre", { className: "vl-code-pre" }, h("code", null, cur.code)),
    );
  }

  /* ================= v2 additions ================= */
  var useEffect = React.useEffect;
  var useRef = React.useRef;
  Object.assign(ICONS, {
    "chevron-down": [["path", { d: "m6 9 6 6 6-6" }]],
    "chevron-up": [["path", { d: "m18 15-6-6-6 6" }]],
    search: [
      ["path", { d: "m21 21-4.34-4.34" }],
      ["circle", { cx: 11, cy: 11, r: 8 }],
    ],
    minus: [["path", { d: "M5 12h14" }]],
    info: [
      ["circle", { cx: 12, cy: 12, r: 10 }],
      ["path", { d: "M12 16v-4" }],
      ["path", { d: "M12 8h.01" }],
    ],
  });

  var SEV_ORDER = ["critical", "high", "medium", "low", "info"];
  var SEV_SHAPE = {
    critical: "◆",
    high: "▲",
    medium: "●",
    low: "▼",
    info: "○",
  };

  /* ---------- SeverityMarker ---------- */
  function SeverityMarker(props) {
    var s = props.severity || "info";
    var size = props.size || 10;
    var shapes = {
      critical: h("path", { d: "M5 0 10 5 5 10 0 5Z" }),
      high: h("path", { d: "M5 0.5 10 9.5H0Z" }),
      medium: h("circle", { cx: 5, cy: 5, r: 4.5 }),
      low: h("path", { d: "M0 0.5H10L5 9.5Z" }),
      info: h("circle", {
        cx: 5,
        cy: 5,
        r: 3.75,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.5,
      }),
    };
    return h(
      "svg",
      {
        className: "vl-marker vl-fg-" + s,
        width: size,
        height: size,
        viewBox: "0 0 10 10",
        fill: "currentColor",
        role: props.label ? "img" : undefined,
        "aria-label": props.label ? SEV_LABEL[s] : undefined,
        "aria-hidden": props.label ? undefined : "true",
      },
      shapes[s],
    );
  }

  /* ---------- Tooltip ---------- */
  function Tooltip(props) {
    return h(
      "span",
      { className: "vl-tip-wrap" },
      props.children,
      h(
        "span",
        {
          className: cx("vl-tip", props.side === "bottom" && "is-bottom"),
          role: "tooltip",
        },
        props.content,
      ),
    );
  }

  /* ---------- Checkbox ---------- */
  function Checkbox(props) {
    var ctrl = props.checked !== undefined;
    var st = useState(!!props.defaultChecked);
    var checked = ctrl ? props.checked : st[0];
    var ref = useRef(null);
    useEffect(function () {
      if (ref.current) ref.current.indeterminate = !!props.indeterminate;
    });
    return h(
      "label",
      { className: cx("vl-check", props.disabled && "is-disabled") },
      h("input", {
        ref: ref,
        type: "checkbox",
        checked: checked,
        disabled: props.disabled,
        onChange: function (e) {
          if (!ctrl) st[1](e.target.checked);
          if (props.onChange) props.onChange(e.target.checked);
        },
      }),
      h(
        "span",
        { className: "vl-check-box", "aria-hidden": "true" },
        h(Icon, {
          name: props.indeterminate ? "minus" : "check",
          size: 12,
          strokeWidth: 3,
        }),
      ),
      props.severity ? h(SeverityMarker, { severity: props.severity }) : null,
      h("span", { className: "vl-check-label" }, props.label),
      props.count != null
        ? h("span", { className: "vl-check-count" }, props.count)
        : null,
    );
  }

  /* ---------- Toggle ---------- */
  function Toggle(props) {
    var ctrl = props.checked !== undefined;
    var st = useState(!!props.defaultChecked);
    var on = ctrl ? props.checked : st[0];
    return h(
      "button",
      {
        type: "button",
        role: "switch",
        "aria-checked": on,
        disabled: props.disabled,
        title: props.title,
        className: cx("vl-toggle", on && "is-on"),
        onClick: function () {
          if (props.disabled) return;
          if (!ctrl) st[1](!on);
          if (props.onChange) props.onChange(!on);
        },
      },
      h(
        "span",
        { className: "vl-toggle-track", "aria-hidden": "true" },
        h("span", { className: "vl-toggle-thumb" }),
      ),
      props.icon ? h(Icon, { name: props.icon, size: 14 }) : null,
      h("span", null, props.label),
      props.count != null
        ? h("span", { className: "vl-check-count" }, props.count)
        : null,
    );
  }

  /* ---------- SegmentedControl ---------- */
  function SegmentedControl(props) {
    var opts = props.options || [
      "7 days",
      "15 days",
      "30 days",
      "6 months",
      "All",
    ];
    var st = useState(
      props.value != null
        ? props.value
        : props.defaultValue != null
          ? props.defaultValue
          : opts[opts.length - 1],
    );
    var val = props.value != null ? props.value : st[0];
    return h(
      "div",
      {
        className: "vl-seg",
        role: "radiogroup",
        "aria-label": props.label || "Date range",
      },
      opts.map(function (o) {
        return h(
          "button",
          {
            key: o,
            type: "button",
            role: "radio",
            "aria-checked": o === val,
            className: cx("vl-seg-opt", o === val && "is-on"),
            onClick: function () {
              st[1](o);
              if (props.onChange) props.onChange(o);
            },
          },
          o,
        );
      }),
    );
  }

  /* ---------- Input ---------- */
  function Input(props) {
    var rest = {};
    for (var k in props)
      if (k !== "icon" && k !== "className") rest[k] = props[k];
    return h(
      "span",
      { className: cx("vl-input", props.className) },
      props.icon !== false
        ? h(Icon, { name: props.icon || "search", size: 14 })
        : null,
      h("input", Object.assign({ type: "text" }, rest)),
    );
  }

  /* ---------- MultiSelect ---------- */
  function MultiSelect(props) {
    var opts = props.options || [];
    var ctrl = props.value !== undefined;
    var st = useState(props.defaultValue || []);
    var sel = ctrl ? props.value : st[0];
    var o = useState(!!props.defaultOpen);
    function toggle(v) {
      var next =
        sel.indexOf(v) >= 0
          ? sel.filter(function (x) {
              return x !== v;
            })
          : sel.concat([v]);
      if (!ctrl) st[1](next);
      if (props.onChange) props.onChange(next);
    }
    var summary =
      sel.length === 0
        ? props.placeholder || "All"
        : sel.length === 1
          ? sel[0]
          : sel.length + " selected";
    var wrap = React.useRef(null),
      trig = React.useRef(null);
    useLayer(
      o[0],
      function (why) {
        o[1](false);
        if (why === "escape" && trig.current) trig.current.focus();
      },
      wrap,
    );
    return h(
      "div",
      { className: "vl-ms", ref: wrap },
      h(
        "button",
        {
          type: "button",
          ref: trig,
          className: cx("vl-ms-trigger", o[0] && "is-open"),
          "aria-expanded": o[0],
          "aria-haspopup": "listbox",
          onClick: function () {
            o[1](!o[0]);
          },
          onKeyDown: function (e) {
            if (e.key === "ArrowDown" && !o[0]) {
              e.preventDefault();
              o[1](true);
              setTimeout(function () {
                var c =
                  wrap.current &&
                  wrap.current.querySelector(".vl-ms-menu input");
                if (c) c.focus();
              }, 0);
            }
          },
        },
        props.label
          ? h("span", { className: "vl-ms-label" }, props.label)
          : null,
        h("span", { className: "vl-ms-value" }, summary),
        h(Icon, { name: "chevron-down", size: 14 }),
      ),
      o[0]
        ? h(
            "div",
            {
              className: "vl-ms-menu",
              role: "listbox",
              "aria-multiselectable": "true",
              onKeyDown: function (e) {
                menuKeys(e, "input");
              },
            },
            opts.map(function (op) {
              var v = typeof op === "string" ? op : op.value;
              return h(
                "div",
                { key: v, className: "vl-ms-item" },
                h(Checkbox, {
                  label: typeof op === "string" ? op : op.label || v,
                  severity: op.severity,
                  count: op.count,
                  checked: sel.indexOf(v) >= 0,
                  onChange: function () {
                    toggle(v);
                  },
                }),
              );
            }),
          )
        : null,
    );
  }

  /* ---------- Modal ---------- */
  /* controlled-or-internal chart selection: pass selected + onSelect(labelOrNull) to cross-filter */
  /* Enter / Space activate an SVG mark the way a click does */
  function kbd(fn) {
    return function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    };
  }
  function useSel(props) {
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
  var LAYERS = [];
  function isTopLayer(t) {
    return LAYERS[LAYERS.length - 1] === t;
  }
  function useLayer(open, onClose, wrapRef) {
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
  function useDialog(onClose) {
    var ref = React.useRef(null);
    var cb = React.useRef(onClose);
    cb.current = onClose;
    useEffect(function () {
      var prev = document.activeElement,
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
          var ae = document.activeElement;
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
  function menuKeys(e, sel) {
    var items = Array.prototype.slice.call(
      e.currentTarget.querySelectorAll(sel),
    );
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
  function Modal(props) {
    if (props.open === false) return null;
    return h(ModalInner, props);
  }
  function ModalInner(props) {
    var ref = useDialog(props.onClose);
    return h(
      "div",
      {
        className: "vl-overlay vl-overlay-center",
        onClick: function (e) {
          if (e.target === e.currentTarget && props.onClose) props.onClose();
        },
      },
      h(
        "div",
        {
          ref: ref,
          tabIndex: -1,
          className: "vl-modal",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": props.title,
          style: props.width ? { width: props.width } : null,
        },
        h(
          "header",
          { className: "vl-modal-head" },
          h(
            "div",
            null,
            h("h2", { className: "vl-modal-title" }, props.title),
            props.subtitle
              ? h("p", { className: "vl-modal-sub" }, props.subtitle)
              : null,
          ),
          h(
            "button",
            {
              type: "button",
              className: "vl-icon-btn",
              "aria-label": "Close",
              onClick: props.onClose,
            },
            h(Icon, { name: "x", size: 14 }),
          ),
        ),
        h("div", { className: "vl-modal-body" }, props.children),
        props.footer
          ? h("footer", { className: "vl-modal-foot" }, props.footer)
          : null,
      ),
    );
  }

  /* ---------- Drawer ---------- */
  function Drawer(props) {
    if (props.open === false) return null;
    return h(DrawerInner, props);
  }
  function DrawerInner(props) {
    var ref = useDialog(props.onClose);
    return h(
      "div",
      {
        className: "vl-overlay",
        onClick: function (e) {
          if (e.target === e.currentTarget && props.onClose) props.onClose();
        },
      },
      h(
        "aside",
        {
          ref: ref,
          tabIndex: -1,
          className: "vl-drawer",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": props.title,
        },
        h(
          "header",
          { className: "vl-drawer-head" },
          h(
            "div",
            { className: "vl-drawer-titles" },
            props.eyebrow
              ? h("span", { className: "vl-label" }, props.eyebrow)
              : null,
            h(
              "h2",
              { className: cx("vl-drawer-title", props.mono && "is-mono") },
              props.title,
            ),
            props.meta
              ? h("div", { className: "vl-drawer-meta" }, props.meta)
              : null,
          ),
          h(
            "button",
            {
              type: "button",
              className: "vl-icon-btn",
              "aria-label": "Close",
              onClick: props.onClose,
            },
            h(Icon, { name: "x", size: 14 }),
          ),
        ),
        h("div", { className: "vl-drawer-body" }, props.children),
        props.footer
          ? h("footer", { className: "vl-drawer-foot" }, props.footer)
          : null,
      ),
    );
  }

  /* ---------- VulnTable ---------- */
  var COLS = [
    { key: "severity", label: "Severity", w: "112px" },
    { key: "name", label: "Finding" },
    { key: "host", label: "Host", w: "168px", mono: true },
    { key: "cvss", label: "CVSS", w: "64px", mono: true, num: true },
    { key: "lifecycle", label: "Status", w: "96px" },
    { key: "tool", label: "Tool", w: "96px" },
  ];
  function cmp(a, b, key, num) {
    if (key === "severity")
      return SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity);
    if (key === "cvss") return (b.cvss || 0) - (a.cvss || 0);
    if (num) {
      var x = a[key],
        y = b[key];
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return y - x;
    }
    return String(a[key] || "").localeCompare(String(b[key] || ""));
  }
  function VulnTable(props) {
    var rows0 = props.rows || [];
    /* sort can be controlled (props.sort + props.onSortChange) so the app can remember it */
    var s0 = useState(props.sort || { key: "severity", dir: 1 });
    var s = props.onSortChange
      ? [props.sort || { key: "severity", dir: 1 }, props.onSortChange]
      : s0;
    /* extra columns chosen by the user: {key, label, num?, mono?, w?}; cells show row[key + "Txt"] when given */
    var cols = COLS.slice(0, 5)
      .concat(props.extraCols || [])
      .concat([COLS[5]]);
    var numKey = {};
    cols.forEach(function (c) {
      if (c.num) numKey[c.key] = true;
    });
    var ex = useState(props.defaultExpanded || null);
    /* sort everything first, then show the first `limit` rows (paging never hides the worst findings) */
    var rows = rows0.slice().sort(function (a, b) {
      return (
        cmp(a, b, s[0].key, numKey[s[0].key]) * s[0].dir ||
        (b.risk || 0) - (a.risk || 0)
      );
    });
    if (props.limit) rows = rows.slice(0, props.limit);
    /* optional multi-select: props.selectable + props.selected (array of row ids) + props.onSelectChange(ids) */
    var selOn = !!props.selectable,
      sel = {};
    (props.selected || []).forEach(function (id) {
      sel[id] = true;
    });
    var allOn =
        selOn &&
        rows.length > 0 &&
        rows.every(function (r) {
          return sel[r.id];
        }),
      someOn =
        selOn &&
        rows.some(function (r) {
          return sel[r.id];
        });
    function setSel(ids) {
      if (props.onSelectChange) props.onSelectChange(ids);
    }
    var lastSel = React.useRef(null);
    /* shift-click selects (or clears) the whole range since the last box clicked */
    function toggleRow(id, shift) {
      var ids = rows.map(function (r) {
          return r.id;
        }),
        a = ids.indexOf(lastSel.current),
        b = ids.indexOf(id);
      if (shift && a >= 0 && b >= 0) {
        var range = ids.slice(Math.min(a, b), Math.max(a, b) + 1),
          on = !sel[id];
        setSel(
          on
            ? uniqIds((props.selected || []).concat(range))
            : (props.selected || []).filter(function (x) {
                return range.indexOf(x) < 0;
              }),
        );
      } else {
        var n = (props.selected || []).filter(function (x) {
          return x !== id;
        });
        if (!sel[id]) n.push(id);
        setSel(n);
      }
      lastSel.current = id;
    }
    function toggleAll() {
      var vis = rows.map(function (r) {
        return r.id;
      });
      setSel(
        allOn
          ? (props.selected || []).filter(function (x) {
              return vis.indexOf(x) < 0;
            })
          : uniqIds((props.selected || []).concat(vis)),
      );
    }
    function uniqIds(a) {
      var o = {},
        out = [];
      a.forEach(function (x) {
        if (!o[x]) {
          o[x] = 1;
          out.push(x);
        }
      });
      return out;
    }
    return h(
      "div",
      { className: "vl-table-wrap", "data-density": props.density },
      h(
        "table",
        { className: "vl-table" + (selOn ? " is-selectable" : "") },
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            selOn
              ? h(
                  "th",
                  { style: { width: "36px" } },
                  h("input", {
                    type: "checkbox",
                    className: "vl-rowcheck",
                    "aria-label": allOn
                      ? "Clear selection"
                      : "Select all rows shown",
                    checked: allOn,
                    ref: function (el) {
                      if (el) el.indeterminate = !allOn && someOn;
                    },
                    onChange: toggleAll,
                  }),
                )
              : null,
            h("th", { style: { width: "32px" } }),
            cols.map(function (c) {
              var on = s[0].key === c.key;
              return h(
                "th",
                {
                  key: c.key,
                  style: c.w ? { width: c.w } : null,
                  className: c.num ? "is-num" : null,
                  "aria-sort": on
                    ? (s[0].dir === 1) ===
                      (c.key === "severity" || c.key === "cvss" || !!c.num)
                      ? "descending"
                      : "ascending"
                    : "none",
                  title:
                    c.key === "severity" || c.key === "cvss" || c.num
                      ? "Sort: highest first, click again to reverse"
                      : "Sort: A to Z, click again to reverse",
                },
                h(
                  "button",
                  {
                    type: "button",
                    className: cx("vl-th-btn", on && "is-on"),
                    onClick: function () {
                      s[1]({ key: c.key, dir: on ? -s[0].dir : 1 });
                    },
                  },
                  c.label,
                  h(Icon, {
                    name: on && s[0].dir === -1 ? "chevron-up" : "chevron-down",
                    size: 12,
                  }),
                ),
              );
            }),
          ),
        ),
        h(
          "tbody",
          null,
          rows.map(function (r) {
            var open = ex[0] === r.id;
            var cells = h.apply(
              null,
              [
                "tr",
                {
                  key: r.id,
                  className: cx(
                    "vl-tr",
                    open && "is-open",
                    sel[r.id] && "is-selected",
                  ),
                  onClick: function () {
                    ex[1](open ? null : r.id);
                  },
                },
              ].concat(
                [
                  selOn
                    ? h(
                        "td",
                        {
                          onClick: function (e) {
                            e.stopPropagation();
                          },
                        },
                        h("input", {
                          type: "checkbox",
                          className: "vl-rowcheck",
                          "aria-label": "Select " + r.name + " on " + r.host,
                          checked: !!sel[r.id],
                          onChange: function () {},
                          onClick: function (e) {
                            toggleRow(r.id, e.shiftKey);
                          },
                        }),
                      )
                    : null,
                  h(
                    "td",
                    null,
                    h(
                      "button",
                      {
                        type: "button",
                        className: "vl-row-toggle",
                        "aria-expanded": open,
                        "aria-label": (open ? "Collapse " : "Expand ") + r.name,
                      },
                      h(Icon, {
                        name: open ? "chevron-down" : "chevron-right",
                        size: 14,
                      }),
                    ),
                  ),
                  h("td", null, h(SeverityBadge, { severity: r.severity })),
                  h(
                    "td",
                    null,
                    h(
                      "div",
                      { className: "vl-td-name" },
                      h("span", { className: "vl-td-title" }, r.name),
                      r.merged > 1
                        ? h(
                            "span",
                            { className: "vl-merged" },
                            r.merged + "x merged",
                          )
                        : null,
                      (r.tags || []).map(function (t) {
                        return h(ThreatTag, { key: t, kind: t });
                      }),
                    ),
                  ),
                  h("td", { className: "is-mono" }, r.host),
                  h(
                    "td",
                    { className: "is-mono is-num" },
                    r.cvss != null ? r.cvss.toFixed(1) : "—",
                  ),
                  h("td", null, h(LifecycleText, { value: r.lifecycle })),
                ]
                  .concat(
                    (props.extraCols || []).map(function (c) {
                      var v =
                        r[c.key + "Txt"] != null ? r[c.key + "Txt"] : r[c.key];
                      return h(
                        "td",
                        {
                          key: c.key,
                          className: cx(
                            c.mono && "is-mono",
                            c.num && "is-num",
                            c.muted && "vl-td-muted",
                          ),
                        },
                        v == null || v === "" ? "—" : v,
                      );
                    }),
                  )
                  .concat([
                    h("td", { key: "tool", className: "vl-td-muted" }, r.tool),
                  ]),
              ),
            );
            if (!open) return cells;
            return [
              cells,
              h(
                "tr",
                { key: r.id + "-d", className: "vl-tr-detail" },
                h(
                  "td",
                  { colSpan: cols.length + 1 + (selOn ? 1 : 0) },
                  props.renderDetail
                    ? props.renderDetail(r)
                    : h(FindingDetail, { finding: r }),
                ),
              ),
            ];
          }),
        ),
      ),
      rows.length === 0
        ? h(EmptyState, {
            title: "No findings match the current filters.",
            action: props.onClearFilters
              ? h(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    onClick: props.onClearFilters,
                  },
                  "Clear filters",
                )
              : null,
          })
        : null,
    );
  }
  function LifecycleText(props) {
    var v = props.value || "Open";
    return h(
      "span",
      {
        className:
          "vl-life vl-life-" +
          v
            .toLowerCase()
            .replace(/[^a-z]+/g, "-")
            .replace(/-$/, ""),
        title: props.title,
      },
      v,
    );
  }
  function FindingDetail(props) {
    var f = props.finding;
    return h(
      "div",
      { className: "vl-detail" },
      h(
        "div",
        { className: "vl-detail-main" },
        h(
          "p",
          { className: "vl-detail-desc" },
          f.description || "No description provided by the scanner.",
        ),
        f.cves && f.cves.length
          ? h(
              "div",
              { className: "vl-detail-cves" },
              f.cves.map(function (c) {
                return h(
                  "a",
                  {
                    key: c,
                    className: "vl-cve",
                    href: "https://nvd.nist.gov/vuln/detail/" + c,
                    target: "_blank",
                    rel: "noreferrer",
                  },
                  c,
                );
              }),
            )
          : null,
        f.snippet
          ? h(CodeSnippet, { title: "Remediation", tabs: f.snippet })
          : null,
      ),
      h(
        "div",
        { className: "vl-detail-side" },
        h("span", { className: "vl-label" }, "Owner"),
        h("span", { className: "vl-detail-v" }, f.team || "Unassigned"),
        h("span", { className: "vl-label" }, "Ticket"),
        f.ticket
          ? h(
              "span",
              { className: "vl-kcard-ticket" },
              h(Icon, { name: "ticket", size: 12 }),
              f.ticket,
            )
          : h(
              Button,
              {
                size: "sm",
                icon: "ticket",
                restricted: f.readOnly,
                restrictedReason: "Security Auditors have read-only access.",
              },
              "Raise ticket",
            ),
        h("span", { className: "vl-label" }, "SLA"),
        f.sla
          ? h(SlaPill, f.sla)
          : h("span", { className: "vl-detail-v" }, "—"),
      ),
    );
  }

  /* ---------- PipelineStepper ---------- */
  var STAGES = [
    "Unassigned",
    "Assigned",
    "In Progress",
    "Pending Verification",
    "Resolved",
  ];
  function PipelineStepper(props) {
    var counts = props.counts || [0, 0, 0, 0, 0];
    var cur = props.current;
    return h(
      "ol",
      { className: "vl-steps" },
      (props.labels || STAGES).map(function (s, i) {
        return h(
          "li",
          {
            key: s,
            className: cx(
              "vl-step",
              cur === i && "is-current",
              i === 4 && "is-done",
            ),
          },
          h("span", { className: "vl-step-count" }, counts[i]),
          h("span", { className: "vl-step-label" }, s),
        );
      }),
    );
  }

  /* ---------- DiffBadge ---------- */
  var DIFF = {
    fixed: ["Verified fixed", "check"],
    new: ["New risk", "zap"],
    persistent: ["Persistent", "clock"],
    reopened: ["Reopened", "flame"],
    unverified: ["Not re-tested", "lock"],
    accepted: ["Risk accepted", "shield"],
  };
  function DiffBadge(props) {
    var d = DIFF[props.kind] || DIFF.persistent;
    return h(
      "span",
      { className: "vl-diff vl-diff-" + props.kind },
      h(Icon, { name: d[1], size: 12, strokeWidth: 2.5 }),
      props.label || d[0],
      props.count != null
        ? h("span", { className: "vl-sev-count" }, props.count)
        : null,
    );
  }

  /* ---------- QuadrantTile ---------- */
  var QUAD = {
    quickwins: ["Quick Wins", "High risk · low effort", "Patch now"],
    strategic: ["Strategic", "High risk · high effort", "Plan a sprint"],
    mundane: ["Mundane Fixes", "Low risk · low effort", "Routine maintenance"],
    deferrable: ["Deferrable", "Low risk · high effort", "Backlog"],
  };
  function QuadrantTile(props) {
    var q = QUAD[props.kind] || QUAD.quickwins;
    return h(
      "button",
      {
        type: "button",
        className: cx(
          "vl-quad",
          "vl-quad-" + props.kind,
          props.selected && "is-selected",
        ),
        "aria-pressed": !!props.selected,
        onClick: props.onClick,
      },
      h(
        "span",
        { className: "vl-quad-top" },
        h("span", { className: "vl-quad-name" }, q[0]),
        h(
          "span",
          { className: "vl-quad-count" },
          props.count != null ? props.count : 0,
        ),
      ),
      h("span", { className: "vl-quad-axes" }, q[1]),
      h("span", { className: "vl-quad-hint" }, q[2]),
    );
  }

  /* ---------- AuditLogRow ---------- */
  function AuditLogRow(props) {
    return h(
      "div",
      { className: "vl-audit" },
      h(
        "span",
        {
          className:
            "vl-audit-act vl-audit-" + (props.action || "PATCH").toLowerCase(),
        },
        props.action || "PATCH",
      ),
      h(
        "div",
        { className: "vl-audit-main" },
        h("span", { className: "vl-audit-detail" }, props.detail),
        h(
          "span",
          { className: "vl-audit-meta" },
          props.role,
          " · ",
          h("time", { dateTime: props.at }, props.time || props.at),
        ),
      ),
    );
  }

  /* ---------- EmptyState ---------- */
  function EmptyState(props) {
    return h(
      "div",
      { className: "vl-empty" },
      h(
        "p",
        { className: "vl-empty-title" },
        props.title || "Nothing here yet.",
      ),
      props.hint ? h("p", { className: "vl-empty-hint" }, props.hint) : null,
      props.action || null,
    );
  }

  /* ---------- Skeleton ---------- */
  function Skeleton(props) {
    if (props.variant === "rows") {
      var n = props.rows || 4,
        out = [];
      for (var i = 0; i < n; i++)
        out.push(
          h(
            "div",
            { key: i, className: "vl-skel-row" },
            h("span", { className: "vl-skel", style: { width: "72px" } }),
            h("span", { className: "vl-skel", style: { flex: 1 } }),
            h("span", { className: "vl-skel", style: { width: "96px" } }),
          ),
        );
      return h(
        "div",
        {
          className: "vl-skel-rows",
          "aria-busy": "true",
          "aria-label": "Loading",
        },
        out,
      );
    }
    return h("span", {
      className: "vl-skel",
      style: { width: props.width || "100%", height: props.height || "12px" },
      "aria-hidden": "true",
    });
  }

  /* ---------- Toast ---------- */
  function Toast(props) {
    var tone = props.tone || "ok";
    return h(
      "div",
      {
        className: "vl-toast vl-toast-" + tone,
        role: tone === "danger" ? "alert" : "status",
      },
      h(Icon, {
        name: tone === "ok" ? "check" : tone === "danger" ? "shield" : "info",
        size: 16,
      }),
      h(
        "div",
        { className: "vl-toast-main" },
        h("span", { className: "vl-toast-title" }, props.title),
        props.message
          ? h("span", { className: "vl-toast-msg" }, props.message)
          : null,
      ),
      props.action
        ? h(
            "button",
            {
              type: "button",
              className: "vl-toast-action",
              onClick: props.action.onClick,
            },
            props.action.label,
          )
        : null,
      props.onClose
        ? h(
            "button",
            {
              type: "button",
              className: "vl-chip-x",
              "aria-label": "Dismiss",
              onClick: props.onClose,
            },
            h(Icon, { name: "x", size: 12 }),
          )
        : null,
    );
  }

  /* ---------- Charts (token-styled SVG; the app uses Recharts with the same rules) ---------- */
  function ChartLegend(props) {
    return h(
      "div",
      { className: "vl-legend" },
      props.items.map(function (it) {
        return h(
          "span",
          { key: it.label, className: "vl-legend-item" },
          it.severity
            ? h(SeverityMarker, { severity: it.severity })
            : h("span", {
                className: "vl-legend-sw",
                style: { background: it.color },
              }),
          it.label,
          it.value != null
            ? h("span", { className: "vl-legend-v" }, it.value)
            : null,
        );
      }),
    );
  }
  function BarChart(props) {
    var data = props.data || [];
    var H = props.height || 180,
      W = props.width || 420,
      padL = 32,
      padB = 24,
      padT = 8;
    var max = Math.max.apply(
      null,
      data
        .map(function (d) {
          return d.value;
        })
        .concat([1]),
    );
    var nice = Math.ceil(max / 5) * 5,
      bw = (W - padL) / data.length;
    var sel = useSel(props),
      rot = data.length > 8;
    if (rot) {
      padB = 64;
      H = (props.height || 180) + 40;
    }
    var ticks = [0, 0.25, 0.5, 0.75, 1];
    return h(
      "div",
      { className: "vl-chart" },
      h(
        "svg",
        {
          viewBox: "0 0 " + W + " " + H,
          width: "100%",
          role: "img",
          "aria-label": props.label || "Bar chart",
        },
        ticks.map(function (t) {
          var y = padT + (H - padB - padT) * (1 - t);
          return h(
            "g",
            { key: t },
            h("line", { className: "vl-grid", x1: padL, x2: W, y1: y, y2: y }),
            h(
              "text",
              {
                className: "vl-axis",
                x: padL - 6,
                y: y + 4,
                textAnchor: "end",
              },
              Math.round(nice * t),
            ),
          );
        }),
        data.map(function (d, i) {
          var bh = ((H - padB - padT) * d.value) / nice,
            x = padL + i * bw + bw * 0.18,
            w = Math.min(48, bw * 0.64);
          var dim = sel[0] != null && sel[0] !== d.label,
            lx = x + w / 2;
          return h(
            "g",
            {
              key: d.label,
              className: cx(
                "vl-bar",
                dim && "is-dim",
                sel[0] === d.label && "is-sel",
              ),
              onClick: function () {
                sel[1](d.label);
              },
              role: props.static ? null : "button",
              tabIndex: props.static ? null : 0,
              "aria-pressed": sel[0] === d.label,
              "aria-label": d.label + ": " + d.value,
              onKeyDown: function (e) {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  sel[1](d.label);
                }
              },
            },
            h("rect", {
              x: x,
              y: H - padB - bh,
              width: w,
              height: Math.max(bh, d.value ? 1 : 0),
              rx: 3,
              className: d.severity ? "vl-fill-" + d.severity : null,
              style: d.color ? { fill: d.color } : null,
            }),
            h("title", null, d.label + ": " + d.value),
            rot
              ? h(
                  "text",
                  {
                    className: "vl-axis",
                    x: lx,
                    y: H - padB + 12,
                    textAnchor: "end",
                    transform: "rotate(-35 " + lx + " " + (H - padB + 12) + ")",
                  },
                  fit(String(d.label), 90),
                )
              : h(
                  "text",
                  {
                    className: "vl-axis",
                    x: lx,
                    y: H - 8,
                    textAnchor: "middle",
                  },
                  fit(String(d.label), bw - 4),
                ),
          );
        }),
      ),
      props.legend
        ? h(ChartLegend, {
            items: data.map(function (d) {
              return {
                label: d.label,
                severity: d.severity,
                color: d.color,
                value: d.value,
              };
            }),
          })
        : null,
    );
  }
  function DonutChart(props) {
    var data = props.data || [];
    var total =
      data.reduce(function (a, d) {
        return a + d.value;
      }, 0) || 1;
    var R = 64,
      r = R * 0.58,
      C = 80,
      acc = 0;
    function arc(a0, a1) {
      var p = function (a, rad) {
        return [C + rad * Math.sin(a), C - rad * Math.cos(a)];
      };
      var large = a1 - a0 > Math.PI ? 1 : 0,
        o0 = p(a0, R),
        o1 = p(a1, R),
        i1 = p(a1, r),
        i0 = p(a0, r);
      return (
        "M" +
        o0 +
        "A" +
        R +
        "," +
        R +
        " 0 " +
        large +
        " 1 " +
        o1 +
        "L" +
        i1 +
        "A" +
        r +
        "," +
        r +
        " 0 " +
        large +
        " 0 " +
        i0 +
        "Z"
      );
    }
    var gap = 0.035,
      sel = useSel(props);
    return h(
      "div",
      { className: "vl-chart vl-donut" },
      h(
        "svg",
        {
          viewBox: "0 0 160 160",
          width: 160,
          height: 160,
          role: "img",
          "aria-label": props.label || "Donut chart",
        },
        data.map(function (d) {
          var a0 = (acc / total) * Math.PI * 2,
            a1 = ((acc + d.value) / total) * Math.PI * 2;
          acc += d.value;
          return h(
            "path",
            {
              key: d.label,
              d: arc(a0 + gap / 2, Math.max(a0 + gap / 2 + 0.01, a1 - gap / 2)),
              className: cx(
                "vl-slice",
                d.severity && "vl-fill-" + d.severity,
                sel[0] != null && sel[0] !== d.label && "is-dim",
                sel[0] === d.label && "is-sel",
              ),
              style: d.color ? { fill: d.color } : null,
              onClick: function () {
                sel[1](d.label);
              },
              role: props.static ? null : "button",
              tabIndex: props.static ? null : 0,
              "aria-label": d.label + ": " + d.value,
              onKeyDown: function (e) {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  sel[1](d.label);
                }
              },
            },
            h("title", null, d.label + ": " + d.value),
          );
        }),
        h(
          "text",
          { className: "vl-donut-total", x: C, y: C + 4, textAnchor: "middle" },
          props.total != null ? props.total : total,
        ),
        h(
          "text",
          { className: "vl-axis", x: C, y: C + 20, textAnchor: "middle" },
          props.totalLabel || "active",
        ),
      ),
      h(ChartLegend, {
        items: data.map(function (d) {
          return {
            label: d.label,
            severity: d.severity,
            color: d.color,
            value: d.value,
          };
        }),
      }),
    );
  }
  function Heatmap(props) {
    var rows = props.rows || [],
      sel = useSel(props);
    var max = 1;
    rows.forEach(function (r) {
      r.values.forEach(function (v) {
        if (v > max) max = v;
      });
    });
    return h(
      "div",
      {
        className: "vl-heat",
        style: { gridTemplateColumns: "minmax(120px,auto) repeat(5, 1fr)" },
      },
      h("span"),
      SEV_ORDER.map(function (s) {
        return h(
          "span",
          { key: s, className: "vl-heat-h" },
          h(SeverityMarker, { severity: s }),
          SEV_LABEL[s],
        );
      }),
      rows.map(function (r) {
        var dim = sel[0] != null && sel[0] !== r.host;
        return [
          h(
            "button",
            {
              key: r.host,
              type: "button",
              className: cx(
                "vl-heat-host",
                sel[0] === r.host && "is-sel",
                dim && "is-dim",
              ),
              onClick: function () {
                sel[1](r.host);
              },
              "aria-pressed": sel[0] === r.host,
            },
            r.host,
          ),
        ].concat(
          r.values.map(function (v, i) {
            var s = SEV_ORDER[i];
            return h(
              "span",
              {
                key: r.host + s,
                className: cx("vl-heat-cell", dim && "is-dim"),
                onClick: function () {
                  sel[1](r.host);
                },
                title: r.host + " · " + SEV_LABEL[s] + ": " + v,
              },
              h("span", {
                className: "vl-heat-fill vl-fill-bg-" + s,
                style: { opacity: v ? 0.14 + (0.74 * v) / max : 0 },
              }),
              h(
                "span",
                { className: cx("vl-heat-v", v / max > 0.55 && "is-strong") },
                v || "",
              ),
            );
          }),
        );
      }),
    );
  }

  /* ---------- ReportHeader ---------- */
  function ReportHeader(props) {
    return h(
      "header",
      { className: "vl-report vl-report-" + (props.theme || "slate") },
      h(
        "div",
        { className: "vl-report-band" },
        h(Logo, { size: 22 }),
        h(
          "span",
          { className: "vl-report-kind" },
          props.kind || "Vulnerability Assessment Report",
        ),
      ),
      h(
        "div",
        { className: "vl-report-body" },
        h(
          "h1",
          { className: "vl-report-title" },
          props.title || "Executive Summary",
        ),
        h("p", { className: "vl-report-meta" }, props.meta),
      ),
    );
  }

  /* ================= v3 additions ================= */
  Object.assign(ICONS, {
    gauge: [
      ["path", { d: "m12 14 4-4" }],
      ["path", { d: "M3.34 19a10 10 0 1 1 17.32 0" }],
    ],
    paperclip: [
      [
        "path",
        {
          d: "m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551",
        },
      ],
    ],
    book: [
      ["path", { d: "M12 7v14" }],
      [
        "path",
        {
          d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
        },
      ],
    ],
    tag: [
      [
        "path",
        {
          d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
        },
      ],
      ["circle", { cx: 7.5, cy: 7.5, r: 1 }],
    ],
    refresh: [
      ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
      ["path", { d: "M3 3v5h5" }],
    ],
    message: [
      [
        "path",
        {
          d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
        },
      ],
    ],
    briefcase: [
      ["path", { d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" }],
      ["rect", { width: 20, height: 14, x: 2, y: 6, rx: 2 }],
    ],
    ban: [
      ["circle", { cx: 12, cy: 12, r: 10 }],
      ["path", { d: "m4.9 4.9 14.2 14.2" }],
    ],
    unlock: [
      ["rect", { width: 18, height: 11, x: 3, y: 11, rx: 2 }],
      ["path", { d: "M7 11V7a5 5 0 0 1 9.9-1" }],
    ],
    plus: [
      ["path", { d: "M5 12h14" }],
      ["path", { d: "M12 5v14" }],
    ],
    filter: [
      [
        "path",
        {
          d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",
        },
      ],
    ],
    route: [
      ["circle", { cx: 6, cy: 19, r: 3 }],
      ["path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }],
      ["circle", { cx: 18, cy: 5, r: 3 }],
    ],
    sparkles: [
      [
        "path",
        {
          d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
        },
      ],
      ["path", { d: "M20 3v4" }],
      ["path", { d: "M22 5h-4" }],
    ],
    target: [
      ["circle", { cx: 12, cy: 12, r: 10 }],
      ["circle", { cx: 12, cy: 12, r: 6 }],
      ["circle", { cx: 12, cy: 12, r: 2 }],
    ],
    flag: [
      [
        "path",
        {
          d: "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",
        },
      ],
    ],
    workflow: [
      ["rect", { width: 8, height: 8, x: 3, y: 3, rx: 2 }],
      ["path", { d: "M7 11v4a2 2 0 0 0 2 2h4" }],
      ["rect", { width: 8, height: 8, x: 13, y: 13, rx: 2 }],
    ],
  });

  Object.assign(ICONS, {
    upload: [
      ["path", { d: "M12 3v12" }],
      ["path", { d: "m17 8-5-5-5 5" }],
      ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ],
    download: [
      ["path", { d: "M12 15V3" }],
      ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
      ["path", { d: "m7 10 5 5 5-5" }],
    ],
    file: [
      [
        "path",
        {
          d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
        },
      ],
      ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
      ["path", { d: "M8 13h2" }],
      ["path", { d: "M14 13h2" }],
      ["path", { d: "M8 17h2" }],
      ["path", { d: "M14 17h2" }],
    ],
    server: [
      ["rect", { width: 20, height: 8, x: 2, y: 2, rx: 2 }],
      ["rect", { width: 20, height: 8, x: 2, y: 14, rx: 2 }],
      ["path", { d: "M6 6h.01" }],
      ["path", { d: "M6 18h.01" }],
    ],
    database: [
      ["ellipse", { cx: 12, cy: 5, rx: 9, ry: 3 }],
      ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5" }],
      ["path", { d: "M3 12A9 3 0 0 0 21 12" }],
    ],
    globe: [
      ["circle", { cx: 12, cy: 12, r: 10 }],
      ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }],
      ["path", { d: "M2 12h20" }],
    ],
    router: [
      ["rect", { width: 20, height: 8, x: 2, y: 14, rx: 2 }],
      ["path", { d: "M6.01 18H6" }],
      ["path", { d: "M10.01 18H10" }],
      ["path", { d: "M15 10v4" }],
      ["path", { d: "M17.84 7.17a4 4 0 0 0-5.66 0" }],
      ["path", { d: "M20.66 4.34a8 8 0 0 0-11.31 0" }],
    ],
    key: [
      [
        "path",
        {
          d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
        },
      ],
    ],
    monitor: [
      ["rect", { width: 20, height: 14, x: 2, y: 3, rx: 2 }],
      ["path", { d: "M8 21h8" }],
      ["path", { d: "M12 17v4" }],
    ],
    user: [
      ["circle", { cx: 12, cy: 8, r: 5 }],
      ["path", { d: "M20 21a8 8 0 0 0-16 0" }],
    ],
    ellipsis: [
      ["circle", { cx: 12, cy: 12, r: 1 }],
      ["circle", { cx: 19, cy: 12, r: 1 }],
      ["circle", { cx: 5, cy: 12, r: 1 }],
    ],
    template: [
      ["rect", { width: 18, height: 7, x: 3, y: 3, rx: 1 }],
      ["rect", { width: 9, height: 7, x: 3, y: 14, rx: 1 }],
      ["rect", { width: 5, height: 7, x: 16, y: 14, rx: 1 }],
    ],
    "trend-up": [
      ["path", { d: "M16 7h6v6" }],
      ["path", { d: "m22 7-8.5 8.5-5-5L2 17" }],
    ],
    "trend-down": [
      ["path", { d: "M16 17h6v-6" }],
      ["path", { d: "m22 17-8.5-8.5-5 5L2 7" }],
    ],
    "shield-check": [
      [
        "path",
        {
          d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        },
      ],
      ["path", { d: "m9 12 2 2 4-4" }],
    ],
  });

  /* ---------- FileDropzone ---------- */
  function FileDropzone(props) {
    var st = props.state || "idle";
    var drag = useState(false);
    var s = drag[0] && st === "idle" ? "drag" : st;
    var body;
    if (s === "parsing")
      body = [
        h(
          "span",
          { key: "t", className: "vl-drop-title" },
          "Parsing ",
          h("span", { className: "vl-mono" }, props.fileName || "scan.csv"),
        ),
        h(
          "div",
          {
            key: "b",
            className: "vl-drop-bar",
            role: "progressbar",
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            "aria-valuenow": props.progress || 0,
          },
          h("span", { style: { width: (props.progress || 0) + "%" } }),
        ),
        h(
          "span",
          { key: "h", className: "vl-drop-hint" },
          (props.rows || 0).toLocaleString() + " rows read · in your browser",
        ),
      ];
    else if (s === "error")
      body = [
        h(Icon, { key: "i", name: "shield", size: 20 }),
        h(
          "span",
          { key: "t", className: "vl-drop-title" },
          props.error || "Couldn't read this file.",
        ),
        h(
          "span",
          { key: "h", className: "vl-drop-hint" },
          "CSV, XML, .nessus, JSON, JSONL or SARIF.",
        ),
        h(
          Button,
          { key: "b", size: "sm", onClick: props.onBrowse },
          "Choose another file",
        ),
      ];
    else
      body = [
        h(Icon, { key: "i", name: "upload", size: 20 }),
        h(
          "span",
          { key: "t", className: "vl-drop-title" },
          s === "drag" ? "Drop to analyse" : "Drop scan files here",
        ),
        h(
          "span",
          { key: "h", className: "vl-drop-hint" },
          "Drop one or many files: CSV from 10 scanners, .nessus, OpenVAS, Burp and ZAP XML/JSON, Nuclei JSONL, Nikto, Wapiti, Dependency-Check, Trivy, SARIF and Nmap XML, or any CSV/JSON you map yourself.",
        ),
        s === "idle"
          ? h(
              Button,
              {
                key: "b",
                size: "sm",
                variant: "primary",
                icon: "upload",
                onClick: props.onBrowse,
              },
              "Choose files",
            )
          : null,
        h(
          "span",
          { key: "p", className: "vl-drop-privacy" },
          h(Icon, { name: "shield-check", size: 12 }),
          "Files never leave this machine",
        ),
      ];
    return h(
      "div",
      {
        className: cx("vl-drop", "is-" + s),
        onDragEnter: function (e) {
          e.preventDefault();
          drag[1](true);
        },
        onDragOver: function (e) {
          e.preventDefault();
        },
        onDragLeave: function () {
          drag[1](false);
        },
        onDrop: function (e) {
          e.preventDefault();
          drag[1](false);
          if (props.onFiles) props.onFiles(e.dataTransfer.files);
        },
      },
      body,
    );
  }

  /* ---------- ScannerBadge ---------- */
  function ScannerBadge(props) {
    var ok = props.matched == null || props.matched >= 2;
    return h(
      "span",
      { className: cx("vl-scanner", !ok && "is-unknown") },
      h(Icon, { name: ok ? "check" : "info", size: 12, strokeWidth: 2.5 }),
      h(
        "span",
        { className: "vl-scanner-name" },
        ok ? props.tool : "Unrecognised CSV",
      ),
      props.matched != null
        ? h(
            "span",
            { className: "vl-scanner-meta" },
            props.matched + "/" + props.total + " headers",
          )
        : null,
    );
  }

  /* ---------- ColumnMapRow ---------- */
  function ColumnMapRow(props) {
    var mapped = !!props.header;
    return h(
      "div",
      { className: cx("vl-cmap", !mapped && props.required && "is-missing") },
      h(
        "div",
        { className: "vl-cmap-field" },
        h("span", { className: "vl-mono" }, props.field),
        props.required
          ? h("span", { className: "vl-cmap-req" }, "required")
          : null,
      ),
      h(
        "div",
        { className: "vl-cmap-pick" },
        h(
          "select",
          {
            className: "vl-cmap-select",
            "aria-label": "Column for " + props.field,
            value: props.onChange ? props.header || "" : undefined,
            defaultValue: props.onChange ? undefined : props.header || "",
            onChange: function (e) {
              if (props.onChange) props.onChange(e.target.value || null);
            },
          },
          h("option", { value: "" }, "Not mapped"),
          (props.options || []).map(function (o) {
            return h("option", { key: o, value: o }, o);
          }),
        ),
      ),
      h(
        "div",
        { className: "vl-cmap-sample" },
        mapped
          ? props.sample
          : props.required
            ? "Map a column to continue"
            : "Optional",
      ),
    );
  }

  /* ---------- Tabs ---------- */
  function Tabs(props) {
    var tabs = props.tabs || [];
    var st = useState(props.defaultValue || (tabs[0] && tabs[0].label));
    var val = props.value != null ? props.value : st[0];
    return h(
      "div",
      { className: "vl-tabs", role: "tablist" },
      tabs.map(function (t) {
        var on = t.label === val;
        return h(
          "button",
          {
            key: t.label,
            type: "button",
            role: "tab",
            "aria-selected": on,
            className: cx("vl-tab", on && "is-on"),
            onClick: function () {
              st[1](t.label);
              if (props.onChange) props.onChange(t.label);
            },
          },
          t.label,
          t.count != null
            ? h("span", { className: "vl-tab-count" }, t.count)
            : null,
        );
      }),
    );
  }

  /* ---------- DropdownMenu ---------- */
  function DropdownMenu(props) {
    var o = useState(!!props.defaultOpen),
      wrap = React.useRef(null);
    function focusTrigger() {
      var b = wrap.current && wrap.current.querySelector("[aria-haspopup]");
      if (b) b.focus();
    }
    useLayer(
      o[0],
      function (why) {
        o[1](false);
        if (why === "escape") focusTrigger();
      },
      wrap,
    );
    useEffect(
      function () {
        if (o[0] && wrap.current) {
          var f = wrap.current.querySelector('[role="menuitem"]');
          if (f && wrap.current.contains(document.activeElement)) f.focus();
        }
      },
      [o[0]],
    );
    return h(
      "div",
      { className: "vl-menu-wrap", ref: wrap },
      h(
        Button,
        {
          variant: props.variant || "secondary",
          size: props.size,
          icon: props.icon,
          "aria-haspopup": "menu",
          "aria-expanded": o[0],
          onClick: function () {
            o[1](!o[0]);
          },
          onKeyDown: function (e) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              o[1](true);
            }
          },
        },
        props.label,
        h(Icon, { name: "chevron-down", size: 14 }),
      ),
      o[0]
        ? h(
            "div",
            {
              className: cx("vl-menu", props.align === "right" && "is-right"),
              role: "menu",
              onKeyDown: function (e) {
                menuKeys(e, '[role="menuitem"]');
              },
            },
            (props.items || []).map(function (it, i) {
              if (it === "-")
                return h("div", {
                  key: i,
                  className: "vl-menu-sep",
                  role: "separator",
                });
              return h(
                "button",
                {
                  key: it.label,
                  type: "button",
                  role: "menuitem",
                  className: cx("vl-menu-item", it.danger && "is-danger"),
                  onClick: function () {
                    o[1](false);
                    focusTrigger();
                    if (it.onSelect) it.onSelect();
                  },
                },
                it.icon
                  ? h(Icon, { name: it.icon, size: 14 })
                  : h("span", { className: "vl-menu-gap" }),
                h("span", { className: "vl-menu-label" }, it.label),
                it.hint
                  ? h("span", { className: "vl-menu-hint" }, it.hint)
                  : null,
              );
            }),
          )
        : null,
    );
  }

  /* ---------- Banner ---------- */
  function Banner(props) {
    var tone = props.tone || "info";
    var icon = {
      info: "info",
      warn: "clock",
      danger: "shield",
      privacy: "shield-check",
    }[tone];
    return h(
      "div",
      {
        className: "vl-banner vl-banner-" + tone,
        role: tone === "danger" ? "alert" : "status",
      },
      h(Icon, { name: icon, size: 16 }),
      h(
        "div",
        { className: "vl-banner-main" },
        props.title
          ? h("span", { className: "vl-banner-title" }, props.title)
          : null,
        props.children
          ? h("span", { className: "vl-banner-body" }, props.children)
          : null,
      ),
      props.action || null,
      props.onClose
        ? h(
            "button",
            {
              type: "button",
              className: "vl-chip-x",
              "aria-label": "Dismiss",
              onClick: props.onClose,
            },
            h(Icon, { name: "x", size: 12 }),
          )
        : null,
    );
  }

  /* ---------- RoleSwitcher ---------- */
  var ROLES = {
    Administrator: "Full access · can toggle 2FA",
    "Remediation Lead": "Remediate, assign, raise tickets",
    "Security Auditor": "Read-only",
  };
  function RoleSwitcher(props) {
    var st = useState(props.value || "Administrator");
    var val = props.value != null && props.onChange ? props.value : st[0];
    var tfa = useState(!!props.twoFactor);
    return h(
      "div",
      { className: "vl-role" },
      h(
        "div",
        { className: "vl-role-head" },
        h(Icon, { name: "user", size: 14 }),
        h("span", { className: "vl-label" }, "Acting as"),
      ),
      h(
        "div",
        { className: "vl-role-opts", role: "radiogroup", "aria-label": "Role" },
        Object.keys(ROLES).map(function (r) {
          return h(
            "button",
            {
              key: r,
              type: "button",
              role: "radio",
              "aria-checked": r === val,
              className: cx("vl-role-opt", r === val && "is-on"),
              onClick: function () {
                st[1](r);
                if (props.onChange) props.onChange(r);
              },
            },
            h("span", { className: "vl-role-name" }, r),
            h("span", { className: "vl-role-desc" }, ROLES[r]),
          );
        }),
      ),
      h(
        "div",
        { className: "vl-role-2fa" },
        val === "Administrator"
          ? h(Toggle, {
              label: "Simulated 2FA",
              icon: "key",
              checked: tfa[0],
              onChange: tfa[1],
            })
          : h(
              Tooltip,
              { content: "Only Administrators can change 2FA." },
              h(
                Button,
                {
                  size: "sm",
                  restricted: true,
                  restrictedReason: "Only Administrators can change 2FA.",
                },
                "Simulated 2FA",
              ),
            ),
      ),
    );
  }

  /* ---------- TeamPicker ---------- */
  var TEAMS = [
    "Server Team",
    "DevOps / Cloud",
    "Database DBAs",
    "SecOps",
    "Application Dev",
  ];
  var RACI = [
    ["R", "Responsible"],
    ["A", "Accountable"],
    ["C", "Consulted"],
    ["I", "Informed"],
  ];
  function TeamPicker(props) {
    var t = useState(props.team || null),
      r = useState(props.role || "R");
    var ro = !!props.readOnly;
    return h(
      "div",
      { className: cx("vl-team", ro && "is-ro") },
      h(
        "div",
        {
          className: "vl-team-list",
          role: "radiogroup",
          "aria-label": "Owner team",
        },
        TEAMS.map(function (n, i) {
          return h(
            "button",
            {
              key: n,
              type: "button",
              role: "radio",
              "aria-checked": t[0] === n,
              "aria-disabled": ro || undefined,
              className: cx("vl-team-opt", t[0] === n && "is-on"),
              onClick: function () {
                if (!ro) {
                  t[1](n);
                  if (props.onChange) props.onChange(n, r[0]);
                }
              },
            },
            h("span", {
              className: "vl-team-dot",
              style: { background: "var(--chart-" + (i + 1) + ")" },
            }),
            n,
          );
        }),
      ),
      h(
        "div",
        {
          className: "vl-raci-pick",
          role: "radiogroup",
          "aria-label": "RACI role",
        },
        RACI.map(function (x) {
          return h(
            "button",
            {
              key: x[0],
              type: "button",
              role: "radio",
              "aria-checked": r[0] === x[0],
              "aria-disabled": ro || undefined,
              title: x[1],
              className: cx("vl-raci-opt", r[0] === x[0] && "is-on"),
              onClick: function () {
                if (!ro) {
                  r[1](x[0]);
                  if (props.onChange) props.onChange(t[0], x[0]);
                }
              },
            },
            h("b", null, x[0]),
            h("span", null, x[1]),
          );
        }),
      ),
      ro
        ? h(
            "span",
            { className: "vl-team-ro" },
            h(Icon, { name: "lock", size: 12 }),
            "Security Auditors have read-only access.",
          )
        : null,
    );
  }

  /* ---------- RaciMatrix ---------- */
  function RaciMatrix(props) {
    var data = props.data || {};
    var max = 1;
    TEAMS.forEach(function (tm) {
      RACI.forEach(function (x) {
        var v = (data[tm] || {})[x[0]] || 0;
        if (v > max) max = v;
      });
    });
    return h(
      "table",
      { className: "vl-raci" },
      h(
        "thead",
        null,
        h(
          "tr",
          null,
          h("th", null, "Team"),
          RACI.map(function (x) {
            return h("th", { key: x[0] }, h("b", null, x[0]), " ", x[1]);
          }),
        ),
      ),
      h(
        "tbody",
        null,
        TEAMS.map(function (tm, i) {
          return h(
            "tr",
            { key: tm },
            h(
              "th",
              { scope: "row" },
              h("span", {
                className: "vl-team-dot",
                style: { background: "var(--chart-" + (i + 1) + ")" },
              }),
              tm,
            ),
            RACI.map(function (x) {
              var v = (data[tm] || {})[x[0]] || 0;
              var step = v
                ? [1, 2, 4, 5][Math.min(3, Math.floor((4 * v) / max))]
                : 0;
              return h(
                "td",
                {
                  key: x[0],
                  className: cx(
                    "vl-raci-cell",
                    "heat-" + step,
                    step >= 4 && "is-strong",
                  ),
                },
                v || "·",
              );
            }),
          );
        }),
      ),
    );
  }

  /* ---------- Sparkline ---------- */
  function Sparkline(props) {
    var v = props.values || [];
    var W = props.width || 96,
      H = props.height || 24;
    var mx = Math.max.apply(null, v.concat([1])),
      mn = Math.min.apply(null, v.concat([0]));
    var pts = v.map(function (y, i) {
      return [
        (i / Math.max(1, v.length - 1)) * (W - 4) + 2,
        H - 2 - ((y - mn) / Math.max(1, mx - mn)) * (H - 4),
      ];
    });
    var d = pts
      .map(function (p, i) {
        return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1);
      })
      .join("");
    var last = pts[pts.length - 1];
    return h(
      "svg",
      {
        className: "vl-spark vl-spark-" + (props.tone || "lens"),
        width: W,
        height: H,
        viewBox: "0 0 " + W + " " + H,
        role: "img",
        "aria-label": props.label || "Trend: " + v.join(", "),
      },
      h("path", {
        d: d,
        fill: "none",
        strokeWidth: 1.75,
        strokeLinejoin: "round",
        strokeLinecap: "round",
      }),
      last ? h("circle", { cx: last[0], cy: last[1], r: 2.5 }) : null,
    );
  }

  /* ---------- SlaTrend ---------- */
  function SlaTrend(props) {
    var m = props.months || [];
    var cur = m.length ? m[m.length - 1].pct : 0;
    function band(p) {
      return p >= 80 ? "ok" : p >= 50 ? "warn" : "danger";
    }
    return h(
      "div",
      { className: "vl-slatrend" },
      h(
        "div",
        { className: "vl-slatrend-head" },
        h("span", { className: "vl-label" }, props.label || "SLA compliance"),
        h(
          "span",
          { className: "vl-slatrend-val vl-fg-status-" + band(cur) },
          cur + "%",
        ),
        h(
          "span",
          { className: "vl-slatrend-band" },
          band(cur) === "ok"
            ? "On target"
            : band(cur) === "warn"
              ? "Below target"
              : "Critical",
        ),
      ),
      h(
        "div",
        { className: "vl-slatrend-bars" },
        m.map(function (x) {
          return h(
            "div",
            {
              key: x.label,
              className: "vl-slatrend-col",
              title: x.label + ": " + x.pct + "%",
            },
            h(
              "div",
              { className: "vl-slatrend-track" },
              h("span", {
                className: "vl-slatrend-bar vl-bg-status-" + band(x.pct),
                style: { height: x.pct + "%" },
              }),
            ),
            h("span", { className: "vl-slatrend-m" }, x.label),
          );
        }),
      ),
      h(
        "div",
        { className: "vl-slatrend-key" },
        h("span", null, "≥ 80% on target"),
        h("span", null, "50–79% below"),
        h("span", null, "< 50% critical"),
      ),
    );
  }

  /* ---------- EffortMeter ---------- */
  function EffortMeter(props) {
    var v = Math.max(1, Math.min(10, props.value || 1));
    var segs = [];
    for (var i = 1; i <= 10; i++)
      segs.push(
        h("span", {
          key: i,
          className: cx("vl-effort-seg", i <= Math.round(v) && "is-on"),
        }),
      );
    return h(
      "div",
      {
        className: cx("vl-effort", v >= 6 ? "is-high" : "is-low"),
        role: "meter",
        "aria-valuemin": 1,
        "aria-valuemax": 10,
        "aria-valuenow": v,
        "aria-label": "Remediation effort",
      },
      h("div", { className: "vl-effort-segs" }, segs),
      h("span", { className: "vl-effort-v" }, v.toFixed(1)),
      h(
        "span",
        { className: "vl-effort-l" },
        v >= 6 ? "High effort" : "Low effort",
      ),
    );
  }

  /* ---------- TierBadge ---------- */
  var TIERS = {
    1: "Tier 1 · Crown Jewel",
    2: "Tier 2 · Production",
    3: "Tier 3 · Dev/Staging",
  };
  function TierBadge(props) {
    var t = props.tier || 3;
    return h(
      "span",
      { className: "vl-tier vl-tier-" + t },
      h(
        "span",
        { className: "vl-tier-pips", "aria-hidden": "true" },
        [1, 2, 3].map(function (i) {
          return h("i", { key: i, className: i <= 4 - t ? "is-on" : null });
        }),
      ),
      props.short ? "Tier " + t : TIERS[t],
    );
  }

  /* ---------- AssetRow ---------- */
  var DEVICE = {
    Database: "database",
    "API Gateway": "router",
    "Domain Controller": "key",
    "Web Server": "globe",
    Server: "server",
    Workstation: "monitor",
  };
  function AssetRow(props) {
    var c = props.counts || {};
    return h(
      "div",
      {
        className: "vl-asset",
        role: props.onClick ? "button" : undefined,
        tabIndex: props.onClick ? 0 : undefined,
        onClick: props.onClick,
      },
      h(
        "span",
        { className: "vl-asset-icon" },
        h(Icon, { name: DEVICE[props.device] || "server", size: 16 }),
      ),
      h(
        "div",
        { className: "vl-asset-id" },
        h("span", { className: "vl-asset-host" }, props.host),
        h(
          "span",
          { className: "vl-asset-sub" },
          props.device,
          " · ",
          props.os,
          props.eol ? h(ThreatTag, { kind: "eol" }) : null,
        ),
      ),
      h(TierBadge, { tier: props.tier, short: true }),
      h("span", { className: "vl-asset-owner" }, props.owner),
      h(
        "span",
        { className: "vl-asset-counts" },
        SEV_ORDER.slice(0, 3).map(function (s) {
          return c[s]
            ? h(SeverityBadge, { key: s, severity: s, count: c[s] })
            : null;
        }),
      ),
      props.score != null
        ? h("span", { className: "vl-asset-score" }, props.score)
        : null,
    );
  }

  /* ---------- BreachList ---------- */
  function BreachList(props) {
    var items = props.items || [];
    return h(
      "ol",
      { className: "vl-breach" },
      items.map(function (it, i) {
        var sel = props.onSelect
          ? function () {
              props.onSelect(it, i);
            }
          : null;
        return h(
          "li",
          {
            key: i,
            className: cx("vl-breach-row", sel && "is-link"),
            role: sel ? "button" : null,
            tabIndex: sel ? 0 : null,
            onClick: sel,
            onKeyDown: sel ? kbd(sel) : null,
            "aria-label": sel
              ? it.title + " on " + it.host + ", risk " + it.risk
              : null,
          },
          h("span", { className: "vl-breach-rank" }, i + 1),
          h(
            "div",
            { className: "vl-breach-main" },
            h("span", { className: "vl-breach-title" }, it.title),
            h("span", { className: "vl-breach-host" }, it.host),
          ),
          h(
            "span",
            { className: "vl-breach-tags" },
            (it.tags || []).map(function (t) {
              return h(ThreatTag, { key: t, kind: t });
            }),
          ),
          h("span", { className: "vl-breach-risk" }, it.risk),
        );
      }),
    );
  }

  /* ---------- ExposureBars ---------- */
  var EXPO = {
    kev: ["CISA KEV", "flame", "threat-kev"],
    zeroday: ["Zero-day", "zap", "threat-zeroday"],
    ransomware: ["Ransomware", "skull", "threat-ransomware"],
    exploitable: ["Exploitable", "shield", "sev-high"],
    breached: ["SLA breached", "clock", "status-danger"],
    eol: ["EOL software", "clock", "ink-muted"],
  };
  function ExposureBars(props) {
    var total = props.total || 1;
    return h(
      "div",
      { className: "vl-expo" },
      (props.items || []).map(function (it) {
        var e = EXPO[it.kind] || EXPO.exploitable,
          pct = Math.round((100 * it.value) / total);
        return h(
          "div",
          { key: it.kind, className: "vl-expo-row" },
          h(
            "span",
            {
              className: "vl-expo-label",
              style: { color: "var(--" + e[2] + ")" },
            },
            h(Icon, { name: e[1], size: 14 }),
            h("span", { style: { color: "var(--ink)" } }, e[0]),
          ),
          h(
            "span",
            { className: "vl-expo-v" },
            it.value,
            h("span", null, " / " + total),
          ),
          h(
            "div",
            {
              className: "vl-expo-track",
              role: "meter",
              "aria-valuemin": 0,
              "aria-valuemax": total,
              "aria-valuenow": it.value,
              "aria-label": e[0],
            },
            h("span", {
              style: { width: pct + "%", background: "var(--" + e[2] + ")" },
            }),
          ),
        );
      }),
    );
  }

  /* ---------- RiskDelta ---------- */
  function RiskDelta(props) {
    var p = props.pct || 0,
      better = p < 0;
    return h(
      "div",
      { className: "vl-delta" },
      h("span", { className: "vl-label" }, props.label || "Net risk delta"),
      h(
        "div",
        { className: "vl-delta-main" },
        h(Icon, { name: better ? "trend-down" : "trend-up", size: 20 }),
        h(
          "span",
          { className: cx("vl-delta-v", better ? "is-better" : "is-worse") },
          (p > 0 ? "+" : p < 0 ? "−" : "") + Math.abs(p) + "%",
        ),
        h(
          "span",
          { className: "vl-delta-word" },
          better ? "Risk reduced" : p === 0 ? "No change" : "Risk increased",
        ),
      ),
      h(
        "div",
        { className: "vl-delta-ab" },
        h(
          "span",
          null,
          h("b", null, "A"),
          " ",
          props.baseline || "Baseline",
          h("i", null, props.before != null ? "ΣCVSS " + props.before : ""),
        ),
        h(Icon, { name: "chevron-right", size: 12 }),
        h(
          "span",
          null,
          h("b", null, "B"),
          " ",
          props.retest || "Re-test",
          h("i", null, props.after != null ? "ΣCVSS " + props.after : ""),
        ),
      ),
    );
  }

  /* ---------- TopologyMap ---------- */
  function TopologyMap(props) {
    var subnets = props.subnets || [];
    var sel = useState(props.selected || null);
    var CX = 320,
      CY = 240,
      R1 = 125,
      R2 = 45;
    var nodes = [],
      links = [],
      groups = [];
    subnets.forEach(function (s, i) {
      var a = (i / subnets.length) * Math.PI * 2 - Math.PI / 2;
      var sx = CX + R1 * Math.cos(a),
        sy = CY + R1 * Math.sin(a);
      links.push(
        h("line", {
          key: "l" + i,
          className: "vl-topo-link",
          x1: CX,
          y1: CY,
          x2: sx,
          y2: sy,
        }),
      );
      groups.push(
        h(
          "g",
          { key: "s" + i },
          h("circle", { className: "vl-topo-subnet", cx: sx, cy: sy, r: 14 }),
          h(
            "text",
            {
              className: "vl-topo-label",
              x: CX + (R1 + R2 + 30) * Math.cos(a),
              y: CY + (R1 + R2 + 30) * Math.sin(a) + 4,
              textAnchor:
                Math.abs(Math.cos(a)) < 0.3
                  ? "middle"
                  : Math.cos(a) > 0
                    ? "start"
                    : "end",
            },
            s.name,
          ),
        ),
      );
      (s.hosts || []).forEach(function (hst, j) {
        var n = s.hosts.length,
          b = a + (j - (n - 1) / 2) * (Math.PI / 4.5);
        var hx = sx + R2 * Math.cos(b),
          hy = sy + R2 * Math.sin(b);
        var r = Math.min(12, 6 + Math.log2((hst.count || 0) + 1) * 2);
        links.push(
          h("line", {
            key: "h" + i + j,
            className: "vl-topo-hlink",
            x1: sx,
            y1: sy,
            x2: hx,
            y2: hy,
          }),
        );
        var on = sel[0] === hst.ip,
          dim = sel[0] && !on;
        nodes.push(
          h(
            "g",
            {
              key: hst.ip,
              className: cx("vl-topo-host", on && "is-sel", dim && "is-dim"),
              tabIndex: 0,
              role: "button",
              "aria-label":
                hst.ip + ", " + hst.count + " findings, worst " + hst.severity,
              onClick: function () {
                sel[1](on ? null : hst.ip);
                if (props.onSelect) props.onSelect(on ? null : hst.ip);
              },
            },
            h("circle", {
              cx: hx,
              cy: hy,
              r: r,
              className: "vl-fill-" + (hst.severity || "info"),
            }),
            on
              ? h("circle", {
                  cx: hx,
                  cy: hy,
                  r: r + 4,
                  className: "vl-topo-ring",
                })
              : null,
            h("title", null, hst.ip + " · " + hst.count + " findings"),
          ),
        );
      });
    });
    return h(
      "div",
      { className: "vl-topo" },
      h(
        "svg",
        {
          viewBox: "0 0 640 480",
          width: "100%",
          role: "group",
          "aria-label": "Subnet topology",
        },
        links,
        groups,
        h(
          "g",
          null,
          h("circle", { className: "vl-topo-core", cx: CX, cy: CY, r: 22 }),
          h(
            "text",
            {
              className: "vl-topo-core-t",
              x: CX,
              y: CY + 4,
              textAnchor: "middle",
            },
            "SCAN",
          ),
        ),
        nodes,
      ),
      h(ChartLegend, {
        items: SEV_ORDER.map(function (s) {
          return { label: SEV_LABEL[s], severity: s };
        }),
      }),
    );
  }

  /* ---------- TemplateCard ---------- */
  function TemplateCard(props) {
    var locked = !!props.locked;
    var card = h(
      "button",
      {
        type: "button",
        className: cx("vl-tpl", locked && "is-locked"),
        "aria-disabled": locked || undefined,
        onClick: function (e) {
          if (locked) {
            e.preventDefault();
            return;
          }
          if (props.onAdd) props.onAdd();
        },
      },
      h(
        "span",
        { className: "vl-tpl-thumb", "aria-hidden": "true" },
        h(TplThumb, { kind: props.chart || "bar" }),
      ),
      h(
        "span",
        { className: "vl-tpl-title" },
        locked ? h(Icon, { name: "lock", size: 12 }) : null,
        props.title,
      ),
      h("span", { className: "vl-tpl-desc" }, props.description),
      h("span", { className: "vl-tpl-meta" }, props.chartLabel || props.chart),
    );
    return locked
      ? h(
          Tooltip,
          {
            content: props.lockReason || "Needs at least 2 dated scan batches.",
          },
          card,
        )
      : card;
  }
  function TplThumb(props) {
    var k = props.kind;
    if (k === "donut")
      return h(
        "svg",
        { viewBox: "0 0 80 44" },
        h("circle", {
          cx: 40,
          cy: 22,
          r: 15,
          fill: "none",
          strokeWidth: 8,
          className: "vl-thumb-a",
          strokeDasharray: "40 100",
        }),
        h("circle", {
          cx: 40,
          cy: 22,
          r: 15,
          fill: "none",
          strokeWidth: 8,
          className: "vl-thumb-b",
          strokeDasharray: "30 100",
          strokeDashoffset: -42,
        }),
        h("circle", {
          cx: 40,
          cy: 22,
          r: 15,
          fill: "none",
          strokeWidth: 8,
          className: "vl-thumb-c",
          strokeDasharray: "20 100",
          strokeDashoffset: -74,
        }),
      );
    if (k === "line")
      return h(
        "svg",
        { viewBox: "0 0 80 44" },
        h("path", {
          d: "M4 34 20 26 34 30 50 14 64 18 76 8",
          fill: "none",
          strokeWidth: 2.5,
          className: "vl-thumb-line",
        }),
      );
    if (k === "heatmap") {
      var cs = [];
      for (var y = 0; y < 3; y++)
        for (var x = 0; x < 5; x++)
          cs.push(
            h("rect", {
              key: x + "-" + y,
              x: 6 + x * 14,
              y: 4 + y * 13,
              width: 12,
              height: 11,
              rx: 2,
              className: "vl-thumb-a",
              opacity: 0.2 + ((x * 3 + y * 5) % 7) / 9,
            }),
          );
      return h("svg", { viewBox: "0 0 80 44" }, cs);
    }
    return h(
      "svg",
      { viewBox: "0 0 80 44" },
      [18, 30, 12, 24, 8].map(function (v, i) {
        return h("rect", {
          key: i,
          x: 8 + i * 14,
          y: 40 - v,
          width: 10,
          height: v,
          rx: 2,
          className: i === 1 ? "vl-thumb-a" : "vl-thumb-b",
        });
      }),
    );
  }

  /* ================= v3b: remaining spec engines ================= */
  function chartFrame(W, H, padL, padB, padT, max, ticks) {
    return ticks.map(function (t) {
      var y = padT + (H - padB - padT) * (1 - t);
      return h(
        "g",
        { key: "g" + t },
        h("line", { className: "vl-grid", x1: padL, x2: W, y1: y, y2: y }),
        h(
          "text",
          { className: "vl-axis", x: padL - 6, y: y + 4, textAnchor: "end" },
          Math.round(max * t),
        ),
      );
    });
  }
  function seriesColor(s, i) {
    return s.severity
      ? "var(--sev-" + s.severity + ")"
      : s.color || "var(--chart-" + ((i % 6) + 1) + ")";
  }

  /* ---------- LineChart (line + area) ---------- */
  function LineChart(props) {
    var labels = props.labels || [],
      series = props.series || [];
    var W = props.width || 480,
      H = props.height || 200,
      padL = 32,
      padB = 24,
      padT = 8;
    var mx = 1;
    series.forEach(function (s) {
      s.values.forEach(function (v) {
        if (v > mx) mx = v;
      });
    });
    var nice = Math.ceil(mx / 4) * 4 || 4;
    var hov = useState(null);
    function X(i) {
      return padL + 8 + (i * (W - padL - 16)) / Math.max(1, labels.length - 1);
    }
    function Y(v) {
      return padT + (H - padB - padT) * (1 - v / nice);
    }
    function path(vals) {
      // monotone-ish smoothing
      /* null / undefined values are gaps: the line breaks and resumes */
      return vals
        .map(function (v, i) {
          if (v == null) return "";
          var pv = i ? vals[i - 1] : null;
          if (pv == null) return "M" + X(i) + " " + Y(v);
          var x0 = X(i - 1),
            y0 = Y(pv),
            x1 = X(i),
            y1 = Y(v),
            cx = (x0 + x1) / 2;
          return (
            "C" + cx + " " + y0 + " " + cx + " " + y1 + " " + x1 + " " + y1
          );
        })
        .join("");
    }
    return h(
      "div",
      { className: "vl-chart" },
      h(
        "svg",
        {
          viewBox: "0 0 " + W + " " + H,
          width: "100%",
          role: "img",
          "aria-label": props.label || "Line chart",
          onMouseLeave: function () {
            hov[1](null);
          },
        },
        h(
          "defs",
          null,
          series.map(function (s, i) {
            return h(
              "linearGradient",
              {
                key: i,
                id: "vl-ag-" + i + (props.id || ""),
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 1,
              },
              h("stop", {
                offset: "0%",
                stopColor: seriesColor(s, i),
                stopOpacity: 0.28,
              }),
              h("stop", {
                offset: "100%",
                stopColor: seriesColor(s, i),
                stopOpacity: 0,
              }),
            );
          }),
        ),
        chartFrame(W, H, padL, padB, padT, nice, [0, 0.25, 0.5, 0.75, 1]),
        labels.map(function (l, i) {
          return h(
            "text",
            {
              key: "x" + i,
              className: "vl-axis",
              x: X(i),
              y: H - 8,
              textAnchor: "middle",
            },
            l,
          );
        }),
        hov[0] != null
          ? h("line", {
              className: "vl-crosshair",
              x1: X(hov[0]),
              x2: X(hov[0]),
              y1: padT,
              y2: H - padB,
            })
          : null,
        series.map(function (s, i) {
          var d = path(s.values);
          return h(
            "g",
            { key: s.label },
            props.area
              ? h("path", {
                  d:
                    d +
                    "L" +
                    X(s.values.length - 1) +
                    " " +
                    (H - padB) +
                    "L" +
                    X(0) +
                    " " +
                    (H - padB) +
                    "Z",
                  fill: "url(#vl-ag-" + i + (props.id || "") + ")",
                })
              : null,
            h("path", {
              d: d,
              fill: "none",
              stroke: seriesColor(s, i),
              strokeWidth: 2,
              strokeDasharray: s.dashed ? "5 4" : null,
            }),
            s.values.map(function (v, j) {
              return v == null
                ? null
                : h("circle", {
                    key: j,
                    cx: X(j),
                    cy: Y(v),
                    r: hov[0] === j ? 4.5 : 2.5,
                    fill: seriesColor(s, i),
                    stroke: "var(--surface-100)",
                    strokeWidth: 1.5,
                  });
            }),
          );
        }),
        labels.map(function (l, i) {
          return h("rect", {
            key: "hit" + i,
            x: X(i) - 12,
            y: padT,
            width: 24,
            height: H - padB - padT,
            fill: "transparent",
            onMouseEnter: function () {
              hov[1](i);
            },
          });
        }),
      ),
      h(ChartLegend, {
        items: series.map(function (s, i) {
          return {
            label: s.label,
            severity: s.severity,
            color: s.severity ? null : seriesColor(s, i),
            value:
              hov[0] != null
                ? s.values[hov[0]]
                : s.values
                    .filter(function (v) {
                      return v != null;
                    })
                    .slice(-1)[0],
          };
        }),
      }),
    );
  }

  /* ---------- StackedBarChart ---------- */
  function StackedBarChart(props) {
    var labels = props.labels || [],
      series = props.series || [];
    var W = props.width || 480,
      H = props.height || 200,
      padL = 32,
      padB = 24,
      padT = 8;
    var totals = labels.map(function (_, i) {
      return series.reduce(function (a, s) {
        return a + (s.values[i] || 0);
      }, 0);
    });
    var nice = Math.ceil(Math.max.apply(null, totals.concat([1])) / 4) * 4;
    var bw = (W - padL) / labels.length,
      w = Math.min(48, bw * 0.6),
      sel = useSel(props);
    return h(
      "div",
      { className: "vl-chart" },
      h(
        "svg",
        {
          viewBox: "0 0 " + W + " " + H,
          width: "100%",
          role: "img",
          "aria-label": props.label || "Stacked bar chart",
        },
        chartFrame(W, H, padL, padB, padT, nice, [0, 0.25, 0.5, 0.75, 1]),
        labels.map(function (l, i) {
          var x = padL + i * bw + (bw - w) / 2,
            acc = 0;
          return h(
            "g",
            {
              key: l,
              className: cx(
                "vl-bar",
                sel[0] != null && sel[0] !== l && "is-dim",
                sel[0] === l && "is-sel",
              ),
              onClick: function () {
                sel[1](l);
              },
              onKeyDown: kbd(function () {
                sel[1](l);
              }),
              role: props.static ? null : "button",
              tabIndex: props.static ? null : 0,
              "aria-pressed": sel[0] === l,
            },
            h(
              "title",
              null,
              l +
                ": " +
                series
                  .map(function (s) {
                    return s.label + " " + (s.values[i] || 0);
                  })
                  .join(", "),
            ),
            series.map(function (s, k) {
              var v = s.values[i] || 0,
                hh = ((H - padB - padT) * v) / nice,
                y = H - padB - acc - hh;
              acc += hh;
              return v
                ? h("rect", {
                    key: k,
                    x: x,
                    y: y,
                    width: w,
                    height: Math.max(0, hh - 1),
                    fill: seriesColor(s, k),
                    rx: k === series.length - 1 ? 3 : 0,
                  })
                : null;
            }),
            h(
              "text",
              {
                className: "vl-axis",
                x: x + w / 2,
                y: H - 8,
                textAnchor: "middle",
              },
              fit(String(l), bw - 4),
            ),
          );
        }),
      ),
      h(ChartLegend, {
        items: series.map(function (s, k) {
          return {
            label: s.label,
            severity: s.severity,
            color: s.severity ? null : seriesColor(s, k),
          };
        }),
      }),
    );
  }

  /* ---------- RadarChart ---------- */
  function RadarChart(props) {
    var axes = props.axes || [],
      series = props.series || [];
    var C = 110,
      R = 80,
      n = axes.length || 1,
      max = props.max || 10;
    function pt(i, v) {
      var a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return [
        C + ((R * v) / max) * Math.cos(a),
        C + ((R * v) / max) * Math.sin(a),
      ];
    }
    var rings = [0.25, 0.5, 0.75, 1];
    return h(
      "div",
      { className: "vl-chart vl-donut" },
      h(
        "svg",
        {
          viewBox: "-50 -6 320 232",
          width: 320,
          height: 232,
          role: "img",
          "aria-label": props.label || "Radar chart",
        },
        rings.map(function (r) {
          return h("polygon", {
            key: r,
            className: "vl-radar-ring",
            points: axes
              .map(function (_, i) {
                return pt(i, max * r).join(",");
              })
              .join(" "),
          });
        }),
        axes.map(function (a, i) {
          var p = pt(i, max),
            q = pt(i, max * 1.22);
          return h(
            "g",
            { key: a },
            h("line", {
              className: "vl-grid",
              x1: C,
              y1: C,
              x2: p[0],
              y2: p[1],
            }),
            h(
              "text",
              {
                className: "vl-axis",
                x: q[0],
                y: q[1] + 4,
                textAnchor:
                  Math.abs(q[0] - C) < 8
                    ? "middle"
                    : q[0] > C
                      ? "start"
                      : "end",
              },
              a,
            ),
          );
        }),
        series.map(function (s, k) {
          var pts = s.values.map(function (v, i) {
            return pt(i, v);
          });
          return h(
            "g",
            { key: s.label },
            h("polygon", {
              points: pts
                .map(function (p) {
                  return p.join(",");
                })
                .join(" "),
              fill: seriesColor(s, k),
              fillOpacity: 0.18,
              stroke: seriesColor(s, k),
              strokeWidth: 2,
              strokeDasharray: s.dashed ? "5 4" : null,
            }),
            pts.map(function (p, i) {
              return h("circle", {
                key: i,
                cx: p[0],
                cy: p[1],
                r: 3,
                fill: seriesColor(s, k),
              });
            }),
          );
        }),
      ),
      h(ChartLegend, {
        items: series.map(function (s, k) {
          return { label: s.label, color: seriesColor(s, k) };
        }),
      }),
    );
  }

  /* ---------- Treemap (squarified, 1 level) ---------- */
  function fit(t, px) {
    var n = Math.floor(px / 6.6);
    return t.length <= n ? t : t.slice(0, Math.max(1, n - 1)) + "…";
  }
  function Treemap(props) {
    var data = (props.data || []).slice().sort(function (a, b) {
      return b.value - a.value;
    });
    var W = props.width || 480,
      H = props.height || 220,
      total =
        data.reduce(function (a, d) {
          return a + d.value;
        }, 0) || 1;
    var rects = [],
      x = 0,
      y = 0,
      w = W,
      hh = H,
      items = data.map(function (d) {
        return Object.assign({}, d, { area: (d.value / total) * W * H });
      });
    function worst(row, side) {
      var s = row.reduce(function (a, r) {
          return a + r.area;
        }, 0),
        mx = Math.max.apply(
          null,
          row.map(function (r) {
            return r.area;
          }),
        ),
        mn = Math.min.apply(
          null,
          row.map(function (r) {
            return r.area;
          }),
        );
      return Math.max(
        (side * side * mx) / (s * s),
        (s * s) / (side * side * mn),
      );
    }
    function layout(row) {
      var s = row.reduce(function (a, r) {
        return a + r.area;
      }, 0);
      if (w >= hh) {
        var cw = s / hh,
          cy = y;
        row.forEach(function (r) {
          var rh = r.area / cw;
          rects.push({ d: r, x: x, y: cy, w: cw, h: rh });
          cy += rh;
        });
        x += cw;
        w -= cw;
      } else {
        var ch = s / w,
          cx0 = x;
        row.forEach(function (r) {
          var rw = r.area / ch;
          rects.push({ d: r, x: cx0, y: y, w: rw, h: ch });
          cx0 += rw;
        });
        y += ch;
        hh -= ch;
      }
    }
    var row = [];
    items.forEach(function (it) {
      var side = Math.min(w, hh);
      if (!row.length || worst(row.concat([it]), side) <= worst(row, side))
        row.push(it);
      else {
        layout(row);
        row = [it];
      }
    });
    if (row.length) layout(row);
    var sel = useSel(props);
    return h(
      "div",
      { className: "vl-chart" },
      h(
        "svg",
        {
          viewBox: "0 0 " + W + " " + H,
          width: "100%",
          role: "img",
          "aria-label": props.label || "Treemap",
        },
        rects.map(function (r, i) {
          var big = r.w > 70 && r.h > 34,
            dim = sel[0] != null && sel[0] !== r.d.label;
          return h(
            "g",
            {
              key: r.d.label,
              className: cx(
                "vl-tm",
                dim && "is-dim",
                sel[0] === r.d.label && "is-sel",
              ),
              onClick: function () {
                sel[1](r.d.label);
              },
              onKeyDown: kbd(function () {
                sel[1](r.d.label);
              }),
              role: props.static ? null : "button",
              tabIndex: props.static ? null : 0,
              "aria-label": r.d.label + ": " + r.d.value,
            },
            h("rect", {
              x: r.x + 1.5,
              y: r.y + 1.5,
              width: Math.max(0, r.w - 3),
              height: Math.max(0, r.h - 3),
              rx: 8,
              fill: r.d.severity
                ? "var(--sev-" + r.d.severity + ")"
                : r.d.color || "var(--chart-" + ((i % 6) + 1) + ")",
            }),
            big
              ? h(
                  "text",
                  { className: "vl-tm-t", x: r.x + 10, y: r.y + 20 },
                  fit(r.d.label, r.w - 20),
                )
              : null,
            big
              ? h(
                  "text",
                  { className: "vl-tm-v", x: r.x + 10, y: r.y + 36 },
                  r.d.value,
                )
              : null,
            h("title", null, r.d.label + ": " + r.d.value),
          );
        }),
      ),
    );
  }

  /* ---------- ScatterChart ---------- */
  function ScatterChart(props) {
    var cats = props.categories || [],
      pts = props.points || [];
    var W = props.width || 480,
      rowH = 30,
      padL = 132,
      padT = 8,
      padB = 28,
      H = padT + cats.length * rowH + padB;
    function X(v) {
      return padL + ((W - padL - 12) * v) / 10;
    }
    var sel = useSel(props);
    return h(
      "div",
      { className: "vl-chart" },
      h(
        "svg",
        {
          viewBox: "0 0 " + W + " " + H,
          width: "100%",
          role: "img",
          "aria-label": props.label || "CVSS scatter",
        },
        [0, 2, 4, 6, 8, 10].map(function (t) {
          return h(
            "g",
            { key: t },
            h("line", {
              className: "vl-grid",
              x1: X(t),
              x2: X(t),
              y1: padT,
              y2: H - padB,
            }),
            h(
              "text",
              {
                className: "vl-axis",
                x: X(t),
                y: H - 10,
                textAnchor: "middle",
              },
              t,
            ),
          );
        }),
        [4, 7, 9].map(function (t) {
          return h("line", {
            key: "b" + t,
            className: "vl-band",
            x1: X(t),
            x2: X(t),
            y1: padT,
            y2: H - padB,
          });
        }),
        cats.map(function (c, i) {
          return h(
            "text",
            {
              key: c,
              className: "vl-axis vl-axis-mono",
              x: padL - 10,
              y: padT + i * rowH + rowH / 2 + 4,
              textAnchor: "end",
            },
            c,
          );
        }),
        pts.map(function (p, i) {
          var cy =
            padT +
            cats.indexOf(p.category) * rowH +
            rowH / 2 +
            ((i % 3) - 1) * 5;
          return h(
            "g",
            {
              key: i,
              transform: "translate(" + X(p.cvss) + " " + cy + ")",
              className: cx(
                "vl-pt",
                "vl-fg-" + p.severity,
                sel[0] != null && sel[0] !== p.category && "is-dim",
              ),
              onClick: function () {
                sel[1](p.category);
              },
            },
            h(
              "g",
              { transform: "translate(-5 -5)" },
              h(SeverityMarker, { severity: p.severity, size: 10 }),
            ),
            h("title", null, p.category + " · " + p.name + " · CVSS " + p.cvss),
          );
        }),
      ),
      h(ChartLegend, {
        items: SEV_ORDER.map(function (s) {
          return { label: SEV_LABEL[s], severity: s };
        }),
      }),
    );
  }

  /* ---------- SlaBreachCard (SlaBreachKpiWidget) ---------- */
  function SlaBreachCard(props) {
    var b = props.breakdown || {};
    var total =
      props.total != null
        ? props.total
        : SEV_ORDER.reduce(function (a, s) {
            return a + (b[s] || 0);
          }, 0);
    return h(
      "div",
      { className: "vl-kpi vl-slab" },
      h(
        "div",
        { className: "vl-kpi-head" },
        h("span", { className: "vl-label" }, "SLA breached"),
        h(Icon, { name: "clock", size: 16 }),
      ),
      h(
        "div",
        {
          className: "vl-kpi-value",
          style: { color: total ? "var(--status-danger)" : "var(--status-ok)" },
        },
        total,
      ),
      h(
        "div",
        { className: "vl-slab-list" },
        SEV_ORDER.map(function (s) {
          return h(
            "button",
            {
              key: s,
              type: "button",
              className: "vl-slab-row",
              disabled: !b[s],
              onClick: function () {
                if (props.onSelect) props.onSelect(s);
              },
            },
            h(SeverityMarker, { severity: s }),
            h("span", null, SEV_LABEL[s]),
            h(
              "span",
              { className: "vl-slab-days" },
              {
                critical: "14d",
                high: "30d",
                medium: "90d",
                low: "180d",
                info: "360d",
              }[s],
            ),
            h("span", { className: "vl-slab-n" }, b[s] || 0),
          );
        }),
      ),
    );
  }

  /* ---------- SlaProjectionTable (C.H.I.) ---------- */
  function SlaProjectionTable(props) {
    var rows = props.rows || [];
    return h(
      "div",
      { className: "vl-table-wrap" },
      h(
        "table",
        { className: "vl-table vl-chi" },
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            [
              "Severity",
              "SLA",
              "Active",
              "Breached",
              "At risk ≤ 7d",
              "Avg days left",
            ].map(function (c, i) {
              return h(
                "th",
                { key: c, className: i > 1 ? "is-num" : null },
                h("span", { className: "vl-th-btn" }, c),
              );
            }),
          ),
        ),
        h(
          "tbody",
          null,
          rows.map(function (r) {
            return h(
              "tr",
              { key: r.severity },
              h("td", null, h(SeverityBadge, { severity: r.severity })),
              h(
                "td",
                { className: "is-mono vl-td-muted" },
                r.sla ||
                  {
                    critical: "14d",
                    high: "30d",
                    medium: "90d",
                    low: "180d",
                    info: "360d",
                  }[r.severity],
              ),
              h("td", { className: "is-mono is-num" }, r.active),
              h(
                "td",
                { className: "is-mono is-num" },
                r.breached
                  ? h("span", { className: "vl-fg-status-danger" }, r.breached)
                  : "0",
              ),
              h(
                "td",
                { className: "is-mono is-num" },
                r.atRisk
                  ? h("span", { className: "vl-fg-status-warn" }, r.atRisk)
                  : "0",
              ),
              h(
                "td",
                { className: "is-mono is-num" },
                r.avgDays < 0
                  ? h(
                      "span",
                      { className: "vl-fg-status-danger" },
                      "−" + Math.abs(r.avgDays),
                    )
                  : r.avgDays,
              ),
            );
          }),
        ),
      ),
    );
  }

  /* ---------- ExposureRegistry ---------- */
  function ExposureRegistry(props) {
    return h(
      "div",
      { className: "vl-reg" },
      (props.items || []).map(function (it) {
        return h(
          "div",
          { key: it.name, className: "vl-reg-row" },
          h(ThreatTag, { kind: it.kind === "zeroday" ? "zeroday" : "eol" }),
          h(
            "div",
            { className: "vl-reg-main" },
            h("span", { className: "vl-reg-name" }, it.name),
            it.detail
              ? h("span", { className: "vl-reg-detail" }, it.detail)
              : null,
          ),
          h(
            "span",
            { className: "vl-reg-stat" },
            h("b", null, it.hosts),
            it.hosts === 1 ? " host" : " hosts",
          ),
          h(
            "span",
            { className: "vl-reg-stat" },
            it.criticals
              ? h(SeverityBadge, { severity: "critical", count: it.criticals })
              : h("span", { className: "vl-td-muted" }, "No critical"),
          ),
        );
      }),
    );
  }

  window.VAPTLens = Object.assign(window.VAPTLens || {}, {
    Icon: Icon,
    Logo: Logo,
    Button: Button,
    SeverityBadge: SeverityBadge,
    ThreatTag: ThreatTag,
    SlaPill: SlaPill,
    FilterChip: FilterChip,
    KpiCard: KpiCard,
    WidgetCard: WidgetCard,
    NavTabs: NavTabs,
    RiskMeter: RiskMeter,
    KanbanCard: KanbanCard,
    CodeSnippet: CodeSnippet,
    SeverityMarker: SeverityMarker,
    Tooltip: Tooltip,
    Checkbox: Checkbox,
    Toggle: Toggle,
    SegmentedControl: SegmentedControl,
    Input: Input,
    MultiSelect: MultiSelect,
    Modal: Modal,
    Drawer: Drawer,
    VulnTable: VulnTable,
    PipelineStepper: PipelineStepper,
    DiffBadge: DiffBadge,
    QuadrantTile: QuadrantTile,
    AuditLogRow: AuditLogRow,
    EmptyState: EmptyState,
    Skeleton: Skeleton,
    Toast: Toast,
    BarChart: BarChart,
    DonutChart: DonutChart,
    Heatmap: Heatmap,
    ReportHeader: ReportHeader,
    FindingDetail: FindingDetail,
    ChartLegend: ChartLegend,
    FileDropzone: FileDropzone,
    ScannerBadge: ScannerBadge,
    ColumnMapRow: ColumnMapRow,
    Tabs: Tabs,
    DropdownMenu: DropdownMenu,
    Banner: Banner,
    RoleSwitcher: RoleSwitcher,
    TeamPicker: TeamPicker,
    RaciMatrix: RaciMatrix,
    Sparkline: Sparkline,
    SlaTrend: SlaTrend,
    EffortMeter: EffortMeter,
    TierBadge: TierBadge,
    AssetRow: AssetRow,
    BreachList: BreachList,
    ExposureBars: ExposureBars,
    RiskDelta: RiskDelta,
    TopologyMap: TopologyMap,
    TemplateCard: TemplateCard,
    LineChart: LineChart,
    StackedBarChart: StackedBarChart,
    RadarChart: RadarChart,
    Treemap: Treemap,
    ScatterChart: ScatterChart,
    SlaBreachCard: SlaBreachCard,
    SlaProjectionTable: SlaProjectionTable,
    ExposureRegistry: ExposureRegistry,
  });
})();
