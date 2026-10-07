import { PageHead } from "@/app/components/PageHead";
import { openRow } from "@/app/components/utils";
import { SEV_LABEL, cvssTxt, hostLabel, uniq } from "@/app/lib/common";
import { slug, toCsv } from "@/app/lib/export";
import { CsvBox } from "@/app/views/retest/CsvBox";
import React, { useState } from "react";
import * as V from "@/ui";

/* ================= 7. Re-test ================= */
export function Retest(ctx) {
  var bs = ctx.batches;
  function lab(x) {
    return bs.filter(function (y) {
      return y.label === x.label;
    }).length > 1
      ? x.label + " #" + x.id
      : x.label;
  }
  var A = useState(bs[bs.length - 2] ? lab(bs[bs.length - 2]) : lab(bs[0])),
    B = useState(lab(bs[bs.length - 1])),
    tb = useState("New risk"),
    cp = useState(false);
  var ba =
      bs.find(function (x) {
        return lab(x) === A[0];
      }) || bs[0],
    bb =
      bs.find(function (x) {
        return lab(x) === B[0];
      }) || bs[bs.length - 1];
  var scopeB = ctx.eng.scope[bb.id] || {};
  /* scanner evidence only: rows the scan itself produced (no carried-over or synthetic rows) */
  var ra = ctx.data.filter(function (x) {
      return x.batch === ba.id && x.lifecycle !== "Fixed" && !x.unverified;
    }),
    rb = ctx.data.filter(function (x) {
      return x.batch === bb.id && x.lifecycle !== "Fixed" && !x.unverified;
    });
  var ka = {},
    kb = {};
  ra.forEach(function (x) {
    ka[x.key] = x;
  });
  rb.forEach(function (x) {
    kb[x.key] = x;
  });
  var gone = ra.filter(function (x) {
    return !kb[x.key];
  });
  /* fixed only if B's own scanner re-tested the host (a Nessus re-scan says nothing about a Burp finding) */
  var fixed = gone.filter(function (x) {
      return ctx.eng.covers(bb.id, x);
    }),
    untested = gone.filter(function (x) {
      return !ctx.eng.covers(bb.id, x);
    });
  var added = rb.filter(function (x) {
      return !ka[x.key] && !x.reopenCount;
    }),
    reopened = rb.filter(function (x) {
      return !ka[x.key] && x.reopenCount;
    }),
    pers = rb.filter(function (x) {
      return ka[x.key];
    });
  var sa = ra.reduce(function (t, x) {
      return t + x.cvss;
    }, 0),
    sb = rb.concat(untested).reduce(function (t, x) {
      return t + x.cvss;
    }, 0);
  var pct = sa ? Math.round(((sb - sa) / sa) * 100) : 0;
  var groups = [
    ["Verified fixed", fixed, "fixed"],
    ["New risk", added, "new"],
    ["Reopened", reopened, "reopened"],
    ["Persistent", pers, "persistent"],
    ["Not re-tested", untested, "unverified"],
  ];
  var list = (groups.find(function (g2) {
    return g2[0] === tb[0];
  }) || groups[1])[1];
  var csv = toCsv(
    [
      [
        "status",
        "severity",
        "host",
        "port",
        "finding",
        "cvss",
        "cves",
        "first_seen",
      ],
    ].concat(
      [].concat.apply(
        [],
        groups.map(function (g2) {
          return g2[1].map(function (x) {
            return [
              g2[0],
              SEV_LABEL[x.sev],
              x.host,
              x.port,
              x.name,
              x.cvss,
              x.cves.join(" "),
              x.firstSeen,
            ];
          });
        }),
      ),
    ),
  );
  var same = ba.id === bb.id;
  /* one scan: nothing to compare yet — say what to do instead of showing two identical pickers */
  if (bs.length < 2)
    return (
      <div className="page">
        <PageHead
          title="Re-Test Verification"
          sub="Compare a re-test scan against the original to see what's fixed, still open or new."
        />
        <V.EmptyState
          title="Upload a re-test scan to compare"
          hint={
            "There's one scan in this workspace (" +
            (bs[0] ? lab(bs[0]) : "none") +
            "). After the fixes, scan the same hosts again and upload it here."
          }
          action={
            ctx.readOnly ? null : (
              <V.Button variant="primary" size="sm" icon="upload" onClick={function () {
                ctx.openUpload();
              }}>
                Upload re-test scan
              </V.Button>
            )
          }
        />
      </div>
    );
  return (
    <div className="page">
      <PageHead
        title="Re-Test Verification"
        sub="Findings match on a fingerprint (CVE or scanner rule + host + port). Something counts as fixed only if the re-test scanned its host; otherwise it's Not re-tested."
      />
      <section className="retest-pick">
        <div className="pick">
          <span className="vl-label">Baseline scan A</span>
          <V.SegmentedControl
            label="Baseline"
            options={bs.map(lab)}
            value={lab(ba)}
            onChange={A[1]}
          />
        </div>
        <div className="pick">
          <span className="vl-label">Re-test scan B</span>
          <V.SegmentedControl
            label="Re-test"
            options={bs.map(lab)}
            value={lab(bb)}
            onChange={B[1]}
          />
        </div>
      </section>
      {same ? (
        <V.Banner tone="warn" title="Pick two different scans">
          Baseline and re-test are the same batch.
        </V.Banner>
      ) : (
        [
          <section key="s" className="retest-sum">
            <V.RiskDelta
              pct={pct}
              baseline={ba.label}
              retest={bb.label}
              before={sa.toFixed(1)}
              after={sb.toFixed(1)}
            />
            <div className="diff-row">
              {groups.map(function (g2) {
                return (
                  <V.DiffBadge key={g2[2]} kind={g2[2]} count={g2[1].length} />
                );
              })}
            </div>
          </section>,
          untested.length ? (
            <V.Banner
              key="u"
              tone="warn"
              title={untested.length + " findings weren't re-tested"}
            >
              {"Scan " +
                bb.label +
                " didn't cover " +
                uniq(
                  untested.map(function (x) {
                    return x.host;
                  }),
                ).join(", ") +
                ". Re-scan those hosts to verify the fixes."}
            </V.Banner>
          ) : null,
          <V.WidgetCard
            key="t"
            title="Differential results"
            draggable={false}
            actions={
              <V.Button
                size="sm"
                variant="ghost"
                icon="file"
                onClick={function () {
                  cp[1](!cp[0]);
                }}
              >
                {cp[0] ? "Hide CSV" : "Export audit CSV"}
              </V.Button>
            }
          >
            <div className="stack">
              <V.Tabs
                tabs={groups.map(function (g2) {
                  return {
                    label: g2[0],
                    count: g2[1].length,
                  };
                })}
                value={tb[0]}
                onChange={tb[1]}
              />
              {list.length > 300 ? (
                <p className="up-help">
                  {"Showing the 300 highest-CVSS of " +
                    list.length +
                    ". Download the CSV for all of them."}
                </p>
              ) : null}
              {list.length ? (
                <div className="stack-tight">
                  {list
                    .slice()
                    .sort(function (p, q) {
                      return q.cvss - p.cvss;
                    })
                    .slice(0, 300)
                    .map(function (x) {
                      return (
                        <div
                          {...Object.assign(
                            {
                              key: x.id,
                            },
                            openRow(ctx, x.key, "diff-item"),
                          )}
                        >
                          <V.SeverityBadge severity={x.sev} />
                          <span className="breach-name">{x.name}</span>
                          <span className="vl-mono diff-host">
                            {hostLabel(x)}
                          </span>
                          <span className="vl-mono">{cvssTxt(x)}</span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <V.EmptyState title="Nothing in this group." />
              )}
              {cp[0] ? (
                <CsvBox
                  csv={csv}
                  name={
                    "vaptlens-retest-verification-" +
                    slug(ba.label) +
                    "-vs-" +
                    slug(bb.label) +
                    ".csv"
                  }
                  toast={ctx.toast}
                />
              ) : null}
            </div>
          </V.WidgetCard>,
        ]
      )}
    </div>
  );
}
