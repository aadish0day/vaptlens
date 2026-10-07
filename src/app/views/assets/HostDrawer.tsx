import { openRow } from "@/app/components/utils";
import { count, cvssTxt, tagsOf, uniq } from "@/app/lib/common";
import { HostAliases } from "@/app/views/assets/HostAliases";
import { hostProfiles } from "@/app/views/assets/utils";
import { subnetOf } from "@/lib/data";
import { assetBand, assetOf } from "@/lib/engine";
import React, { useEffect, useRef, useState } from "react";
import * as V from "@/ui";

export function HostDrawer(p) {
  /* typed-but-not-blurred profile edits are saved when the drawer closes (Esc, Back, switching hosts) */
  var pend = useRef<any>({});
  useEffect(function () {
    return function () {
      var q: any = pend.current;
      if (q.bu != null || q.tags != null) {
        var n = Object.assign({}, p.assetsNow.current);
        n[p.host] = Object.assign(
          {},
          n[p.host] || {},
          q.bu != null
            ? {
                bu: q.bu,
              }
            : {},
          q.tags != null
            ? {
                tags: q.tags,
              }
            : {},
        );
        p.setAssets(n);
        p.log("ASSET", p.host + " profile saved on close");
      }
    };
  }, []);
  var tb0 = useState("Findings");
  var known =
    p.data.some(function (x) {
      return x.host === p.host;
    }) ||
    p.batches.some(function (b) {
      return p.eng.scope[b.id] && p.eng.scope[b.id][p.host];
    });
  if (!known)
    return (
      <V.Drawer title={p.host} mono={true} onClose={p.onClose}>
        <V.EmptyState
          title="This host isn't in the current workspace."
          hint="It may have been merged into another name, removed with a scan, or belong to another workspace."
        />
      </V.Drawer>
    );
  var r = p.active.filter(function (x) {
      return x.host === p.host;
    }),
    prof = hostProfiles(p).find(function (x) {
      return x.host === p.host;
    }) || {
      tier: 3,
      device: "",
      os: "",
      owner: "",
      score: 0,
      counts: {},
    };
  var tb = tb0;
  return (
    <V.Drawer
      eyebrow={"Host · " + prof.device + " · " + prof.os}
      title={p.host}
      mono={true}
      onClose={p.onClose}
      meta={[
        <V.TierBadge key="t" tier={prof.tier} />,
        prof.eol ? <V.ThreatTag key="e" kind="eol" /> : null,
        r.some(function (x) {
          return x.zeroday;
        }) ? (
          <V.ThreatTag key="z" kind="zeroday" />
        ) : null,
      ]}
      footer={[
        <V.Button
          key="f"
          size="sm"
          onClick={function () {
            p.setFilters(
              Object.assign({}, p.filters, {
                host: p.host,
              }),
            );
            p.onClose();
            p.go("dashboard");
          }}
        >
          Filter dashboard to host
        </V.Button>,
      ]}
    >
      <div className="stack">
        <V.RiskMeter
          host={"Asset risk · " + assetBand(prof.score)}
          score={prof.score}
          max={1000}
        />
        <div className="row-wrap">
          {["critical", "high", "medium", "low", "info"].map(function (s) {
            var n = count(r, function (x) {
              return x.sev === s;
            });
            return n ? (
              <V.SeverityBadge key={s} severity={s} count={n} />
            ) : null;
          })}
        </div>
        <V.Tabs
          tabs={[
            {
              label: "Findings",
              count: r.length,
            },
            {
              label: "Profile",
            },
          ]}
          value={tb[0]}
          onChange={tb[1]}
        />
        {tb[0] === "Findings" ? (
          <div className="drawer-list">
            {r.length > 200 ? (
              <p className="up-help">
                {"The 200 riskiest of " +
                  r.length +
                  " — use “Filter dashboard to host” for all."}
              </p>
            ) : null}
            {r
              .sort(function (a, b) {
                return b.risk - a.risk;
              })
              .slice(0, 200)
              .map(function (x) {
                return (
                  <div
                    {...Object.assign(
                      {
                        key: x.id,
                      },
                      openRow(p, x.key, "drawer-item"),
                    )}
                  >
                    <V.SeverityBadge severity={x.sev} />
                    <div className="drawer-item-main">
                      <span className="drawer-item-t">{x.name}</span>
                      <span className="drawer-item-m">
                        {(x.port ? ":" + x.port + " · " : "") +
                          "CVSS " +
                          cvssTxt(x) +
                          " · risk " +
                          x.risk}
                      </span>
                    </div>
                    <div className="row-wrap">
                      {tagsOf(x)
                        .slice(0, 2)
                        .map(function (t) {
                          return <V.ThreatTag key={t} kind={t} />;
                        })}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="stack">
            <dl className="profile">
              {[
                ["Device", prof.device],
                ["OS", prof.os],
                ["Owner team", prof.owner],
                ["Subnet", subnetOf(p.host)],
                ["Open findings", r.length],
                [
                  "Last scanned",
                  (function () {
                    var ls = null;
                    p.batches.forEach(function (b) {
                      if (p.eng.scope[b.id][p.host]) ls = b.date;
                    });
                    return ls || "—";
                  })(),
                ],
              ].map(function (kv) {
                return [
                  <dt key={kv[0]}>{kv[0]}</dt>,
                  <dd key={kv[0] + "v"}>{kv[1]}</dd>,
                ];
              })}
            </dl>
            <div className="wb-form">
              <label className="wb-field">
                <span className="vl-label">Business criticality</span>
                <select
                  className="wb-select"
                  disabled={p.readOnly}
                  value={String(prof.tier)}
                  onChange={function (e) {
                    var n = Object.assign({}, p.assets);
                    n[p.host] = Object.assign({}, n[p.host] || {}, {
                      tier: +e.target.value,
                    });
                    p.setAssets(n);
                    p.log("ASSET", p.host + " set to Tier " + e.target.value);
                  }}
                >
                  {[
                    ["1", "Tier 1 · Crown jewel"],
                    ["2", "Tier 2 · Business"],
                    ["3", "Tier 3 · Low impact"],
                  ].map(function (o) {
                    return (
                      <option key={o[0]} value={o[0]}>
                        {o[1]}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="wb-field">
                <span className="vl-label">Exposure</span>
                <select
                  className="wb-select"
                  disabled={p.readOnly}
                  value={prof.exposure}
                  onChange={function (e) {
                    var n = Object.assign({}, p.assets);
                    n[p.host] = Object.assign({}, n[p.host] || {}, {
                      exposure: e.target.value,
                    });
                    p.setAssets(n);
                    p.log(
                      "ASSET",
                      p.host + " exposure set to " + e.target.value,
                    );
                  }}
                >
                  {[
                    ["internet", "Internet-facing"],
                    ["internal", "Internal only"],
                    ["isolated", "Isolated segment"],
                  ].map(function (o) {
                    return (
                      <option key={o[0]} value={o[0]}>
                        {o[1]}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="wb-field">
                <span className="vl-label">
                  Public well-being impact (SSVC)
                </span>
                <select
                  className="wb-select"
                  disabled={p.readOnly}
                  value={assetOf(p.host, p.assets).wellbeing}
                  onChange={function (e) {
                    var n = Object.assign({}, p.assets);
                    n[p.host] = Object.assign({}, n[p.host] || {}, {
                      wellbeing: e.target.value,
                    });
                    p.setAssets(n);
                    p.log(
                      "ASSET",
                      p.host + " well-being impact → " + e.target.value,
                    );
                  }}
                >
                  {[
                    ["minimal", "Minimal"],
                    ["material", "Material (safety, finance, privacy)"],
                    ["irreversible", "Irreversible (injury, loss of life)"],
                  ].map(function (o) {
                    return (
                      <option key={o[0]} value={o[0]}>
                        {o[1]}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="wb-field">
                <span className="vl-label">Business unit</span>
                <input
                  className="wb-select"
                  disabled={p.readOnly}
                  list="bu-list"
                  defaultValue={prof.bu || ""}
                  placeholder="e.g. E-commerce"
                  onChange={function (e) {
                    pend.current.bu = e.target.value.trim();
                  }}
                  onKeyDown={function (e) {
                    if (e.key === "Enter") (e.target as any).blur();
                  }}
                  onBlur={function (e) {
                    delete pend.current.bu;
                    var v = e.target.value.trim();
                    if (v === (prof.bu || "")) return;
                    var n = Object.assign({}, p.assets);
                    n[p.host] = Object.assign({}, n[p.host] || {}, {
                      bu: v,
                    });
                    p.setAssets(n);
                    p.log(
                      "ASSET",
                      p.host + " business unit → " + (v || "none"),
                    );
                  }}
                />
                <datalist id="bu-list">
                  {uniq(
                    Object.keys(p.assets)
                      .map(function (hh) {
                        return p.assets[hh].bu;
                      })
                      .filter(Boolean),
                  ).map(function (b) {
                    return <option key={b} value={b} />;
                  })}
                </datalist>
              </label>
              <label className="wb-field">
                <span className="vl-label">Asset tags (comma-separated)</span>
                <input
                  className="wb-select"
                  disabled={p.readOnly}
                  defaultValue={(prof.tags || []).join(", ")}
                  placeholder="pci, prod, customer-data"
                  onChange={function (e) {
                    pend.current.tags = e.target.value
                      .split(",")
                      .map(function (x) {
                        return x.trim().toLowerCase();
                      })
                      .filter(Boolean);
                  }}
                  onKeyDown={function (e) {
                    if (e.key === "Enter") (e.target as any).blur();
                  }}
                  onBlur={function (e) {
                    delete pend.current.tags;
                    var v = e.target.value
                      .split(",")
                      .map(function (x) {
                        return x.trim().toLowerCase();
                      })
                      .filter(Boolean);
                    if (v.join(",") === (prof.tags || []).join(",")) return;
                    var n = Object.assign({}, p.assets);
                    n[p.host] = Object.assign({}, n[p.host] || {}, {
                      tags: v,
                    });
                    p.setAssets(n);
                    p.log(
                      "ASSET",
                      p.host + " tags → " + (v.join(", ") || "none"),
                    );
                  }}
                />
              </label>
              <V.Checkbox
                label="Retired / decommissioned (excluded from coverage)"
                checked={!!assetOf(p.host, p.assets).retired}
                disabled={p.readOnly}
                onChange={function (v) {
                  var n = Object.assign({}, p.assets);
                  n[p.host] = Object.assign({}, n[p.host] || {}, {
                    retired: v,
                  });
                  p.setAssets(n);
                  p.log(
                    "ASSET",
                    p.host + (v ? " retired" : " returned to service"),
                  );
                }}
              />
              <HostAliases p={p} />
              <p className="up-help">
                Tier, exposure and well-being feed every finding's risk, its
                SSVC mission input and the attack-path model. Isolated hosts
                can't be reached laterally.
              </p>
            </div>
          </div>
        )}
      </div>
    </V.Drawer>
  );
}

/* other names the same machine goes by (FQDN, NetBIOS, old IP): their findings fold onto this host */
