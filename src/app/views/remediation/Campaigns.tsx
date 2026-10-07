import { Field } from "@/app/auth/Field";
import { openRow } from "@/app/components/utils";
import { RO_REASON, hostLabel, nowIso, uniq } from "@/app/lib/common";
import { saveFile, slug } from "@/app/lib/export";
import { biCtx } from "@/app/lib/filters";
import { addDays, applyFilters, jiraCsv } from "@/app/views/findings/utils";
import { campaignStats } from "@/app/views/remediation/utils";
import { TEAMS, days } from "@/lib/data";
import { AS_OF, localDay } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

export function Campaigns(p) {
  var ctx = p.ctx,
    ed = useState(null),
    ex = useState(null);
  function save(c) {
    ctx.setCampaigns(
      ctx.campaigns
        .filter(function (x) {
          return x.id !== c.id;
        })
        .concat([c]),
    );
    ctx.log("CAMPAIGN", "Saved " + c.name);
    ed[1](null);
  }
  function fromFilters() {
    var f = ctx.filters,
      rows = applyFilters(ctx.active, f, biCtx(ctx));
    ed[1]({
      id: "c-" + Date.now().toString(36),
      name: "Campaign " + (ctx.campaigns.length + 1),
      owner: "SecOps",
      due: addDays(localDay(), 30),
      keys: uniq(
        rows.map(function (x) {
          return x.key;
        }),
      ),
      createdAt: nowIso(),
      createdBy: ctx.me.username,
      source: "dashboard filters",
    });
  }
  return (
    <div className="stack">
      <div className="row-wrap">
        <V.Button
          size="sm"
          icon="plus"
          restricted={ctx.readOnly}
          restrictedReason={RO_REASON}
          onClick={fromFilters}
        >
          New from dashboard filters
        </V.Button>
        <span className="up-help">
          Or create one from Top fixes or an attack-path choke point.
        </span>
      </div>
      {ed[0] ? (
        <div className="dt-box">
          <div className="eng-grid">
            <Field
              label="Name"
              input={{
                value: ed[0].name,
                onChange: function (e) {
                  ed[1](
                    Object.assign({}, ed[0], {
                      name: e.target.value,
                    }),
                  );
                },
              }}
            />
            <label className="wb-field">
              <span className="vl-label">Owner team</span>
              <select
                className="wb-select"
                value={ed[0].owner}
                onChange={function (e) {
                  ed[1](
                    Object.assign({}, ed[0], {
                      owner: e.target.value,
                    }),
                  );
                }}
              >
                {TEAMS.map(function (t) {
                  return (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  );
                })}
              </select>
            </label>
            <Field
              label="Due"
              input={{
                type: "date",
                value: ed[0].due,
                onChange: function (e) {
                  ed[1](
                    Object.assign({}, ed[0], {
                      due: e.target.value,
                    }),
                  );
                },
              }}
            />
            <p className="up-help">
              {ed[0].keys.length + " findings in scope"}
            </p>
          </div>
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
              disabled={!ed[0].name.trim() || !ed[0].keys.length}
              onClick={function () {
                save(ed[0]);
              }}
            >
              Save campaign
            </V.Button>
          </div>
        </div>
      ) : null}
      {ctx.campaigns.length ? (
        <div className="camp-list">
          {ctx.campaigns
            .slice()
            .sort(function (a, b) {
              return (a.due || "") < (b.due || "") ? -1 : 1;
            })
            .map(function (c) {
              var s = campaignStats(c, ctx),
                open = ex[0] === c.id;
              return (
                <div
                  key={c.id}
                  className={
                    "camp" +
                    (s.overdue ? " is-over" : "") +
                    (s.pct === 100 ? " is-done" : "")
                  }
                >
                  <div className="camp-h">
                    <V.Icon name="flag" size={14} />
                    <div className="up-main">
                      <span className="up-name">{c.name}</span>
                      <span className="up-meta">
                        {c.owner +
                          " · due " +
                          (c.due || "—") +
                          " · " +
                          c.keys.length +
                          " findings · from " +
                          (c.source || "manual")}
                      </span>
                    </div>
                    <span className="camp-pct">{s.pct + "%"}</span>
                    {s.overdue ? (
                      <V.SlaPill status="breached" days={days(c.due, AS_OF)} />
                    ) : s.pct === 100 ? (
                      <V.DiffBadge kind="fixed" label="Complete" />
                    ) : (
                      <V.SlaPill
                        status={
                          c.due && days(AS_OF, c.due) <= 7 ? "at-risk" : "met"
                        }
                        days={c.due ? days(AS_OF, c.due) : undefined}
                      />
                    )}
                  </div>
                  <div
                    className="camp-bar"
                    role="progressbar"
                    aria-valuenow={s.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span
                      style={{
                        width: s.pct + "%",
                      }}
                    />
                  </div>
                  <div className="row-wrap">
                    <button
                      type="button"
                      className="up-edit"
                      onClick={function () {
                        ex[1](open ? null : c.id);
                      }}
                    >
                      {open
                        ? "Hide findings"
                        : "Show " + s.open.length + " open"}
                    </button>
                    <button
                      type="button"
                      className="up-edit"
                      onClick={function () {
                        saveFile(
                          ctx,
                          "vaptlens-campaign-" + slug(c.name) + "-jira.csv",
                          jiraCsv(s.open, ctx),
                        );
                      }}
                    >
                      Jira CSV
                    </button>
                    {ctx.readOnly ? null : (
                      <button
                        type="button"
                        className="up-edit"
                        onClick={function () {
                          ed[1](Object.assign({}, c));
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {ctx.readOnly ? null : (
                      <button
                        type="button"
                        className="up-edit"
                        onClick={function () {
                          var prev = ctx.campaigns;
                          ctx.setCampaigns(
                            ctx.campaigns.filter(function (x) {
                              return x.id !== c.id;
                            }),
                          );
                          ctx.log("CAMPAIGN", "Deleted " + c.name);
                          ctx.listUndo(
                            ctx.setCampaigns,
                            c,
                            "Campaign " + c.name + " deleted",
                          );
                        }}
                      >
                        Delete
                      </button>
                    )}
                    <span className="up-help">
                      {s.done +
                        " verified fixed · " +
                        s.open.length +
                        " open" +
                        (s.excepted ? " · " + s.excepted + " excepted" : "") +
                        (s.orphan
                          ? " · " + s.orphan + " no longer in any scan"
                          : "") +
                        " · open risk " +
                        s.risk}
                    </span>
                  </div>
                  {open ? (
                    <div className="stack-tight">
                      {ctx.readOnly ? null : (
                        <div className="row-wrap">
                          <V.Button
                            size="sm"
                            icon="plus"
                            onClick={function () {
                              var add = applyFilters(
                                ctx.active,
                                ctx.filters,
                                biCtx(ctx),
                              )
                                .map(function (f) {
                                  return f.key;
                                })
                                .filter(function (k) {
                                  return (c.keys || []).indexOf(k) < 0;
                                });
                              if (!add.length) {
                                ctx.toast({
                                  title: "Nothing new to add",
                                  message:
                                    "Every finding in the current dashboard view is already in this campaign.",
                                  tone: "info",
                                });
                                return;
                              }
                              ctx.setCampaigns(
                                ctx.campaigns.map(function (x) {
                                  return x.id === c.id
                                    ? Object.assign({}, x, {
                                        keys: uniq((x.keys || []).concat(add)),
                                      })
                                    : x;
                                }),
                              );
                              ctx.log(
                                "CAMPAIGN",
                                add.length + " findings added to " + c.name,
                                add.slice(0, 50),
                              );
                              var prevKeys = (c.keys || []).slice();
                              var tidA = ctx.toast({
                                title:
                                  add.length + " findings added to " + c.name,
                                action: {
                                  label: "Undo",
                                  onClick: function () {
                                    ctx.setCampaigns(function (cs) {
                                      return cs.map(function (x) {
                                        return x.id === c.id
                                          ? Object.assign({}, x, {
                                              keys: (x.keys || []).filter(
                                                function (k) {
                                                  return (
                                                    add.indexOf(k) < 0 ||
                                                    prevKeys.indexOf(k) >= 0
                                                  );
                                                },
                                              ),
                                            })
                                          : x;
                                      });
                                    });
                                    ctx.log(
                                      "UNDO",
                                      "Campaign " +
                                        c.name +
                                        ": " +
                                        add.length +
                                        " additions removed",
                                    );
                                    ctx.dropToast(tidA);
                                  },
                                },
                              });
                              return;
                              ctx.toast({
                                title:
                                  add.length + " findings added to " + c.name,
                              });
                            }}
                          >
                            Add findings from the dashboard view
                          </V.Button>
                        </div>
                      )}
                      {s.open.map(function (f) {
                        return (
                          <div
                            {...Object.assign(
                              {
                                key: f.id,
                              },
                              openRow(ctx, f.key, "breach-item"),
                            )}
                          >
                            <V.SeverityBadge severity={f.sev} />
                            <span className="breach-name">{f.name}</span>
                            <span className="vl-mono diff-host">
                              {hostLabel(f)}
                            </span>
                            {ctx.readOnly ? null : (
                              <button
                                type="button"
                                className="vl-icon-btn"
                                aria-label={
                                  "Remove " + f.name + " from " + c.name
                                }
                                title="Remove from campaign"
                                onClick={function (e) {
                                  e.stopPropagation();
                                  ctx.setCampaigns(
                                    ctx.campaigns.map(function (x) {
                                      return x.id === c.id
                                        ? Object.assign({}, x, {
                                            keys: (x.keys || []).filter(
                                              function (k) {
                                                return k !== f.key;
                                              },
                                            ),
                                          })
                                        : x;
                                    }),
                                  );
                                  ctx.log(
                                    "CAMPAIGN",
                                    f.name + " removed from " + c.name,
                                    f.key,
                                  );
                                  var tid = ctx.toast({
                                    title: "Removed from " + c.name,
                                    action: {
                                      label: "Undo",
                                      onClick: function () {
                                        ctx.setCampaigns(function (cs) {
                                          return cs.map(function (x) {
                                            return x.id === c.id
                                              ? Object.assign({}, x, {
                                                  keys: uniq(
                                                    (x.keys || []).concat([
                                                      f.key,
                                                    ]),
                                                  ),
                                                })
                                              : x;
                                          });
                                        });
                                        ctx.dropToast(tid);
                                      },
                                    },
                                  });
                                }}
                              >
                                <V.Icon name="x" size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
        </div>
      ) : (
        <V.EmptyState
          title="No campaigns yet."
          hint="Group findings into a named push with an owner and a due date, then track it to done."
        />
      )}
    </div>
  );
}
