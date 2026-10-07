import React, { useState } from "react";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- FileDropzone ---------- */
export function FileDropzone(props) {
  var st = props.state || "idle";
  var drag = useState(false);
  var s = drag[0] && st === "idle" ? "drag" : st;
  var body;
  if (s === "parsing")
    body = [
      <span key="t" className="vl-drop-title">
        {"Parsing "}
        <span className="vl-mono">{props.fileName || "scan.csv"}</span>
      </span>,
      <div
        key="b"
        className="vl-drop-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={props.progress || 0}
      >
        <span
          style={{
            width: (props.progress || 0) + "%",
          }}
        />
      </div>,
      <span key="h" className="vl-drop-hint">
        {(props.rows || 0).toLocaleString() + " rows read · in your browser"}
      </span>,
    ];
  else if (s === "error")
    body = [
      <Icon key="i" name="shield" size={20} />,
      <span key="t" className="vl-drop-title">
        {props.error || "Couldn't read this file."}
      </span>,
      <span key="h" className="vl-drop-hint">
        CSV, XML, .nessus, JSON, JSONL or SARIF.
      </span>,
      <Button key="b" size="sm" onClick={props.onBrowse}>
        Choose another file
      </Button>,
    ];
  else
    body = [
      <Icon key="i" name="upload" size={20} />,
      <span key="t" className="vl-drop-title">
        {s === "drag" ? "Drop to analyse" : "Drop scan files here"}
      </span>,
      <span key="h" className="vl-drop-hint">
        Drop one or many files: CSV from 10 scanners, .nessus, OpenVAS, Burp and
        ZAP XML/JSON, Nuclei JSONL, Nikto, Wapiti, Dependency-Check, Trivy,
        SARIF and Nmap XML, or any CSV/JSON you map yourself.
      </span>,
      s === "idle" ? (
        <Button
          key="b"
          size="sm"
          variant="primary"
          icon="upload"
          onClick={props.onBrowse}
        >
          Choose files
        </Button>
      ) : null,
      <span key="p" className="vl-drop-privacy">
        <Icon name="shield-check" size={12} />
        Parsed in your browser
      </span>,
    ];
  return (
    <div
      className={cx("vl-drop", "is-" + s)}
      onDragEnter={function (e) {
        e.preventDefault();
        drag[1](true);
      }}
      onDragOver={function (e) {
        e.preventDefault();
      }}
      onDragLeave={function () {
        drag[1](false);
      }}
      onDrop={function (e) {
        e.preventDefault();
        drag[1](false);
        if (props.onFiles) props.onFiles(e.dataTransfer.files);
      }}
    >
      {body}
    </div>
  );
}

/* ---------- ScannerBadge ---------- */
