import { normSev } from "@/lib/data";
import {
  PLUGIN_NS,
  parseVector,
  sourceOf,
  uniqA,
  vectorScore,
} from "@/lib/engine";
import Papa from "papaparse";

/* ---------- Multi-format scan parsers (all in-browser) ---------- */
export var SCAN_ACCEPT =
  ".csv,.tsv,.txt,.nessus,.xml,.json,.jsonl,.ndjson,.sarif";

export var FORMATS_HELP =
  "Qualys XML · Rapid7 Nexpose XML · Grype JSON · OSV-Scanner JSON · Snyk JSON · CycloneDX SBOM/VEX · OpenVEX · CSV · .nessus · OpenVAS/Greenbone XML · Burp XML · ZAP JSON/XML · Nuclei JSON/JSONL · Nikto JSON/XML · Wapiti JSON · Dependency-Check JSON · Trivy JSON · SARIF (Semgrep, CodeQL, Snyk…) · Nmap XML";

export function sevFromNum5(n) {
  n = +n;
  return n >= 4
    ? "critical"
    : n === 3
      ? "high"
      : n === 2
        ? "medium"
        : n === 1
          ? "low"
          : "info";
}

export function num(x) {
  var t = String(x == null ? "" : x).trim();
  if (/^\d+,\d+$/.test(t)) t = t.replace(",", ".");
  var v = parseFloat(t);
  return isNaN(v) ? 0 : v;
}
/* direct child only: OpenVAS nests <severity> inside nvt>severities too */

/* direct child only: OpenVAS nests <severity> inside nvt>severities too */
export function kid(el, name) {
  if (!el) return "";
  for (var i = 0; i < el.children.length; i++)
    if (el.children[i].nodeName === name)
      return (el.children[i].textContent || "").trim();
  return "";
}

export function txt(el, sel) {
  if (!el) return "";
  var n = sel ? el.querySelector(sel) : el;
  return n ? (n.textContent || "").trim() : "";
}

export function cvesIn(s) {
  var m = String(s || "").match(/CVE-\d{4}-\d{4,7}/gi);
  return m
    ? m
        .map(function (x) {
          return x.toUpperCase();
        })
        .filter(function (x, i, a) {
          return a.indexOf(x) === i;
        })
    : [];
}

export function hostOf(u) {
  try {
    return new URL(u).hostname;
  } catch (e) {
    var str = String(u || "").replace(/^https?:\/\//, "");
    var firstPart = str.split('/')[0];
    if (firstPart.indexOf(":") !== firstPart.lastIndexOf(":")) {
      return /^\[.*\]$/.test(firstPart) ? firstPart : "[" + firstPart + "]";
    }
    return (
      str.split(/[/:]/)[0] || "unknown-host"
    );
  }
}

export function portOf(u) {
  try {
    var x = new URL(u);
    return x.port ? +x.port : x.protocol === "https:" ? 443 : 80;
  } catch (e) {
    return null;
  }
}

export function pathOf(u) {
  try {
    var x = new URL(u, "http://localhost");
    return x.pathname + x.search;
  } catch (e) {
    return undefined;
  }
}

export function strip(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cwesIn(s) {
  var m = String(s || "").match(/CWE[-_ ]?(\d{1,5})/gi);
  return m
    ? m
        .map(function (x) {
          return "CWE-" + x.replace(/\D/g, "");
        })
        .filter(function (x, i, a) {
          return a.indexOf(x) === i;
        })
    : [];
}

export function row(o) {
  var cwe = []
    .concat(o.cwe || [])
    .map(function (x) {
      x = String(x).trim();
      return /^\d+$/.test(x) ? "CWE-" + x : x.toUpperCase();
    })
    .filter(function (x) {
      return /^CWE-\d+$/.test(x);
    });
  return {
    name: o.name || "Untitled finding",
    host: String(o.host || "unknown-host")
      .trim()
      .toLowerCase(),
    port: o.port ? parseInt(o.port, 10) || null : null,
    sev: o.sev || normSev("", o.cvss),
    cvss: num(o.cvss),
    vector: o.vector ? String(o.vector).trim() : undefined,
    cves: (o.cves || [])
      .map(function (c) {
        return String(c).trim().toUpperCase();
      })
      .filter(Boolean),
    cwe: cwe.filter(function (x, i, a) {
      return a.indexOf(x) === i;
    }),
    pluginId: o.pluginId ? String(o.pluginId) : undefined,
    tool: o.tool,
    desc: strip(o.desc) || "No description in the export.",
    sol: strip(o.sol) || "See vendor guidance.",
    url: o.url,
    dateHint: o.dateHint || undefined,
  };
}
/* ISO date (yyyy-mm-dd) from many timestamp shapes; null when unusable */

/* ISO date (yyyy-mm-dd) from many timestamp shapes; null when unusable */
export function isoDay(v) {
  if (v == null || v === "") return null;
  if (/^\d{9,11}$/.test(String(v))) v = +v * 1000;
  else if (/^\d{12,14}$/.test(String(v))) v = +v;
  /* a timestamp without a zone is local time: keep its calendar day instead of converting to UTC */
  var sv = String(v),
    m0 =
      /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/.exec(
        sv,
      );
  if (m0) return m0[1] + "-" + m0[2] + "-" + m0[3];
  var mc = /^(\d{4})(\d{2})(\d{2})(T\d|$)/.exec(sv);
  if (mc && +mc[1] >= 1995 && +mc[1] <= 2100)
    return mc[1] + "-" + mc[2] + "-" + mc[3];
  var d = new Date(v);
  if (isNaN(d as any)) {
    var m = /(\d{4})(\d{2})(\d{2})T?/.exec(String(v));
    if (m)
      return +m[1] >= 1995 && +m[1] <= 2100
        ? m[1] + "-" + m[2] + "-" + m[3]
        : null;
  }
  if (isNaN(d as any) || d.getFullYear() < 1995 || d.getFullYear() > 2100)
    return null;
  function p2(n) {
    return String(n).padStart(2, "0");
  }
  return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
}

/* --- XML --- */

/* --- XML --- */
export function parseNessus(doc) {
  var out: any = [];
  out.scope = [];
  out.dates = [];
  out.aliases = [];
  doc.querySelectorAll("ReportHost").forEach(function (rh) {
    var host = rh.getAttribute("name");
    var ipTag = rh.querySelector('HostProperties tag[name="host-ip"]');
    if (ipTag) host = ipTag.textContent.trim() || host;
    if (!host) host = "unknown";
    ["host-fqdn", "hostname", "netbios-name"].forEach(function (t) {
      var e = rh.querySelector('HostProperties tag[name="' + t + '"]');
      var v = e && e.textContent.trim().toLowerCase();
      if (v && v !== host.toLowerCase())
        out.aliases.push([v, host.toLowerCase()]);
    });
    var rn = String(rh.getAttribute("name") || "").toLowerCase();
    if (rn && rn !== host.toLowerCase())
      out.aliases.push([rn, host.toLowerCase()]);
    out.scope.push(host);
    var st =
      rh.querySelector('HostProperties tag[name="HOST_START_TIMESTAMP"]') ||
      rh.querySelector('HostProperties tag[name="HOST_START"]');
    if (st) out.dates.push(isoDay(st.textContent.trim()));
    rh.querySelectorAll("ReportItem").forEach(function (it) {
      var cv = txt(it, "cvss3_base_score") || txt(it, "cvss_base_score");
      out.push(
        row({
          tool: "Tenable Nessus",
          host: host,
          port: it.getAttribute("port"),
          name: it.getAttribute("pluginName"),
          pluginId: "nessus:" + it.getAttribute("pluginID"),
          sev: sevFromNum5(it.getAttribute("severity")),
          cvss: cv,
          vector: txt(it, "cvss3_vector") || undefined,
          cwe: Array.prototype.map.call(
            it.querySelectorAll("cwe"),
            function (c) {
              return c.textContent;
            },
          ),
          cves: Array.prototype.map.call(
            it.querySelectorAll("cve"),
            function (c) {
              return c.textContent.trim();
            },
          ),
          desc: txt(it, "synopsis") || txt(it, "description"),
          sol: txt(it, "solution"),
        }),
      );
    });
  });
  return out;
}

export function parseOpenVAS(doc) {
  var out = [];
  doc.querySelectorAll("result").forEach(function (r) {
    if (!r.querySelector("nvt")) return;
    var sc = kid(r, "severity"),
      th = kid(r, "threat");
    if (/^false positive$/i.test(th) || +sc < 0) return;
    if (/^alarm$/i.test(th)) th = "High";
    if (/^debug$/i.test(th)) th = "Log";
    var port = txt(r, "port").split("/")[0] || null;
    var cves = Array.prototype.map
      .call(r.querySelectorAll('ref[type="cve"]'), function (x) {
        return x.getAttribute("id");
      })
      .concat(cvesIn(txt(r, "nvt > cve")));
    var nvt = r.querySelector("nvt");
    out.push(
      row({
        tool: "OpenVAS / Greenbone",
        host: txt(r, "host").split(/\s/)[0],
        port: port,
        pluginId:
          nvt && nvt.getAttribute("oid")
            ? "oid:" + nvt.getAttribute("oid")
            : undefined,
        vector:
          (txt(r, "nvt > severities > severity > value") || "").indexOf(
            "CVSS:",
          ) === 0
            ? txt(r, "nvt > severities > severity > value")
            : undefined,
        cwe: cwesIn(txt(r, "nvt > tags")),
        name: txt(r, "nvt > name") || txt(r, "name"),
        sev: normSev(th === "Log" ? "info" : th, sc),
        cvss: sc,
        cves: cves.filter(function (x, i, a) {
          return x && a.indexOf(x) === i;
        }),
        desc: txt(r, "description"),
        sol: txt(r, "nvt > solution"),
      }),
    );
  });
  return out;
}

export function parseBurp(doc) {
  var out = [];
  doc.querySelectorAll("issue").forEach(function (i) {
    var h = txt(i, "host"),
      sev = txt(i, "severity");
    if (/^false positive$/i.test(sev)) return;
    out.push(
      row({
        tool: "Burp Suite",
        host: hostOf(h),
        port: portOf(h),
        url: txt(i, "path"),
        name: txt(i, "name"),
        pluginId: txt(i, "type") ? "burp:" + txt(i, "type") : undefined,
        cwe: cwesIn(txt(i, "vulnerabilityClassifications")),
        sev: normSev(sev === "Information" ? "info" : sev),
        desc: txt(i, "issueDetail") || txt(i, "issueBackground"),
        sol: txt(i, "remediationDetail") || txt(i, "remediationBackground"),
        cves: cvesIn(txt(i, "issueDetail")),
      }),
    );
  });
  return out;
}

export function parseZapXml(doc) {
  var out = [];
  doc.querySelectorAll("site").forEach(function (s) {
    var host = s.getAttribute("host") || hostOf(s.getAttribute("name")),
      port = s.getAttribute("port");
    s.querySelectorAll("alertitem").forEach(function (a) {
      if (txt(a, "confidence") === "0") return;
      out.push(
        row({
          tool: "OWASP ZAP",
          host: host,
          port: port,
          name: txt(a, "alert") || txt(a, "name"),
          pluginId: txt(a, "pluginid")
            ? "zap:" + txt(a, "pluginid")
            : undefined,
          cwe:
            txt(a, "cweid") && txt(a, "cweid") !== "-1"
              ? [txt(a, "cweid")]
              : [],
          sev: ["info", "low", "medium", "high"][+txt(a, "riskcode")] || "info",
          desc: txt(a, "desc"),
          sol: txt(a, "solution"),
          url: pathOf(txt(a, "uri")),
        }),
      );
    });
  });
  return out;
}

export function parseNiktoXml(doc) {
  var out = [];
  doc.querySelectorAll("scandetails").forEach(function (sd) {
    var host = sd.getAttribute("targethostname") || sd.getAttribute("targetip"),
      port = sd.getAttribute("targetport");
    sd.querySelectorAll("item").forEach(function (it) {
      out.push(
        row({
          tool: "Nikto",
          host: host,
          port: port,
          name: txt(it, "description").slice(0, 120),
          sev: "low",
          desc: txt(it, "description"),
          url: txt(it, "uri"),
        }),
      );
    });
  });
  return out;
}

export function parseNmap(doc) {
  var out: any = [];
  out.scope = [];
  out.aliases = [];
  doc.querySelectorAll("host").forEach(function (hh) {
    var addr =
      hh.querySelector('address[addrtype="ipv4"]') ||
      hh.querySelector("address");
    var host = addr ? addr.getAttribute("addr") : "unknown-host";
    hh.querySelectorAll("hostnames > hostname").forEach(function (hn) {
      var v = String(hn.getAttribute("name") || "").toLowerCase();
      if (v && v !== host) out.aliases.push([v, host]);
    });
    var hs = hh.querySelector("status");
    if (!hs || hs.getAttribute("state") === "up") out.scope.push(host);
    hh.querySelectorAll("port").forEach(function (p) {
      var st = p.querySelector("state");
      if (!st || st.getAttribute("state") !== "open") return;
      var svc = p.querySelector("service"),
        name = svc
          ? (svc.getAttribute("name") || "") +
            (svc.getAttribute("product")
              ? " (" +
                svc.getAttribute("product") +
                " " +
                (svc.getAttribute("version") || "") +
                ")"
              : "")
          : "";
      var vul = Array.prototype.map
        .call(p.querySelectorAll("script"), function (s) {
          return s.getAttribute("output") || "";
        })
        .join(" ");
      var cves = cvesIn(vul),
        proto = p.getAttribute("protocol") || "tcp",
        sname = svc ? svc.getAttribute("name") || "" : "";
      var ver = svc
        ? [
            svc.getAttribute("product"),
            svc.getAttribute("version"),
            svc.getAttribute("extrainfo"),
          ]
            .filter(Boolean)
            .join(" ")
        : "";
      /* stable rule ID: port/protocol/service (+ CVEs). The product version lives in the text, so an upgrade
         from OpenSSH 8.2 to 9.6 is the same open port, not a fix plus a new finding */
      out.push(
        row({
          tool: "Nmap",
          host: host,
          port: p.getAttribute("portid"),
          pluginId:
            "nmap:" +
            p.getAttribute("portid") +
            "/" +
            proto +
            ":" +
            (sname || "unknown") +
            (cves.length ? ":" + cves.slice().sort().join(",") : ""),
          name: cves.length
            ? "Vulnerable service: " + name.trim()
            : "Open port " +
              p.getAttribute("portid") +
              "/" +
              p.getAttribute("protocol") +
              " " +
              name.trim(),
          sev: cves.length ? "high" : "info",
          cves: cves,
          desc:
            (vul || "Open port found by Nmap service detection.") +
            (ver ? " Service: " + ver + "." : ""),
        }),
      );
    });
  });
  return out;
}

/* --- JSON --- */

/* --- JSON --- */
export function parseNucleiObj(o) {
  var info = o.info || {},
    cl = info.classification || {};
  var cve = []
    .concat(cl["cve-id"] || [])
    .filter(Boolean)
    .map(function (x) {
      return String(x).toUpperCase();
    });
  var at = o["matched-at"] || o.matched || o.host || "";
  return row({
    tool: "Nuclei",
    pluginId: o["template-id"] ? "nuclei:" + o["template-id"] : undefined,
    vector: cl["cvss-metrics"],
    cwe: [].concat(cl["cwe-id"] || []),
    dateHint: o.timestamp,
    host: o.host
      ? hostOf(o.host.indexOf("://") > 0 ? o.host : "http://" + o.host)
      : hostOf(at),
    port: o.port || portOf(at),
    url: pathOf(at),
    name: info.name || o["template-id"],
    sev: normSev(info.severity),
    cvss: cl["cvss-score"],
    cves: cve,
    desc: info.description || o["matcher-name"],
    sol: info.remediation,
  });
}

export function parseZapJson(j) {
  var out = [];
  [].concat(j.site || []).forEach(function (s) {
    var host = s["@host"] || hostOf(s["@name"]),
      port = s["@port"];
    (s.alerts || []).forEach(function (a) {
      if (String(a.confidence) === "0") return;
      out.push(
        row({
          tool: "OWASP ZAP",
          host: host,
          port: port,
          name: a.alert || a.name,
          pluginId: a.pluginid ? "zap:" + a.pluginid : undefined,
          cwe: a.cweid && a.cweid !== "-1" ? [a.cweid] : [],
          sev: ["info", "low", "medium", "high"][+a.riskcode] || "info",
          desc: a.desc,
          sol: a.solution,
          url:
            a.instances && a.instances[0]
              ? pathOf(a.instances[0].uri)
              : undefined,
        }),
      );
    });
  });
  return out;
}

export function parseNiktoJson(j) {
  var out = [];
  [].concat(j).forEach(function (t) {
    (t.vulnerabilities || []).forEach(function (v) {
      out.push(
        row({
          tool: "Nikto",
          host: t.host || t.ip,
          port: t.port,
          name: String(v.msg || v.id).slice(0, 120),
          sev: "low",
          desc: v.msg,
          url: v.url,
        }),
      );
    });
  });
  return out;
}

export function parseWapiti(j) {
  var out = [],
    target = (j.infos && j.infos.target) || "";
  Object.keys(j.vulnerabilities || {}).forEach(function (cat) {
    (j.vulnerabilities[cat] || []).forEach(function (v) {
      out.push(
        row({
          tool: "Wapiti",
          host: hostOf(target) || "unknown-host",
          port: portOf(target),
          name: cat,
          sev:
            v.level >= 4
              ? "critical"
              : v.level === 3
                ? "high"
                : v.level === 2
                  ? "medium"
                  : v.level === 1
                    ? "low"
                    : "info",
          desc: v.info,
          url: v.path,
        }),
      );
    });
  });
  return out;
}

export function parseDepCheck(j) {
  var out = [],
    proj = (j.projectInfo && j.projectInfo.name) || "application";
  (j.dependencies || []).forEach(function (d) {
    (d.vulnerabilities || []).forEach(function (v) {
      var sc = (v.cvssv3 && v.cvssv3.baseScore) || (v.cvssv2 && v.cvssv2.score);
      out.push(
        row({
          tool: "Dependency-Check",
          host: proj,
          pluginId: "dc:" + d.fileName + ":" + v.name,
          name: d.fileName + " · " + v.name,
          sev: normSev(v.severity, sc),
          cvss: sc,
          vector: v.cvssv3 ? v.cvssv3.vectorString || undefined : undefined,
          cwe: [].concat(v.cwes || []).map(function (c) {
            return String(c).replace(/^CWE-?/i, "");
          }),
          cves: cvesIn(v.name),
          desc: v.description,
          sol: "Upgrade " + d.fileName + " to a fixed version.",
        }),
      );
    });
  });
  return out;
}

export function parseTrivy(j) {
  var out = [],
    artFull = j.ArtifactName || "image",
    art = imageName(artFull);
  (j.Results || []).forEach(function (r) {
    (r.Vulnerabilities || []).forEach(function (v) {
      /* score and vector from the same source (NVD first, then the vendor), never mixed */
      /* newest CVSS version first, then the source Trivy took the severity from, then NVD */
      var srcs = v.CVSS
        ? Object.keys(v.CVSS)
            .map(function (k) {
              var c = v.CVSS[k];
              var o: any = c.V40Score
                ? {
                    s: c.V40Score,
                    v: c.V40Vector,
                    ver: 4,
                  }
                : c.V3Score
                  ? {
                      s: c.V3Score,
                      v: c.V3Vector,
                      ver: 3,
                    }
                  : c.V2Score
                    ? {
                        s: c.V2Score,
                        v: c.V2Vector,
                        ver: 2,
                      }
                    : null;
              if (o)
                o.rank =
                  o.ver * 10 +
                  (k === v.SeveritySource ? 2 : k === "nvd" ? 1 : 0);
              return o;
            })
            .filter(Boolean)
            .sort(function (a, b) {
              return (b as any).rank - (a as any).rank;
            })
        : [];
      var sc = srcs.length ? srcs[0].s : 0,
        vec = srcs.length ? srcs[0].v : undefined;
      out.push(
        row({
          tool: "Trivy",
          host: art,
          name:
            v.PkgName +
            " " +
            v.InstalledVersion +
            " · " +
            (v.Title || v.VulnerabilityID),
          sev: normSev(v.Severity, sc),
          cvss: sc,
          vector: vec,
          cwe: v.CweIDs || [],
          pluginId: "trivy:" + v.VulnerabilityID + ":" + v.PkgName,
          cves: cvesIn(v.VulnerabilityID),
          desc:
            (v.Description || v.VulnerabilityID) +
            (artFull !== art ? " Image: " + artFull + "." : ""),
          sol: v.FixedVersion
            ? "Upgrade " + v.PkgName + " to " + v.FixedVersion + "."
            : "No fixed version yet.",
        }),
      );
    });
  });
  return out;
}

export function parseSarif(j) {
  var out = [];
  (j.runs || []).forEach(function (run) {
    var tool = (run.tool && run.tool.driver && run.tool.driver.name) || "SARIF";
    var rules = {};
    ((run.tool && run.tool.driver && run.tool.driver.rules) || []).forEach(
      function (r) {
        rules[r.id] = r;
      },
    );
    var repo =
      (run.versionControlProvenance &&
        run.versionControlProvenance[0] &&
        run.versionControlProvenance[0].repositoryUri) ||
      "";
    (run.results || []).forEach(function (res) {
      if (
        (res.suppressions && res.suppressions.length) ||
        res.baselineState === "absent"
      )
        return;
      var rule = rules[res.ruleId] || {},
        props = rule.properties || {};
      var ss = num(
        props["security-severity"] ||
          (res.properties || {})["security-severity"],
      );
      var loc =
        res.locations && res.locations[0] && res.locations[0].physicalLocation;
      var file = loc && loc.artifactLocation ? loc.artifactLocation.uri : "";
      var line = loc && loc.region ? loc.region.startLine : null;
      var lvl =
        res.level ||
        (rule.defaultConfiguration && rule.defaultConfiguration.level) ||
        "warning";
      var fpr = res.partialFingerprints || res.fingerprints || null,
        fpv = fpr ? fpr[Object.keys(fpr)[0]] : null;
      out.push(
        row({
          tool: tool,
          host: repo
            ? hostOf(repo) +
              (repo.split("/").slice(-1)[0]
                ? "/" +
                  repo
                    .replace(/\.git$/, "")
                    .split("/")
                    .slice(-1)[0]
                : "")
            : (tool || "repository").toLowerCase(),
          name:
            (rule.shortDescription && rule.shortDescription.text) || res.ruleId,
          pluginId:
            "sarif:" + res.ruleId + ":" + file + ":" + (fpv || line || ""),
          cwe: cwesIn(
            JSON.stringify(props.tags || []) +
              " " +
              JSON.stringify(props.cwe || ""),
          ),
          sev: ss
            ? normSev("", ss)
            : lvl === "error"
              ? "high"
              : lvl === "warning"
                ? "medium"
                : lvl === "none"
                  ? "info"
                  : "low",
          cvss: ss,
          cves: cvesIn(JSON.stringify(props.tags || [])),
          desc:
            (res.message && res.message.text) +
            (file ? " (" + file + (line ? ":" + line : "") + ")" : ""),
          sol: (rule.help && rule.help.text) || "",
          url: file || undefined,
        }),
      );
    });
  });
  return out;
}
/* CycloneDX 1.4+ (SBOM with vulnerabilities, or a VEX document) */

/* CycloneDX 1.4+ (SBOM with vulnerabilities, or a VEX document) */
export function parseCycloneDx(j) {
  var out: any = [],
    comps = {},
    app =
      (j.metadata &&
        j.metadata.component &&
        j.metadata.component.name +
          (j.metadata.component.version
            ? "@" + j.metadata.component.version
            : "")) ||
      "sbom";
  (function walk(list) {
    (list || []).forEach(function (c) {
      comps[c["bom-ref"] || c.purl || c.name] =
        c.name + (c.version ? " " + c.version : "");
      walk(c.components);
    });
  })(j.components);
  out.vex = [];
  (j.vulnerabilities || []).forEach(function (v) {
    var rt =
      (v.ratings || []).slice().sort(function (a, b) {
        return (b.score || 0) - (a.score || 0);
      })[0] || {};
    var an = v.analysis || {},
      id = v.id || "";
    var affects = (v.affects || []).map(function (a) {
      return comps[a.ref] || a.ref;
    });
    var st = an.state || "";
    if (st)
      (affects.length ? affects : [app]).forEach(function (pr) {
        out.vex.push({
          cve: id.toUpperCase(),
          status: st,
          justification: an.justification || "",
          detail: an.detail || "",
          product: pr,
        });
      });
    if (/not_affected|false_positive|resolved/.test(st)) return;
    (affects.length ? affects : [null]).forEach(function (aff) {
      out.push(
        row({
          tool: "CycloneDX",
          host: app,
          name:
            (aff ? aff + " · " : "") +
            (v.description ? v.description.split(/[.\n]/)[0].slice(0, 80) : id),
          pluginId: "cdx:" + id + ":" + (aff || ""),
          sev: normSev(rt.severity, rt.score),
          cvss: rt.score,
          vector: rt.vector,
          cves: cvesIn(id + " " + JSON.stringify(v.references || [])),
          cwe: (v.cwes || []).map(String),
          desc: v.detail || v.description || id,
          sol:
            v.recommendation ||
            (an.response
              ? "Response: " + [].concat(an.response).join(", ")
              : "Upgrade the affected component."),
        }),
      );
    });
  });
  return out;
}

export function parseOpenVex(j) {
  var out = [],
    at = j.timestamp || null;
  (j.statements || []).forEach(function (s) {
    var vid =
        (s.vulnerability && (s.vulnerability.name || s.vulnerability["@id"])) ||
        s.vulnerability,
      cve = String(vid || "").toUpperCase();
    if (!/^CVE-/.test(cve)) return;
    /* one statement per product (and per subcomponent, which is where the vulnerable package usually is) */
    var prods = [];
    (s.products || []).forEach(function (pr) {
      var id =
        typeof pr === "string"
          ? pr
          : pr["@id"] ||
            (pr.identifiers && (pr.identifiers.purl || pr.identifiers.cpe23)) ||
            "";
      var subs = (pr && pr.subcomponents) || [];
      if (subs.length)
        subs.forEach(function (sc) {
          prods.push(
            typeof sc === "string"
              ? sc
              : sc["@id"] || (sc.identifiers && sc.identifiers.purl) || id,
          );
        });
      else prods.push(id);
    });
    if (!prods.length) prods.push("");
    prods.forEach(function (pid) {
      out.push({
        cve: cve,
        status: s.status,
        justification: s.justification || s.impact_statement || "",
        detail: s.status_notes || s.action_statement || "",
        product: pid,
        at: s.timestamp || at,
      });
    });
  });
  return out;
}
/* --- Qualys VM: scan-results XML (<SCAN>) and Asset Data Report (<ASSET_DATA_REPORT>) --- */

/* --- Qualys VM: scan-results XML (<SCAN>) and Asset Data Report (<ASSET_DATA_REPORT>) --- */
export var QUALYS_SEV = {
  5: "critical",
  4: "high",
  3: "medium",
  2: "low",
  1: "info",
};

export function qualysCvss(el) {
  var c = [
    "CVSS3_FINAL",
    "CVSS3_BASE",
    "CVSS_V3 > BASE",
    "CVSS_SCORE > CVSS3_BASE",
    "CVSS_FINAL",
    "CVSS_BASE",
    "CVSS_SCORE > CVSS_BASE",
  ];
  for (var i = 0; i < c.length; i++) {
    var v = num(String(txt(el, c[i])).split(/\s/)[0]);
    if (v > 0) return v;
  }
  return 0;
}

export function parseQualysScan(doc) {
  var out: any = [];
  out.scope = [];
  out.aliases = [];
  doc.querySelectorAll("IP").forEach(function (ipEl) {
    var host = ipEl.getAttribute("value");
    if (!host) return;
    out.scope.push(host);
    var nm = ipEl.getAttribute("name");
    if (nm && nm !== "No registered hostname" && nm.toLowerCase() !== host)
      out.aliases.push([nm.toLowerCase(), host]);
    /* VULNS = confirmed; PRACTICES = potential. INFOS and SERVICES are informational */
    ipEl
      .querySelectorAll("VULNS > CAT, PRACTICES > CAT")
      .forEach(function (cat) {
        var potential =
          cat.parentNode && cat.parentNode.nodeName === "PRACTICES";
        cat.querySelectorAll("VULN").forEach(function (v) {
          var qid = v.getAttribute("number"),
            sv = +v.getAttribute("severity");
          var cves = Array.prototype.map
            .call(v.querySelectorAll("CVE_ID_LIST ID, CVE_ID"), function (x) {
              return (x.textContent || "").trim();
            })
            .filter(function (x) {
              return /^CVE-/i.test(x);
            });
          out.push(
            row({
              tool: "Qualys VM",
              host: host,
              port: cat.getAttribute("port"),
              pluginId: "qid:" + qid,
              name: strip(txt(v, "TITLE")) + (potential ? " (potential)" : ""),
              sev: QUALYS_SEV[sv] || "info",
              cvss: qualysCvss(v),
              cves: cvesIn(cves.join(" ")),
              desc:
                strip(txt(v, "DIAGNOSIS") || txt(v, "THREAT")) +
                (txt(v, "RESULT")
                  ? " Result: " + strip(txt(v, "RESULT")).slice(0, 400)
                  : ""),
              sol: strip(txt(v, "SOLUTION")),
            }),
          );
        });
      });
  });
  return out;
}

export function parseQualysAssetReport(doc) {
  var out: any = [];
  out.scope = [];
  out.aliases = [];
  var gl = {};
  doc.querySelectorAll("GLOSSARY VULN_DETAILS").forEach(function (d) {
    gl[
      txt(d, "QID") || String(d.getAttribute("id") || "").replace(/^qid_/, "")
    ] = d;
  });
  doc.querySelectorAll("HOST_LIST > HOST").forEach(function (hEl) {
    var host = txt(hEl, "IP");
    if (!host) return;
    out.scope.push(host);
    var dns = (txt(hEl, "DNS") || txt(hEl, "NETBIOS")).toLowerCase();
    if (dns && dns !== host) out.aliases.push([dns, host]);
    hEl.querySelectorAll("VULN_INFO_LIST > VULN_INFO").forEach(function (vi) {
      var type = txt(vi, "TYPE");
      if (/^(info|ig)$/i.test(type) || /^information/i.test(type)) return;
      var qid = txt(vi, "QID"),
        d = gl[qid];
      if (/fixed/i.test(txt(vi, "VULN_STATUS"))) return;
      var sv = +(d ? txt(d, "SEVERITY") : 0);
      out.push(
        row({
          tool: "Qualys VM",
          host: host,
          port: txt(vi, "PORT"),
          pluginId: "qid:" + qid,
          name:
            (d ? strip(txt(d, "TITLE")) : "QID " + qid) +
            (/practice|potential/i.test(type) ? " (potential)" : ""),
          sev: QUALYS_SEV[sv] || "info",
          cvss: d ? qualysCvss(d) : 0,
          cves: d
            ? cvesIn(
                Array.prototype.map
                  .call(
                    d.querySelectorAll("CVE_ID_LIST ID, CVE_ID"),
                    function (x) {
                      return x.textContent;
                    },
                  )
                  .join(" "),
              )
            : [],
          dateHint: txt(vi, "LAST_FOUND"),
          desc: d ? strip(txt(d, "THREAT")) : "",
          sol: d ? strip(txt(d, "SOLUTION")) : "",
        }),
      );
    });
  });
  return out;
}
/* --- Rapid7 Nexpose / InsightVM XML Export 2.0 --- */

/* --- Rapid7 Nexpose / InsightVM XML Export 2.0 --- */
export function parseNexpose(doc) {
  var out: any = [];
  out.scope = [];
  out.aliases = [];
  var defs = {};
  doc
    .querySelectorAll("VulnerabilityDefinitions > vulnerability")
    .forEach(function (v) {
      defs[String(v.getAttribute("id")).toLowerCase()] = v;
    });
  doc.querySelectorAll("nodes > node").forEach(function (n) {
    var host = n.getAttribute("address");
    if (!host) return;
    out.scope.push(host);
    n.querySelectorAll("names > name").forEach(function (nm) {
      var v = (nm.textContent || "").trim().toLowerCase();
      if (v && v !== host) out.aliases.push([v, host]);
    });
    function take(test, port) {
      var st = test.getAttribute("status") || "";
      if (!/^vulnerable/.test(st)) return;
      var id = String(test.getAttribute("id")).toLowerCase(),
        d = defs[id],
        cv = d ? num(d.getAttribute("cvssScore")) : 0,
        sv = d ? +d.getAttribute("severity") : 0;
      var refs = d
        ? Array.prototype.map
            .call(
              d.querySelectorAll('references > reference[source="CVE"]'),
              function (r) {
                return r.textContent;
              },
            )
            .join(" ")
        : "";
      out.push(
        row({
          tool: "Rapid7 Nexpose",
          host: host,
          port: port,
          pluginId: "nexpose:" + id,
          name: d ? d.getAttribute("title") : id,
          sev: cv
            ? normSev("", cv)
            : sv >= 8
              ? "critical"
              : sv >= 6
                ? "high"
                : sv >= 4
                  ? "medium"
                  : "low",
          cvss: cv,
          vector:
            d && d.getAttribute("cvssVector")
              ? String(d.getAttribute("cvssVector")).replace(/^\(|\)$/g, "")
              : undefined,
          cves: cvesIn(refs),
          desc: d ? strip(txt(d, "description")) : "",
          sol: d ? strip(txt(d, "solution")) : "",
          dateHint: test.getAttribute("vulnerable-since"),
        }),
      );
    }
    n.querySelectorAll(":scope > tests > test").forEach(function (t) {
      take(t, null);
    });
    n.querySelectorAll("endpoints > endpoint").forEach(function (ep) {
      ep.querySelectorAll("test").forEach(function (t) {
        take(t, ep.getAttribute("port"));
      });
    });
  });
  return out;
}
/* --- Anchore Grype JSON --- */
/* container image without its tag or digest, so shop:2.0 → shop:2.1 is the same asset re-scanned */

/* --- Anchore Grype JSON --- */
/* container image without its tag or digest, so shop:2.0 → shop:2.1 is the same asset re-scanned */
export function imageName(s) {
  s = String(s || "");
  if (/^sha(256|512):/i.test(s)) return s;
  s = s.replace(/@sha(256|512):[a-f0-9]+$/i, "");
  if (/[\\/]package-lock|\.json$|\.lock$|\.txt$/i.test(s)) return s;
  return s
    .replace(/@sha256:[a-f0-9]+$/i, "")
    .replace(/:([\w][\w.-]{0,127})$/, function (m0, tag) {
      return /^\d+$/.test(tag) &&
        s.indexOf("/") < 0 &&
        s.split(":").length === 2 &&
        /\./.test(s.split(":")[0])
        ? m0
        : "";
    });
}

export function parseGrype(j) {
  var tgt = j.source && j.source.target,
    hostFull =
      (tgt &&
        (tgt.userInput || tgt.name || (typeof tgt === "string" ? tgt : ""))) ||
      "image",
    host =
      (j.source && j.source.type === "image") || /:/.test(hostFull)
        ? imageName(hostFull)
        : hostFull;
  return (j.matches || []).map(function (mt) {
    var v = mt.vulnerability || {},
      a = mt.artifact || {},
      c =
        (v.cvss || [])
          .concat(
            (mt.relatedVulnerabilities || []).reduce(function (t, r) {
              return t.concat(r.cvss || []);
            }, []),
          )
          .sort(function (x, y) {
            return (
              ((y.metrics && y.metrics.baseScore) || 0) -
              ((x.metrics && x.metrics.baseScore) || 0)
            );
          })[0] || {};
    var ids = [v.id]
      .concat(
        (mt.relatedVulnerabilities || []).map(function (r) {
          return r.id;
        }),
      )
      .join(" ");
    var fix =
      v.fix && v.fix.versions && v.fix.versions.length
        ? v.fix.versions.join(", ")
        : "";
    return row({
      tool: "Grype",
      host: host,
      pluginId: "grype:" + v.id + ":" + a.name,
      name: a.name + " " + a.version + " · " + (v.id || ""),
      sev: normSev(v.severity, c.metrics && c.metrics.baseScore),
      cvss: c.metrics && c.metrics.baseScore,
      vector: c.vector,
      cves: cvesIn(ids),
      desc:
        (v.description ||
          ((mt.relatedVulnerabilities || [])[0] || {}).description ||
          v.id) + (hostFull !== host ? " Image: " + hostFull + "." : ""),
      sol: fix
        ? "Upgrade " + a.name + " to " + fix + "."
        : "No fixed version yet (" +
          ((v.fix && v.fix.state) || "unknown") +
          ").",
    });
  });
}
/* --- Google OSV-Scanner JSON --- */

/* --- Google OSV-Scanner JSON --- */
export function parseOsv(j) {
  var out = [];
  (j.results || []).forEach(function (r) {
    var src = (r.source && r.source.path) || "lockfile",
      host = src.split(/[\\/]/).slice(-2).join("/");
    (r.packages || []).forEach(function (pk) {
      var p0 = pk.package || {},
        grp = {};
      (pk.groups || []).forEach(function (g) {
        (g.ids || []).forEach(function (id) {
          grp[id] = g;
        });
      });
      (pk.vulnerabilities || []).forEach(function (v) {
        var g = grp[v.id] || {},
          vec = (
            (v.severity || []).filter(function (x) {
              return /CVSS_V[34]/.test(x.type);
            })[0] || {}
          ).score;
        var maxSev = g.max_severity;
        var sc = 0;
        if (maxSev === "CRITICAL") sc = 9.5;
        else if (maxSev === "HIGH") sc = 8.0;
        else if (maxSev === "MEDIUM") sc = 5.0;
        else if (maxSev === "LOW") sc = 2.0;
        else sc = num(maxSev);
        if (!sc && vec) {
          var pvx = parseVector(vec);
          sc = pvx ? vectorScore(pvx) || 0 : 0;
        }
        var fixed = [];
        (v.affected || []).forEach(function (af) {
          (af.ranges || []).forEach(function (rg) {
            (rg.events || []).forEach(function (ev) {
              if (ev.fixed) fixed.push(ev.fixed);
            });
          });
        });
        out.push(
          row({
            tool: "OSV-Scanner",
            host: host,
            pluginId: "osv:" + v.id + ":" + p0.name,
            name: p0.name + " " + p0.version + " · " + (v.summary || v.id),
            sev: normSev((v.database_specific || {}).severity, sc),
            cvss: sc,
            vector: vec,
            cves: cvesIn([v.id].concat(v.aliases || []).join(" ")),
            cwe: cwesIn(
              JSON.stringify((v.database_specific || {}).cwe_ids || []),
            ),
            desc: v.details || v.summary || v.id,
            sol: fixed.length
              ? "Upgrade " + p0.name + " to " + uniqA(fixed).join(" or ") + "."
              : "No fixed version published.",
          }),
        );
      });
    });
  });
  return out;
}
/* --- Snyk CLI (snyk test --json), single project or an array of projects --- */

/* --- Snyk CLI (snyk test --json), single project or an array of projects --- */
export function parseSnyk(j) {
  var out = [];
  [].concat(j).forEach(function (pr) {
    var host = pr.projectName || pr.displayTargetFile || pr.path || "project",
      seen = {};
    (pr.vulnerabilities || []).forEach(function (v) {
      if (v.type === "license" || /^snyk:lic:/.test(v.id || ""))
        return; /* license policy issues aren't vulnerabilities */
      var k = v.id + ":" + v.packageName + "@" + v.version;
      if (seen[k]) return;
      seen[k] = 1; /* Snyk repeats a vuln once per dependency path */
      var ids = v.identifiers || {};
      out.push(
        row({
          tool: "Snyk",
          host: host,
          pluginId: "snyk:" + v.id + ":" + v.packageName,
          name: v.packageName + " " + v.version + " · " + (v.title || v.id),
          sev: normSev(v.severity, v.cvssScore),
          cvss: v.cvssScore,
          vector: v.CVSSv3 || undefined,
          cves: cvesIn((ids.CVE || []).join(" ")),
          cwe: ids.CWE || [],
          desc:
            strip(v.description || "").slice(0, 1200) +
            (v.from ? " Path: " + v.from.join(" › ") : ""),
          sol:
            v.fixedIn && v.fixedIn.length
              ? "Upgrade " +
                v.packageName +
                " to " +
                v.fixedIn.join(" or ") +
                "."
              : v.isUpgradable || v.isPatchable
                ? "Run snyk wizard / apply the suggested upgrade."
                : "No fix available yet.",
        }),
      );
    });
  });
  return out;
}

export function flatten(o, pre?, acc?) {
  acc = acc || {};
  Object.keys(o || {}).forEach(function (k) {
    var v = o[k],
      key = pre ? pre + "." + k : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, acc);
    else acc[key] = Array.isArray(v) ? v.join(", ") : v;
  });
  return acc;
}

/* --- dispatcher: returns { format, tool, rows } or { format:'csv-unknown', headers, data } --- */

/* --- dispatcher: returns { format, tool, rows } or { format:'csv-unknown', headers, data } --- */
export function parseScanText(name, text) {
  var r = parseScanTextRaw(name, text);
  if (r.rows) {
    var hosts = r.rows
      .map(function (x) {
        return x.host;
      })
      .concat(r.rows.scope || []);
    r.scope = Array.from(new Set(hosts.filter(Boolean)));
    var ds = (r.rows.dates || [])
      .concat(
        r.rows.map(function (x) {
          return isoDay(x.dateHint);
        }),
      )
      .concat([r.docDate])
      .filter(Boolean)
      .sort();
    r.scanDate = ds.length ? ds[ds.length - 1] : null;
    r.rows.forEach(function (x) {
      delete x.dateHint;
    });
    r.vex = (r.vex || []).concat(r.rows.vex || []);
    r.aliases = r.rows.aliases || [];
  }
  return r;
}

export function parseScanTextRaw(name, text) {
  var t = text.replace(/^﻿/, "").trim(),
    low = name.toLowerCase();
  if (t[0] === "<") {
    var doc = new DOMParser().parseFromString(t, "application/xml");
    if (doc.querySelector("parsererror"))
      throw new Error("the XML is malformed");
    var root = doc.documentElement.nodeName,
      de = doc.documentElement;
    var docDate =
      isoDay(
        de.getAttribute("exportTime") ||
          de.getAttribute("start") ||
          de.getAttribute("generated"),
      ) ||
      isoDay(txt(doc, "report > creation_time") || txt(doc, "creation_time")) ||
      isoDay(de.getAttribute("scanstart"));
    function W(o) {
      if (!o.docDate) o.docDate = docDate;
      return o;
    }
    if (/NessusClientData/i.test(root) || low.endsWith(".nessus"))
      return W({
        format: ".nessus XML",
        tool: "Tenable Nessus",
        rows: parseNessus(doc),
      });
    if (root === "issues")
      return W({
        format: "Burp XML",
        tool: "Burp Suite",
        rows: parseBurp(doc),
      });
    if (root === "OWASPZAPReport")
      return W({
        format: "ZAP XML",
        tool: "OWASP ZAP",
        rows: parseZapXml(doc),
      });
    if (root === "nmaprun")
      return W({
        format: "Nmap XML",
        tool: "Nmap",
        rows: parseNmap(doc),
      });
    if (root === "niktoscan" || doc.querySelector("niktoscan"))
      return W({
        format: "Nikto XML",
        tool: "Nikto",
        rows: parseNiktoXml(doc),
      });
    if (root === "SCAN" && doc.querySelector("IP")) {
      var qd = Array.prototype.filter.call(
        doc.querySelectorAll("HEADER > KEY"),
        function (k) {
          return k.getAttribute("value") === "DATE";
        },
      )[0];
      return W({
        format: "Qualys scan XML",
        tool: "Qualys VM",
        rows: parseQualysScan(doc),
        docDate: qd ? isoDay(qd.textContent.trim()) : null,
      });
    }
    if (root === "ASSET_DATA_REPORT")
      return W({
        format: "Qualys asset report XML",
        tool: "Qualys VM",
        rows: parseQualysAssetReport(doc),
        docDate: isoDay(txt(doc, "HEADER > GENERATION_DATETIME")),
      });
    if (/^NexposeReport$/i.test(root)) {
      var ns = doc.querySelector("scans > scan");
      return W({
        format: "Nexpose XML 2.0",
        tool: "Rapid7 Nexpose",
        rows: parseNexpose(doc),
        docDate: ns
          ? isoDay(ns.getAttribute("endTime") || ns.getAttribute("startTime"))
          : null,
      });
    }
    if (doc.querySelector("result > nvt"))
      return W({
        format: "OpenVAS XML",
        tool: "OpenVAS / Greenbone",
        rows: parseOpenVAS(doc),
      });
    throw new Error("this XML format isn't recognised (root <" + root + ">)");
  }
  if (t[0] === "{" || t[0] === "[") {
    var j = null;
    try {
      j = JSON.parse(t);
    } catch (e) {
      var lines = t.split(/\r?\n/).filter(Boolean),
        objs = [];
      try {
        lines.forEach(function (l) {
          objs.push(JSON.parse(l));
        });
      } catch (e2) {
        throw new Error("the JSON is malformed");
      }
      if (objs[0] && (objs[0]["template-id"] || objs[0].info))
        return {
          format: "Nuclei JSONL",
          tool: "Nuclei",
          rows: objs.map(parseNucleiObj),
        };
      j = objs;
    }
    if (j && j.bomFormat === "CycloneDX")
      return {
        format: "CycloneDX SBOM/VEX",
        tool: "CycloneDX",
        rows: parseCycloneDx(j),
      };
    if (
      j &&
      (/openvex/i.test(String(j["@context"] || "")) ||
        (j.statements && j["@id"]))
    )
      return {
        format: "OpenVEX",
        tool: "OpenVEX",
        rows: [],
        vex: parseOpenVex(j),
      };
    if (
      j &&
      j.runs &&
      (j.$schema || j.version) &&
      /sarif/i.test(JSON.stringify(j.$schema || "") + low + (j.version || ""))
    )
      return {
        format: "SARIF",
        tool:
          (j.runs[0] && j.runs[0].tool && j.runs[0].tool.driver.name) ||
          "SARIF",
        rows: parseSarif(j),
      };
    if (j && j.runs)
      return {
        format: "SARIF",
        tool: "SARIF",
        rows: parseSarif(j),
      };
    if (j && j.site && (j["@programName"] || j["@version"] || j.site))
      return {
        format: "ZAP JSON",
        tool: "OWASP ZAP",
        rows: parseZapJson(j),
        docDate: isoDay(j["@generated"]),
      };
    if (
      j &&
      j.matches &&
      ((j.descriptor && /grype/i.test(j.descriptor.name || "")) || j.source)
    )
      return {
        format: "Grype JSON",
        tool: "Grype",
        rows: parseGrype(j),
        docDate: isoDay(j.descriptor && j.descriptor.timestamp),
      };
    if (
      j &&
      Array.isArray(j.results) &&
      j.results.some(function (r) {
        return r.packages;
      })
    )
      return {
        format: "OSV-Scanner JSON",
        tool: "OSV-Scanner",
        rows: parseOsv(j),
      };
    if (
      [].concat(j)[0] &&
      [].concat(j)[0].vulnerabilities &&
      ([].concat(j)[0].packageManager || [].concat(j)[0].projectName) &&
      [].concat(j)[0].ok !== undefined
    )
      return {
        format: "Snyk JSON",
        tool: "Snyk",
        rows: parseSnyk(j),
      };
    if (j && j.Results && (j.ArtifactName || j.SchemaVersion))
      return {
        format: "Trivy JSON",
        tool: "Trivy",
        rows: parseTrivy(j),
        docDate: isoDay(j.CreatedAt),
      };
    if (j && j.dependencies && (j.reportSchema || j.scanInfo))
      return {
        format: "Dependency-Check JSON",
        tool: "Dependency-Check",
        rows: parseDepCheck(j),
      };
    if (j && j.vulnerabilities && j.infos)
      return {
        format: "Wapiti JSON",
        tool: "Wapiti",
        rows: parseWapiti(j),
      };
    var arr = [].concat(j);
    if (
      arr[0] &&
      (arr[0]["template-id"] || (arr[0].info && arr[0].info.severity))
    )
      return {
        format: "Nuclei JSON",
        tool: "Nuclei",
        rows: arr.map(parseNucleiObj),
      };
    if (arr[0] && arr[0].vulnerabilities && (arr[0].host || arr[0].ip))
      return {
        format: "Nikto JSON",
        tool: "Nikto",
        rows: parseNiktoJson(arr),
      };
    if (arr.length && typeof arr[0] === "object") {
      var flat = arr.map(function (o) {
        return flatten(o);
      });
      return {
        format: "Generic JSON",
        csvLike: true,
        headers: Object.keys(flat[0]),
        data: flat,
      };
    }
    throw new Error("this JSON format isn't recognised");
  }
  var res = Papa.parse(t, {
    header: true,
    skipEmptyLines: true,
    transformHeader: function (x) {
      return String(x).trim();
    },
  });
  var headers = (res.meta.fields || []).map(function (x) {
    return x.trim();
  });
  if (!headers.length || !res.data.length)
    throw new Error("no header row and data were found");
  return {
    format: "CSV",
    csvLike: true,
    headers: headers,
    data: res.data,
  };
}

export function rowsFromTable(headers, data, map, tool, scale?) {
  if (!scale && /nessus|tenable/i.test(tool || "")) scale = "0-4";
  return data
    .map(function (r) {
      function gv(k) {
        var col = map[k];
        return col ? String(r[col] == null ? "" : r[col]).trim() : "";
      }
      var name = gv("name");
      if (!name) return null;
      var host = gv("host") || "unknown-host";
      if (/^https?:/.test(host)) host = hostOf(host);
      var cvss = num(gv("cvss"));
      return row({
        tool: tool,
        name: name,
        host: host,
        port: gv("port"),
        sev:
          scale === "0-4" && /^[0-4]$/.test(gv("severity"))
            ? ["info", "low", "medium", "high", "critical"][+gv("severity")]
            : normSev(gv("severity"), cvss),
        cvss: cvss,
        vector:
          gv("vector") || (/^CVSS:/.test(gv("cvss")) ? gv("cvss") : undefined),
        cwe: cwesIn(gv("cwe") || gv("cve")),
        pluginId: gv("pluginId")
          ? (PLUGIN_NS[sourceOf(tool) as any] || tool) + ":" + gv("pluginId")
          : undefined,
        cves: gv("cve")
          .split(/[,;|]/)
          .map(function (x) {
            return x.trim();
          })
          .filter(Boolean),
        desc: gv("description"),
        sol: gv("solution"),
        url: gv("url") || undefined,
      });
    })
    .filter(Boolean);
}
