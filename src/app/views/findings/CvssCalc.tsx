import { SEV_LABEL, hostLabel, nowIso } from "@/app/lib/common";
import { CVSS_DEFS, cvssVectorOf } from "@/app/views/findings/utils";
import { parseVector, sevFromScore, vectorScore } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

export function CvssCalc(p) {
  var f = p.f,
    ctx = p.ctx,
    pv0 = parseVector(f.vector);
  var v0 =
    pv0 && pv0.version === "4.0"
      ? "4.0"
      : pv0 && /^3/.test(pv0.version)
        ? "3.1"
        : "4.0";
  function init(ver) {
    var m: any = {};
    CVSS_DEFS[ver].forEach(function (d) {
      m[d[1]] =
        pv0 && pv0.version.slice(0, 1) === ver.slice(0, 1) && pv0.m[d[1]]
          ? pv0.m[d[1]]
          : d[2][0][0];
    });
    if (ver === "4.0" && f.kev && m.E === "X") m.E = "A";
    return m;
  }
  var vs = useState(v0),
    ms = useState(function () {
      return init(v0);
    }),
    why = useState("");
  var ver = vs[0],
    m = ms[0],
    vec = cvssVectorOf(ver, m),
    score = vectorScore(parseVector(vec)),
    sev = sevFromScore(score || 0);
  function save() {
    ctx.patchGov(f.key, {
      cvssVector: vec,
      cvssBy: ctx.me.username,
      cvssAt: nowIso(),
      cvssWhy: why[0],
    });
    ctx.log(
      "CVSS",
      f.name +
        " on " +
        hostLabel(f) +
        " re-scored " +
        (f.scannerCvss != null ? f.scannerCvss : f.cvss) +
        " → " +
        score +
        " (" +
        vec +
        ")" +
        (why[0] ? " — " + why[0] : ""),
    );
    ctx.toast({
      title: "Re-scored " + score.toFixed(1) + " · " + SEV_LABEL[sev],
      message: "Severity, SLA, risk and SSVC now use your vector.",
    });
    p.onClose();
  }
  function clear() {
    ctx.patchGov(f.key, {
      cvssVector: null,
      cvssWhy: null,
    });
    ctx.log("CVSS", f.name + " back to the scanner's score");
    p.onClose();
  }
  return (
    <V.Modal
      title={"CVSS " + ver + " calculator"}
      subtitle={f.name + " · " + hostLabel(f)}
      width="720px"
      onClose={p.onClose}
      footer={[
        (ctx.gov[f.key] || {}).cvssVector ? (
          <V.Button key="x" variant="ghost" onClick={clear}>
            Use scanner score
          </V.Button>
        ) : null,
        <V.Button key="c" onClick={p.onClose}>
          Cancel
        </V.Button>,
        <V.Button
          key="s"
          variant="primary"
          disabled={score == null}
          onClick={save}
        >
          Save score
        </V.Button>,
      ].filter(Boolean)}
    >
      <div className="cv-head">
        <V.SegmentedControl
          label="Version"
          options={["4.0", "3.1"]}
          value={ver}
          onChange={function (v) {
            vs[1](v);
            ms[1](init(v));
          }}
        />
        <div className="cv-score">
          <b className="vl-mono">{score == null ? "—" : score.toFixed(1)}</b>
          <V.SeverityBadge severity={sev} />
        </div>
      </div>
      <div className="cv-grid">
        {CVSS_DEFS[ver].map(function (d) {
          return (
            <div key={d[1]} className="cv-row">
              <span className="vl-label">{d[0] + " (" + d[1] + ")"}</span>
              <div className="cv-opts" role="radiogroup" aria-label={d[0]}>
                {d[2].map(function (o) {
                  var on = m[d[1]] === o[0];
                  return (
                    <button
                      key={o[0]}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      className={"cv-opt" + (on ? " is-on" : "")}
                      onClick={function () {
                        var n = Object.assign({}, m);
                        n[d[1]] = o[0];
                        ms[1](n);
                      }}
                    >
                      {o[1]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="vl-mono cv-vec">{vec}</p>
      <label className="wb-field">
        <span className="vl-label">Why (goes in the audit log and report)</span>
        <input
          className="wb-select"
          value={why[0]}
          placeholder="e.g. only reachable from the admin VLAN; needs a valid session"
          onChange={function (e) {
            why[1](e.target.value);
          }}
        />
      </label>
      <p className="up-help">
        {"Scanner score: " +
          (f.scannerCvss != null ? f.scannerCvss : f.cvss || "—") +
          (f.scannerVector || (f.cvssSrc !== "analyst" && f.vector)
            ? " (" + (f.scannerVector || f.vector) + ")"
            : "") +
          ". CVSS 4.0 scoring follows FIRST's reference calculator."}
      </p>
    </V.Modal>
  );
}
