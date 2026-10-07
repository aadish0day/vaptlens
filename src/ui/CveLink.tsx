import React from "react";
import { Icon } from "@/ui/Icon";
import { CopyButton } from "@/ui/CopyButton";
import { cx } from "@/ui/core";

/* ---------- CveLink (CVE id chip: NVD link in a new tab, KEV marker, copy) ---------- */
export function CveLink(props) {
  var id = String(props.id || "").toUpperCase(), ok = /^CVE-\d{4}-\d{4,}$/.test(id);
  return (
    <span className={cx("vl-cve", props.kev && "is-kev")}>
      {ok ? (
        <a href={"https://nvd.nist.gov/vuln/detail/" + id} target="_blank" rel="noopener noreferrer" title={"Open " + id + " on NVD (new tab)"}>
          {id}<Icon name="external-link" size={11} />
        </a>
      ) : <span>{id || "—"}</span>}
      {props.kev ? <span className="vl-cve-kev" title="Listed in CISA Known Exploited Vulnerabilities">KEV</span> : null}
      {props.copy && ok ? <CopyButton iconOnly text={id} label={"Copy " + id} /> : null}
    </span>
  );
}
