import React from "react";
import { cx } from "@/ui/core";

var NAMES = {
  AV: ["Attack vector", { N: "Network", A: "Adjacent", L: "Local", P: "Physical" }],
  AC: ["Attack complexity", { L: "Low", H: "High" }],
  AT: ["Attack requirements", { N: "None", P: "Present" }],
  PR: ["Privileges required", { N: "None", L: "Low", H: "High" }],
  UI: ["User interaction", { N: "None", R: "Required", P: "Passive", A: "Active" }],
  S: ["Scope", { U: "Unchanged", C: "Changed" }],
  C: ["Confidentiality", { N: "None", L: "Low", H: "High" }], I: ["Integrity", { N: "None", L: "Low", H: "High" }], A: ["Availability", { N: "None", L: "Low", H: "High" }],
  VC: ["Vuln. confidentiality", { N: "None", L: "Low", H: "High" }], VI: ["Vuln. integrity", { N: "None", L: "Low", H: "High" }], VA: ["Vuln. availability", { N: "None", L: "Low", H: "High" }],
  SC: ["Subseq. confidentiality", { N: "None", L: "Low", H: "High" }], SI: ["Subseq. integrity", { N: "None", L: "Low", H: "High" }], SA: ["Subseq. availability", { N: "None", L: "Low", H: "High" }],
  E: ["Exploit maturity", { X: "Not defined", A: "Attacked", P: "PoC", U: "Unreported", F: "Functional", H: "High" }],
};
/* worst-case values (drive the red highlight) */
var BAD = { AV: "N", AC: "L", AT: "N", PR: "N", UI: "N", S: "C", C: "H", I: "H", A: "H", VC: "H", VI: "H", VA: "H", SC: "H", SI: "H", SA: "H", E: "A" };
export function parseCvss(v: string) {
  var s = String(v || "").trim(), m = /^CVSS:(\d\.\d)\/(.*)$/.exec(s), ver = m ? m[1] : "2.0", body = m ? m[2] : s;
  var out = { version: ver, metrics: [] as any[] };
  body.split("/").forEach(function (kv) { var p = kv.split(":"); if (p.length === 2) { var n = NAMES[p[0]]; out.metrics.push({ key: p[0], value: p[1], label: n ? n[0] : p[0], text: n ? n[1][p[1]] || p[1] : p[1], bad: BAD[p[0]] === p[1] }); } });
  return out;
}
/* ---------- CvssVector (vector string → readable metric chips; worst-case values highlighted) ---------- */
export function CvssVector(props) {
  var p = parseCvss(props.vector);
  if (!p.metrics.length) return <span className="vl-cvss-none">No vector</span>;
  return (
    <div className="vl-cvss" aria-label={"CVSS " + p.version + " vector " + props.vector}>
      <span className="vl-cvss-ver">CVSS {p.version}{props.score != null ? " · " + Number(props.score).toFixed(1) : ""}</span>
      <ul>
        {p.metrics.map(function (m) {
          return <li key={m.key} className={cx("vl-cvss-m", m.bad && "is-bad")} title={m.label + ": " + m.text}><abbr title={m.label}>{m.key}</abbr><span>{props.compact ? m.value : m.text}</span></li>;
        })}
      </ul>
    </div>
  );
}
