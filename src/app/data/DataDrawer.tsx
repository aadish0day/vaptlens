import { RO_REASON, count, fmtTime, nowIso } from "@/app/lib/common";
import { saveFile } from "@/app/lib/export";
import { buildEvidencePack } from "@/app/lib/integrations";
import { AUTH } from "@/lib/auth";
import {
  localDay,
  parseEpssCsv,
  parseKevFeed,
  runSelfTests,
} from "@/lib/engine";
import {
  WS,
  exportWorkspace,
  importWorkspace,
  readFileText,
} from "@/lib/store";
import React, { useEffect, useRef, useState } from "react";
import * as V from "@/ui";

export function DataDrawer(p) {
  var cfWs = useState(null),
    cf = useState(false),
    tb = useState(typeof p.tab === "string" ? p.tab : "Scans"),
    eb = useState(null),
    fin = useRef(null),
    fk = useRef(null),
    fe = useRef(null),
    fr = useRef(null);
  var ib = useState(""),
    st = useState(null);
  function importFeed(kind, file) {
    if (!file) return;
    ib[1]("Reading " + file.name + "…");
    readFileText(file)
      .then(function (t) {
        var r: any = kind === "kev" ? parseKevFeed(t) : parseEpssCsv(t);
        if (kind === "kev") r.kevLoaded = nowIso();
        else r.epssLoaded = nowIso();
        return p.saveIntel(r).then(function () {
          return r;
        });
      })
      .then(function (r) {
        ib[1]("");
        p.log(
          "INTEL",
          kind === "kev"
            ? "CISA KEV loaded · " + r.kevCount + " CVEs"
            : "EPSS loaded · " + r.epssCount + " CVEs scored " + r.epssDate,
        );
        p.toast({
          title: kind === "kev" ? "CISA KEV loaded" : "EPSS scores loaded",
          message:
            (r.kevCount || r.epssCount) + " CVEs · every finding re-scored",
        });
      })
      .catch(function (e) {
        ib[1]("");
        p.toast({
          title: "Couldn't load " + file.name,
          message: e.message,
          tone: "danger",
        });
      });
  }
  function backup() {
    exportWorkspace()
      .then(function (j) {
        return saveFile(p, "vaptlens-workspace-" + localDay() + ".json", j);
      })
      .catch(function (e) {
        p.toast({
          title: "Couldn't save backup",
          message: e.message,
          tone: "danger",
        });
      });
  }
  /* restore asks once: it replaces this workspace's data on the server (accounts are untouched) */
  var rf = useState(null);
  function restore(file) {
    if (!file) return;
    if (fr.current) fr.current.value = "";
    readFileText(file)
      .then(function (t) {
        var j0 = JSON.parse(t as string);
        if (j0.app !== "VAPTLens")
          throw new Error("This isn't a VAPTLens backup file.");
        rf[1]({
          name: file.name,
          text: t,
          at: j0.exportedAt,
        });
      })
      .catch(function (e) {
        p.toast({
          title: "Restore failed",
          message: e.message,
          tone: "danger",
        });
      });
  }
  function doRestore() {
    var x = rf[0];
    rf[1](null);
    Promise.resolve()
      .then(function () {
        return importWorkspace(x.text);
      })
      .then(
        function () {
          location.reload();
        },
        function (e) {
          p.toast({
            title: "Restore failed",
            message: e.message,
            tone: "danger",
          });
        },
      );
  }
  var tabs = [
    "Scans",
    "Workspaces",
    "Threat intel",
    "Security",
    "Backup",
    "Self-test",
  ];
  var wl = useState(null),
    wn = useState(""),
    wsBusy = useState(false);
  useEffect(
    function () {
      if (tb[0] === "Workspaces") refreshWs();
    },
    [tb[0]],
  );
  function refreshWs() {
    return WS.list().then(wl[1], function (e) {
      p.toast({
        title: "Couldn't list workspaces",
        message: e.message,
        tone: "danger",
      });
    });
  }
  function switchWs(name) {
    wsBusy[1](true);
    p.log("WORKSPACE", "Switched from " + WS.current() + " to " + name);
    WS.switchTo(name).then(
      function () {
        location.reload();
      },
      function (e) {
        wsBusy[1](false);
        p.toast({
          title: "Couldn't switch workspace",
          message: e.message,
          tone: "danger",
        });
      },
    );
  }
  function createWs(name) {
    wsBusy[1](true);
    WS.create(name).then(
      function () {
        switchWs(name);
      },
      function (e) {
        wsBusy[1](false);
        p.toast({
          title: "Couldn't create workspace",
          message: e.message,
          tone: "danger",
        });
      },
    );
  }
  var sec = tb[0];
  return (
    <V.Drawer
      eyebrow="Data · workspace"
      title={WS.current()}
      onClose={p.onClose}
      footer={
        cf[0]
          ? [
              <span key="q" className="dd-q">
                Delete every scan, finding and upload? Governance history stays.
              </span>,
              <V.Button
                key="n"
                size="sm"
                onClick={function () {
                  cf[1](false);
                }}
              >
                Cancel
              </V.Button>,
              <V.HoldToConfirm
                key="y"
                confirmLabel="Cleared"
                resetAfter={0}
                onConfirm={function () {
                  p.clearAll();
                  cf[1](false);
                  p.onClose();
                }}
              >
                Hold to clear all data
              </V.HoldToConfirm>,
            ]
          : [
              <V.Button
                key="c"
                size="sm"
                variant="danger"
                restricted={!p.isAdmin}
                restrictedReason="Only administrators can clear data."
                disabled={p.isAdmin && !p.batches.length}
                onClick={function () {
                  cf[1](true);
                }}
              >
                Clear all data
              </V.Button>,
            ]
      }
    >
      <div className="stack">
        <V.Tabs
          tabs={tabs.map(function (t) {
            return {
              label: t,
            };
          })}
          value={sec}
          onChange={tb[1]}
        />
        {sec === "Scans" ? (
          <div className="stack">
            <V.Banner tone="privacy" title="Parsed here, kept on your server">
              Scan files are parsed in this browser; the findings are saved to
              this VAPTLens server, so they're there from any browser you sign
              in with. Nothing is sent to anyone else.
            </V.Banner>
            {p.batches.length ? (
              <div className="up-list">
                {p.batches
                  .slice()
                  .reverse()
                  .map(function (b) {
                    var n = count(p.data, function (x) {
                        return (
                          x.batch === b.id &&
                          x.lifecycle !== "Fixed" &&
                          !x.unverified
                        );
                      }),
                      sc = Object.keys(p.eng.scope[b.id] || {}).length,
                      ed = eb[0] && eb[0].id === b.id ? eb[0] : null;
                    return (
                      <div key={b.id} className="up-row">
                        <div className="up-main">
                          <span className="up-name">
                            {b.label + (b.id === p.latest ? " · latest" : "")}
                          </span>
                          <span className="up-meta">
                            {b.date +
                              " · " +
                              b.tools +
                              " · " +
                              sc +
                              " hosts in scope" +
                              (b.full ? " (full)" : "")}
                          </span>
                        </div>
                        <span className="up-count">{n + " findings"}</span>
                        <span className="row-wrap">
                          <button
                            type="button"
                            className="up-edit"
                            disabled={!p.isAdmin}
                            title={
                              p.isAdmin
                                ? null
                                : "Only administrators can edit or delete scans."
                            }
                            onClick={function () {
                              eb[1](
                                ed
                                  ? null
                                  : {
                                      id: b.id,
                                      label: b.label,
                                      date: b.date,
                                      full: !!b.full,
                                    },
                              );
                            }}
                          >
                            {ed ? "Close" : "Edit"}
                          </button>
                          <button
                            type="button"
                            className="vl-icon-btn"
                            disabled={!p.isAdmin}
                            title={
                              p.isAdmin
                                ? null
                                : "Only administrators can edit or delete scans."
                            }
                            aria-label={"Delete " + b.label}
                            onClick={function () {
                              p.deleteBatch(b.id);
                            }}
                          >
                            <V.Icon name="x" size={14} />
                          </button>
                        </span>
                        {ed ? (
                          <div className="up-map">
                            <div className="up-save">
                              <label className="wb-field">
                                <span className="vl-label">Label</span>
                                <input
                                  className="wb-select"
                                  value={ed.label}
                                  onChange={function (e) {
                                    eb[1](
                                      Object.assign({}, ed, {
                                        label: e.target.value,
                                      }),
                                    );
                                  }}
                                />
                              </label>
                              <label className="wb-field">
                                <span className="vl-label">Scan date</span>
                                <input
                                  className="wb-select"
                                  type="date"
                                  value={ed.date}
                                  onChange={function (e) {
                                    eb[1](
                                      Object.assign({}, ed, {
                                        date: e.target.value,
                                      }),
                                    );
                                  }}
                                />
                              </label>
                            </div>
                            <V.Checkbox
                              label="Full-scope scan: every known host was covered, so anything it didn't find counts as fixed"
                              checked={ed.full}
                              onChange={function (v) {
                                eb[1](
                                  Object.assign({}, ed, {
                                    full: typeof v === "boolean" ? v : !ed.full,
                                  }),
                                );
                              }}
                            />
                            <div className="row-wrap">
                              <V.Button
                                size="sm"
                                variant="primary"
                                disabled={!ed.date || !ed.label.trim()}
                                onClick={function () {
                                  p.updateBatch(b.id, {
                                    label: ed.label.trim(),
                                    date: ed.date,
                                    full: ed.full,
                                  });
                                  p.log(
                                    "SCAN",
                                    "Scan " +
                                      ed.label +
                                      " set to " +
                                      ed.date +
                                      (ed.full ? " (full scope)" : ""),
                                  );
                                  eb[1](null);
                                }}
                              >
                                Save
                              </V.Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <V.EmptyState
                title="No scans loaded."
                action={
                  <V.Button
                    size="sm"
                    icon="upload"
                    onClick={function () {
                      p.onClose();
                      p.openUpload();
                    }}
                  >
                    Upload scans
                  </V.Button>
                }
              />
            )}
          </div>
        ) : null}
        {sec === "Workspaces" ? (
          <div className="stack">
            <p className="up-help">
              Keep each client or engagement in its own workspace: scans,
              governance, notes, evidence, library and report settings switch
              together. Threat-intel feeds are shared. Everyone signed in to
              this server sees the same workspaces.
            </p>
            <div className="up-list">
              {[
                {
                  name: WS.current(),
                  cur: true,
                },
              ]
                .concat(
                  (wl[0] || []).filter(function (x) {
                    return x.name !== WS.current();
                  }),
                )
                .map(function (w) {
                  return (
                    <div key={w.name} className="up-row">
                      <div className="up-main">
                        <span className="up-name">
                          {w.name + (w.cur ? " · open" : "")}
                        </span>
                        <span className="up-meta">
                          {w.cur
                            ? p.batches.length +
                              " scans · " +
                              p.active.length +
                              " active findings"
                            : "Created " +
                              fmtTime((w as any).createdAt) +
                              ((w as any).createdBy
                                ? " by " + (w as any).createdBy
                                : "")}
                        </span>
                      </div>
                      <span />
                      {w.cur ? (
                        <span />
                      ) : (
                        <span className="row-wrap">
                          <V.Button
                            size="sm"
                            disabled={wsBusy[0]}
                            onClick={function () {
                              switchWs(w.name);
                            }}
                          >
                            Open
                          </V.Button>
                          <button
                            type="button"
                            className="vl-icon-btn"
                            disabled={!p.isAdmin}
                            aria-label={"Delete workspace " + w.name}
                            onClick={function () {
                              if (cfWs[0] !== w.name) {
                                cfWs[1](w.name);
                                p.toast({
                                  title: "Click × again to delete " + w.name,
                                  message:
                                    "Its scans, decisions and evidence are removed for good (its audit history is kept).",
                                  tone: "info",
                                });
                                setTimeout(function () {
                                  cfWs[1](null);
                                }, 5000);
                                return;
                              }
                              cfWs[1](null);
                              p.log("WORKSPACE", "Deleted workspace " + w.name);
                              WS.remove(w.name).then(refreshWs, function (e) {
                                p.toast({
                                  title: "Couldn't delete " + w.name,
                                  message: e.message,
                                  tone: "danger",
                                });
                              });
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
            <form
              className="sv-form"
              onSubmit={function (e) {
                e.preventDefault();
                var n = wn[0].trim();
                if (!n || n === WS.current()) return;
                createWs(n);
              }}
            >
              <input
                className="wb-select"
                placeholder="New workspace, e.g. Globex Bank 2026"
                value={wn[0]}
                onChange={function (e) {
                  wn[1](e.target.value);
                }}
              />
              <V.Button
                size="sm"
                variant="primary"
                type="submit"
                icon="plus"
                disabled={!wn[0].trim() || wsBusy[0] || p.readOnly}
                title={p.readOnly ? RO_REASON : null}
              >
                {"Create & open"}
              </V.Button>
            </form>
            {wsBusy[0] ? <V.Skeleton variant="rows" rows={1} /> : null}
          </div>
        ) : null}
        {sec === "Threat intel" ? (
          <div className="stack">
            <p className="up-help">
              Download the feeds yourself and drop them here. They're parsed in
              this browser and cached here; VAPTLens never fetches anything from
              the internet. Every finding is re-scored when a feed loads.
            </p>
            <div className="intel">
              <div className="intel-row">
                <div className="up-main">
                  <span className="up-name">
                    CISA Known Exploited Vulnerabilities
                  </span>
                  <span className="up-meta">
                    {p.intel.kevCount
                      ? p.intel.kevCount +
                        " CVEs · catalog " +
                        p.intel.kevVersion +
                        " · loaded " +
                        fmtTime(p.intel.kevLoaded)
                      : "Using the bundled list (~45 CVEs). Load known_exploited_vulnerabilities.json from cisa.gov for the full catalog."}
                  </span>
                </div>
                <V.Button
                  size="sm"
                  icon="upload"
                  restricted={p.readOnly}
                  restrictedReason={RO_REASON}
                  onClick={function () {
                    fk.current.click();
                  }}
                >
                  Load KEV JSON
                </V.Button>
                <input
                  ref={fk}
                  type="file"
                  accept=".json,application/json"
                  hidden={true}
                  onChange={function (e) {
                    importFeed("kev", e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </div>
              <div className="intel-row">
                <div className="up-main">
                  <span className="up-name">FIRST EPSS scores</span>
                  <span className="up-meta">
                    {p.intel.epssCount
                      ? p.intel.epssCount.toLocaleString() +
                        " CVEs · scored " +
                        p.intel.epssDate +
                        (p.intel.epssModel
                          ? " · model " + p.intel.epssModel
                          : "")
                      : "Not loaded. Get epss_scores-current.csv.gz from first.org/epss/data (.gz is fine)."}
                  </span>
                </div>
                <V.Button
                  size="sm"
                  icon="upload"
                  restricted={p.readOnly}
                  restrictedReason={RO_REASON}
                  onClick={function () {
                    fe.current.click();
                  }}
                >
                  Load EPSS CSV
                </V.Button>
                <input
                  ref={fe}
                  type="file"
                  accept=".csv,.gz,text/csv"
                  hidden={true}
                  onChange={function (e) {
                    importFeed("epss", e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
            <div className="intel">
              <div className="intel-row">
                <div className="up-main">
                  <span className="up-name">
                    VEX statements (CycloneDX / OpenVEX)
                  </span>
                  <span className="up-meta">
                    {p.vexList.length
                      ? p.vexList.length +
                        " stored · " +
                        count(p.vexList, function (v) {
                          return /not_affected|false_positive/.test(v.status);
                        }) +
                        " not affected · " +
                        count(
                          p.data.filter(function (x) {
                            return x.batch === p.latest;
                          }),
                          function (x) {
                            var g0 = p.gov[x.key];
                            return g0 && g0.by === "VEX" && g0.state === "fp";
                          },
                        ) +
                        " findings suppressed now. Matched by CVE and product (purl or name@version); applied to every future scan."
                      : "None yet. Drop a VEX file in Upload scans; it's kept and applied to later scans too."}
                  </span>
                </div>
                {p.vexList.length ? (
                  <V.Button
                    size="sm"
                    variant="ghost"
                    restricted={p.readOnly}
                    restrictedReason={RO_REASON}
                    onClick={p.clearVex}
                  >
                    Clear VEX
                  </V.Button>
                ) : null}
              </div>
              {p.vexList.length ? (
                <div className="scroll-x">
                  <table className="ledger">
                    <thead>
                      <tr>
                        {[
                          "CVE",
                          "Status",
                          "Product",
                          "Justification",
                          "Source",
                        ].map(function (c) {
                          return <th key={c}>{c}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {p.vexList
                        .slice(-8)
                        .reverse()
                        .map(function (v, i) {
                          return (
                            <tr key={i}>
                              <td className="vl-mono">{v.cve}</td>
                              <td>{v.status}</td>
                              <td className="vl-mono">{v.product || "any"}</td>
                              <td>{v.justification || "—"}</td>
                              <td>{v.source || "—"}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
            {ib[0] ? <V.Skeleton variant="rows" rows={1} /> : null}
            {p.intel.kevCount || p.intel.epssCount ? (
              <V.Button
                size="sm"
                variant="ghost"
                restricted={p.readOnly}
                restrictedReason={RO_REASON}
                onClick={function () {
                  p.saveIntel({
                    kev: null,
                    kevCount: 0,
                    epss: null,
                    epssCount: 0,
                  });
                  p.log("INTEL", "Feeds cleared");
                }}
              >
                Clear loaded feeds
              </V.Button>
            ) : null}
          </div>
        ) : null}
        {sec === "Security" ? (
          <div className="stack">
            <V.Banner
              tone="privacy"
              title={"Signed in as " + p.me.username + " · " + p.role}
            >
              Accounts, sessions and every change live on this VAPTLens server.
              Your role is checked by the server on every request, so what the
              screen hides is also refused if someone calls the API directly.
              The audit log is written by the server, stamped with who did what,
              and hash-chained so edits to the database show up when you verify
              it.
            </V.Banner>
            <dl className="kv">
              <dt>Idle sign-out</dt>
              <dd>{AUTH.idleMinutes + " min"}</dd>
              <dt>Lockout</dt>
              <dd>5 failed attempts → 5 min</dd>
              <dt>Passwords</dt>
              <dd>scrypt-hashed on the server; 12+ characters</dd>
            </dl>
            <p className="up-help">
              {
                "Protect the server itself: serve it over HTTPS, keep its database volume on an encrypted disk, and back it up. Whoever administers the server can read the data, as with any self-hosted web app."
              }
            </p>
            {p.isAdmin ? (
              <V.Button
                size="sm"
                icon="user"
                onClick={function () {
                  p.onClose();
                  p.openUsers();
                }}
              >
                Manage users
              </V.Button>
            ) : null}
          </div>
        ) : null}
        {sec === "Backup" ? (
          <div className="stack">
            <p className="up-help">
              One JSON file with every scan, governance decision, note, library
              entry, setting and every evidence image in this workspace. It
              isn't encrypted and has no accounts in it: store it somewhere
              safe.
            </p>
            <div className="row-wrap">
              <V.Button
                size="sm"
                variant="primary"
                icon="download"
                restricted={!p.isAdmin}
                restrictedReason="Only administrators can export a full backup."
                onClick={backup}
              >
                Export workspace
              </V.Button>
              <V.Button
                size="sm"
                icon="file"
                onClick={function () {
                  p.toast({
                    title: "Building evidence pack…",
                    tone: "info",
                  });
                  buildEvidencePack(p)
                    .then(
                      function (b) {
                        return saveFile(
                          p,
                          "vaptlens-evidence-pack-" + localDay() + ".zip",
                          b,
                        );
                      },
                      function (e) {
                        p.toast({
                          title: "Couldn't build the evidence pack",
                          message: e.message,
                          tone: "danger",
                        });
                      },
                    )
                    .catch(function (e) {
                      p.toast({
                        title: "Couldn't save the evidence pack",
                        message: e.message,
                        tone: "danger",
                      });
                    });
                }}
              >
                Evidence pack (.zip)
              </V.Button>
              <V.Button
                size="sm"
                icon="upload"
                restricted={!p.isAdmin}
                restrictedReason="Only administrators can restore a backup."
                onClick={function () {
                  fr.current.click();
                }}
              >
                Restore from backup…
              </V.Button>
              <input
                ref={fr}
                type="file"
                accept=".json"
                hidden={true}
                onChange={function (e) {
                  restore(e.target.files[0]);
                }}
              />
            </div>
            {rf[0] ? (
              <V.Banner
                tone="danger"
                title={"Restore " + rf[0].name + "?"}
                action={
                  <span className="row-wrap">
                    <V.HoldToConfirm
                      confirmLabel="Restoring"
                      resetAfter={0}
                      onConfirm={doRestore}
                    >
                      Hold to replace everything
                    </V.HoldToConfirm>
                    <V.Button
                      size="sm"
                      onClick={function () {
                        rf[1](null);
                      }}
                    >
                      Cancel
                    </V.Button>
                  </span>
                }
              >
                {"Backup from " +
                  (rf[0].at ? fmtTime(rf[0].at) : "an unknown date") +
                  ". This workspace's scans, decisions and evidence on the server are replaced for everyone. Accounts aren't affected."}
              </V.Banner>
            ) : null}
            <V.Banner
              tone="warn"
              title={"Restore replaces workspace " + WS.current()}
            >
              Export first if you want to keep what's here. The restore is
              recorded in the audit log.
            </V.Banner>
          </div>
        ) : null}
        {sec === "Self-test" ? (
          <div className="stack">
            <p className="up-help">
              Runs the built-in checks on the scoring and lifecycle logic in
              this browser: CVSS 3.1 maths, fingerprints, partial-scope
              handling, reopen detection, SSVC, EOL and feed parsers.
            </p>
            <V.Button
              size="sm"
              variant="primary"
              icon="shield-check"
              onClick={function () {
                st[1](runSelfTests());
              }}
            >
              Run self-test
            </V.Button>
            {st[0] ? (
              <div className="stack-tight">
                <span className="up-count">
                  {st[0].filter(function (x) {
                    return x.ok;
                  }).length +
                    " / " +
                    st[0].length +
                    " passed"}
                </span>
                {st[0].map(function (x, i) {
                  return (
                    <div
                      key={i}
                      className={"test-row " + (x.ok ? "is-ok" : "is-bad")}
                    >
                      <V.Icon name={x.ok ? "check" : "x"} size={14} />
                      <span>{x.name}</span>
                      {x.err ? <span className="up-err">{x.err}</span> : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </V.Drawer>
  );
}

/* ================= 2. Assets ================= */
/* host profiles are reused until the active findings or asset profiles change (20k-row workspaces open drawers instantly) */
