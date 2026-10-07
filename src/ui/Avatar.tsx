import React from "react";
import { cx } from "@/ui/core";

export function initials(name: string) {
  var p = String(name || "?")
    .trim()
    .split(/[\s._@-]+/)
    .filter(Boolean);
  return (
    (p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")
  ).toUpperCase();
}
/* stable hue per name so the same person always gets the same colour */
export function hueOf(name: string) {
  var h = 0,
    s = String(name || "");
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}
/* ---------- Avatar ---------- */
export function Avatar(props) {
  var sz = props.size || 28;
  return (
    <span
      className={cx("vl-avatar", props.className)}
      title={props.title || props.name}
      style={{
        width: sz,
        height: sz,
        fontSize: Math.round(sz * 0.4),
        ["--av-h" as any]: hueOf(props.name),
      }}
      role="img"
      aria-label={props.name}
    >
      {initials(props.name)}
      {props.status ? (
        <span
          className={cx("vl-avatar-st", "is-" + props.status)}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}
/* ---------- AvatarGroup (+N overflow) ---------- */
export function AvatarGroup(props) {
  var names = props.names || [],
    max = props.max || 4,
    extra = names.length - max;
  return (
    <span className="vl-avatars" aria-label={names.join(", ")}>
      {names.slice(0, max).map(function (n) {
        return <Avatar key={n} name={n} size={props.size} />;
      })}
      {extra > 0 ? (
        <span
          className="vl-avatar vl-avatar-more"
          style={{ width: props.size || 28, height: props.size || 28 }}
          title={names.slice(max).join(", ")}
        >
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
