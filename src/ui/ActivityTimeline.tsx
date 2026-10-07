import React from "react";
import { cx } from "@/ui/core";
import { Avatar } from "@/ui/Avatar";

/* ---------- ActivityTimeline (who did what, when; grouped by day) ---------- */
/* items: [{ id, at (ISO), actor, text, tone? ("ok"|"warn"|"danger"|"info") , detail? }] */
export function ActivityTimeline(props) {
  var items = (props.items || []).slice().sort(function (a, b) {
    return a.at < b.at ? 1 : -1;
  });
  var groups = [];
  items.forEach(function (it) {
    var d = String(it.at).slice(0, 10),
      g = groups[groups.length - 1];
    if (!g || g.day !== d) groups.push((g = { day: d, items: [] }));
    g.items.push(it);
  });
  if (!items.length)
    return <p className="vl-tl-empty">{props.empty || "No activity yet."}</p>;
  return (
    <div className="vl-tl">
      {groups.map(function (g) {
        return (
          <section key={g.day} className="vl-tl-day">
            <h4 className="vl-tl-date">{g.day}</h4>
            <ol>
              {g.items.map(function (it, i) {
                return (
                  <li
                    key={it.id || i}
                    className={cx("vl-tl-item", it.tone && "is-" + it.tone)}
                  >
                    <span className="vl-tl-dot" aria-hidden="true" />
                    {it.actor ? <Avatar name={it.actor} size={22} /> : null}
                    <div className="vl-tl-main">
                      <div className="vl-tl-text">
                        {it.actor ? <b>{it.actor} </b> : null}
                        {it.text}
                      </div>
                      {it.detail ? (
                        <div className="vl-tl-detail">{it.detail}</div>
                      ) : null}
                    </div>
                    <time className="vl-tl-time" dateTime={it.at}>
                      {String(it.at).slice(11, 16)}
                    </time>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
