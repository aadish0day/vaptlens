import { RO_REASON, count, fmtTime, nowIso } from "@/app/lib/common";
import { saveFile } from "@/app/lib/export";
import { buildEvidencePack } from "@/app/lib/integrations";
import { RotateKey } from "@/app/users/RotateKey";
import { AUTH, LOCK_AFTER, LOCK_MINUTES } from "@/lib/auth";
import {
  localDay,
  parseEpssCsv,
  parseKevFeed,
  runSelfTests,
} from "@/lib/engine";
import {
  P,
  VAULT,
  WS,
  exportWorkspace,
  importWorkspace,
  readFileText,
} from "@/lib/store";
import { SYNC } from "@/lib/sync";
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
  var pw = useState(""),
    pw2 = useState(""),
    vb = useState(false),
    st = useState(null),
    ib = useState("");
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
    exportWorkspace().then(function (j) {
      return saveFile(p, "vaptlens-workspace-" + localDay() + ".json", j);
    }).catch(function (e) {
      p.toast({
        title: "Couldn't save backup",
        message: e.message,
        tone: "danger",
      });
    });
  }
  /* restore asks once: it replaces this browser's workspace and accounts */
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
    p.log("DATA", "Workspace restored from " + x.name);
    P.hold(
      P.idle().then(function () {
        return importWorkspace(x.text);
      }),
    ).then(
      function () {
        (P as any).frozen = true;
        sessionStorage.clear();
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
  function enableVault() {
    if (pw[0].length < 10 || pw[0] !== pw2[0]) return;
    vb[1](true);
    VAULT.enable(pw[0]).then(
      function () {
        vb[1](false);
        pw[1]("");
        pw2[1]("");
        p.log("VAULT", "Encryption at rest enabled");
        p.toast({
          title: "Workspace encrypted",
          message: "You'll need the passphrase after a reload.",
        });
      },
      function (e) {
        vb[1](false);
        p.toast({
          title: "Couldn't enable encryption",
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
    "Team sync",
    "Self-test",
  ];
  var tk = useState(SYNC.token()),
    sy = useState(""),
    pc = useState(false);
  function syncFail(e) {
    sy[1]("");
    p.toast({
      title: "Sync failed",
      message: e.message,
      tone: "danger",
    });
  }
  function push() {
    SYNC.setToken(tk[0]);
    sy[1]("Pushing…");
    SYNC.push().then(function (r) {
      sy[1]("");
      p.log(
        "SYNC",
        "Pushed workspace " +
          WS.current() +
          " to the team server (version " +
          r.version +
          ")",
      );
      p.toast({
        title: "Pushed to the team server",
        message: "Version " + r.version,
      });
    }, syncFail);
  }
  function pull() {
    pc[1](false);
    SYNC.setToken(tk[0]);
    sy[1]("Pulling…");
    SYNC.pull().then(function () {
      location.reload();
    }, syncFail);
  }
  var wl = useState(null),
    wn = useState(""),
    wsBusy = useState(false);
  useEffect(
    function () {
      if (tb[0] === "Workspaces") WS.list().then(wl[1]);
    },
    [tb[0]],
  );
  function switchWs(name) {
    wsBusy[1](true);
    p.log("WORKSPACE", "Switched from " + WS.current() + " to " + name);
    setTimeout(function () {
      P.hold(
        P.idle().then(function () {
          return WS.switchTo(name);
        }),
      ).then(
        function () {
          (P as any).frozen = true;
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
    }, 300);
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
              <V.Button
                key="y"
                size="sm"
                variant="danger"
                onClick={function () {
                  p.clearAll();
                  cf[1](false);
                  p.onClose();
                }}
              >
                Clear all data
              </V.Button>,
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
            <V.Banner tone="privacy" title="Encrypted in this browser">
              Scans stay in this browser's storage, encrypted with your sign-in,
              so they survive a reload. Nothing leaves this browser unless you
              push it, still encrypted, from Team sync.
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
              together. Threat-intel feeds are shared. Everything stays in this
              browser.
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
                            : "Saved " + fmtTime((w as any).savedAt)}
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
                                    "Its saved snapshot is removed for good.",
                                  tone: "info",
                                });
                                setTimeout(function () {
                                  cfWs[1](null);
                                }, 5000);
                                return;
                              }
                              cfWs[1](null);
                              p.log("WORKSPACE", "Deleted workspace " + w.name);
                              WS.remove(w.name)
                                .then(function () {
                                  return WS.list();
                                })
                                .then(wl[1]);
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
                switchWs(n);
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
              this browser and kept in storage, so the zero-trust promise
              holds. Every finding is re-scored when a feed loads.
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
              title={"Encrypted at rest · signed in as " + p.me.username}
            >
              Scans, governance, notes, the audit log, the library, engagement
              details, evidence and saved workspaces are stored with AES-GCM
              256. The data key is wrapped separately for each account with a
              key derived from its password (PBKDF2-SHA-256, 310,000 rounds). It
              lives in memory; this tab keeps a copy wrapped by a
              non-extractable browser key so a reload doesn't sign you out. Both
              are dropped on sign-out, tab close or after the idle timeout.
            </V.Banner>
            <dl className="kv">
              <dt>Accounts</dt>
              <dd>{((AUTH.store() || {}).users || []).length}</dd>
              <dt>Idle sign-out</dt>
              <dd>{((AUTH.store() || {}).idleMinutes || 15) + " min"}</dd>
              <dt>Lockout</dt>
              <dd>
                {LOCK_AFTER + " failed attempts → " + LOCK_MINUTES + " min"}
              </dd>
            </dl>
            <p className="up-help">
              {
                "Honest limits: this protects data at rest and separates roles for people sharing one browser profile. Someone with the device can still copy the encrypted data and guess passwords offline, which is why long passwords matter. The governance audit log is hash-chained (SHA-256) and records who did what; verify it from SLA & RACI."
              }
            </p>
            {p.isAdmin ? <RotateKey ctx={p} /> : null}
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
              One JSON file with every scan, governance decision, note, evidence
              image, library entry, setting and the user accounts. It stays
              encrypted: restoring it anywhere needs one of its accounts to sign
              in.
            </p>
            <div className="row-wrap">
              <V.Button
                size="sm"
                variant="primary"
                icon="download"
                restricted={!p.isAdmin}
                restrictedReason="Only administrators can export: the file contains every account's wrapped key."
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
                  buildEvidencePack(p).then(
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
                    }
                  ).catch(function(e) {
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
                    <V.Button size="sm" variant="danger" onClick={doRestore}>
                      Replace everything
                    </V.Button>
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
                  ". Everything in this browser — scans, decisions, accounts — is replaced, then you sign in with an account from the backup."}
              </V.Banner>
            ) : null}
            <V.Banner
              tone="warn"
              title="Restore replaces this browser's workspace and accounts"
            >
              The page reloads and asks you to sign in with an account from the
              backup. Export first if you want to keep what's here.
            </V.Banner>
          </div>
        ) : null}
        {sec === "Team sync" ? (
          <div className="stack">
            <p className="up-help">
              {'Share workspace "' +
                WS.current() +
                "\" with your team through the sync server. It receives the same encrypted snapshot as a backup: findings stay ciphertext, and each teammate signs in with their own account. Push sends your copy; pull replaces this browser's copy with the server's."}
            </p>
            <label className="wb-field">
              <span className="vl-label">Team token</span>
              <input
                className="wb-select"
                type="password"
                autoComplete="off"
                value={tk[0]}
                onChange={function (e) {
                  tk[1](e.target.value);
                }}
              />
            </label>
            <p className="up-help">
              {SYNC.version()
                ? "Last synced at server version " + SYNC.version() + "."
                : "Not synced from this browser yet."}
            </p>
            <div className="row-wrap">
              <V.Button
                size="sm"
                variant="primary"
                icon="upload"
                disabled={!tk[0].trim() || !!sy[0]}
                restricted={p.readOnly}
                restrictedReason={RO_REASON}
                onClick={push}
              >
                {sy[0] === "Pushing…" ? sy[0] : "Push to team"}
              </V.Button>
              <V.Button
                size="sm"
                icon="download"
                disabled={!tk[0].trim() || !!sy[0]}
                onClick={function () {
                  pc[1](true);
                }}
              >
                {sy[0] === "Pulling…" ? sy[0] : "Pull from team…"}
              </V.Button>
            </div>
            {pc[0] ? (
              <V.Banner
                tone="danger"
                title="Replace this browser's copy?"
                action={
                  <span className="row-wrap">
                    <V.Button size="sm" variant="danger" onClick={pull}>
                      Pull and reload
                    </V.Button>
                    <V.Button
                      size="sm"
                      onClick={function () {
                        pc[1](false);
                      }}
                    >
                      Cancel
                    </V.Button>
                  </span>
                }
              >
                Scans, decisions and accounts here are replaced by the server's
                version. Anything you haven't pushed is lost.
              </V.Banner>
            ) : null}
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
