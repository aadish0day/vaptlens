import {
  dupCampaignToast,
  openRemTab,
  sameCampaign,
} from "@/app/lib/campaigns";
import { nowIso } from "@/app/lib/common";
import { addDays } from "@/app/views/findings/utils";
import { SLA_DAYS } from "@/lib/data";
import { localDay, topFixes } from "@/lib/engine";
import React from "react";
import * as V from "@/ui";

/* ---------- Remediation: Top fixes, Campaigns, Rules ---------- */
export function TopFixes(p) {
  var ctx = p.ctx,
    fx = topFixes(ctx.active).slice(0, 25);
  function campaign(x) {
    var dup = sameCampaign(
      ctx,
      x.findings.map(function (f) {
        return f.key;
      }),
    );
    if (dup) return dupCampaignToast(ctx, dup);
    var id = "c-" + Date.now().toString(36);
    ctx.setCampaigns(
      ctx.campaigns.concat([
        {
          id: id,
          name:
            x.sample.slice(0, 50) +
            (x.findings.length > 1 ? " (" + x.findings.length + ")" : ""),
          owner: ctx.g(x.findings[0]).team,
          due: addDays(localDay(), SLA_DAYS[x.findings[0].sev] || 30),
          keys: x.findings.map(function (f) {
            return f.key;
          }),
          createdAt: nowIso(),
          createdBy: ctx.me.username,
          source: "top fix",
        },
      ]),
    );
    ctx.log("CAMPAIGN", "Created from fix: " + x.sample);
    ctx.toast({
      title: "Campaign created",
      message: x.findings.length + " findings",
      action: {
        label: "Open campaigns",
        onClick: function () {
          openRemTab(ctx, "Campaigns");
        },
      },
    });
  }
  var cum = 0;
  return (
    <div className="stack">
      <p className="up-help">
        {"Findings grouped by the fix that closes them. Doing the top 5 removes " +
          fx.slice(0, 5).reduce(function (t, x) {
            return t + x.share;
          }, 0) +
          "% of current risk."}
      </p>
      <div className="scroll-x">
        <table className="ledger fixes">
          <thead>
            <tr>
              {[
                "#",
                "Fix",
                "Findings",
                "Hosts",
                "KEV",
                "Effort",
                "Risk removed",
                "Cumulative",
                "",
              ].map(function (c, i) {
                return <th key={i}>{c}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {fx.map(function (x, i) {
              cum += x.share;
              return (
                <tr key={x.key}>
                  <td className="vl-mono">{i + 1}</td>
                  <td>
                    <div className="up-main">
                      <span className="fix-sol">{x.sol}</span>
                      <span className="up-meta">{x.sample}</span>
                    </div>
                  </td>
                  <td className="vl-mono">{x.findings.length}</td>
                  <td className="vl-mono">{x.hostN}</td>
                  <td className="vl-mono">{x.kev || "—"}</td>
                  <td>
                    <V.EffortMeter value={x.effort} />
                  </td>
                  <td>
                    <span className="fix-bar">
                      <span
                        style={{
                          width: Math.min(100, x.share * 3) + "%",
                        }}
                      />
                      <b>{x.share + "%"}</b>
                    </span>
                  </td>
                  <td className="vl-mono">{Math.min(100, cum) + "%"}</td>
                  <td>
                    {ctx.readOnly ? null : (
                      <button
                        type="button"
                        className="up-edit"
                        onClick={function () {
                          campaign(x);
                        }}
                      >
                        Campaign
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
