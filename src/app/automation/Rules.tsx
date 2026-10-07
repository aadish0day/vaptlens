import { Field } from "@/app/auth/Field";
import { RO_REASON, SEV_LABEL, count, uniq } from "@/app/lib/common";
import { Sel } from "@/app/views/dashboard/Sel";
import { SEV, TEAMS } from "@/lib/data";
import { assetOf, ruleMatches } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

export function Rules(p) {
  var ctx = p.ctx,
    ed = useState(null),
    prev = useState(null);
  function blank() {
    return {
      id: "r-" + Date.now().toString(36),
      name: "",
      enabled: true,
      when: {},
      then: {},
    };
  }
  function setW(k, v) {
    var n = JSON.parse(JSON.stringify(ed[0]));
    if (v === "" || v == null || v === false || (Array.isArray(v) && !v.length))
      delete n.when[k];
    else n.when[k] = v;
    ed[1](n);
    prev[1](null);
  }
  function setT(k, v) {
    var n = JSON.parse(JSON.stringify(ed[0]));
    if (v === "" || v == null || v === false) delete n.then[k];
    else n.then[k] = v;
    ed[1](n);
  }
  function desc(r) {
    var w = r.when || {},
      t = r.then || {},
      a = [],
      b = [];
    if (w.sev) a.push(w.sev.join("/"));
    if (w.kev) a.push("KEV");
    if (w.onPath) a.push("on attack path");
    if (w.ssvc) a.push("SSVC " + w.ssvc.join("/"));
    if (w.exposure) a.push(w.exposure);
    if (w.tier) a.push("Tier " + w.tier);
    if (w.bu) a.push("BU " + w.bu);
    if (w.host) a.push("host ~ " + w.host);
    if (w.name) a.push("title ~ " + w.name);
    if (w.tool) a.push("tool ~ " + w.tool);
    if (t.team) b.push("assign " + t.team);
    if (t.raci) b.push("RACI " + t.raci);
    if (t.tag) b.push("#" + t.tag);
    if (t.ticket) b.push("raise ticket");
    if (t.status) b.push("status " + t.status);
    if (t.campaign) b.push("add to campaign");
    return (
      "If " +
      (a.join(" and ") || "any active finding") +
      " → " +
      (b.join(", ") || "nothing")
    );
  }
  var r = ed[0],
    bus = uniq(
      Object.keys(ctx.assets)
        .map(function (hh) {
          return ctx.assets[hh].bu;
        })
        .filter(Boolean),
    );
  var matchN = r
    ? count(ctx.active, function (f) {
        return ruleMatches(r, f, {
          buOf: function (hh) {
            return assetOf(hh, ctx.assets).bu;
          },
        });
      })
    : 0;
  return (
    <div className="stack">
      <div className="row-wrap">
        <V.Button
          size="sm"
          icon="plus"
          restricted={ctx.readOnly}
          restrictedReason={RO_REASON}
          onClick={function () {
            ed[1](blank());
          }}
        >
          New rule
        </V.Button>
        <V.Button
          size="sm"
          variant="primary"
          icon="workflow"
          restricted={ctx.readOnly}
          restrictedReason={RO_REASON}
          onClick={function () {
            ctx.runRules();
          }}
        >
          Run all rules now
        </V.Button>
        <span className="up-help">
          Rules also run after every import. Each change is written to the audit
          log.
        </span>
      </div>
      {r ? (
        <div className="dt-box rule-ed">
          <Field
            label="Rule name"
            input={{
              value: r.name,
              placeholder: "e.g. Criticals on tier-1 assets → Application Dev",
              onChange: function (e) {
                ed[1](
                  Object.assign({}, r, {
                    name: e.target.value,
                  }),
                );
              },
            }}
          />
          <span className="vl-label">When a finding…</span>
          <div className="eng-grid">
            <div className="wb-field">
              <span className="vl-label">Severity</span>
              <div className="row-wrap">
                {SEV.map(function (s2) {
                  var on = (r.when.sev || []).indexOf(s2) >= 0;
                  return (
                    <V.Checkbox
                      key={s2}
                      label={SEV_LABEL[s2]}
                      severity={s2}
                      checked={on}
                      onChange={function () {
                        var l = (r.when.sev || []).filter(function (x) {
                          return x !== s2;
                        });
                        if (!on) l.push(s2);
                        setW("sev", l);
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="wb-field">
              <span className="vl-label">Signals</span>
              <div className="row-wrap">
                <V.Checkbox
                  label="CISA KEV"
                  checked={!!r.when.kev}
                  onChange={function (v) {
                    setW("kev", v);
                  }}
                />
                <V.Checkbox
                  label="On attack path"
                  checked={!!r.when.onPath}
                  onChange={function (v) {
                    setW("onPath", v);
                  }}
                />
              </div>
            </div>
            <Sel
              label="SSVC decision"
              value={(r.when.ssvc || [""])[0]}
              options={[
                ["", "Any"],
                ["Act", "Act"],
                ["Attend", "Attend"],
                ["Track*", "Track*"],
                ["Track", "Track"],
              ]}
              onChange={function (v) {
                setW("ssvc", v ? [v] : null);
              }}
            />
            <Sel
              label="Exposure"
              value={r.when.exposure || ""}
              options={[
                ["", "Any"],
                ["internet", "Internet-facing"],
                ["internal", "Internal"],
                ["isolated", "Isolated"],
              ]}
              onChange={function (v) {
                setW("exposure", v);
              }}
            />
            <Sel
              label="Asset tier"
              value={String(r.when.tier || "")}
              options={[
                ["", "Any"],
                ["1", "Tier 1"],
                ["2", "Tier 2"],
                ["3", "Tier 3"],
              ]}
              onChange={function (v) {
                setW("tier", v ? +v : null);
              }}
            />
            <Sel
              label="Business unit"
              value={r.when.bu || ""}
              options={[["", "Any"]].concat(
                bus.map(function (b) {
                  return [b, b];
                }),
              )}
              onChange={function (v) {
                setW("bu", v);
              }}
            />
            <Field
              label="Host contains"
              input={{
                value: r.when.host || "",
                onChange: function (e) {
                  setW("host", e.target.value);
                },
              }}
            />
            <Field
              label="Title contains"
              input={{
                value: r.when.name || "",
                onChange: function (e) {
                  setW("name", e.target.value);
                },
              }}
            />
          </div>
          <span className="vl-label">Then…</span>
          <div className="eng-grid">
            <Sel
              label="Assign team"
              value={r.then.team || ""}
              options={[["", "Don't change"]].concat(
                TEAMS.map(function (t) {
                  return [t, t];
                }),
              )}
              onChange={function (v) {
                setT("team", v);
              }}
            />
            <Sel
              label="RACI role"
              value={r.then.raci || ""}
              options={[
                ["", "Don't change"],
                ["R", "Responsible"],
                ["A", "Accountable"],
                ["C", "Consulted"],
                ["I", "Informed"],
              ]}
              onChange={function (v) {
                setT("raci", v);
              }}
            />
            <Field
              label="Add tag"
              input={{
                value: r.then.tag || "",
                placeholder: "e.g. pci-scope",
                onChange: function (e) {
                  setT(
                    "tag",
                    e.target.value
                      .trim()
                      .toLowerCase()
                      .replace(/[^a-z0-9:_-]+/g, "-"),
                  );
                },
              }}
            />
            <Sel
              label="Add to campaign"
              value={r.then.campaign || ""}
              options={[["", "None"]].concat(
                ctx.campaigns.map(function (c) {
                  return [c.id, c.name];
                }),
              )}
              onChange={function (v) {
                setT("campaign", v);
              }}
            />
            <div className="wb-field">
              <span className="vl-label">Ticket</span>
              <V.Checkbox
                label="Raise a ticket if none"
                checked={!!r.then.ticket}
                onChange={function (v) {
                  setT("ticket", v);
                }}
              />
            </div>
          </div>
          <p className="rule-desc">
            {desc(r) + " · matches " + matchN + " active findings now"}
          </p>
          <div className="row-wrap">
            <V.Button
              size="sm"
              onClick={function () {
                ed[1](null);
              }}
            >
              Cancel
            </V.Button>
            <V.Button
              size="sm"
              variant="primary"
              disabled={!r.name.trim() || !Object.keys(r.then).length}
              onClick={function () {
                ctx.setRules(
                  ctx.rules
                    .filter(function (x) {
                      return x.id !== r.id;
                    })
                    .concat([r]),
                );
                ctx.log("RULE", "Saved: " + r.name + " — " + desc(r));
                ed[1](null);
              }}
            >
              Save rule
            </V.Button>
          </div>
        </div>
      ) : null}
      <div className="up-list">
        {ctx.rules.map(function (x) {
          return (
            <div key={x.id} className="up-row">
              <div className="up-main">
                <span className="up-name">{x.name}</span>
                <span className="up-meta">{desc(x)}</span>
              </div>
              <V.Toggle
                label={x.enabled === false ? "Off" : "On"}
                checked={x.enabled !== false}
                disabled={ctx.readOnly}
                title={ctx.readOnly ? RO_REASON : null}
                onChange={function (v) {
                  if (ctx.readOnly) return;
                  ctx.setRules(
                    ctx.rules.map(function (y) {
                      return y.id === x.id
                        ? Object.assign({}, y, {
                            enabled: v,
                          })
                        : y;
                    }),
                  );
                  ctx.log("RULE", x.name + (v ? " enabled" : " disabled"));
                }}
              />
              {ctx.readOnly ? (
                <span />
              ) : (
                <span className="row-wrap">
                  <button
                    type="button"
                    className="up-edit"
                    onClick={function () {
                      ed[1](JSON.parse(JSON.stringify(x)));
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="vl-icon-btn"
                    aria-label={"Delete rule " + x.name}
                    onClick={function () {
                      var prevR = ctx.rules;
                      ctx.setRules(
                        ctx.rules.filter(function (y) {
                          return y.id !== x.id;
                        }),
                      );
                      ctx.listUndo(
                        ctx.setRules,
                        x,
                        "Rule " + x.name + " deleted",
                      );
                      ctx.log("RULE", "Deleted " + x.name);
                    }}
                  >
                    <V.Icon name="x" size={14} />
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- exception approvals (admins) ---------- */
