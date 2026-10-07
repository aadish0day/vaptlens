import { SEV_LABEL } from "@/app/lib/common";
import { CUR } from "@/app/views/governance/utils";
import { SEV } from "@/lib/data";
import React from "react";
import * as V from "@/ui";

export function Policies(p) {
  var ctx = p.ctx,
    pol = ctx.policy || {},
    ro = !ctx.isAdmin;
  function set(patch, what) {
    if (ro) return;
    ctx.setPolicy(Object.assign({}, pol, patch));
    ctx.log("POLICY", what);
  }
  return (
    <div className="grid-2">
      <V.WidgetCard title="Exception governance" draggable={false}>
        <p className="up-help">
          Maximum length of a risk acceptance, by severity. Longer requests are
          refused; renewals restart the clock.
        </p>
        <div className="pol-grid">
          {SEV.map(function (s2) {
            return (
              <label key={s2} className="wb-field">
                <span className="vl-label">{SEV_LABEL[s2] + " (days)"}</span>
                <input
                  type="number"
                  min={1}
                  max={730}
                  className="wb-select"
                  disabled={ro}
                  value={(pol.maxDays || {})[s2] || 365}
                  onChange={function (e) {
                    var n = Object.assign({}, pol.maxDays);
                    n[s2] = Math.max(1, Math.min(730, +e.target.value || 1));
                    set(
                      {
                        maxDays: n,
                      },
                      "Max exception " + s2 + " → " + n[s2] + "d",
                    );
                  }}
                />
              </label>
            );
          })}
        </div>
        <V.Toggle
          label="Separation of duties: requesters can't approve their own requests"
          checked={pol.sod !== false}
          disabled={ro}
          title={ro ? "Only administrators change policy." : null}
          onChange={function (v) {
            set(
              {
                sod: v,
              },
              "Separation of duties " + (v ? "on" : "off"),
            );
          }}
        />
        <V.Toggle
          label="Two-person rule: Critical and KEV acceptances need a second administrator"
          checked={!!pol.twoPerson}
          disabled={ro}
          title={ro ? "Only administrators change policy." : null}
          onChange={function (v) {
            set(
              {
                twoPerson: v,
              },
              "Two-person approval " + (v ? "on" : "off"),
            );
          }}
        />
      </V.WidgetCard>
      <V.WidgetCard title="Risk in money" draggable={false}>
        <label className="wb-field">
          <span className="vl-label">Currency</span>
          <select
            className="wb-select"
            disabled={ro}
            value={pol.currency || "USD"}
            onChange={function (e) {
              set(
                {
                  currency: e.target.value,
                },
                "Currency → " + e.target.value,
              );
            }}
          >
            {Object.keys(CUR).map(function (c) {
              return (
                <option key={c} value={c}>
                  {c + " " + CUR[c][0]}
                </option>
              );
            })}
          </select>
        </label>
        <p className="up-help">
          Value at stake per asset tier (revenue, data or replacement cost an
          incident could touch).
        </p>
        <div className="pol-grid">
          {[1, 2, 3].map(function (t) {
            return (
              <label key={t} className="wb-field">
                <span className="vl-label">{"Tier " + t + " asset value"}</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  className="wb-select"
                  disabled={ro}
                  value={(pol.assetValue || {})[t] || 0}
                  onChange={function (e) {
                    var n = Object.assign({}, pol.assetValue);
                    n[t] = Math.max(0, +e.target.value || 0);
                    set(
                      {
                        assetValue: n,
                      },
                      "Tier " + t + " asset value → " + n[t],
                    );
                  }}
                />
              </label>
            );
          })}
        </div>
        {ro ? (
          <p className="up-help">Only administrators change policy.</p>
        ) : null}
      </V.WidgetCard>
    </div>
  );
}
