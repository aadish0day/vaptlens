import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { Illustration } from "@/ui/Illustration";
import { cx } from "@/ui/core";

/* ---------- NotificationCenter (unread/all tabs, mark read, mark all, per-item action) ---------- */
/* items: [{ id, title, body?, at, tone?, read?, onOpen? }] */
export function NotificationCenter(props) {
  var tab = useState("unread");
  var items = (props.items || []).slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  var unread = items.filter(function (x) { return !x.read; });
  var shown = tab[0] === "unread" ? unread : items;
  return (
    <section className="vl-notif" aria-label="Notifications">
      <header className="vl-notif-head">
        <div className="vl-seg" role="tablist">
          {[["unread", "Unread · " + unread.length], ["all", "All"]].map(function (t) {
            return <button key={t[0]} type="button" role="tab" aria-selected={tab[0] === t[0]} className={cx("vl-seg-opt", tab[0] === t[0] && "is-on")} onClick={function () { tab[1](t[0]); }}>{t[1]}</button>;
          })}
        </div>
        {unread.length && props.onMarkAll ? <button type="button" className="vl-drp-clear" onClick={props.onMarkAll}>Mark all read</button> : null}
      </header>
      {shown.length === 0 ? (
        <div className="vl-notif-empty"><Illustration name="inbox-zero" size={96} /><p>{tab[0] === "unread" ? "You're all caught up." : "No notifications yet."}</p></div>
      ) : (
        <ul className="vl-notif-list">
          {shown.map(function (n) {
            return (
              <li key={n.id} className={cx("vl-notif-item", !n.read && "is-unread", n.tone && "is-" + n.tone)}>
                <button type="button" className="vl-notif-main" onClick={function () { if (props.onRead && !n.read) props.onRead(n.id); if (n.onOpen) n.onOpen(); }}>
                  <span className="vl-notif-dot" aria-hidden="true" />
                  <span className="vl-notif-text"><b>{n.title}</b>{n.body ? <span>{n.body}</span> : null}</span>
                  <time dateTime={n.at}>{String(n.at).slice(5, 16).replace("T", " ")}</time>
                </button>
                {!n.read && props.onRead ? <button type="button" className="vl-ibtn is-sm is-ghost" aria-label={"Mark read: " + n.title} title="Mark read" onClick={function () { props.onRead(n.id); }}><Icon name="check" size={14} /></button> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
