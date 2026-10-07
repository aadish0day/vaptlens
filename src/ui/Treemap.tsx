import React from "react";
import { cx, fit, kbd, useSel } from "@/ui/core";

export function Treemap(props) {
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
      return Object.assign({}, d, {
        area: (d.value / total) * W * H,
      });
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
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
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
        rects.push({
          d: r,
          x: x,
          y: cy,
          w: cw,
          h: rh,
        });
        cy += rh;
      });
      x += cw;
      w -= cw;
    } else {
      var ch = s / w,
        cx0 = x;
      row.forEach(function (r) {
        var rw = r.area / ch;
        rects.push({
          d: r,
          x: cx0,
          y: y,
          w: rw,
          h: ch,
        });
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
  return (
    <div className="vl-chart">
      <svg
        viewBox={"0 0 " + W + " " + H}
        width="100%"
        role="img"
        aria-label={props.label || "Treemap"}
      >
        {rects.map(function (r, i) {
          var big = r.w > 70 && r.h > 34,
            dim = sel[0] != null && sel[0] !== r.d.label;
          return (
            <g
              key={r.d.label}
              className={cx(
                "vl-tm",
                dim && "is-dim",
                sel[0] === r.d.label && "is-sel",
              )}
              onClick={function () {
                sel[1](r.d.label);
              }}
              onKeyDown={kbd(function () {
                sel[1](r.d.label);
              })}
              role={props.static ? null : "button"}
              tabIndex={props.static ? null : 0}
              aria-label={r.d.label + ": " + r.d.value}
            >
              <rect
                x={r.x + 1.5}
                y={r.y + 1.5}
                width={Math.max(0, r.w - 3)}
                height={Math.max(0, r.h - 3)}
                rx={8}
                fill={
                  r.d.severity
                    ? "var(--sev-" + r.d.severity + ")"
                    : r.d.color || "var(--chart-" + ((i % 6) + 1) + ")"
                }
              />
              {big ? (
                <text className="vl-tm-t" x={r.x + 10} y={r.y + 20}>
                  {fit(r.d.label, r.w - 20)}
                </text>
              ) : null}
              {big ? (
                <text className="vl-tm-v" x={r.x + 10} y={r.y + 36}>
                  {r.d.value}
                </text>
              ) : null}
              <title>{r.d.label + ": " + r.d.value}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- ScatterChart ---------- */
