import React from "react";
import { Icon } from "@/ui/Icon";

/* ---------- ExternalLink (new tab, noopener, visible + announced "opens in new tab") ---------- */
export function ExternalLink(props) {
  return (
    <a className="vl-xlink" href={props.href} target="_blank" rel="noopener noreferrer">
      {props.children}<Icon name="external-link" size={12} /><span className="vl-sr"> (opens in a new tab)</span>
    </a>
  );
}
