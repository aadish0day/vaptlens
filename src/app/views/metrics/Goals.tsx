import { Field } from "@/app/auth/Field";
import { SEV_LABEL, nowIso, uniq } from "@/app/lib/common";
import { Sel } from "@/app/views/dashboard/Sel";
import { addDays } from "@/app/views/findings/utils";
import { GOAL_METRICS, goalStatus, goalValue } from "@/app/views/metrics/goals";
import { SEV } from "@/lib/data";
import { AS_OF, localDay } from "@/lib/engine";
import React, { useEffect, useState } from "react";
import * as V from "@/ui";

export function Goals(p) {
  var ctx = p.ctx,
    ed = useState(null);
  /* goals without a starting point get one now, so progress can move */
  useEffect(function () {
    if (ctx.readOnly) return;
    if (
      ctx.goals.some(function (g) {
        return g.baseline == null;
      })
    )
      ctx.setGoals(
        ctx.goals.map(function (g) {
          return g.baseline != null
            ? g
            : Object.assign({}, g, {
                baseline: goalValue(g, ctx),
                baselineAt: nowIso(),
              });
        }),
      );
  }, []);
  function blank() {
    return {
      id: "g-" + Date.now().toString(36),
      name: "",
      type: "time",
      metric: "count",
      target: 0,
      due: addDays(localDay(), 30),
      filter: {
        sev: ["critical"],
      },
      createdAt: nowIso(),
      createdBy: ctx.me.username,
    };
  }
  function save(g) {
    var cur = goalValue(g, ctx),
      old = ctx.goals.find(function (x) {
        return x.id === g.id;
      });
    var same =
      old &&
      old.metric === g.metric &&
      JSON.stringify(old.filter || {}) === JSON.stringify(g.filter || {});
    var n = Object.assign({}, g, {
      baselineAt: same && g.baselineAt ? g.baselineAt : nowIso(),
      baseline: same && g.baseline != null ? g.baseline : cur,
      due: g.type === "continuous" ? null : g.due,
    });
    ctx.setGoals(
      ctx.goals
        .filter(function (x) {
          return x.id !== g.id;
        })
        .concat([n]),
    );
    ctx.log("GOAL", "Saved: " + g.name + " (target " + g.target + ")");
    ed[1](null);
  }
  var g = ed[0];
  function setF(k, v) {
    var n = JSON.parse(JSON.stringify(g));
    if (v === "" || v == null || v === false || (Array.isArray(v) && !v.length))
      delete n.filter[k];
    else n.filter[k] = v;
    ed[1](n);
  }
  var bus = uniq(
    ctx.active
      .map(function (x) {
        return x.bu;
      })
      .filter(Boolean),
  );
  return (
    <V.WidgetCard
      title={"Goals · " + ctx.goals.length}
      draggable={false}
      actions={
        ctx.readOnly ? null : (
          <V.Button
            size="sm"
            icon="plus"
            onClick={function () {
              ed[1](blank());
            }}
          >
            New goal
          </V.Button>
        )
      }
    >
      {g ? (
        <div className="dt-box goal-ed">
          <div className="eng-grid">
            <Field
              label="Goal"
              input={{
                value: g.name,
                placeholder:
                  "e.g. Zero critical findings on tier-1 assets by Q4",
                onChange: function (e) {
                  ed[1](
                    Object.assign({}, g, {
                      name: e.target.value,
                    }),
                  );
                },
              }}
            />
            <Sel
              label="Type"
              value={g.type}
              options={[
                ["time", "Time-bound (deadline)"],
                ["continuous", "Continuous (always hold)"],
              ]}
              onChange={function (v) {
                ed[1](
                  Object.assign({}, g, {
                    type: v,
                  }),
                );
              }}
            />
            <Sel
              label="Measure"
              value={g.metric}
              options={GOAL_METRICS}
              onChange={function (v) {
                ed[1](
                  Object.assign({}, g, {
                    metric: v,
                  }),
                );
              }}
            />
            <Field
              label="Target"
              input={{
                type: "number",
                min: 0,
                value: g.target,
                onChange: function (e) {
                  ed[1](
                    Object.assign({}, g, {
                      target: +e.target.value || 0,
                    }),
                  );
                },
              }}
            />
            {g.type === "time" ? (
              <Field
                label="Deadline"
                input={{
                  type: "date",
                  value: g.due || "",
                  min: AS_OF,
                  onChange: function (e) {
                    ed[1](
                      Object.assign({}, g, {
                        due: e.target.value,
                      }),
                    );
                  },
                }}
              />
            ) : (
              <span />
            )}
            {g.metric === "count" || g.metric === "breached" ? (
              <div className="wb-field eng-wide">
                <span className="vl-label">Which findings</span>
                <div className="row-wrap">
                  {SEV.map(function (s2) {
                    var on = (g.filter.sev || []).indexOf(s2) >= 0;
                    return (
                      <V.Checkbox
                        key={s2}
                        label={SEV_LABEL[s2]}
                        severity={s2}
                        checked={on}
                        onChange={function () {
                          var l = (g.filter.sev || []).filter(function (x) {
                            return x !== s2;
                          });
                          if (!on) l.push(s2);
                          setF("sev", l);
                        }}
                      />
                    );
                  })}
                  <V.Checkbox
                    label="CISA KEV"
                    checked={!!g.filter.kev}
                    onChange={function (v) {
                      setF("kev", v);
                    }}
                  />
                  <V.Checkbox
                    label="On attack path"
                    checked={!!g.filter.path}
                    onChange={function (v) {
                      setF("path", v);
                    }}
                  />
                </div>
                <div className="row-wrap">
                  <Sel
                    label="Business unit"
                    value={g.filter.bu || ""}
                    options={[["", "Any"]].concat(
                      bus.map(function (b) {
                        return [b, b];
                      }),
                    )}
                    onChange={function (v) {
                      setF("bu", v);
                    }}
                  />
                  <Sel
                    label="Tier"
                    value={String(g.filter.tier || "")}
                    options={[
                      ["", "Any"],
                      ["1", "Tier 1"],
                      ["2", "Tier 2"],
                      ["3", "Tier 3"],
                    ]}
                    onChange={function (v) {
                      setF("tier", v);
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <p className="rule-desc">
            {"Now: " +
              (goalValue(g, ctx) == null ? "—" : goalValue(g, ctx)) +
              " → target " +
              g.target +
              (g.type === "time" ? " by " + g.due : " (continuous)")}
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
              disabled={!g.name.trim() || (g.type === "time" && !g.due)}
              onClick={function () {
                save(g);
              }}
            >
              Save goal
            </V.Button>
          </div>
        </div>
      ) : null}
      {ctx.goals.length ? (
        <div className="goal-list">
          {ctx.goals.map(function (x) {
            var s2 = goalStatus(x, ctx);
            return (
              <div
                key={x.id}
                className={
                  "goal goal-" + s2.status.toLowerCase().replace(/\s+/g, "-")
                }
              >
                <div className="goal-h">
                  <V.Icon name="target" size={14} />
                  <div className="up-main">
                    <span className="up-name">{x.name}</span>
                    <span className="up-meta">
                      {(GOAL_METRICS.find(function (m) {
                        return m[0] === x.metric;
                      }) || ["", ""])[1] +
                        " · " +
                        (x.due ? "due " + x.due : "continuous")}
                    </span>
                  </div>
                  <span className="goal-v">
                    {(s2.value == null ? "—" : s2.value) + " / " + x.target}
                  </span>
                  <span className="goal-st">{s2.status}</span>
                </div>
                <div className="camp-bar">
                  <span
                    style={{
                      width: s2.pct + "%",
                    }}
                  />
                </div>
                {ctx.readOnly ? null : (
                  <div className="row-wrap">
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
                      className="up-edit"
                      onClick={function () {
                        var prevG = ctx.goals;
                        ctx.setGoals(
                          ctx.goals.filter(function (y) {
                            return y.id !== x.id;
                          }),
                        );
                        ctx.listUndo(
                          ctx.setGoals,
                          x,
                          "Goal " + x.name + " deleted",
                        );
                        ctx.log("GOAL", "Deleted " + x.name);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <V.EmptyState
          title="No goals yet."
          hint={
            'Set a time-bound target ("zero KEV findings by 31 Oct") or a continuous one ("SLA compliance stays ≥ 90%") and track it here.'
          }
        />
      )}
    </V.WidgetCard>
  );
}
