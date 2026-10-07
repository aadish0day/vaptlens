import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- ThreatTag ---------- */
export var THREAT = {
  kev: {
    label: "CISA KEV",
    icon: "flame",
  },
  zeroday: {
    label: "Zero-day",
    icon: "zap",
  },
  ransomware: {
    label: "Ransomware",
    icon: "skull",
  },
  exploitable: {
    label: "Exploitable",
    icon: "shield",
  },
  eol: {
    label: "EOL",
    icon: "clock",
  },
  breached: {
    label: "SLA Breached",
    icon: "clock",
  },
};

export function ThreatTag(props) {
  var t = THREAT[props.kind] || THREAT.exploitable;
  return (
    <span className={cx("vl-threat", "vl-threat-" + props.kind)}>
      <Icon name={t.icon} size={12} strokeWidth={2.25} />
      {props.label || t.label}
    </span>
  );
}

/* ---------- SlaPill ---------- */
