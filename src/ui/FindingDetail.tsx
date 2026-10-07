import React from "react";
import { Button } from "@/ui/Button";
import { CodeSnippet } from "@/ui/CodeSnippet";
import { Icon } from "@/ui/Icon";
import { SlaPill } from "@/ui/SlaPill";

export function FindingDetail(props) {
  var f = props.finding;
  return (
    <div className="vl-detail">
      <div className="vl-detail-main">
        <p className="vl-detail-desc">
          {f.description || "No description provided by the scanner."}
        </p>
        {f.cves && f.cves.length ? (
          <div className="vl-detail-cves">
            {f.cves.map(function (c) {
              return (
                <a
                  key={c}
                  className="vl-cve"
                  href={"https://nvd.nist.gov/vuln/detail/" + c}
                  target="_blank"
                  rel="noreferrer"
                >
                  {c}
                </a>
              );
            })}
          </div>
        ) : null}
        {f.snippet ? (
          <CodeSnippet title="Remediation" tabs={f.snippet} />
        ) : null}
      </div>
      <div className="vl-detail-side">
        <span className="vl-label">Owner</span>
        <span className="vl-detail-v">{f.team || "Unassigned"}</span>
        <span className="vl-label">Ticket</span>
        {f.ticket ? (
          <span className="vl-kcard-ticket">
            <Icon name="ticket" size={12} />
            {f.ticket}
          </span>
        ) : (
          <Button
            size="sm"
            icon="ticket"
            restricted={f.readOnly}
            restrictedReason="Security Auditors have read-only access."
          >
            Raise ticket
          </Button>
        )}
        <span className="vl-label">SLA</span>
        {f.sla ? (
          <SlaPill {...f.sla} />
        ) : (
          <span className="vl-detail-v">—</span>
        )}
      </div>
    </div>
  );
}

/* ---------- PipelineStepper ---------- */
