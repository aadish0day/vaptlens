import { SEV_LABEL } from "@/app/lib/common";
import { SEV } from "@/lib/data";
import React from "react";
import * as V from "@/ui";

export function SlaMatrix(p) {
  var base = p.base,
    tier = p.tier;
  return (
    <div className="scroll-x">
      <table className="ledger sla-matrix">
        <thead>
          <tr>
            <th>Asset tier</th>
            {SEV.map(function (s2) {
              return <th key={s2}>{SEV_LABEL[s2]}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>Default</b>
            </td>
            {SEV.map(function (s2) {
              return (
                <td key={s2}>
                  <input
                    className="wb-select sla-in"
                    type="number"
                    min={1}
                    max={999}
                    value={base[s2]}
                    aria-label={"Default SLA " + s2}
                    onChange={function (e) {
                      var n = Object.assign({}, base);
                      n[s2] = Math.max(
                        1,
                        Math.min(999, parseInt(e.target.value, 10) || 1),
                      );
                      p.onBase(n);
                    }}
                  />
                </td>
              );
            })}
          </tr>
          {[1, 2, 3].map(function (t) {
            var o = tier[t] || {};
            return (
              <tr key={t}>
                <td>
                  <V.TierBadge tier={t} short={true} />
                </td>
                {SEV.map(function (s2) {
                  return (
                    <td key={s2}>
                      <input
                        className="wb-select sla-in"
                        type="number"
                        min={1}
                        max={999}
                        placeholder={String(base[s2])}
                        value={o[s2] || ""}
                        aria-label={"Tier " + t + " SLA " + s2}
                        onChange={function (e) {
                          var n = JSON.parse(JSON.stringify(tier));
                          n[t] = n[t] || {};
                          var v = parseInt(e.target.value, 10);
                          if (v > 0) n[t][s2] = Math.min(999, v);
                          else delete n[t][s2];
                          p.onTier(n);
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="up-help">
        Blank cells use the default. CISA KEV due dates always win when they're
        sooner.
      </p>
    </div>
  );
}

/* CMDB / asset inventory CSV: host, owner, business unit, tier, exposure, well-being, tags, device, os, retired */
