import React, { useState } from "react";
import { ChartLegend } from "@/ui/ChartLegend";
import { SEV_LABEL, SEV_ORDER, cx } from "@/ui/core";

/* ---------- TopologyMap ---------- */
export function TopologyMap(props) {
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
      <line
        key={"l" + i}
        className="vl-topo-link"
        x1={CX}
        y1={CY}
        x2={sx}
        y2={sy}
      />,
    );
    groups.push(
      <g key={"s" + i}>
        <circle className="vl-topo-subnet" cx={sx} cy={sy} r={14} />
        <text
          className="vl-topo-label"
          x={CX + (R1 + R2 + 30) * Math.cos(a)}
          y={CY + (R1 + R2 + 30) * Math.sin(a) + 4}
          textAnchor={
            Math.abs(Math.cos(a)) < 0.3
              ? "middle"
              : Math.cos(a) > 0
                ? "start"
                : "end"
          }
        >
          {s.name}
        </text>
      </g>,
    );
    (s.hosts || []).forEach(function (hst, j) {
      var n = s.hosts.length,
        b = a + (j - (n - 1) / 2) * (Math.PI / 4.5);
      var hx = sx + R2 * Math.cos(b),
        hy = sy + R2 * Math.sin(b);
      var r = Math.min(12, 6 + Math.log2((hst.count || 0) + 1) * 2);
      links.push(
        <line
          key={"h" + i + j}
          className="vl-topo-hlink"
          x1={sx}
          y1={sy}
          x2={hx}
          y2={hy}
        />,
      );
      var on = sel[0] === hst.ip,
        dim = sel[0] && !on;
      nodes.push(
        <g
          key={hst.ip}
          className={cx("vl-topo-host", on && "is-sel", dim && "is-dim")}
          tabIndex={0}
          role="button"
          aria-label={
            hst.ip + ", " + hst.count + " findings, worst " + hst.severity
          }
          onClick={function () {
            sel[1](on ? null : hst.ip);
            if (props.onSelect) props.onSelect(on ? null : hst.ip);
          }}
        >
          <circle
            cx={hx}
            cy={hy}
            r={r}
            className={"vl-fill-" + (hst.severity || "info")}
          />
          {on ? (
            <circle cx={hx} cy={hy} r={r + 4} className="vl-topo-ring" />
          ) : null}
          <title>{hst.ip + " · " + hst.count + " findings"}</title>
        </g>,
      );
    });
  });
  return (
    <div className="vl-topo">
      <svg
        viewBox="0 0 640 480"
        width="100%"
        role="group"
        aria-label="Subnet topology"
      >
        {links}
        {groups}
        <g>
          <circle className="vl-topo-core" cx={CX} cy={CY} r={22} />
          <text
            className="vl-topo-core-t"
            x={CX}
            y={CY + 4}
            textAnchor="middle"
          >
            SCAN
          </text>
        </g>
        {nodes}
      </svg>
      <ChartLegend
        items={SEV_ORDER.map(function (s) {
          return {
            label: SEV_LABEL[s],
            severity: s,
          };
        })}
      />
    </div>
  );
}

/* ---------- TemplateCard ---------- */
