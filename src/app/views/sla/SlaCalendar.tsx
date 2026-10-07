import { openRow } from "@/app/components/utils";
import { SEV_LABEL, hostLabel, nowIso } from "@/app/lib/common";
import { saveFile } from "@/app/lib/export";
import { vlLabel } from "@/app/lib/integrations";
import { addDays } from "@/app/views/findings/utils";
import { SLA_DAYS, days } from "@/lib/data";
import { AS_OF, localDay } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

/* SLA calendar: what falls due each week for the next 8 weeks, with an .ics export for any calendar */
export function SlaCalendar(p) {
  var ctx = p.ctx,
    sel = useState(null);
  function dueOf(x) {
    var d = addDays(
      x.slaStart || x.firstSeen,
      (x.slaDays != null ? x.slaDays : SLA_DAYS[x.sev]) + (x.pausedDays || 0),
    );
    return x.kevDue && x.kevDue < d ? x.kevDue : d;
  }
  var start = AS_OF,
    weeks = [],
    overdue = [];
  for (var w = 0; w < 8; w++)
    weeks.push({
      from: addDays(start, w * 7),
      to: addDays(start, w * 7 + 6),
      items: [],
    });
  ctx.active.forEach(function (x) {
    var d = dueOf(x);
    if (d < start) {
      overdue.push(x);
      return;
    }
    var wi = Math.floor(days(start, d) / 7);
    if (wi < 8) weeks[wi].items.push(x);
  });
  var max = Math.max(
    1,
    overdue.length,
    Math.max.apply(
      null,
      weeks.map(function (w2) {
        return w2.items.length;
      }),
    ),
  );
  /* RFC 5545: escape text, fold at 75 octets, overdue items land on today marked OVERDUE */
  function icsText(t) {
    return String(t || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n|\r/g, "\\n");
  }
  function fold(line) {
    var out = [],
      cur = "",
      bytes = 0;
    Array.from(line).forEach(function (ch) {
      var b = new TextEncoder().encode(ch as string).length;
      if (bytes + b > (out.length ? 74 : 75)) {
        out.push(cur);
        cur = "";
        bytes = 0;
      }
      cur += ch;
      bytes += b;
    });
    out.push(cur);
    return out.join("\r\n ");
  }
  function ics() {
    var lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//VAPTLens//SLA//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
      ],
      stamp = nowIso()
        .replace(/[-:]/g, "")
        .replace(/\.\d+Z$/, "Z"),
      today = localDay();
    ctx.active.forEach(function (x) {
      var d = dueOf(x),
        over = d < today;
      if (days(AS_OF, d) > 90) return;
      var d2 = over ? today : d;
      var dd = d2.replace(/-/g, ""),
        nd = addDays(d2, 1).replace(/-/g, "");
      lines.push(
        "BEGIN:VEVENT",
        "UID:" + vlLabel(x.key) + "@vaptlens",
        "DTSTAMP:" + stamp,
        "DTSTART;VALUE=DATE:" + dd,
        "DTEND;VALUE=DATE:" + nd,
        "SUMMARY:" +
          icsText(
            (over ? "OVERDUE since " + d + ": " : "SLA due: ") +
              "[" +
              SEV_LABEL[x.sev] +
              "] " +
              x.name +
              " on " +
              hostLabel(x),
          ),
        "DESCRIPTION:" +
          icsText(
            "Risk " +
              x.risk +
              " · " +
              (x.slaSource || "SLA " + x.slaDays + " days") +
              " · owner " +
              (ctx.g(x).team || "unassigned"),
          ),
        "END:VEVENT",
      );
    });
    lines.push("END:VCALENDAR");
    saveFile(
      ctx,
      "vaptlens-sla-due-" + localDay() + ".ics",
      lines.map(fold).join("\r\n") + "\r\n",
    );
  }
  var list =
    sel[0] === "overdue" ? overdue : sel[0] != null ? weeks[sel[0]].items : [];
  function bar(label, n, key, tone) {
    return (
      <button
        key={key}
        type="button"
        aria-label={
          n +
          " finding" +
          (n === 1 ? "" : "s") +
          (key === "overdue"
            ? " overdue"
            : " due " + weeks[key].from + " to " + weeks[key].to)
        }
        className={
          "cal-week" +
          (sel[0] === key ? " is-on" : "") +
          (tone ? " is-" + tone : "")
        }
        aria-pressed={sel[0] === key}
        disabled={!n && sel[0] !== key}
        onClick={function () {
          sel[1](sel[0] === key ? null : key);
        }}
      >
        <span className="cal-n vl-mono">{n}</span>
        <span
          className="cal-bar"
          style={{
            height: Math.max(4, Math.round((64 * n) / max)) + "px",
          }}
        />
        <span className="cal-l">{label}</span>
      </button>
    );
  }
  return (
    <V.WidgetCard
      title="SLA calendar · next 8 weeks"
      draggable={false}
      actions={
        <V.Button size="sm" variant="ghost" icon="download" onClick={ics}>
          Export .ics
        </V.Button>
      }
    >
      <div className="cal-weeks">
        {[bar("Overdue", overdue.length, "overdue", "danger")].concat(
          weeks.map(function (w2, i) {
            return bar(
              w2.from.slice(5) + " → " + w2.to.slice(5),
              w2.items.length,
              i,
              i === 0 ? "warn" : null,
            );
          }),
        )}
      </div>
      {sel[0] != null ? (
        list.length ? (
          <div className="stack-tight cal-list">
            {list
              .sort(function (a, b) {
                return dueOf(a) < dueOf(b) ? -1 : 1;
              })
              .slice(0, 50)
              .map(function (x) {
                return (
                  <div
                    {...Object.assign(
                      {
                        key: x.id,
                      },
                      openRow(ctx, x.key, "breach-item"),
                    )}
                  >
                    <V.SeverityBadge severity={x.sev} />
                    <span className="breach-name">{x.name}</span>
                    <span className="vl-mono diff-host">{dueOf(x)}</span>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="up-help">Nothing due then.</p>
        )
      ) : (
        <p className="up-help">
          Click a week to see what's due. Due = first seen (or reopened) + SLA
          days, or the CISA KEV due date when sooner.
        </p>
      )}
    </V.WidgetCard>
  );
}
