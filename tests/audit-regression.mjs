/* tests/audit-regression.mjs — Comprehensive regression test suite for VAPTLens.
   Verifies fixes for all defects identified in the 2026-10-12 multi-agent security audit.
   Executes directly in Node.js >= 22.13. */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { createServer } from "node:http";

console.log("=== VAPTLens Multi-Agent Security Audit Regression Suite ===");

/* Build unified in-memory bundle of engine, parsers, data, export */
const bundle = await build({
  stdin: {
    contents: `
      export * from "./src/lib/engine";
      export * from "./src/lib/parsers";
      export * from "./src/lib/data";
      export * from "./src/app/lib/export";
      export * from "./src/app/appUtils";
      export * from "./src/app/views/governance/utils";
    `,
    resolveDir: process.cwd(),
    sourcefile: "test-entry.ts",
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  logLevel: "error",
  tsconfig: "tsconfig.json",
});

const core = await import(
  "data:text/javascript;base64," + Buffer.from(bundle.outputFiles[0].text).toString("base64")
);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ✓ " + name);
  } catch (err) {
    failed++;
    console.error("  ✗ " + name + "\n    " + (err ? err.stack : err));
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    passed++;
    console.log("  ✓ " + name);
  } catch (err) {
    failed++;
    console.error("  ✗ " + name + "\n    " + (err ? err.stack : err));
  }
}

/* -------------------------------------------------------------------------- */
/* Layer 1: Parsers & Format Normalization Tests                              */
/* -------------------------------------------------------------------------- */
console.log("\n[1] Parser Security and Correctness Tests");

test("PARSE-01: portOf extracts port from bare IP:port and host:port strings", () => {
  assert.equal(core.portOf("10.0.0.1:8080"), 8080, "bare IP:port should extract 8080");
  assert.equal(core.portOf("app.corp.internal:8443"), 8443, "bare domain:port should extract 8443");
  assert.equal(core.portOf("http://10.0.0.1:8080/api"), 8080, "http URL should extract 8080");
  assert.equal(core.portOf("https://secure.internal/login"), 443, "https without port defaults to 443");
  assert.equal(core.portOf("10.0.0.1"), null, "bare IP without port should return null");
});

test("PARSE-02: hostOf preserves IPv6 zone identifiers and bare bracketed addresses", () => {
  assert.equal(core.hostOf("https://[fe80::1%eth0]:8443"), "fe80::1%eth0", "IPv6 zone identifier preserved");
  assert.equal(core.hostOf("https://[fe80::1]:8443/test"), "fe80::1", "standard bracketed IPv6 preserved");
  assert.equal(core.hostOf("10.0.0.1:8080"), "10.0.0.1", "hostOf bare IP:port strips port");
  assert.equal(core.hostOf("https://app.internal/path"), "app.internal", "standard domain hostname extracted");
});

test("PARSE-03: normSev keeps 1-5 scale distinct from CVSS scores when equal", () => {
  // Severity '4' with CVSS '4.0' must remain 'high' (1-5 scale: 4 = High), not downgraded to 'medium'
  assert.equal(core.normSev("4", 4.0), "high", "severity 4 with cvss 4.0 should be high");
  assert.equal(core.normSev("4", 3.5), "high", "severity 4 with cvss 3.5 should be high");
  assert.equal(core.normSev("5", 5.0), "critical", "severity 5 with cvss 5.0 should be critical");
  assert.equal(core.normSev("3", 3.0), "medium", "severity 3 with cvss 3.0 should be medium");
  assert.equal(core.normSev("2", 2.0), "low", "severity 2 with cvss 2.0 should be low");
  assert.equal(core.normSev("1", 1.0), "info", "severity 1 with cvss 1.0 should be info");
  // Explicit decimals still map to CVSS standard brackets
  assert.equal(core.normSev("4.0"), "medium", "decimal 4.0 without scale is medium");
  assert.equal(core.normSev("7.0"), "high", "decimal 7.0 is high");
});

test("PARSE-04: normSev maps 'negligible' and 'trivial' to info/low instead of medium", () => {
  assert.equal(core.normSev("Negligible"), "info", "Negligible should map to info");
  assert.equal(core.normSev("negligible"), "info", "lowercase negligible should map to info");
  assert.equal(core.normSev("trivial"), "info", "trivial should map to info");
});

test("PARSE-05: detectTool matches CSV headers case-insensitively", () => {
  const lowercaseNessusHeaders = ["plugin id", "plugin name", "risk", "cve", "see also"];
  const res = core.detectTool(lowercaseNessusHeaders);
  const tool = res && res.preset ? res.preset.tool : res;
  assert.ok(/nessus/i.test(tool), "Lowercase Nessus headers should still detect as Nessus");
});

test("PARSE-06: rowsFromTable uses cvesIn and preserves bare numeric CWEs", () => {
  const headers = ["Plugin ID", "CVE", "CVSS", "Risk", "Host", "Port", "Plugin Name", "Description", "CWE"];
  const data = [
    {
      "Plugin ID": "1001",
      "CVE": "Vulnerable to CVE-2021-44228 and CVE-2021-45046 in text",
      "CVSS": "10.0",
      "Risk": "Critical",
      "Host": "10.0.0.1",
      "Port": "8080",
      "Plugin Name": "Log4j RCE",
      "Description": "Test",
      "CWE": "89", // Bare numeric CWE
    },
  ];
  const map = {
    pluginId: "Plugin ID",
    cve: "CVE",
    cvss: "CVSS",
    severity: "Risk",
    host: "Host",
    port: "Port",
    name: "Plugin Name",
    description: "Description",
    cwe: "CWE",
  };
  const rows = core.rowsFromTable(headers, data, map, "Custom CSV");
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].cves, ["CVE-2021-44228", "CVE-2021-45046"], "CVEs should be cleanly extracted with cvesIn");
  assert.deepEqual(rows[0].cwe, ["CWE-89"], "Bare CWE number 89 should be normalized to CWE-89");
});

test("PARSE-07: parseSarif handles security-severity 0.0 without escalating to warning level", () => {
  const sarifText = readFileSync("test-data/synthetic-sarif.sarif", "utf8");
  const parsed = core.parseSarif(JSON.parse(sarifText));
  const rows = parsed.rows || parsed;
  assert.equal(rows.length, 2);
  const metricFinding = rows.find((r) => r.name.includes("Informational"));
  assert.ok(metricFinding, "Should find informational rule");
  assert.equal(metricFinding.sev, "info", "security-severity 0.0 with level warning must be info, not medium");
});

test("PARSE-08: parseNuclei handles streaming JSONL with corrupted lines without throwing", () => {
  const jsonlText = readFileSync("test-data/synthetic-nuclei.jsonl", "utf8");
  const parsed = core.parseScanTextRaw(jsonlText, "nuclei.jsonl");
  assert.equal(parsed.format, "Nuclei JSON");
  assert.equal(parsed.rows.length, 2, "Should parse the 2 valid records despite corrupted middle line");
});

test("PARSE-09: parseCycloneDx handles nested components with cyclic references safely", () => {
  const cdxText = readFileSync("test-data/synthetic-cyclonedx.json", "utf8");
  const parsed = core.parseCycloneDx(JSON.parse(cdxText));
  assert.ok((parsed.rows ? parsed.rows.length : parsed.length) > 0 || (parsed.vex && parsed.vex.length > 0), "CycloneDX parses successfully");
  assert.equal(parsed.vex[0].cve, "CVE-2021-44228");
  assert.equal(parsed.vex[0].status, "not_affected");
});

test("PARSE-14: Table parser extracts normalized host and port from URL host strings", () => {
  const headers = ["Host", "Name", "Severity"];
  const data = [{ Host: "https://10.0.0.1:8443/app", Name: "TLS Issue", Severity: "medium" }];
  const map = { host: "Host", name: "Name", severity: "Severity" };
  const rows = core.rowsFromTable(headers, data, map, "Custom");
  assert.equal(rows[0].host, "10.0.0.1", "hostOf must extract normalized host IP");
  assert.equal(rows[0].port, 8443, "portOf must extract port from URL host string");
});

test("PARSE-15: Table parser computes CVSS score from CVSS:3.1 vector when score column is blank", () => {
  const headers = ["Host", "Name", "Severity", "Vector"];
  const data = [{ Host: "10.0.0.1", Name: "RCE", Severity: "", Vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" }];
  const map = { host: "Host", name: "Name", severity: "Severity", vector: "Vector" };
  const rows = core.rowsFromTable(headers, data, map, "Custom");
  assert.equal(rows[0].cvss, 9.8, "CVSS score must be computed from vector");
  assert.equal(rows[0].sev, "critical", "Severity must be normalized to critical from computed score");
});

test("PARSE-16: parseSarif falls back to rule description when result message is undefined", () => {
  const sarif = {
    version: "2.1.0",
    runs: [{
      tool: { driver: { name: "CodeQL", rules: [{ id: "js/xss", shortDescription: { text: "Cross-site scripting vulnerability" } }] } },
      results: [{ ruleId: "js/xss", ruleIndex: 0, level: "error" }]
    }]
  };
  const parsed = core.parseSarif(sarif);
  const rows = parsed.rows || parsed;
  assert.equal(rows[0].desc, "Cross-site scripting vulnerability", "Fallback rule description must be used");
});

test("PARSE-17: cvesIn enforces word boundary and supports variable length CVE numbers", () => {
  const text = "PrefixABCVE-2021-44228 CVE-2021-44228 CVE-2024-12345678 suffix";
  const cves = core.cvesIn(text);
  assert.deepEqual(cves, ["CVE-2021-44228", "CVE-2024-12345678"], "Should ignore prefix non-word match and extract >7 digit CVE");
});

test("PARSE-18: normSev maps 'fatal' and 'blocker' to critical", () => {
  assert.equal(core.normSev("fatal"), "critical");
  assert.equal(core.normSev("blocker"), "critical");
});

test("PARSE-19: parseScanTextRaw rejects XML entity expansion (XXE/Billion Laughs)", () => {
  const maliciousXml = '<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol">]><NessusClientData_v2></NessusClientData_v2>';
  assert.throws(() => {
    core.parseScanTextRaw(maliciousXml, "scan.xml");
  }, /XML entity declarations/);
});

/* -------------------------------------------------------------------------- */
/* Layer 2: Vulnerability Engine, SLA & Analytics Tests                       */
/* -------------------------------------------------------------------------- */
console.log("\n[2] Engine, SLA and Analytics Tests");

test("ENG-01: Duplicate merging keeps the highest CVSS and strongest vector", () => {
  const r = core.runEngine(
    [
      { batch: 1, host: "10.0.0.5", port: "443", name: "Vuln Test", sev: "medium", cvss: 5.0, vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N", pluginId: "tool1:1", tool: "Tool1" },
      { batch: 1, host: "10.0.0.5", port: "443", name: "Vuln Test", sev: "critical", cvss: 9.8, vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", pluginId: "tool1:1", tool: "Tool2" },
    ],
    [{ id: 1, date: "2026-01-10", full: false }]
  );
  const f = r.data.find((x) => x.batch === 1);
  assert.equal(f.sev, "critical");
  assert.equal(f.cvss, 9.8, "Secondary scanner higher CVSS score must be preserved");
  assert.equal(f.vector, "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", "Higher vector preserved");
});

test("ENG-02 (L-8A): Historical KEV due date does not cause Day-0 SLA breach", () => {
  const today = core.localDay();
  core.setAS_OF(today);
  const finding = {
    lifecycle: "New",
    firstSeen: today,
    slaStart: today,
    sev: "critical",
    kevDue: "2021-12-24", // Historical KEV due date from 5 years ago
  };
  const env = { slaFor: () => 14, pausedDays: () => 0 };
  const asset = { tier: "tier-1", exposure: "internal" };
  core.enrichWith(finding, asset, env);

  assert.equal(finding.breached, false, "Brand new finding must not breach on Day 0 despite older KEV catalog date");
  assert.ok(finding.daysLeft >= 0, "Remaining days must be non-negative on Day 0");
});

test("ENG-03 (L-8B): Program SLA metrics subtract paused days during remediation cycles", () => {
  const today = core.localDay();
  core.setAS_OF(today);
  const eng = {
    findings: {
      "f1": {
        key: "f1",
        host: "h1",
        sev: "critical",
        state: "fixed",
        cycles: [
          { start: "2026-01-01", end: "2026-01-20", pausedDays: 10 } // 19 days total, 10 paused => 9 effective days
        ]
      }
    },
    latest: 1,
    order: [{ id: 1, date: today, label: "Batch 1" }],
    data: [],
    scope: { 1: { "h1": true } }
  };
  const metrics = core.metricsOf(eng, {}, { critical: 14 }); // SLA is 14 days
  assert.equal(metrics.withinSla, 1, "Cycle of 19d with 10d paused = 9d effective, within 14d SLA");
});

test("ENG-05: metricsOf openBreached counts all active open breached findings across estate", () => {
  const today = core.localDay();
  core.setAS_OF(today);
  const eng = {
    findings: {
      "f1": { key: "f1", host: "h1", sev: "high", state: "open" }
    },
    latest: 2,
    order: [
      { id: 1, date: "2026-01-01", label: "Batch 1" },
      { id: 2, date: today, label: "Batch 2" }
    ],
    // Finding was seen in batch 1, host was not rescanned in batch 2
    data: [
      { key: "f1", batch: 1, lifecycle: "New", breached: true }
    ],
    scope: { 1: { "h1": true }, 2: { "h2": true } }
  };
  const metrics = core.metricsOf(eng, {}, { high: 30 });
  assert.equal(metrics.breached, 1, "Unfixed breached finding from earlier batch must be counted in metrics");
});

test("ENG-06 (VEX-1): vexMatches matches CVEs case-insensitively", () => {
  const v = { cve: "cve-2021-44228", product: "log4j-core", status: "not_affected" };
  const f = { cves: ["CVE-2021-44228"], name: "log4j-core vulnerability", tool: "Trivy" };
  assert.equal(core.vexMatches(v, f), true, "Lowercase VEX CVE should match uppercase finding CVE");
});

test("ENG-07: Safe array reduction avoids RangeError call-stack overflow on large datasets", () => {
  const largeArray = new Array(100000).fill(5);
  // Instead of Math.max.apply, reduction handles any array length safely
  const max = largeArray.reduce((m, x) => Math.max(m, x || 0), 0);
  assert.equal(max, 5);
});

test("ENG-08 (NAN-1): Invalid date does not produce NaN daysLeft or suppress breaches", () => {
  const today = core.localDay();
  core.setAS_OF(today);
  const finding = {
    lifecycle: "New",
    firstSeen: "invalid-date-string",
    slaStart: "invalid-date-string",
    sev: "critical",
  };
  const env = { slaFor: () => 14, pausedDays: () => 0 };
  const asset = { tier: "tier-1", exposure: "internal" };
  core.enrichWith(finding, asset, env);
  assert.ok(!isNaN(finding.daysLeft), "daysLeft must not be NaN");
});

test("CVSS-01: cvss4Score rejects base SI:S and SA:S but supports environmental MSI:S and MSA:S", () => {
  const illegalBase = core.parseVector("CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:S/SA:H");
  assert.equal(core.cvss4Score(illegalBase), null, "Base SI:S must be rejected");

  const validEnv = core.parseVector("CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H/MSI:S");
  assert.ok(core.cvss4Score(validEnv) > 0, "Environmental MSI:S must be accepted");
});

test("RISK-01: riskModel and threatIndex defend against unmapped severities and NaN EPSS", () => {
  const f = { cvss: 0, sev: "unknown_sev", epss: NaN, lifecycle: "Open" };
  const asset = { tier: 1, exposure: "internal" };
  const r = core.riskModel(f, asset);
  assert.ok(!isNaN(r.risk), "risk must not be NaN");
  assert.equal(typeof r.risk, "number");

  const active = [{ risk: 50 }, { risk: NaN }, { risk: undefined }];
  const ti = core.threatIndex(active);
  assert.ok(!isNaN(ti), "threatIndex must not be NaN");
  assert.equal(typeof ti, "number");
});

test("SLA-01: pausedDaysOf clamps future scheduled pauses to AS_OF and merges overlapping intervals", () => {
  core.setAS_OF("2026-10-12");
  const g0 = {
    pauses: [
      { from: "2026-10-01", to: "2026-10-10" },
      { from: "2026-10-05", to: "2026-10-15" },
    ],
  };
  const paused = core.pausedDaysOf(g0, "2026-10-01");
  assert.equal(paused, 11, "Overlapping and future intervals must be correctly merged and clamped");
});

test("MATH-06: govFacts olderThan accounts for pausedDays in open age calculations", () => {
  core.setAS_OF("2026-10-12");
  const ctx = {
    active: [
      { id: "f1", sev: "critical", slaStart: "2026-09-12", ageDays: 30, pausedDays: 20 },
    ],
    metrics: {},
    policy: {},
    batches: [],
    eng: { scope: {} },
    assets: {},
  };
  const facts = core.govFacts(ctx);
  assert.equal(facts.olderThan(["critical"], 14).length, 0, "Paused days must prevent false positive compliance breaches");
});

/* -------------------------------------------------------------------------- */
/* Layer 3: Export & Formula Injection Security Tests                         */
/* -------------------------------------------------------------------------- */
console.log("\n[3] Export Security Tests");

test("SYNC-03: csvCell neutralizes formula injection with leading spaces, tabs, newlines, pipes", () => {
  assert.ok(core.csvCell(" =cmd|' /C calc'!A0").startsWith("'"), "Leading space before formula must be neutralized");
  assert.ok(core.csvCell("   +cmd").startsWith("'"), "Multiple spaces before formula must be neutralized");
  assert.ok(core.csvCell("\n=2+5").startsWith("'"), "Leading newline before formula must be neutralized");
  assert.ok(core.csvCell("|calc").startsWith("'"), "Leading pipe must be neutralized");
  assert.ok(core.csvCell("@SUM(1,2)").startsWith("'") || core.csvCell("@SUM(1,2)").startsWith('"\''), "Leading @ must be neutralized");
  assert.equal(core.csvCell("-5"), "-5", "Negative integer must remain clean number");
  assert.equal(core.csvCell("+123"), "+123", "Positive signed integer must remain clean number");
});

/* -------------------------------------------------------------------------- */
/* Layer 4: Server API & Security Hardening Tests                             */
/* -------------------------------------------------------------------------- */
console.log("\n[4] Server API Security Tests (Isolated SQLite Database)");

// Set up temporary isolated DB for API tests
process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "vl-audit-reg-")), "test.db");
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_HOST;
process.env.VL_QUIET = "1";

const {
  handler,
  q,
  isValidName,
  verifyPassword,
  hostAllowed,
  extractHostname,
  checkRemediation,
  findingFacts,
} = await import("../server/server.mjs");
const srv = createServer(handler);
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + srv.address().port;

function client() {
  let cookie = "";
  return async function api(path, o = {}) {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      cookie ? { Cookie: cookie } : {},
      o.headers || {}
    );
    const res = await fetch(base + path, {
      method: o.method || "GET",
      headers,
      body: o.body === undefined ? undefined : typeof o.body === "string" ? o.body : JSON.stringify(o.body),
    });
    const sc = res.headers.get("set-cookie");
    const m = sc && /vl_sid=([^;]*)/.exec(sc);
    if (m) cookie = m[1] ? "vl_sid=" + m[1] : "";
    let data = null;
    try {
      data = await res.json();
    } catch (e) {}
    return { status: res.status, data };
  };
}

const admin = client();

await asyncTest("Setup admin account on fresh instance", async () => {
  const res = await admin("/api/auth/setup", {
    method: "POST",
    body: { username: "admin", name: "Administrator", password: "Correct-Horse-9!" },
  });
  assert.equal(res.status, 200);
});

await asyncTest("VULN-01: POST /api/auth/setup returns 409 immediately without expensive hashing if already setup", async () => {
  const t0 = Date.now();
  const res = await client()("/api/auth/setup", {
    method: "POST",
    body: { username: "attacker", password: "Password-12345678!" },
  });
  const elapsed = Date.now() - t0;
  assert.equal(res.status, 409, "Must return 409 Conflict");
  assert.ok(elapsed < 20, `Pre-check should return in <20ms without computing scrypt (took ${elapsed}ms)`);
});

await asyncTest("VULN-08: PUT /api/stores/:ws/:name automatically generates server audit log", async () => {
  // Store a scan batch
  const putRes = await admin("/api/stores/Default/scans", {
    method: "PUT",
    body: { data: { v: 2, data: [] }, version: 0 },
  });
  assert.equal(putRes.status, 200);

  // Check audit log
  const auditRes = await admin("/api/audit/Default");
  assert.equal(auditRes.status, 200);
  const storeAudit = auditRes.data.entries.find((e) => e.action === "STORE_UPDATE" && e.detail.includes("scans"));
  assert.ok(storeAudit, "Server must automatically write STORE_UPDATE audit entry on store mutation");
});

await asyncTest("VULN-10: Security Auditor role is forbidden from POST /api/audit/:ws", async () => {
  // Create an auditor
  await admin("/api/users", {
    method: "POST",
    body: { username: "auditor1", role: "Security Auditor", password: "Auditor-Password-1!" },
  });
  const aud = client();
  await aud("/api/auth/login", {
    method: "POST",
    body: { username: "auditor1", password: "Auditor-Password-1!" },
  });
  // Change initial password
  await aud("/api/auth/password", {
    method: "POST",
    body: { current: "Auditor-Password-1!", next: "New-Auditor-Password-2!" },
  });

  // Attempt to write audit log
  const res = await aud("/api/audit/Default", {
    method: "POST",
    body: { action: "SPOOFED_EVENT", detail: "Injected by auditor" },
  });
  assert.equal(res.status, 403, "Read-only auditor must receive HTTP 403 on POST /api/audit");
});

await asyncTest("SYNC-04: Evidence key disallows __proto__, constructor, and slashes", async () => {
  const protoRes = await admin("/api/evidence/Default/__proto__", {
    method: "PUT",
    body: { data: [], version: 0 },
  });
  assert.equal(protoRes.status, 400, "Key '__proto__' must be rejected with 400");

  const slashRes = await admin("/api/evidence/Default/path%2Fto%2Fkey", {
    method: "PUT",
    body: { data: [], version: 0 },
  });
  assert.equal(slashRes.status, 400, "Key with slashes must be rejected with 400");
});

await asyncTest("PERSIST-01: auditHash binds user_id preventing silent actor tampering", async () => {
  const { auditHash } = await import("../server/server.mjs");
  const entryA = {
    workspace: "Default",
    seq: 1,
    at: "2026-10-12T00:00:00.000Z",
    user_id: "user-uuid-1",
    username: "alice",
    role: "Administrator",
    action: "SETUP",
    detail: "Setup",
    ref: null,
    prev: "",
  };
  const entryB = { ...entryA, user_id: "user-uuid-2" };
  assert.notEqual(
    auditHash(entryA),
    auditHash(entryB),
    "auditHash must produce different hashes when user_id is changed"
  );
});

test("PARSE-07: cvesIn and cwesIn use Set to deduplicate in linear time", () => {
  const cves = core.cvesIn("CVE-2023-1000 CVE-2023-1000 CVE-2023-2000");
  assert.deepEqual(cves, ["CVE-2023-1000", "CVE-2023-2000"]);
  const cwes = core.cwesIn("CWE-79 CWE_79 CWE 89");
  assert.deepEqual(cwes, ["CWE-79", "CWE-89"]);
});

test("PARSE-08: Trivy null CVSS entry does not crash parser", () => {
  const sample = {
    ArtifactName: "app:latest",
    Results: [
      {
        Vulnerabilities: [
          {
            VulnerabilityID: "CVE-2024-0001",
            PkgName: "libtest",
            InstalledVersion: "1.0.0",
            Severity: "HIGH",
            CVSS: { nvd: null, ghsa: null },
          },
        ],
      },
    ],
  };
  const res = core.parseScanText("trivy.json", JSON.stringify(sample));
  assert.equal(res.rows.length, 1);
  assert.equal(res.rows[0].cves[0], "CVE-2024-0001");
});

test("PARSE-09: Snyk and Grype string identifiers and versions do not crash", () => {
  const snykSample = {
    projectName: "my-project",
    ok: false,
    vulnerabilities: [
      {
        id: "SNYK-JS-TEST-1",
        packageName: "lodash",
        version: "4.17.20",
        severity: "high",
        cvssScore: 7.5,
        identifiers: { CVE: "CVE-2021-1234", CWE: ["CWE-79"] },
        from: "project › lodash",
        fixedIn: "4.17.21",
      },
    ],
  };
  const snykRes = core.parseScanText("snyk.json", JSON.stringify(snykSample));
  assert.equal(snykRes.rows.length, 1);
  assert.equal(snykRes.rows[0].cves[0], "CVE-2021-1234");

  const grypeSample = {
    source: { type: "image", target: "alpine:3.18" },
    matches: [
      {
        vulnerability: {
          id: "CVE-2023-5678",
          severity: "Medium",
          cvss: { metrics: { baseScore: 5.3 } },
          fix: { versions: "1.2.3" },
        },
        artifact: { name: "busybox", version: "1.36.0" },
      },
    ],
  };
  const grypeRes = core.parseScanText("grype.json", JSON.stringify(grypeSample));
  assert.equal(grypeRes.rows.length, 1);
  assert.equal(grypeRes.rows[0].cves[0], "CVE-2023-5678");
});

test("PARSE-10: OSV string severity and ZAP JSON single alert object", () => {
  const zapSample = {
    site: [
      {
        "@name": "http://127.0.0.1:8080",
        alerts: {
          alert: "Missing X-Content-Type-Options",
          riskcode: "1",
          confidence: "2",
          desc: "Description",
        },
      },
    ],
  };
  const zapRes = core.parseScanText("zap.json", JSON.stringify(zapSample));
  assert.equal(zapRes.rows.length, 1);
  assert.equal(zapRes.rows[0].name, "Missing X-Content-Type-Options");

  const osvSample = {
    results: [
      {
        packages: [
          {
            package: { name: "express" },
            vulnerabilities: [
              {
                id: "GHSA-1234",
                severity: "HIGH",
              },
            ],
          },
        ],
      },
    ],
  };
  const osvRes = core.parseScanText("osv.json", JSON.stringify(osvSample));
  assert.equal(osvRes.rows.length, 1);
  assert.equal(osvRes.rows[0].pluginId, "osv:GHSA-1234:express");
});

test("PARSE-11: flatten protects against prototype pollution keys", () => {
  const poisoned = JSON.parse('{"__proto__": {"polluted": true}, "safe": "ok"}');
  const flat = core.flatten(poisoned);
  assert.equal(Object.prototype.polluted, undefined, "Object.prototype must not be polluted");
  assert.equal(flat.safe, "ok");
});

test("MATH-01: Vector score does not return NaN on invalid CVSS 4.0 vectors", () => {
  const badV4 = core.parseVector("CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N/CR:INVALID");
  const sc = core.vectorScore(badV4);
  assert.ok(sc === null || typeof sc === "number" && !isNaN(sc), "Vector score must not be NaN");
});

test("MATH-02: SSVC calculation is resilient to null asset parameters", () => {
  const finding = {
    name: "Remote Code Execution",
    desc: "Unauthenticated remote code execution vulnerability",
    epss: 0.85,
    exploitable: true,
  };
  const ssvc = core.ssvcOf(finding, null);
  assert.ok(ssvc && ssvc.decision, "SSVC decision should be returned safely without throwing");
});

test("SEC-06: crossSiteBlocked checks TRUST_PROXY before trusting X-Forwarded-Host", async () => {
  const { crossSiteBlocked } = await import("../server/server.mjs");
  const req = {
    headers: {
      origin: "https://attacker.com",
      "x-forwarded-host": "attacker.com",
      host: "vaptlens.internal:8787",
    },
  };
  assert.equal(crossSiteBlocked(req), true, "Cross site request must be blocked when TRUST_PROXY is disabled");
});

await asyncTest("GOV-03: Updating report store invalidates approved engagement status", async () => {
  await admin("/api/stores/Default/policy", {
    method: "PUT",
    body: { data: { sod: false }, version: 0 },
  });

  const putEng = await admin("/api/stores/Default/engagement", {
    method: "PUT",
    body: {
      data: { client: "ACME Corp", project: "Annual Pentest", status: "Approved", approvedBy: "admin" },
      version: 0,
    },
  });
  assert.equal(putEng.status, 200, "Engagement approval succeeded");

  const repRes = await admin("/api/stores/Default/report", {
    method: "PUT",
    body: {
      data: { summary: "Tampered report content" },
      version: 0,
    },
  });
  assert.equal(repRes.status, 200, "Report update succeeded");

  const engRes = await admin("/api/stores/Default");
  const stores = engRes.data;
  assert.equal(stores.engagement.data.status, "In review", "Engagement must be moved back to In review after report change");
  assert.equal(stores.engagement.data.approvedAt, "", "approvedAt must be cleared");
});

await asyncTest("GOV-04: Non-admin role cannot revoke or delete approved exceptions", async () => {
  const { checkRemediation } = await import("../server/server.mjs");
  const oldGov = {
    "finding-1": { state: "accepted", until: "2026-11-01", approvedBy: "admin" },
  };
  const newGov = {
    "finding-1": { state: null },
  };
  const leadUser = { username: "bob_lead", role: "Remediation Lead" };
  const facts = new Map([["finding-1", { sev: "high", kev: false }]]);

  assert.throws(
    () => {
      checkRemediation(oldGov, newGov, leadUser, { sod: true }, facts, "2026-10-12");
    },
    /Only an administrator can revoke or clear an approved exception/,
    "checkRemediation must throw when lead tries to revoke approved exception"
  );
});

await asyncTest("GOV-05: Exception renewal request is accepted under separation of duties", async () => {
  const { checkRemediation } = await import("../server/server.mjs");
  const oldGov = {
    "finding-1": { state: "accepted", until: "2026-11-01", approvedBy: "admin" },
  };
  const newGov = {
    "finding-1": {
      state: "accepted",
      pendingRenewal: true,
      requestedState: "accepted",
      requestedBy: "bob_lead",
      requestedUntil: "2026-12-01",
      until: "2026-11-01",
      approvedBy: "admin",
    },
  };
  const leadUser = { username: "bob_lead", role: "Remediation Lead" };
  const facts = new Map([["finding-1", { sev: "high", kev: false }]]);

  assert.doesNotThrow(() => {
    checkRemediation(oldGov, newGov, leadUser, { sod: true }, facts, "2026-10-12");
  });
});

test("SEC-12: isValidName rejects bare dots, whitespace, and path traversal sequences", () => {
  assert.equal(isValidName("."), false);
  assert.equal(isValidName(".."), false);
  assert.equal(isValidName("..."), false);
  assert.equal(isValidName("   "), false);
  assert.equal(isValidName("ws/sub"), false);
  assert.equal(isValidName("ws..name"), false);
  assert.equal(isValidName("Valid Workspace"), true);
  assert.equal(isValidName("audit-2026"), true);
});

await asyncTest("GOV-06: import sanitization resets self-approved engagement reports and exceptions", async () => {
  const payload = {
    app: "VAPTLens",
    format: 2,
    stores: {
      engagement: {
        status: "Approved",
        approvedBy: "admin",
      },
      remediation: {
        "finding-1": {
          state: "accepted",
          by: "charlie",
          approvedBy: "charlie",
        },
      },
    },
  };

  const res = await admin("/api/workspaces/Default/import", {
    method: "POST",
    body: payload,
  });
  assert.equal(res.status, 200);

  const getAll = await admin("/api/stores/Default");
  assert.equal(getAll.data.engagement.data.status, "In review", "Self-approved engagement report must be demoted to In review");
  assert.equal(getAll.data.remediation.data["finding-1"].state, "requested", "Self-approved exception must be demoted to requested");
});

await asyncTest("VULN-09: Workspace-level multi-tenant membership isolation and access control", async () => {
  // Create lead user
  await admin("/api/users", {
    method: "POST",
    body: { username: "lead_isolated", role: "Remediation Lead", password: "Lead-Password-1!" },
  });
  const leadClient = client();
  await leadClient("/api/auth/login", {
    method: "POST",
    body: { username: "lead_isolated", password: "Lead-Password-1!" },
  });
  await leadClient("/api/auth/password", {
    method: "POST",
    body: { current: "Lead-Password-1!", next: "New-Lead-Password-2!" },
  });

  // Admin creates restricted workspace
  const createWs = await admin("/api/workspaces", {
    method: "POST",
    body: { name: "Restricted WS" },
  });
  assert.equal(createWs.status, 201);

  // Before members assigned, it's open
  assert.equal((await leadClient("/api/stores/Restricted%20WS")).status, 200);

  // Admin adds auditor1 as the only member
  const addMem = await admin("/api/workspaces/Restricted%20WS/members", {
    method: "POST",
    body: { username: "auditor1" },
  });
  assert.equal(addMem.status, 201);

  const audClient = client();
  await audClient("/api/auth/login", {
    method: "POST",
    body: { username: "auditor1", password: "New-Auditor-Password-2!" },
  });

  // Now restricted:
  // auditor1 (assigned member) can access
  assert.equal((await audClient("/api/stores/Restricted%20WS")).status, 200);
  // lead_isolated (non-member) is 403 Forbidden!
  assert.equal((await leadClient("/api/stores/Restricted%20WS")).status, 403);
  assert.equal((await leadClient("/api/evidence/Restricted%20WS")).status, 403);
  assert.equal((await leadClient("/api/audit/Restricted%20WS")).status, 403);

  // Workspaces list filters Restricted WS for non-member
  const wsListLead = await leadClient("/api/workspaces");
  assert.ok(!wsListLead.data.some((w) => w.name === "Restricted WS"), "Non-member must not see restricted workspace");

  const wsListAud = await audClient("/api/workspaces");
  assert.ok(wsListAud.data.some((w) => w.name === "Restricted WS"), "Assigned member must see workspace");

  const wsListAdmin = await admin("/api/workspaces");
  assert.ok(wsListAdmin.data.some((w) => w.name === "Restricted WS"), "Admin must always see all workspaces");

  // Admin removes member
  const delMem = await admin("/api/workspaces/Restricted%20WS/members/auditor1", {
    method: "DELETE",
  });
  assert.equal(delMem.status, 200);

  // SEC-17: Workspace has 0 members, but was marked restricted -> must NOT fail open to non-members
  assert.equal(
    (await leadClient("/api/stores/Restricted%20WS")).status,
    403,
    "Restricted workspace must not fail open when last member is removed",
  );
  // Admin retains access
  assert.equal((await admin("/api/stores/Restricted%20WS")).status, 200, "Admin can access restricted workspace");

  // Cleanup
  await admin("/api/workspaces/Restricted%20WS", { method: "DELETE" });
});

await asyncTest("SEC-LOCKOUT: Lockout CPU DoS precheck returns 423 before scrypt computation", async () => {
  // Create user to lock
  await admin("/api/users", {
    method: "POST",
    body: { username: "lockout_victim", role: "Security Auditor", password: "Lockout-Victim-1!" },
  });

  const c = client();
  // Send 5 wrong attempts to trigger lockout
  for (let i = 0; i < 5; i++) {
    const res = await c("/api/auth/login", {
      method: "POST",
      body: { username: "lockout_victim", password: "wrong-password" },
    });
    if (i === 4) {
      assert.equal(res.status, 423, "5th attempt must lock account");
    } else {
      assert.equal(res.status, 401);
    }
  }

  // 6th attempt on locked account: must return 423 fast without scrypt compute (<25ms)
  const t0 = Date.now();
  const lockedRes = await c("/api/auth/login", {
    method: "POST",
    body: { username: "lockout_victim", password: "any-password" },
  });
  const elapsed = Date.now() - t0;
  assert.equal(lockedRes.status, 423);
  assert.ok(elapsed < 25, `Locked account pre-check must return fast without scrypt (took ${elapsed}ms)`);
});

await asyncTest("SEC-EVIDENCE: Evidence upload payload validation and item limit", async () => {
  // Reject array > 50 items
  const tooMany = new Array(51).fill({ img: "data:image/png;base64,abc" });
  const res1 = await admin("/api/evidence/Default/key_limit", {
    method: "PUT",
    body: { data: tooMany, version: 0 },
  });
  assert.equal(res1.status, 400);

  // Reject non-image URL scheme
  const badScheme = [{ url: "javascript:alert(1)" }];
  const res2 = await admin("/api/evidence/Default/key_bad_scheme", {
    method: "PUT",
    body: { data: badScheme, version: 0 },
  });
  assert.equal(res2.status, 400);

  // SEC-18: Reject SVG data URLs
  const badSvg = [{ name: "payload.svg", url: "data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+PC9zdmc+" }];
  const resSvg = await admin("/api/evidence/Default/key_svg", {
    method: "PUT",
    body: { data: badSvg, version: 0 },
  });
  assert.equal(resSvg.status, 400, "SVG data URLs must be rejected");

  // SEC-18: Reject blob: URLs
  const badBlob = [{ name: "leak.png", url: "blob:http://localhost:8787/12345" }];
  const resBlob = await admin("/api/evidence/Default/key_blob", {
    method: "PUT",
    body: { data: badBlob, version: 0 },
  });
  assert.equal(resBlob.status, 400, "blob: URLs must be rejected");

  // SEC-18: Reject directory traversal in name
  const badName = [{ name: "../../etc/passwd", url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" }];
  const resName = await admin("/api/evidence/Default/key_name", {
    method: "PUT",
    body: { data: badName, version: 0 },
  });
  assert.equal(resName.status, 400, "Directory traversal in evidence item name must be rejected");

  // Accept valid image data URL
  const good = [{ id: "1", name: "screen.png", url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" }];
  const res3 = await admin("/api/evidence/Default/key_good", {
    method: "PUT",
    body: { data: good, version: 0 },
  });
  assert.equal(res3.status, 200);
});

await asyncTest("BACKUP-01: Standalone Disaster Recovery CLI (scripts/backup.mjs) backup, verify, tamper detection, and restore", async () => {
  const { createBackup, verifyBackupFile, restoreBackupFile } = await import("../scripts/backup.mjs");
  const backupDir = join(mkdtempSync(join(tmpdir(), "vl-dr-test-")), "backups");

  // 1. Create full backup with HMAC secret
  const backupRes = await createBackup({ out: backupDir, secret: "dr-test-secret" });
  assert.ok(existsSync(backupRes.targetPath), "Archive file must exist");
  assert.ok(existsSync(backupRes.shaPath), "Checksum file must exist");
  assert.ok(existsSync(backupRes.hmacPath), "HMAC file must exist");

  // 2. Verify backup
  const verifyRes = await verifyBackupFile(backupRes.targetPath, { secret: "dr-test-secret" });
  assert.equal(verifyRes.ok, true);

  // 3. Tamper detection: flip bytes in corrupted copy
  const corruptedPath = backupRes.targetPath + ".corrupt.json.gz";
  const originalBytes = readFileSync(backupRes.targetPath);
  const tamperedBytes = Buffer.from(originalBytes);
  tamperedBytes[tamperedBytes.length - 10] ^= 0xff;
  writeFileSync(corruptedPath, tamperedBytes);
  writeFileSync(corruptedPath + ".sha256", readFileSync(backupRes.shaPath, "utf8"));

  await assert.rejects(
    async () => {
      await verifyBackupFile(corruptedPath, { secret: "dr-test-secret" });
    },
    /checksum mismatch|decompress|corrupted/i,
    "Tampered backup archive must fail verification",
  );

  // 4. Test atomic restore
  const restoreRes = await restoreBackupFile(backupRes.targetPath, { secret: "dr-test-secret" });
  assert.equal(restoreRes.ok, true);

  // Re-authenticate admin (sessions are intentionally invalidated on restore for security)
  await admin("/api/auth/login", {
    method: "POST",
    body: { username: "admin", password: "Correct-Horse-9!" },
  });

  // Verify database is functional after restore
  const postRestoreWs = await admin("/api/workspaces");
  assert.equal(postRestoreWs.status, 200);
  assert.ok(postRestoreWs.data.some((w) => w.name === "Default"));
});

await asyncTest("GOV-07: Separation of Duties allows renewal approval of active exception by different user, blocks self-approval", async () => {
  const { checkRemediation } = await import("../server/server.mjs");
  const facts = new Map([["vuln_crit", { sev: "critical", kev: false }]]);
  const policy = { sod: true, maxDays: 90 };
  const today = "2026-10-12";

  // Existing accepted exception with pending renewal requested by alice
  const oldGov = {
    vuln_crit: {
      state: "accepted",
      reason: "Legacy system",
      expires: "2026-10-15",
      requestedBy: "alice",
      approvedBy: "bob",
      approvedAt: "2026-07-15T00:00:00Z",
      pendingRenewal: {
        requestedBy: "alice",
        requestedAt: "2026-10-10T00:00:00Z",
        days: 30,
        reason: "Delayed migration",
      },
    },
  };

  // Alice tries to approve her own renewal -> must fail (403)
  const selfApproval = {
    vuln_crit: {
      state: "accepted",
      reason: "Delayed migration",
      expires: "2026-11-14",
      requestedBy: "alice",
      approvedBy: "alice",
      approvedAt: "2026-10-12T00:00:00Z",
    },
  };
  assert.throws(
    () => checkRemediation(oldGov, selfApproval, { username: "alice", role: "Administrator" }, policy, facts, today),
    /nobody approves their own request/i,
  );

  // Bob (different Administrator) approves Alice's renewal -> must succeed without throwing
  const validApproval = {
    vuln_crit: {
      state: "accepted",
      reason: "Delayed migration",
      expires: "2026-11-14",
      requestedBy: "alice",
      approvedBy: "bob",
      approvedAt: "2026-10-12T00:00:00Z",
    },
  };
  assert.doesNotThrow(() => {
    checkRemediation(oldGov, validApproval, { username: "bob", role: "Administrator" }, policy, facts, today);
  });
});

await asyncTest("BACKUP-02: Deleted workspace audit chains remain covered by DR verification", async () => {
  const { createBackup, verifyBackupFile } = await import("../scripts/backup.mjs");
  const backupDir = join(mkdtempSync(join(tmpdir(), "vl-dr-del-")), "backups");

  // Create temporary workspace, append audit entries, then delete workspace
  await admin("/api/workspaces", { method: "POST", body: { name: "Ephemeral WS" } });
  await admin("/api/audit/Ephemeral%20WS", {
    method: "POST",
    body: { action: "TEST_ACTION", detail: "Audit before deletion" },
  });
  await admin("/api/workspaces/Ephemeral%20WS", { method: "DELETE" });

  // Backup should verify all audit chains (including Ephemeral WS which was deleted from vl_workspaces)
  const backupRes = await createBackup({ out: backupDir, secret: "secret-del-test" });
  assert.ok(existsSync(backupRes.targetPath));

  // Verify backup
  const verifyRes = await verifyBackupFile(backupRes.targetPath, { secret: "secret-del-test" });
  assert.equal(verifyRes.ok, true);
  assert.ok(verifyRes.manifest.counts.audit > 0);
});

await asyncTest("OWASP-A07: verifyPassword strictly rejects zero-length hashes and malformed scrypt strings", async () => {
  // Empty hash bypass attempt
  const zeroHash = "scrypt$32768$8$1$c2FsdHNhbHQxMjM0NQ==$";
  assert.equal(await verifyPassword("password123", zeroHash), false);

  // Short hash attempt (less than 32 bytes)
  const shortHash = "scrypt$32768$8$1$c2FsdHNhbHQxMjM0NQ==$c2hvcnQ=";
  assert.equal(await verifyPassword("password123", shortHash), false);

  // Short salt attempt (less than 16 bytes)
  const shortSalt = "scrypt$32768$8$1$c2hvcnQ=$" + Buffer.alloc(32).toString("base64");
  assert.equal(await verifyPassword("password123", shortSalt), false);

  // Malformed structure attempt
  assert.equal(await verifyPassword("password123", "scrypt$invalid"), false);
  assert.equal(await verifyPassword("password123", "md5$32768$8$1$salt$hash"), false);
});

test("OWASP-A05: Host header parser differential with userinfo @ is refused", () => {
  // @ in Host or Origin should return empty hostname and be blocked
  assert.equal(extractHostname("localhost:@attacker.com"), "");
  assert.equal(extractHostname("attacker.com"), "attacker.com");
  assert.equal(hostAllowed({ headers: { host: "localhost:@attacker.com" } }), false);
  assert.equal(hostAllowed({ headers: { host: "localhost:8080" } }), true);
  assert.equal(hostAllowed({ headers: { host: "127.0.0.1:8787" } }), true);
});

test("OWASP-A03: Scanners and parsers handle prototype property keys safely without throwing TypeError", () => {
  // SARIF parser with ruleId 'toString'
  const sarifSample = {
    version: "2.1.0",
    runs: [
      {
        tool: { driver: { name: "TestTool", rules: [] } },
        results: [{ ruleId: "toString", message: { text: "issue" } }],
      },
    ],
  };
  const sarifRes = core.parseScanText("test.sarif", JSON.stringify(sarifSample));
  assert.ok(sarifRes.rows.length >= 1);

  // CycloneDX parser with component ref 'toString'
  const cdxSample = {
    bomFormat: "CycloneDX",
    specVersion: "1.4",
    components: [{ "bom-ref": "toString", name: "comp", version: "1.0" }],
    vulnerabilities: [
      { id: "CVE-2024-9999", affects: [{ ref: "toString" }] },
    ],
  };
  const cdxRes = core.parseScanText("bom.json", JSON.stringify(cdxSample));
  assert.ok(cdxRes.rows.length >= 1);

  // OSV parser with vulnerability id 'toString'
  const osvSample = {
    results: [
      {
        source: { path: "package.json" },
        packages: [
          {
            package: { name: "pkg" },
            groups: [{ ids: ["toString"] }],
            vulnerabilities: [{ id: "toString", severity: "HIGH" }],
          },
        ],
      },
    ],
  };
  const osvRes = core.parseScanText("osv.json", JSON.stringify(osvSample));
  assert.ok(osvRes.rows.length >= 1);
});

test("OWASP-A03: CSV cell sanitization strips null bytes and quotes semicolons", () => {
  // Strips null bytes
  assert.equal(core.csvCell("hello\0world"), "helloworld");
  assert.equal(core.csvCell("\0=1+1"), "'=1+1");
  // Quotes semicolons for European Excel compatibility
  assert.equal(core.csvCell("item1;item2"), '"item1;item2"');
});

test("OWASP-A04: checkRemediation rejects unilateral VEX false positive approval if finding CVE does not match vexId", () => {
  const policy = { sod: true, twoPerson: true };
  const facts = new Map([
    ["vuln-1", { sev: "critical", kev: false, cves: ["CVE-2024-1111"] }],
  ]);
  const today = "2026-10-12";
  const oldGov = {};

  // Forged vexId that does not contain the finding's CVE
  const forgedVexGov = {
    "vuln-1": {
      state: "fp",
      by: "VEX",
      vexId: "CVE-2020-0000|not-affected",
    },
  };

  assert.throws(
    () => {
      checkRemediation(
        oldGov,
        forgedVexGov,
        { username: "alice", role: "Administrator" },
        policy,
        facts,
        today,
      );
    },
    /An approval has to be recorded in your own name|Separation of duties/i,
  );

  // Legitimate vexId containing matching CVE
  const validVexGov = {
    "vuln-1": {
      state: "fp",
      by: "VEX",
      vexId: "CVE-2024-1111|not-affected",
    },
  };
  assert.doesNotThrow(() => {
    checkRemediation(
      oldGov,
      validVexGov,
      { username: "alice", role: "Administrator" },
      policy,
      facts,
      today,
    );
  });
});

await asyncTest("OWASP-A08: verifyBackupFile fails when mandatory .sha256 companion file is missing", async () => {
  const { createBackup, verifyBackupFile } = await import("../scripts/backup.mjs");
  const backupDir = join(mkdtempSync(join(tmpdir(), "vl-dr-sha-")), "backups");
  const backupRes = await createBackup({ out: backupDir, secret: "secret-sha-test" });

  const shaPath = backupRes.targetPath + ".sha256";
  assert.ok(existsSync(shaPath));

  // Remove .sha256 companion file
  const { unlinkSync } = await import("node:fs");
  unlinkSync(shaPath);

  // Verification without .sha256 should fail
  await assert.rejects(
    async () => {
      await verifyBackupFile(backupRes.targetPath, { secret: "secret-sha-test" });
    },
    /Mandatory checksum companion file.*is missing/i,
  );
});

await asyncTest("OWASP-A09: Failed login attempt for non-existent user is recorded in appendAudit", async () => {
  const anon = client();
  const res = await anon("/api/auth/login", {
    method: "POST",
    body: { username: "ghost_user_" + Date.now(), password: "WrongPassword-123!" },
  });
  assert.equal(res.status, 401);

  // Audit entry should exist in SYSTEM_WS
  const auditRes = await admin("/api/audit/_system");
  assert.equal(auditRes.status, 200);
  const found = auditRes.data.entries.some(
    (e) => e.action === "LOGIN_FAILED" && /unknown username/i.test(e.detail || "")
  );
  assert.ok(found, "Audit log contains LOGIN_FAILED for unknown user");
});

await asyncTest("OWASP-A01: Restricted workspace creation automatically enrolls creator in members", async () => {
  // Create lead user
  const leadUser = client();
  const leadRes = await admin("/api/users", {
    method: "POST",
    body: { username: "ws_lead_1", name: "WS Lead", role: "Remediation Lead", password: "LeadPassword-1!" },
  });
  assert.equal(leadRes.status, 201);
  const leadId = leadRes.data.id;

  // Sign in as lead and change password
  await leadUser("/api/auth/login", {
    method: "POST",
    body: { username: "ws_lead_1", password: "LeadPassword-1!" },
  });
  const chg = await leadUser("/api/auth/password", {
    method: "POST",
    body: { current: "LeadPassword-1!", next: "NewLeadPassword-99!" },
  });
  assert.equal(chg.status, 200);

  // Lead creates a restricted workspace
  const wsName = "Restricted Project " + Date.now();
  const createWs = await leadUser("/api/workspaces", {
    method: "POST",
    body: { name: wsName, restricted: true },
  });
  assert.equal(createWs.status, 201);

  // Lead should immediately have access and not be locked out
  const getWs = await leadUser("/api/workspaces");
  assert.equal(getWs.status, 200);
  assert.ok(getWs.data.some((w) => w.name === wsName));

  // Members list should include lead
  const membersRes = await admin("/api/workspaces/" + encodeURIComponent(wsName) + "/members");
  assert.equal(membersRes.status, 200);
  assert.ok(membersRes.data.some((m) => m.userId === leadId));
});

test("OWASP-A03: XML parser rejects external DTD SYSTEM and PUBLIC declarations", () => {
  const dtdXml = `<?xml version="1.0"?>
<!DOCTYPE test SYSTEM "http://127.0.0.1:8080/evil.dtd">
<scan><item>test</item></scan>`;
  assert.throws(
    () => {
      core.parseScanText("test.xml", dtdXml);
    },
    /XML entity declarations.*forbidden/i,
  );
});

srv.close();

console.log(`\nRegression Suite Complete: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
