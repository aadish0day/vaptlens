import React from "react";
import { Icon } from "@/ui/Icon";

/* ---------- ExposureBars ---------- */
export var EXPO = {
  kev: ["CISA KEV", "flame", "threat-kev"],
  zeroday: ["Zero-day", "zap", "threat-zeroday"],
  ransomware: ["Ransomware", "skull", "threat-ransomware"],
  exploitable: ["Exploitable", "shield", "sev-high"],
  breached: ["SLA breached", "clock", "status-danger"],
  eol: ["EOL software", "clock", "ink-muted"],
};

export function ExposureBars(props) {
  var total = props.total || 1;
  return (
    <div className="vl-expo">
      {(props.items || []).map(function (it) {
        var e = EXPO[it.kind] || EXPO.exploitable,
          pct = Math.round((100 * it.value) / total);
        return (
          <div key={it.kind} className="vl-expo-row">
            <span
              className="vl-expo-label"
              style={{
                color: "var(--" + e[2] + ")",
              }}
            >
              <Icon name={e[1]} size={14} />
              <span
                style={{
                  color: "var(--ink)",
                }}
              >
                {e[0]}
              </span>
            </span>
            <span className="vl-expo-v">
              {it.value}
              <span>{" / " + total}</span>
            </span>
            <div
              className="vl-expo-track"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={it.value}
              aria-label={e[0]}
            >
              <span
                style={{
                  width: pct + "%",
                  background: "var(--" + e[2] + ")",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- RiskDelta ---------- */
