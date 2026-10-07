import { RejectButton } from "@/app/components/RejectButton";
import { Timeline } from "@/app/components/Timeline";
import {
  COLS,
  RO_REASON,
  SEV_LABEL,
  fmtTime,
  nowIso,
  uniq,
  mustRequest,
} from "@/app/lib/common";
import { EMPTY_FILTERS } from "@/app/lib/filters";
import { Sel } from "@/app/views/dashboard/Sel";
import { CvssCalc } from "@/app/views/findings/CvssCalc";
import { Evidence } from "@/app/views/findings/Evidence";
import { SSVC_TONE, addDays } from "@/app/views/findings/utils";
import { SlaPause } from "@/app/views/sla/SlaPause";
import { AUTH } from "@/lib/auth";
import { snippetFor } from "@/lib/data";
import {
  AS_OF,
  DEFAULT_CVSS,
  SSVC_HELP,
  complianceOf,
  localDay,
  parseVector,
} from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

export function Detail(p) {
  function flog(a, d) {
    p.ctx.log(a, d, p.row._f.key);
  }
  var f = p.row._f,
    ctx = p.ctx,
    gg = ctx.g(f),
    fi = ctx.eng.findings[f.key] || {
      history: [],
    };
  var md = useState(null),
    mode = md[0],
    setMode = md[1];
  var maxDays0 = ((ctx.policy || {}).maxDays || {})[f.sev] || 365;
  var rs = useState(""),
    until = useState(addDays(localDay(), Math.min(90, maxDays0))),
    note = useState(""),
    tg = useState(""),
    tr = useState("accept");
  var pv = parseVector(f.vector),
    rp = f.riskParts,
    cm = f.compliance || complianceOf(f),
    cc = useState(false);
  function setState(stt) {
    var DEC = [
        "state",
        "requestedState",
        "requestedBy",
        "until",
        "reason",
        "by",
        "approvedBy",
        "approvedAt",
        "at",
        "treatment",
        "fixed",
        "vexId",
        "vexOverride",
        "rejectedBy",
        "rejectedAt",
        "rejectReason",
      ],
      b0 = ctx.gov[f.key] || {},
      before = {};
    DEC.forEach(function (k) {
      before[k] = b0[k];
    });
    var t0u = nowIso(),
      undoAct = {
        label: "Undo",
        onClick: function () {
          var c0 = ctx.gov[f.key] || {};
          if (
            (c0.approvedAt &&
              c0.approvedAt > t0u &&
              c0.approvedBy !== ctx.me.username) ||
            (c0.rejectedAt && c0.rejectedAt > t0u)
          ) {
            ctx.toast({
              title: "Not undone",
              message: "Someone decided on this request after your change.",
              tone: "info",
            });
            return;
          }
          ctx.setGov(function (o) {
            var n = Object.assign({}, o),
              cur = Object.assign({}, o[f.key] || {});
            DEC.forEach(function (k) {
              if (before[k] === undefined) delete cur[k];
              else cur[k] = before[k];
            });
            n[f.key] = cur;
            return n;
          });
          flog("UNDO", f.name + " decision reverted");
        },
      };
    /* governance policy: maximum exception length by severity; Critical/KEV acceptances may need a second administrator */
    var pol = ctx.policy || {},
      maxD = (pol.maxDays || {})[f.sev] || 365,
      needSecond = ctx.isAdmin && mustRequest(ctx, f);
    if (stt === "accepted" && until[0] > addDays(localDay(), maxD)) {
      ctx.toast({
        title: "That exception is too long",
        message:
          SEV_LABEL[f.sev] +
          " exceptions can last at most " +
          maxD +
          " days under your policy (until " +
          addDays(localDay(), maxD) +
          ").",
        tone: "danger",
      });
      return;
    }
    if (stt === "accepted" && (!ctx.isAdmin || needSecond)) {
      ctx.patchGov(f.key, {
        state: "requested",
        requestedState: "accepted",
        requestedBy: ctx.me.username,
        rejectReason: null,
        rejectedBy: null,
        rejectedAt: null,
        treatment: tr[0],
        until: until[0],
        reason: rs[0],
        by: ctx.me.username,
        at: nowIso(),
      });
      flog(
        "ACCEPT-REQUEST",
        f.name + " — exception requested until " + until[0] + ": " + rs[0],
      );
      ctx.toast({
        action: undoAct,
        title: "Exception requested",
        message:
          "An administrator must approve it. The finding stays active until then.",
      });
      setMode(null);
      rs[1]("");
      return;
    }
    if (stt === "accepted") {
      ctx.patchGov(f.key, {
        state: "accepted",
        treatment: tr[0],
        until: until[0],
        reason: rs[0],
        by: ctx.me.username,
        approvedBy: ctx.me.username,
        at: nowIso(),
      });
      flog(
        "ACCEPT",
        f.name + " risk accepted until " + until[0] + " — " + rs[0],
      );
      ctx.toast({
        action: undoAct,
        title: "Risk accepted until " + until[0],
        message: f.name,
      });
    } else if (stt === "fp" && mustRequest(ctx, f)) {
      ctx.patchGov(f.key, {
        state: "requested",
        requestedState: "fp",
        requestedBy: ctx.me.username,
        rejectReason: null,
        rejectedBy: null,
        rejectedAt: null,
        until: null,
        reason: rs[0],
        by: ctx.me.username,
        at: nowIso(),
      });
      flog("FP-REQUEST", f.name + " — " + rs[0]);
      ctx.toast({
        action: undoAct,
        title: "False positive sent for approval",
        message: "It stays active until an administrator approves.",
      });
      setMode(null);
      rs[1]("");
      return;
    } else if (stt === "fp") {
      ctx.patchGov(f.key, {
        state: "fp",
        reason: rs[0],
        by: ctx.me.username,
        approvedBy: ctx.me.username,
        at: nowIso(),
      });
      flog("FALSE-POSITIVE", f.name + " — " + rs[0]);
      ctx.toast({
        action: undoAct,
        title: "Marked false positive",
        message: f.name,
      });
    } else {
      var g1 = ctx.gov[f.key] || {};
      ctx.patchGov(
        f.key,
        Object.assign(
          {
            state: null,
            requestedState: null,
            until: null,
            reason: null,
            fixed: false,
          },
          g1.by === "VEX"
            ? {
                by: ctx.me.username,
                vexOverride: g1.vexId || "any",
                vexId: null,
              }
            : {},
        ),
      );
      flog("REOPEN", f.name + " returned to the active queue");
      ctx.toast({
        action: undoAct,
        title: "Back in the active queue",
        message: f.name,
      });
    }
    setMode(null);
    rs[1]("");
  }
  /* notes record who wrote them; @username mentions land in that person's inbox */
  function addNote() {
    var t = note[0].trim();
    if (!t) return;
    var users = AUTH.directory.map(function (u) {
        return u.username;
      });
    var men = uniq(
      (t.match(/@([a-z0-9._-]{3,32})/gi) || [])
        .map(function (m) {
          return m
            .slice(1)
            .toLowerCase()
            .replace(/[._-]+$/, "");
        })
        .filter(function (u) {
          return users.indexOf(u) >= 0 && u !== ctx.me.username;
        }),
    );
    ctx.patchGov(f.key, {
      notes: gg.notes.concat([
        {
          text: t,
          role: ctx.role,
          user: ctx.me.username,
          at: nowIso(),
          mentions: men,
        },
      ]),
    });
    flog(
      "NOTE",
      f.name +
        ": " +
        t.slice(0, 80) +
        (men.length ? " (mentions " + men.join(", ") + ")" : ""),
    );
    note[1]("");
    if (men.length)
      ctx.toast({
        title: "Note added",
        message:
          "Mentioned " +
          men
            .map(function (u) {
              return "@" + u;
            })
            .join(", ") +
          " — it shows in their inbox.",
      });
  }
  function addTag(t) {
    t = t
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9:_-]+/g, "-");
    if (!t || gg.tags.indexOf(t) >= 0) return;
    ctx.patchGov(f.key, {
      tags: gg.tags.concat([t]),
    });
    flog("TAG", f.name + " +#" + t);
    tg[1]("");
  }
  function toLibrary() {
    var match = f.name.replace(/\s+on\s+\S+$/i, "").slice(0, 80);
    ctx.setLibrary(
      ctx.library
        .filter(function (e) {
          return e.match.toLowerCase() !== match.toLowerCase();
        })
        .concat([
          {
            id: "lib-" + Date.now().toString(36),
            match: match,
            title: f.name,
            desc: f.desc,
            sol: f.sol,
            sev: null,
            at: nowIso(),
          },
        ]),
    );
    flog("LIBRARY", 'Write-up saved for "' + match + '"');
    ctx.toast({
      title: "Saved to the finding library",
      message:
        'Future imports whose title contains "' +
        match +
        '" get this write-up.',
    });
  }
  var ro = ctx.readOnly;
  return (
    <div className="vl-detail dt">
      {cc[0] ? (
        <CvssCalc
          f={f}
          ctx={ctx}
          onClose={function () {
            cc[1](false);
          }}
        />
      ) : null}
      <div className="vl-detail-main">
        {f.regressed ? (
          <V.Banner tone="danger" title="Regression">
            {"This was marked remediated on " +
              (ctx.gov[f.key].fixedAt || "").slice(0, 10) +
              " but the scan on " +
              fi.lastSeen +
              " still found it."}
          </V.Banner>
        ) : null}
        {gg.requested ? (
          <V.Banner
            tone="warn"
            title={
              ((ctx.gov[f.key] || {}).requestedState === "fp"
                ? "False positive requested by "
                : "Exception requested by ") +
              (gg.by || "?") +
              ((ctx.gov[f.key] || {}).requestedState === "fp"
                ? ""
                : " · until " + (gg.until || "—"))
            }
          >
            {(gg.reason || "") +
              (ctx.isAdmin ? " " : " Waiting for an administrator.")}
            {ctx.isAdmin ? (
              <span className="row-wrap">
                <button
                  type="button"
                  className="up-edit"
                  onClick={function () {
                    ctx.decideRequest([f.key], true);
                  }}
                >
                  Approve
                </button>
                <RejectButton
                  onReject={function (why) {
                    ctx.decideRequest([f.key], false, why);
                  }}
                />
              </span>
            ) : null}
          </V.Banner>
        ) : null}
        {!gg.requested && (ctx.gov[f.key] || {}).rejectedBy && !gg.state ? (
          <V.Banner
            tone="info"
            title={
              "Request rejected by " +
              (ctx.gov[f.key] || {}).rejectedBy +
              " · " +
              fmtTime((ctx.gov[f.key] || {}).rejectedAt)
            }
          >
            {(ctx.gov[f.key] || {}).rejectReason || "No reason given."}
          </V.Banner>
        ) : null}
        {f.onPath ? (
          <V.Banner tone="danger" title="On an attack path to a crown jewel">
            {
              "Fixing this breaks at least one route from the internet to a Tier 1 asset. "
            }
            <button
              type="button"
              className="inline-link"
              onClick={function () {
                ctx.go("attack");
              }}
            >
              See Attack Paths
            </button>
          </V.Banner>
        ) : null}
        {f.unverified ? (
          <V.Banner tone="warn" title="Not re-scanned">
            {"The latest scan didn't cover " +
              f.host +
              ", so this stays open until a scan that includes the host no longer finds it. Last seen " +
              fi.lastSeen +
              "."}
          </V.Banner>
        ) : null}
        {gg.state === "accepted" ||
        gg.state === "fp" ||
        gg.state === "expired" ? (
          <V.Banner
            tone={gg.state === "expired" ? "danger" : "info"}
            title={
              gg.state === "fp"
                ? "False positive"
                : gg.state === "expired"
                  ? "Risk acceptance expired " + gg.until
                  : "Risk accepted until " + gg.until
            }
          >
            {(gg.reason || "No reason recorded.") + (ro ? "" : " ")}
            {ro ? null : (
              <button
                type="button"
                className="up-edit"
                onClick={function () {
                  setState(null);
                }}
              >
                Return to queue
              </button>
            )}
          </V.Banner>
        ) : null}
        <p className="vl-detail-desc">{f.desc}</p>
        <p className="detail-sol">
          <span className="vl-label">Solution</span> {f.sol}
        </p>
        {f.url ? (
          <p className="detail-sol">
            <span className="vl-label">Endpoint</span>{" "}
            <span className="vl-mono">{f.host + f.url}</span>
          </p>
        ) : null}
        {f.cves.length || (f.cwe && f.cwe.length) ? (
          <div className="vl-detail-cves">
            {f.cves.map(function (c) {
              return (
                <a
                  key={c}
                  className="vl-cve"
                  href={"https://nvd.nist.gov/vuln/detail/" + c}
                  target="_blank"
                  rel="noreferrer"
                >
                  {c}
                </a>
              );
            })}
            {(f.cwe || []).map(function (c) {
              return (
                <a
                  key={c}
                  className="vl-cve"
                  href={
                    "https://cwe.mitre.org/data/definitions/" +
                    c.replace("CWE-", "") +
                    ".html"
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {c}
                </a>
              );
            })}
          </div>
        ) : null}
        {snippetFor(f.name) ? (
          <V.CodeSnippet title="Remediation" tabs={snippetFor(f.name)} />
        ) : null}
        <div className="dt-grid">
          <section className="dt-box">
            <span className="vl-label">{"Why risk " + f.risk}</span>
            {rp ? (
              <dl className="kv">
                <dt>Severity</dt>
                <dd>
                  {(f.cvss || DEFAULT_CVSS[f.sev]).toFixed(1) +
                    " / 10" +
                    (pv ? "" : " (no vector)")}
                </dd>
                <dt>Likelihood</dt>
                <dd>
                  {rp.likelihood.toFixed(2) +
                    " · " +
                    (f.kev
                      ? "CISA KEV"
                      : f.epss != null
                        ? "EPSS " + (f.epss * 100).toFixed(1) + "%"
                        : f.exploitable
                          ? "public exploit signals"
                          : "no exploit signal")}
                </dd>
                <dt>Asset</dt>
                <dd>{"Tier " + f.tier + " · " + f.exposure}</dd>
                <dt>Modifiers</dt>
                <dd>
                  {rp.bonus
                    ? "+" +
                      rp.bonus +
                      " (" +
                      [
                        f.ransomware && "ransomware",
                        f.eol && "EOL",
                        f.breached && "SLA breach",
                        f.ageDays > 180 && "age",
                      ]
                        .filter(Boolean)
                        .join(", ") +
                      ")"
                    : "none"}
                </dd>
              </dl>
            ) : (
              <span className="up-help">Fixed findings score 0.</span>
            )}
            <p className="up-help">
              risk = 100 × S × (0.35 + 0.65 L) × (0.55 + 0.45 A) + modifiers,
              capped at 100.
            </p>
          </section>
          <section className="dt-box">
            <span className="vl-label">SSVC decision</span>
            <span className={"ssvc ssvc-" + SSVC_TONE[f.ssvc.decision]}>
              {f.ssvc.decision}
            </span>
            <p className="up-help">{SSVC_HELP[f.ssvc.decision]}</p>
            <dl className="kv">
              <dt>Exploitation</dt>
              <dd>{f.ssvc.exploitation}</dd>
              <dt>Automatable</dt>
              <dd>{f.ssvc.automatable}</dd>
              <dt>Technical impact</dt>
              <dd>{f.ssvc.impact}</dd>
              <dt>{"Mission & well-being"}</dt>
              <dd>{f.ssvc.mission}</dd>
            </dl>
          </section>
          <section className="dt-box">
            <span className="vl-label">Classification</span>
            <dl className="kv">
              <dt>{"CVSS " + (f.cvssVer || "vector")}</dt>
              <dd className="vl-mono">
                {f.vector || "—"}
                {f.cvssSrc === "analyst" ? (
                  <span className="cv-src">
                    {" · analyst (scanner " +
                      (f.scannerCvss ? f.scannerCvss.toFixed(1) : "—") +
                      " " +
                      (SEV_LABEL[f.scannerSev] || "") +
                      ")"}
                  </span>
                ) : null}{" "}
                {ctx.readOnly ? null : (
                  <button
                    type="button"
                    className="up-edit"
                    onClick={function () {
                      cc[1](true);
                    }}
                  >
                    {f.cvssSrc === "analyst" ? "Edit score" : "Re-score…"}
                  </button>
                )}
              </dd>
              <dt>EPSS</dt>
              <dd>
                {f.epss != null ? (
                  (f.epss * 100).toFixed(1) +
                  "%" +
                  (f.epssPct != null
                    ? " · p" + Math.round(f.epssPct * 100)
                    : "")
                ) : f.cves.length ? (
                  <button
                    type="button"
                    className="inline-link"
                    onClick={function () {
                      ctx.openData("Threat intel");
                    }}
                  >
                    Load the EPSS feed
                  </button>
                ) : (
                  "n/a (no CVE)"
                )}
              </dd>
              <dt>OWASP</dt>
              <dd>{f.owasp || "—"}</dd>
              <dt>{"ATT&CK"}</dt>
              <dd>
                {f.attack ? (
                  <a
                    href={
                      "https://attack.mitre.org/techniques/" + f.attack.id + "/"
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {f.attack.id + " " + f.attack.name}
                  </a>
                ) : (
                  "—"
                )}
                {f.attack ? " · " + f.attack.tactic : ""}
              </dd>
              <dt>PCI DSS 4.0</dt>
              <dd>{cm.pci.join(", ")}</dd>
              <dt>ISO 27001:2022</dt>
              <dd>{cm.iso.join(", ")}</dd>
              <dt>NIST 800-53</dt>
              <dd>{cm.nist.join(", ")}</dd>
              {f.kevDue ? <dt>KEV due date</dt> : null}
              {f.kevDue ? <dd>{f.kevDue}</dd> : null}
            </dl>
          </section>
          <section className="dt-box">
            <span className="vl-label">History</span>
            <ol className="hist">
              {fi.history.map(function (x, i) {
                var bb = ctx.batches.find(function (y) {
                  return y.id === x[0];
                });
                return (
                  <li
                    key={i}
                    className={
                      "hist-" + x[1].toLowerCase().replace(/[^a-z]+/g, "-")
                    }
                  >
                    <span className="vl-mono">{bb ? bb.date : ""}</span>{" "}
                    {bb ? bb.label : ""}
                    {" · "}
                    <b>{x[1]}</b>
                  </li>
                );
              })}
            </ol>
            <p className="up-help">
              {"First seen " +
                f.firstSeen +
                (fi.reopenCount ? " · reopened " + fi.reopenCount + "×" : "") +
                (f.tool.indexOf(" + ") > 0 ? " · found by " + f.tool : "")}
            </p>
          </section>
          <Timeline f={f} fi={fi} ctx={ctx} notes={gg.notes} />
        </div>
        <section className="dt-box">
          <span className="vl-label">{"Notes · " + gg.notes.length}</span>
          {gg.notes.length ? (
            <ul className="notes">
              {gg.notes.map(function (n, i) {
                return (
                  <li key={i}>
                    <p>{n.text}</p>
                    <span className="up-help">
                      {(n.user ? n.user + " (" + n.role + ")" : n.role) +
                        " · " +
                        fmtTime(n.at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {ro ? null : (
            <div className="note-add">
              <textarea
                className="sum-edit"
                rows={2}
                placeholder="Add a triage note (reproduction steps, owner reply, compensating control…). Type @username to notify someone."
                aria-label="Triage note"
                value={note[0]}
                onChange={function (e) {
                  note[1](e.target.value);
                }}
              />
              <V.Button
                size="sm"
                icon="message"
                disabled={!note[0].trim()}
                onClick={addNote}
              >
                Add note
              </V.Button>
            </div>
          )}
        </section>
        <section className="dt-box">
          <span className="vl-label">Evidence</span>
          <Evidence fkey={f.key} name={f.name} ctx={ctx} readOnly={ro} />
        </section>
      </div>
      <div className="vl-detail-side">
        <span className="vl-label">{"Owner & RACI"}</span>
        <V.TeamPicker
          key={f.key + gg.team + gg.raci}
          team={gg.team}
          role={gg.raci}
          readOnly={ro}
          onChange={function (team, raci) {
            ctx.patchGov(f.key, {
              team: team,
              raci: raci,
              assigned: true,
              manualTeam: true,
            });
            flog("ASSIGN", f.name + " → " + team + " (" + raci + ")");
          }}
        />
        <label className="wb-field">
          <span className="vl-label">Status</span>
          <select
            className="wb-select"
            disabled={ro}
            title={ro ? RO_REASON : null}
            value={gg.fixed ? "Remediated" : gg.status || "To Do"}
            onChange={function (e) {
              var to = e.target.value,
                from = gg.fixed ? "Remediated" : gg.status || "To Do";
              ctx.govUndoable(
                [f.key],
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
                  title: f.name + " → " + to,
                  message:
                    to === "Remediated"
                      ? "Out of the active queue until a re-scan verifies it."
                      : null,
                },
              );
              flog("PATCH", f.name + " " + from + " → " + to);
            }}
          >
            {COLS.map(function (c) {
              return (
                <option key={c} value={c}>
                  {c}
                </option>
              );
            })}
          </select>
        </label>
        <span className="vl-label">Ticket</span>
        {gg.ticket ? (
          <button
            type="button"
            className="vl-kcard-ticket inline-ticket"
            title="Open the Remediation board"
            onClick={function () {
              ctx.go("remediation");
            }}
          >
            <V.Icon name="ticket" size={12} />
            {gg.ticket}
          </button>
        ) : (
          <V.Button
            size="sm"
            icon="ticket"
            restricted={ro}
            restrictedReason={RO_REASON}
            onClick={function () {
              var t = ctx.nextTicket();
              ctx.patchGov(f.key, {
                ticket: t,
                assigned: true,
                status: "In Progress",
              });
              flog("TICKET", t + " raised for " + f.name);
              ctx.toast({
                title: t + " raised",
                message: f.name,
              });
            }}
          >
            Raise ticket
          </V.Button>
        )}
        <SlaPause f={f} ctx={ctx} ro={ro} />
        <span className="vl-label">
          {"SLA · " +
            f.slaDays +
            " days" +
            (f.tier === 1 && f.slaDays !== ctx.sla[f.sev] ? " (tier 1)" : "") +
            (f.slaSource ? " · " + f.slaSource : "")}
        </span>
        {f.lifecycle === "Fixed" ? (
          <V.DiffBadge kind="fixed" />
        ) : gg.state === "accepted" ? (
          <V.DiffBadge kind="accepted" />
        ) : (
          <V.SlaPill
            status={f.breached ? "breached" : f.atRisk ? "at-risk" : "met"}
            days={f.breached ? -f.daysLeft : f.atRisk ? f.daysLeft : undefined}
          />
        )}
        <span className="vl-label">Risk score</span>
        <span className="risk-num">{f.risk}</span>
        <label className="wb-field">
          <span className="vl-label">Validation</span>
          <select
            className="wb-select"
            disabled={ro}
            title={ro ? RO_REASON : null}
            value={gg.validation || ""}
            onChange={function (e) {
              var v = e.target.value || null;
              ctx.patchGov(f.key, {
                validation: v,
                validatedBy: ctx.me.username,
                validatedAt: nowIso(),
              });
              flog("VALIDATE", f.name + " → " + (v || "not validated"));
            }}
          >
            {[
              ["", "Not validated"],
              ["confirmed", "Exploit confirmed"],
              ["not_reproducible", "Not reproducible"],
            ].map(function (o) {
              return (
                <option key={o[0]} value={o[0]}>
                  {o[1]}
                </option>
              );
            })}
          </select>
          <span className="up-help">
            {gg.validation === "confirmed"
              ? "Treated as actively exploited here."
              : gg.validation === "not_reproducible"
                ? "Likelihood cut by 60%."
                : "Record a pentest or BAS result."}
          </span>
        </label>
        <V.Button
          size="sm"
          variant="ghost"
          icon="sparkles"
          onClick={function () {
            ctx.openAssistant({
              finding: f,
            });
          }}
        >
          Explain with Claude
        </V.Button>
        <span className="vl-label">Tags</span>
        <div className="row-wrap">
          {gg.tags.map(function (t) {
            return (
              <span key={t} className="up-pill">
                <button
                  type="button"
                  title="Show every finding with this tag"
                  onClick={function () {
                    ctx.setFilters(
                      Object.assign({}, EMPTY_FILTERS, {
                        q: "#" + t,
                      }),
                    );
                    ctx.showFindings();
                  }}
                >
                  {"#" + t}
                </button>
                {ro ? null : (
                  <button
                    type="button"
                    className="up-pill-x"
                    aria-label={"Remove tag " + t}
                    onClick={function () {
                      ctx.patchGov(f.key, {
                        tags: gg.tags.filter(function (x) {
                          return x !== t;
                        }),
                      });
                      flog("TAG", f.name + " −#" + t);
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
          {ro ? null : (
            <input
              className="wb-select tag-in"
              placeholder="add tag ↵"
              value={tg[0]}
              onChange={function (e) {
                tg[1](e.target.value);
              }}
              onKeyDown={function (e) {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tg[0]);
                }
              }}
            />
          )}
        </div>
        {ro ? null : (
          <div className="dt-actions">
            {mode ? (
              <div className="stack-tight">
                <label className="wb-field">
                  <span className="vl-label">
                    {mode === "accepted"
                      ? "Why accept the risk?"
                      : "Why is this a false positive?"}
                  </span>
                  <textarea
                    className="sum-edit"
                    rows={3}
                    value={rs[0]}
                    onChange={function (e) {
                      rs[1](e.target.value);
                    }}
                    placeholder={
                      mode === "accepted"
                        ? "Compensating control, business owner, ticket…"
                        : "How you verified it isn't real"
                    }
                  />
                </label>
                {mode === "accepted" ? (
                  <Sel
                    label="Treatment"
                    value={tr[0]}
                    options={[
                      ["accept", "Accept — live with it"],
                      ["mitigate", "Mitigate — compensating control in place"],
                      [
                        "transfer",
                        "Transfer — vendor, insurer or third party owns it",
                      ],
                    ]}
                    onChange={tr[1]}
                  />
                ) : null}
                {mode === "accepted" ? (
                  <label className="wb-field">
                    <span className="vl-label">Review by (required)</span>
                    <input
                      className="wb-select"
                      type="date"
                      value={until[0]}
                      min={AS_OF}
                      max={addDays(localDay(), maxDays0)}
                      onChange={function (e) {
                        until[1](e.target.value);
                      }}
                    />
                    <span className="up-help">
                      {"Policy allows up to " +
                        maxDays0 +
                        " days for " +
                        SEV_LABEL[f.sev] +
                        " findings."}
                    </span>
                  </label>
                ) : null}
                <div className="row-wrap">
                  <V.Button
                    size="sm"
                    onClick={function () {
                      setMode(null);
                    }}
                  >
                    Cancel
                  </V.Button>
                  <V.Button
                    size="sm"
                    variant="primary"
                    disabled={
                      rs[0].trim().length < 5 ||
                      (mode === "accepted" && (!until[0] || until[0] < AS_OF))
                    }
                    onClick={function () {
                      setState(mode);
                    }}
                  >
                    {ctx.isAdmin
                      ? mode === "accepted"
                        ? "Accept risk"
                        : "Mark false positive"
                      : "Send for approval"}
                  </V.Button>
                </div>
              </div>
            ) : (
              <div className="stack-tight">
                {gg.state || gg.requested ? null : (
                  <V.Button
                    size="sm"
                    icon="shield"
                    onClick={function () {
                      setMode("accepted");
                    }}
                  >
                    {ctx.isAdmin ? "Accept risk…" : "Request exception…"}
                  </V.Button>
                )}
                {gg.state || gg.requested ? null : (
                  <V.Button
                    size="sm"
                    icon="ban"
                    onClick={function () {
                      setMode("fp");
                    }}
                  >
                    {ctx.isAdmin
                      ? "False positive…"
                      : "Request false positive…"}
                  </V.Button>
                )}
                <V.Button
                  size="sm"
                  variant="ghost"
                  icon="book"
                  onClick={toLibrary}
                >
                  Save write-up to library
                </V.Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
/* yyyy-mm-dd + n days, calendar-safe in any time zone */
