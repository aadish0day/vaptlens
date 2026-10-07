import React from "react";
import { Logo } from "@/ui/Logo";

/* ---------- ReportHeader ---------- */
export function ReportHeader(props) {
  return (
    <header className={"vl-report vl-report-" + (props.theme || "slate")}>
      <div className="vl-report-band">
        <Logo size={22} />
        <span className="vl-report-kind">
          {props.kind || "Vulnerability Assessment Report"}
        </span>
      </div>
      <div className="vl-report-body">
        <h1 className="vl-report-title">
          {props.title || "Executive Summary"}
        </h1>
        <p className="vl-report-meta">{props.meta}</p>
      </div>
    </header>
  );
}

/* ================= v3 additions ================= */
