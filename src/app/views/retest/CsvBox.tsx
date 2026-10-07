import { saveFile } from "@/app/lib/export";
import React from "react";
import * as V from "@/ui";

export function CsvBox(p) {
  return (
    <div className="stack-tight">
      <div className="row-wrap csv-head">
        <span className="vl-mono">{p.name}</span>
        <span className="row-wrap">
          <V.Button
            size="sm"
            variant="primary"
            icon="download"
            onClick={function () {
              saveFile(
                {
                  toast: p.toast,
                },
                p.name,
                p.csv,
              );
            }}
          >
            Download CSV
          </V.Button>
          <V.Button
            size="sm"
            onClick={function () {
              var ok = function () {
                p.toast({
                  title: "CSV copied",
                  message: p.name,
                });
              };
              try {
                navigator.clipboard.writeText(p.csv).then(ok, function () {
                  p.toast({
                    title: "Copy blocked here",
                    message: "Select the text below and copy it.",
                    tone: "info",
                  });
                });
              } catch (e) {
                p.toast({
                  title: "Copy blocked here",
                  message: "Select the text below and copy it.",
                  tone: "info",
                });
              }
            }}
          >
            Copy CSV
          </V.Button>
        </span>
      </div>
      <pre className="csv">{p.csv}</pre>
    </div>
  );
}

/* ================= 8. Report ================= */
