import { Rules } from "@/app/automation/Rules";
import { PageHead } from "@/app/components/PageHead";
import {
  COLS,
  fmtTime,
  hostLabel,
  nowIso,
  store,
  tagsOf,
} from "@/app/lib/common";
import { TopFixes } from "@/app/views/attack/TopFixes";
import { Campaigns } from "@/app/views/remediation/Campaigns";
import { topFixes } from "@/lib/engine";
import React, { useEffect, useRef, useState } from "react";
import * as V from "@/ui";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { LEAVE, NONE, useReduced } from "@/ui/motion";

/* a moved card flies to its new column, the rest close the gap (interior.dev reorder-list / filter-grid) */
var CARD = { type: "spring", stiffness: 520, damping: 40, mass: 0.6 } as const;

/* ================= 5. Remediation ================= */
export function Remediation(ctx) {
  var a = ctx.active.slice().sort(function (x, y) {
    return (
      ["critical", "high", "medium", "low", "info"].indexOf(x.sev) -
        ["critical", "high", "medium", "low", "info"].indexOf(y.sev) ||
      y.risk - x.risk
    );
  });
  var ad = useState(false),
    rt = useState(function () {
      return store("vaptlens.remTab") || "Board";
    });
  function setTab(t) {
    rt[1](t);
    store("vaptlens.remTab", t);
  }
  useEffect(function () {
    function on(e) {
      if (e.detail) rt[1](e.detail);
    }
    window.addEventListener("vl-remtab", on);
    return function () {
      window.removeEventListener("vl-remtab", on);
    };
  }, []);
  var reduced = useReduced();
  var dg = useState(null),
    ov = useState(null);
  /* "Remediated" means fixed: it leaves the active queue and waits for a re-scan to verify (a scan that still finds it reopens it) */
  var activeKeys = {};
  a.forEach(function (x) {
    activeKeys[x.key] = 1;
  });
  var pending = ctx.data.filter(function (x) {
    var g0 = ctx.gov[x.key];
    return (
      x.batch === ctx.latest &&
      x.lifecycle !== "Fixed" &&
      g0 &&
      g0.fixed &&
      !activeKeys[x.key] &&
      ctx.stateOf(x.key) !== "fp" &&
      ctx.stateOf(x.key) !== "accepted"
    );
  });
  function moveTo(x, to) {
    var from = ctx.g(x).status || "To Do";
    if (from === to) return;
    ctx.govUndoable(
      [x.key],
      function () {
        return to === "Remediated"
          ? {
              status: to,
              fixed: true,
              fixedAt: nowIso(),
              assigned: true,
            }
          : {
              status: to,
              fixed: false,
              fixedAt: null,
              assigned: true,
            };
      },
      {
        title: x.name + " → " + to,
        message:
          to === "Remediated"
            ? "Out of the active queue until a re-scan verifies it."
            : null,
      },
    );
    ctx.log("PATCH", x.name + " moved " + from + " → " + to);
  }
  /* keyboard moves keep focus on the card in its new column (it re-renders there) */
  var refocus = useRef(null);
  useEffect(function () {
    var r = refocus.current;
    if (!r) return;
    refocus.current = null;
    var sel = function (s2) {
      return document.querySelector(
        '[data-kmove="' + CSS.escape(r.key + ":" + s2) + '"]',
      ) as HTMLButtonElement;
    };
    var b = sel(r.dir > 0 ? "forward" : "back");
    if (!b || b.disabled) b = sel(r.dir > 0 ? "back" : "forward");
    if (!b || b.disabled) b = sel("open");
    if (b) b.focus();
  });
  function move(x, dir) {
    var cur = ctx.g(x).status || "To Do";
    refocus.current = { key: x.key, dir: dir };
    moveTo(x, COLS[Math.max(0, Math.min(3, COLS.indexOf(cur) + dir))]);
  }
  function dropOn(c) {
    var k = dg[0];
    dg[1](null);
    ov[1](null);
    if (!k || ctx.readOnly) return;
    var x = a.concat(pending).find(function (y) {
      return y.key === k;
    });
    if (x) moveTo(x, c);
  }
  var stage = [0, 0, 0, 0, pending.length];
  a.forEach(function (x) {
    var gg = ctx.g(x);
    if (gg.status === "In Review") stage[3]++;
    else if (gg.status === "In Progress") stage[2]++;
    else if (gg.assigned || gg.status === "To Do") stage[1]++;
    else stage[0]++;
  });
  return (
    <div className="page">
      <PageHead
        title="Remediation Board"
        sub={
          rt[0] === "Board"
            ? ctx.readOnly
              ? "Read-only: Security Auditors can't move cards."
              : "Drag cards between columns, or use the chevrons. Remediated cards leave the queue until a re-scan verifies them; a scan that still finds one reopens it. Every move is logged and can be undone."
            : rt[0] === "Top fixes"
              ? "The few fixes that remove the most risk."
              : rt[0] === "Campaigns"
                ? "Named remediation pushes with an owner, a due date and live progress."
                : "If-this-then-that automation for assignment, tagging and tickets."
        }
        actions={
          <V.Button
            variant="secondary"
            icon="file"
            onClick={function () {
              ad[1](true);
            }}
          >
            {"Audit trail · " + ctx.audit.length}
          </V.Button>
        }
      />
      <V.Tabs
        tabs={[
          {
            label: "Board",
          },
          {
            label: "Top fixes",
            count: topFixes(ctx.active).length,
          },
          {
            label: "Campaigns",
            count: ctx.campaigns.length,
          },
          {
            label: "Rules",
            count: ctx.rules.filter(function (r) {
              return r.enabled !== false;
            }).length,
          },
        ]}
        value={rt[0]}
        onChange={setTab}
      />
      {rt[0] === "Top fixes" ? (
        <TopFixes ctx={ctx} />
      ) : rt[0] === "Campaigns" ? (
        <Campaigns ctx={ctx} />
      ) : rt[0] === "Rules" ? (
        <Rules ctx={ctx} />
      ) : null}
      {rt[0] === "Board" ? (
        <V.PipelineStepper
          counts={stage}
          labels={[
            "Unassigned",
            "To Do",
            "In Progress",
            "In Review",
            "Remediated · awaiting re-scan",
          ]}
        />
      ) : null}
      {rt[0] === "Board" && ctx.fixedKeys.length ? (
        <p className="up-help">
          {ctx.fixedKeys.length +
            " more verified fixed by a re-scan (see Re-Test)."}
        </p>
      ) : null}
      {rt[0] !== "Board" ? null : (
        <LayoutGroup id="kanban">
          <section className="kanban">
            {COLS.map(function (c, ci) {
              var cards =
                c === "Remediated"
                  ? pending
                  : a.filter(function (x) {
                      return (ctx.g(x).status || "To Do") === c;
                    });
              return (
                <div
                  key={c}
                  className={
                    "kcol" + (ov[0] === c ? " kanban-col is-drop" : "")
                  }
                  onDragOver={
                    ctx.readOnly
                      ? null
                      : function (e) {
                          e.preventDefault();
                          if (ov[0] !== c) ov[1](c);
                        }
                  }
                  onDragLeave={function (e) {
                    if (!e.currentTarget.contains(e.relatedTarget as Node))
                      ov[1](null);
                  }}
                  onDrop={function (e) {
                    e.preventDefault();
                    dropOn(c);
                  }}
                >
                  <div className="kcol-head">
                    <span className="vl-card-title">{c}</span>
                    <span className="kcol-n">{cards.length}</span>
                  </div>
                  <div className="kcol-body">
                    {cards.length > 60 ? (
                      <p className="up-help">
                        {"Showing the 60 highest-priority of " +
                          cards.length +
                          ". Filter the dashboard table or use bulk actions for the rest."}
                      </p>
                    ) : null}
                    <AnimatePresence initial={false} mode="popLayout">
                      {cards.length ? (
                        cards.slice(0, 60).map(function (x) {
                          var gg = ctx.g(x);
                          return (
                            <motion.div
                              key={x.key}
                              layout={!reduced}
                              layoutId={reduced ? undefined : "kc-" + x.key}
                              transition={reduced ? NONE : CARD}
                              initial={
                                reduced ? false : { opacity: 0, scale: 0.96 }
                              }
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{
                                opacity: 0,
                                scale: 0.96,
                                transition: reduced ? NONE : LEAVE,
                              }}
                            >
                              <V.KanbanCard
                                severity={x.sev}
                                title={x.name}
                                host={hostLabel(x)}
                                ticket={gg.ticket}
                                tags={tagsOf(x).slice(0, 2)}
                                team={gg.team}
                                onOpen={function () {
                                  ctx.openFinding(x.key);
                                }}
                                dragging={dg[0] === x.key}
                                dragProps={
                                  ctx.readOnly
                                    ? null
                                    : {
                                        draggable: true,
                                        onDragStart: function (e) {
                                          try {
                                            e.dataTransfer.setData(
                                              "text/plain",
                                              x.key,
                                            );
                                            e.dataTransfer.effectAllowed =
                                              "move";
                                          } catch (er) {}
                                          dg[1](x.key);
                                        },
                                        onDragEnd: function () {
                                          dg[1](null);
                                          ov[1](null);
                                        },
                                      }
                                }
                                moveId={x.key}
                                backLabel={
                                  ci > 0
                                    ? "Move " + x.name + " to " + COLS[ci - 1]
                                    : "Move back"
                                }
                                forwardLabel={
                                  ci < 3
                                    ? "Move " + x.name + " to " + COLS[ci + 1]
                                    : "Move forward"
                                }
                                onBack={
                                  !ctx.readOnly && ci > 0
                                    ? function () {
                                        move(x, -1);
                                      }
                                    : undefined
                                }
                                onForward={
                                  !ctx.readOnly && ci < 3
                                    ? function () {
                                        move(x, 1);
                                      }
                                    : undefined
                                }
                              />
                            </motion.div>
                          );
                        })
                      ) : (
                        <motion.p
                          key="empty"
                          className="kcol-empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: NONE }}
                        >
                          No cards
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </section>
        </LayoutGroup>
      )}
      {ad[0] ? (
        <V.Drawer
          eyebrow="Governance"
          title="Audit trail"
          onClose={function () {
            ad[1](false);
          }}
        >
          {ctx.audit.length ? (
            ctx.audit.map(function (x, i) {
              return (
                <V.AuditLogRow
                  key={i}
                  action={x.action}
                  detail={x.detail}
                  role={x.user ? x.user + " · " + x.role : x.role}
                  at={x.at}
                  time={fmtTime(x.at)}
                />
              );
            })
          ) : (
            <V.EmptyState title="No governance actions yet." />
          )}
        </V.Drawer>
      ) : null}
    </div>
  );
}

/* ================= 6. Network ================= */
