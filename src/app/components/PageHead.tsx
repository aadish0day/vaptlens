import { VIEWS } from "@/app/lib/common";
import React from "react";

export function PageHead(p) {
  var no = VIEWS.findIndex(function (v) {
    return v[1] === p.title || (p.title === "SLA & RACI" && v[0] === "sla");
  });
  return (
    <div className="page-head">
      <div>
        <span className="page-eyebrow">
          {String(no + 1).padStart(2, "0") + " / " + p.title.toUpperCase()}
        </span>
        <h1 className="page-title" tabIndex={-1}>
          {p.title}
        </h1>
        {p.sub ? <p className="page-sub">{p.sub}</p> : null}
      </div>
      {p.actions ? <div className="page-actions">{p.actions}</div> : null}
    </div>
  );
}
