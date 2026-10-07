import React from "react";
import { SeverityBadge } from "@/ui/SeverityBadge";
import { ThreatTag } from "@/ui/ThreatTag";

/* ---------- ExposureRegistry ---------- */
export function ExposureRegistry(props) {
  return (
    <div className="vl-reg">
      {(props.items || []).map(function (it) {
        return (
          <div key={it.name} className="vl-reg-row">
            <ThreatTag kind={it.kind === "zeroday" ? "zeroday" : "eol"} />
            <div className="vl-reg-main">
              <span className="vl-reg-name">{it.name}</span>
              {it.detail ? (
                <span className="vl-reg-detail">{it.detail}</span>
              ) : null}
            </div>
            <span className="vl-reg-stat">
              <b>{it.hosts}</b>
              {it.hosts === 1 ? " host" : " hosts"}
            </span>
            <span className="vl-reg-stat">
              {it.criticals ? (
                <SeverityBadge severity="critical" count={it.criticals} />
              ) : (
                <span className="vl-td-muted">No critical</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
