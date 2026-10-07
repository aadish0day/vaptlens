import React from "react";
import { Icon } from "@/ui/Icon";
import { SeverityBadge } from "@/ui/SeverityBadge";
import { ThreatTag } from "@/ui/ThreatTag";
import { TierBadge } from "@/ui/TierBadge";
import { SEV_ORDER } from "@/ui/core";

/* ---------- AssetRow ---------- */
export var DEVICE = {
  Database: "database",
  "API Gateway": "router",
  "Domain Controller": "key",
  "Web Server": "globe",
  Server: "server",
  Workstation: "monitor",
};

export function AssetRow(props) {
  var c = props.counts || {};
  return (
    <div
      className="vl-asset"
      role={props.onClick ? "button" : undefined}
      tabIndex={props.onClick ? 0 : undefined}
      onClick={props.onClick}
    >
      <span className="vl-asset-icon">
        <Icon name={DEVICE[props.device] || "server"} size={16} />
      </span>
      <div className="vl-asset-id">
        <span className="vl-asset-host">{props.host}</span>
        <span className="vl-asset-sub">
          {props.device}
          {" · "}
          {props.os}
          {props.eol ? <ThreatTag kind="eol" /> : null}
        </span>
      </div>
      <TierBadge tier={props.tier} short={true} />
      <span className="vl-asset-owner">{props.owner}</span>
      <span className="vl-asset-counts">
        {SEV_ORDER.slice(0, 3).map(function (s) {
          return c[s] ? (
            <SeverityBadge key={s} severity={s} count={c[s]} />
          ) : null;
        })}
      </span>
      {props.score != null ? (
        <span className="vl-asset-score">{props.score}</span>
      ) : null}
    </div>
  );
}

/* ---------- BreachList ---------- */
