import { openRow } from "@/app/components/utils";
import { count, hostLabel } from "@/app/lib/common";
import { saveFile, toCsv } from "@/app/lib/export";
import {
  FRAMEWORKS,
  ST_LABEL,
  runFramework,
} from "@/app/views/governance/utils";
import { SEV, days } from "@/lib/data";
import { AS_OF, localDay } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

export function Frameworks(p) {
  var ctx = p.ctx,
    sel = useState(function () {
      return (ctx.policy && ctx.policy.framework) || "pci";
    }),
    op = useState(null);
  var res = FRAMEWORKS.map(function (fw) {
    var r = runFramework(fw, p.F, p.A, ctx);
    return {
      fw: fw,
      r: r,
      gaps: count(r, function (x) {
        return x.st === "fail";
      }),
      warn: count(r, function (x) {
        return x.st === "warn";
      }),
      pass: count(r, function (x) {
        return x.st === "pass";
      }),
    };
  });
  var cur =
    res.find(function (x) {
      return x.fw.id === sel[0];
    }) || res[0];
  function csv() {
    var rows = [
      [
        "framework",
        "control",
        "requirement",
        "status",
        "detail",
        "finding",
        "host",
        "severity",
        "first_seen",
        "sla_days_left",
      ],
    ];
    cur.r.forEach(function (c) {
      if (!c.rows.length && !c.hosts.length)
        rows.push([
          cur.fw.name,
          c.id,
          c.title,
          ST_LABEL[c.st],
          c.txt,
          "",
          "",
          "",
          "",
          "",
        ]);
      c.rows.forEach(function (x) {
        rows.push([
          cur.fw.name,
          c.id,
          c.title,
          ST_LABEL[c.st],
          c.txt,
          x.name,
          hostLabel(x),
          x.sev,
          x.firstSeen,
          x.daysLeft,
        ]);
      });
      c.hosts.forEach(function (x) {
        rows.push([
          cur.fw.name,
          c.id,
          c.title,
          ST_LABEL[c.st],
          c.txt,
          "(host not scanned)",
          x.host,
          "",
          x.last,
          "",
        ]);
      });
    });
    saveFile(
      ctx,
      "vaptlens-" + cur.fw.id + "-evidence-" + localDay() + ".csv",
      toCsv(rows),
    );
    ctx.log("COMPLIANCE", cur.fw.name + " evidence exported");
  }
  function applyPreset() {
    var o = Object.assign({}, ctx.sla, cur.fw.preset);
    ctx.setSla(o);
    ctx.setPolicy(
      Object.assign({}, ctx.policy, {
        framework: cur.fw.id,
      }),
    );
    ctx.log(
      "SLA",
      "Windows set to the " +
        cur.fw.name +
        " preset: " +
        SEV.map(function (s2) {
          return s2 + " " + o[s2] + "d";
        }).join(", "),
    );
    ctx.toast({
      title: cur.fw.name + " SLA windows applied",
      message: cur.fw.presetNote,
    });
  }
  return (
    <div className="stack">
      <div className="fw-grid">
        {res.map(function (x) {
          var on = x.fw.id === cur.fw.id;
          return (
            <button
              key={x.fw.id}
              type="button"
              className={"fw-card" + (on ? " is-on" : "")}
              aria-pressed={on}
              onClick={function () {
                sel[1](x.fw.id);
                op[1](null);
              }}
            >
              <span className="fw-name">{x.fw.name}</span>
              <span className="fw-region">{x.fw.region}</span>
              <span className="fw-score">
                {x.gaps ? (
                  <b className="is-fail">
                    {x.gaps + " gap" + (x.gaps > 1 ? "s" : "")}
                  </b>
                ) : (
                  <b className="is-pass">No gaps</b>
                )}
                {x.warn ? " · " + x.warn + " to watch" : ""}
                {" · " + x.pass + "/" + x.r.length + " pass"}
              </span>
            </button>
          );
        })}
      </div>
      <V.WidgetCard
        title={cur.fw.name + " · vulnerability-management controls"}
        draggable={false}
        actions={[
          cur.fw.preset ? (
            <V.Button
              key="p"
              size="sm"
              restricted={!ctx.isAdmin}
              restrictedReason="Only administrators change SLA windows."
              onClick={applyPreset}
            >
              Use its SLA windows
            </V.Button>
          ) : null,
          <V.Button
            key="x"
            size="sm"
            variant="ghost"
            icon="download"
            onClick={csv}
          >
            Evidence CSV
          </V.Button>,
        ].filter(Boolean)}
      >
        {cur.fw.presetNote ? (
          <p className="up-help">{cur.fw.presetNote}</p>
        ) : null}
        <div className="ctl-list">
          {cur.r.map(function (c, i) {
            var openC = op[0] === i,
              n = c.rows.length + c.hosts.length;
            return (
              <div key={i} className={"ctl is-" + c.st}>
                <button
                  type="button"
                  className="ctl-head"
                  aria-expanded={openC}
                  disabled={!n}
                  onClick={function () {
                    op[1](openC ? null : i);
                  }}
                >
                  <span className="ctl-st">{ST_LABEL[c.st]}</span>
                  <span className="ctl-id vl-mono">{c.id}</span>
                  <span className="ctl-t">{c.title}</span>
                  <span className="ctl-txt">{c.txt}</span>
                  {n ? (
                    <span className="up-edit">
                      {openC ? "Hide" : "Show " + n}
                    </span>
                  ) : null}
                </button>
                {openC ? (
                  <div className="stack-tight ctl-rows">
                    {c.rows.slice(0, 100).map(function (x) {
                      return (
                        <div
                          {...Object.assign(
                            {
                              key: x.id,
                            },
                            openRow(ctx, x.key, "breach-item"),
                          )}
                        >
                          <V.SeverityBadge severity={x.sev} />
                          <span className="breach-name">{x.name}</span>
                          <span className="vl-mono diff-host">
                            {hostLabel(x) +
                              " · " +
                              days(x.slaStart || x.firstSeen, AS_OF) +
                              "d open"}
                          </span>
                        </div>
                      );
                    })}
                    {c.hosts.slice(0, 100).map(function (x) {
                      return (
                        <div key={x.host} className="breach-item">
                          <V.Icon name="server" size={14} />
                          <button
                            type="button"
                            className="inline-link vl-mono"
                            onClick={function () {
                              ctx.openHost(x.host);
                            }}
                          >
                            {x.host}
                          </button>
                          <span className="up-help">
                            {"last scanned " + x.last}
                          </span>
                        </div>
                      );
                    })}
                    {n > 100 ? (
                      <p className="up-help">
                        {"First 100 shown; the evidence CSV has all " + n + "."}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </V.WidgetCard>
    </div>
  );
}
/* exception register: every decision with its policy status, renewals and approver chain */
