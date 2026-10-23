import React from "react";
import { Icon } from "@/ui/Icon";

export function ExternalLink(props) {
  var href = String(props.href || "").trim();
  var safe =
    /^https?:\/\//i.test(href) || (/^[/#]/.test(href) && !/^\/\//.test(href))
      ? href
      : "#";
  return (
    <a
      className="vl-xlink"
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
    >
      {props.children}
      <Icon name="external-link" size={12} />
      <span className="vl-sr"> (opens in a new tab)</span>
    </a>
  );
}
