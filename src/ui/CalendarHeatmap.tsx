import React from "react";

/* ---------- CalendarHeatmap (GitHub-style daily activity: scans, fixes, audit events) ---------- */
/* data: { "YYYY-MM-DD": count }; end: last day (default today); weeks: columns */
export function CalendarHeatmap(props) {
  var weeks = props.weeks || 26,
    data = props.data || {},
    cell = 12,
    gap = 3;
  var end = props.end ? new Date(props.end + "T00:00:00") : new Date();
  var start = new Date(
    end.getTime() - ((weeks - 1) * 7 + end.getDay()) * 864e5,
  );
  var max = 0;
  Object.keys(data).forEach(function (k) {
    if (data[k] > max) max = data[k];
  });
  function p(n) {
    return String(n).padStart(2, "0");
  }
  function iso(d) {
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  var cells = [],
    months = [],
    lastM = -1,
    total = 0;
  for (var w = 0; w < weeks; w++)
    for (var d = 0; d < 7; d++) {
      var day = new Date(start.getTime() + (w * 7 + d) * 864e5);
      if (day > end) continue;
      var k = iso(day),
        v = data[k] || 0;
      total += v;
      if (d === 0 && day.getMonth() !== lastM) {
        months.push({
          w: w,
          label: day.toLocaleString("en", { month: "short" }),
        });
        lastM = day.getMonth();
      }
      var lvl =
        v === 0 ? 0 : Math.min(5, 1 + Math.floor((4 * v) / Math.max(1, max)));
      cells.push(
        <rect
          key={k}
          x={28 + w * (cell + gap)}
          y={16 + d * (cell + gap)}
          width={cell}
          height={cell}
          rx="2"
          fill={"var(--heat-" + lvl + ")"}
          onClick={
            props.onSelect
              ? (function (kk) {
                  return function () {
                    props.onSelect(kk);
                  };
                })(k)
              : undefined
          }
          style={props.onSelect ? { cursor: "pointer" } : null}
        >
          <title>{k + ": " + v + " " + (props.unit || "events")}</title>
        </rect>,
      );
    }
  var W = 28 + weeks * (cell + gap),
    H = 16 + 7 * (cell + gap);
  return (
    <figure className="vl-calheat">
      <svg
        viewBox={"0 0 " + W + " " + H}
        width="100%"
        style={{ maxWidth: W }}
        role="img"
        aria-label={
          (props.label || "Activity") +
          ": " +
          total +
          " " +
          (props.unit || "events") +
          " in " +
          weeks +
          " weeks"
        }
      >
        {months.map(function (m) {
          return (
            <text
              key={m.w}
              x={28 + m.w * (cell + gap)}
              y="10"
              className="vl-calheat-t"
            >
              {m.label}
            </text>
          );
        })}
        {["Mon", "Wed", "Fri"].map(function (t, i) {
          return (
            <text
              key={t}
              x="0"
              y={16 + (1 + i * 2) * (cell + gap) + 10}
              className="vl-calheat-t"
            >
              {t}
            </text>
          );
        })}
        {cells}
      </svg>
      <figcaption className="vl-calheat-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4, 5].map(function (l) {
          return <i key={l} style={{ background: "var(--heat-" + l + ")" }} />;
        })}
        <span>More</span>
      </figcaption>
    </figure>
  );
}
