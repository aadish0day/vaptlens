import React, { useState } from "react";
import { cx } from "@/ui/core";

/* ---------- TruncatedText (clamp to N lines with Show more / less) ---------- */
export function TruncatedText(props) {
  var st = useState(false), txt = String(props.children || props.text || "");
  var long = txt.length > (props.threshold || 240);
  return (
    <div className={cx("vl-trunc", !st[0] && long && "is-clamped")} style={{ ["--lines" as any]: props.lines || 3 }}>
      <div className="vl-trunc-body">{txt}</div>
      {long ? <button type="button" className="vl-trunc-more" aria-expanded={st[0]} onClick={function () { st[1](!st[0]); }}>{st[0] ? "Show less" : "Show more"}</button> : null}
    </div>
  );
}
