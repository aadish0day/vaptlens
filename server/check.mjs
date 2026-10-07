/* node server/check.mjs — comprehensive tests for VAPTLens SQLite REST API */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

var testToken = "x".repeat(32);
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
delete process.env.POSTGRES_HOST;
process.env.SYNC_TOKEN = testToken;
process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "vl-test-")), "test.db");

var { handler, db } = await import("./server.mjs");
var srv = createServer(handler).listen(0);
var port = srv.address().port;
var rootUrl = "http://127.0.0.1:" + port;
var authHeaders = {
  Authorization: "Bearer " + testToken,
  "Content-Type": "application/json",
};

async function api(path, options = {}) {
  var headers = Object.assign({}, authHeaders, options.headers || {});
  var res = await fetch(rootUrl + path, {
    method: options.method || "GET",
    headers: headers,
    body: options.body !== undefined ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined,
  });
  var json = null;
  try {
    json = await res.json();
  } catch (e) {}
  return { status: res.status, ok: res.ok, data: json };
}

console.log("Running VAPTLens SQLite Backend test suite...");

// 1. Health check
console.log("-> Testing /api/health");
var healthRes = await fetch(rootUrl + "/api/health");
assert.equal(healthRes.status, 200, "health check status 200");
var healthJson = await healthRes.json();
assert.deepEqual(healthJson, { ok: true, db: "sqlite" }, "health check body");

// 2. Authentication behavior
console.log("-> Testing authentication enforcement");
var noAuth = await fetch(rootUrl + "/api/workspaces");
assert.equal(noAuth.status, 401, "rejects missing token");
var badAuth = await fetch(rootUrl + "/api/workspaces", {
  headers: { Authorization: "Bearer wrong-token" },
});
assert.equal(badAuth.status, 401, "rejects invalid token");

// 3. Workspaces CRUD
console.log("-> Testing workspaces CRUD");
var wsList = await api("/api/workspaces");
assert.equal(wsList.status, 200);
assert.ok(Array.isArray(wsList.data), "workspaces is array");
assert.ok(wsList.data.some(w => w.name === "Default"), "initial Default workspace exists");
assert.ok("savedAt" in wsList.data[0] && "updated_at" in wsList.data[0], "workspace schema fields");

var createWs = await api("/api/workspaces", {
  method: "POST",
  body: { name: "Project-Omega" },
});
assert.equal(createWs.status, 201, "workspace created");
assert.equal(createWs.data.name, "Project-Omega");

var createDuplicate = await api("/api/workspaces", {
  method: "POST",
  body: { name: "Project-Omega" },
});
assert.equal(createDuplicate.status, 409, "duplicate workspace rejected with 409");

var createInvalid = await api("/api/workspaces", {
  method: "POST",
  body: { name: "" },
});
assert.equal(createInvalid.status, 400, "empty workspace name rejected with 400");

// 4. Stores CRUD and Synchronization
console.log("-> Testing stores CRUD & synchronization");
// Generic store
var putPrefs = await api("/api/stores/Project-Omega/prefs", {
  method: "PUT",
  body: { data: { theme: "cyber", autoRefresh: true } },
});
assert.equal(putPrefs.status, 200, "generic store put ok");

var getPrefs = await api("/api/stores/Project-Omega/prefs");
assert.equal(getPrefs.status, 200);
assert.deepEqual(getPrefs.data, {
  name: "prefs",
  data: { theme: "cyber", autoRefresh: true },
});

var getAllStores = await api("/api/stores/Project-Omega");
assert.equal(getAllStores.status, 200);
assert.deepEqual(getAllStores.data.prefs, { theme: "cyber", autoRefresh: true });

var getNotFound = await api("/api/stores/Project-Omega/nonexistent");
assert.equal(getNotFound.status, 404, "non-existent store returns 404");

// Scans store & synchronization to batches and findings tables
console.log("-> Testing scans store synchronization into batches and findings");
var scansPayload = {
  batches: [
    {
      id: 1,
      name: "Network Perimeter Scan",
      tool: "nmap",
      filename: "perimeter.xml",
      count: 2,
      imported_at: "2026-10-05T10:00:00Z",
      raw_size: 4096,
      meta: { scope: "external" },
    },
  ],
  data: [
    {
      id: "f-101",
      batch_id: 1,
      name: "Open SSH Port",
      host: "192.168.1.50",
      port: 22,
      sev: "low",
      cvss: 3.5,
      vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
      cves: ["CVE-2023-1111", "CVE-2023-2222"],
      cwe: ["CWE-200"],
      pluginId: "nmap-ssh",
      tool: "nmap",
      desc: "Port 22 SSH service is accessible",
      sol: "Restrict access",
      url: "https://example.com/cve-2023-1111",
      custom_flag: "retained_in_raw_data",
    },
    {
      id: "f-102",
      batch_id: 1,
      name: "Outdated Web Server",
      host: "192.168.1.50",
      port: 8080,
      sev: "critical",
      cvss: 9.8,
      vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      cves: ["CVE-2021-44228"],
      cwe: ["CWE-502"],
      plugin_id: "log4shell",
      tool: "nmap",
      desc: "Log4Shell RCE vulnerability detected",
      sol: "Upgrade immediately",
      url: "https://logging.apache.org",
    },
  ],
};

var putScans = await api("/api/stores/Project-Omega/scans", {
  method: "PUT",
  body: { data: scansPayload },
});
assert.equal(putScans.status, 200, "scans store put ok");

// Verify in SQLite tables directly
var batchRows = db
  .prepare("SELECT * FROM batches WHERE workspace_id = ?")
  .all("Project-Omega");
assert.equal(batchRows.length, 1, "batches row count");
assert.equal(batchRows[0].id, 1);
assert.equal(batchRows[0].name, "Network Perimeter Scan");
assert.equal(batchRows[0].tool, "nmap");
assert.equal(batchRows[0].filename, "perimeter.xml");
assert.equal(batchRows[0].count, 2);
assert.equal(batchRows[0].raw_size, 4096);

var findingRows = db
  .prepare("SELECT * FROM findings WHERE workspace_id = ? ORDER BY id")
  .all("Project-Omega");
assert.equal(findingRows.length, 2, "findings row count");

var f1 = findingRows[0];
assert.equal(f1.id, "f-101");
assert.equal(f1.batch_id, 1);
assert.equal(f1.name, "Open SSH Port");
assert.equal(f1.host, "192.168.1.50");
assert.equal(f1.port, 22);
assert.equal(f1.sev, "low");
assert.equal(f1.cvss, 3.5);
assert.equal(f1.cves, "CVE-2023-1111,CVE-2023-2222");
assert.equal(f1.cwe, "CWE-200");
assert.equal(f1.plugin_id, "nmap-ssh");
assert.equal(f1.tool, "nmap");
assert.ok(f1.raw_data.includes("retained_in_raw_data"), "raw_data preserves full object");

var f2 = findingRows[1];
assert.equal(f2.id, "f-102");
assert.equal(f2.sev, "critical");
assert.equal(f2.cvss, 9.8);
assert.equal(f2.plugin_id, "log4shell");

// Assets store & synchronization
console.log("-> Testing assets store synchronization into assets table");
var assetsPayload = {
  "192.168.1.50": {
    criticality: "tier-1",
    owner: "Security Ops",
    tags: ["external", "pci"],
  },
  "192.168.1.60": {
    criticality: "tier-3",
    owner: "Dev Team",
    tags: ["internal"],
  },
};
var putAssets = await api("/api/stores/Project-Omega/assets", {
  method: "PUT",
  body: { data: assetsPayload },
});
assert.equal(putAssets.status, 200, "assets store put ok");

var assetRows = db
  .prepare("SELECT * FROM assets WHERE workspace_id = ? ORDER BY host")
  .all("Project-Omega");
assert.equal(assetRows.length, 2, "assets row count");
assert.equal(assetRows[0].host, "192.168.1.50");
assert.equal(assetRows[0].criticality, "tier-1");
assert.equal(assetRows[0].owner, "Security Ops");
assert.equal(assetRows[0].tags, "external,pci");

// Assets store with array format & raw payload test
var putAssetsArray = await api("/api/stores/Project-Omega/assets", {
  method: "PUT",
  body: [
    {
      host: "10.0.0.99",
      criticality: "critical",
      owner: "DevOps",
      tags: ["k8s", "cluster"],
    },
  ],
});
assert.equal(putAssetsArray.status, 200, "assets array put ok");
var assetArrayRows = db
  .prepare("SELECT * FROM assets WHERE workspace_id = ? AND host = ?")
  .all("Project-Omega", "10.0.0.99");
assert.equal(assetArrayRows.length, 1, "array asset inserted");
assert.equal(assetArrayRows[0].criticality, "critical");

// Audit store & synchronization
console.log("-> Testing audit store synchronization into audit_log table");
var auditPayload = [
  {
    action: "IMPORT_SCAN",
    detail: "Imported perimeter.xml",
    role: "admin",
    at: "2026-10-05T10:05:00Z",
    prev: null,
    user: "alice@vaptlens",
    hash: "hash-001",
    ref: "batch-1",
  },
  {
    action: "UPDATE_STATUS",
    detail: "Marked f-101 as accepted risk",
    role: "admin",
    at: "2026-10-05T10:10:00Z",
    prev: "hash-001",
    user: "alice@vaptlens",
    hash: "hash-002",
    ref: "f-101",
  },
];
var putAudit = await api("/api/stores/Project-Omega/audit", {
  method: "PUT",
  body: { data: auditPayload },
});
assert.equal(putAudit.status, 200, "audit store put ok");

var auditRows = db
  .prepare("SELECT * FROM audit_log WHERE workspace_id = ? ORDER BY id")
  .all("Project-Omega");
assert.equal(auditRows.length, 2, "audit_log row count");
assert.equal(auditRows[0].action, "IMPORT_SCAN");
assert.equal(auditRows[0].user, "alice@vaptlens");
assert.equal(auditRows[0].hash, "hash-001");
assert.equal(auditRows[1].ref, "f-101");

// Delete store (scans should clear batches and findings)
console.log("-> Testing store deletion");
var delScans = await api("/api/stores/Project-Omega/scans", { method: "DELETE" });
assert.equal(delScans.status, 200);
assert.equal(
  db.prepare("SELECT COUNT(*) AS c FROM batches WHERE workspace_id = ?").get("Project-Omega").c,
  0,
  "batches cleared after scans deleted"
);
assert.equal(
  db.prepare("SELECT COUNT(*) AS c FROM findings WHERE workspace_id = ?").get("Project-Omega").c,
  0,
  "findings cleared after scans deleted"
);

// 5. Evidence CRUD
console.log("-> Testing evidence CRUD");
var getEvEmpty = await api("/api/evidence/Project-Omega/f-101");
assert.equal(getEvEmpty.status, 200);
assert.deepEqual(getEvEmpty.data, { key: "f-101", data: [] });

var putEv = await api("/api/evidence/Project-Omega/f-101", {
  method: "PUT",
  body: {
    data: [
      { id: "ev-1", caption: "Terminal screenshot", file: "data:image/png;base64,iVBORw..." },
      { id: "ev-2", caption: "Raw banner output", text: "SSH-2.0-OpenSSH_8.2p1" },
    ],
  },
});
assert.equal(putEv.status, 200, "put evidence ok");

var getEv = await api("/api/evidence/Project-Omega/f-101");
assert.equal(getEv.status, 200);
assert.equal(getEv.data.key, "f-101");
assert.equal(getEv.data.data.length, 2);
assert.equal(getEv.data.data[0].id, "ev-1");

var delEv = await api("/api/evidence/Project-Omega/f-101", { method: "DELETE" });
assert.equal(delEv.status, 200, "del evidence ok");

var getEvAfterDel = await api("/api/evidence/Project-Omega/f-101");
assert.equal(getEvAfterDel.status, 200);
assert.deepEqual(getEvAfterDel.data, { key: "f-101", data: [] });

// 6. Backup and Restore
console.log("-> Testing backup & restore");
// Re-put scans and evidence for backup test
await api("/api/stores/Project-Omega/scans", { method: "PUT", body: { data: scansPayload } });
await api("/api/evidence/Project-Omega/f-102", {
  method: "PUT",
  body: { data: [{ id: "ev-log4j", file: "poc.py" }] },
});

var backupRes = await api("/api/backup/Project-Omega");
assert.equal(backupRes.status, 200, "backup ok");
var snapshot = backupRes.data;
assert.equal(snapshot.app, "VAPTLens");
assert.equal(snapshot.workspace, "Project-Omega");
assert.ok(snapshot.stores.scans, "snapshot contains scans store");
assert.ok(snapshot.stores.assets, "snapshot contains assets store");
assert.ok(snapshot.evidence["f-102"], "snapshot contains evidence for f-102");

var restoreRes = await api("/api/restore/Project-Cloned", {
  method: "POST",
  body: snapshot,
});
assert.equal(restoreRes.status, 200, "restore ok");

// Verify cloned workspace data
var clonedStores = await api("/api/stores/Project-Cloned");
assert.equal(clonedStores.status, 200);
assert.ok(clonedStores.data.scans, "cloned workspace has scans store");
assert.ok(clonedStores.data.assets, "cloned workspace has assets store");

var clonedBatches = db
  .prepare("SELECT * FROM batches WHERE workspace_id = ?")
  .all("Project-Cloned");
assert.equal(clonedBatches.length, 1, "cloned batches count");

var clonedFindings = db
  .prepare("SELECT * FROM findings WHERE workspace_id = ?")
  .all("Project-Cloned");
assert.equal(clonedFindings.length, 2, "cloned findings count");

var clonedEvidence = await api("/api/evidence/Project-Cloned/f-102");
assert.equal(clonedEvidence.status, 200);
assert.equal(clonedEvidence.data.data.length, 1);
assert.equal(clonedEvidence.data.data[0].id, "ev-log4j");

// 7. Workspace Deletion cascading
console.log("-> Testing workspace deletion cascading");
var delWsRes = await api("/api/workspaces/Project-Cloned", { method: "DELETE" });
assert.equal(delWsRes.status, 200, "workspace delete ok");

assert.equal(
  db.prepare("SELECT COUNT(*) AS c FROM workspaces WHERE name = ?").get("Project-Cloned").c,
  0,
  "workspace row removed"
);
assert.equal(
  db.prepare("SELECT COUNT(*) AS c FROM stores WHERE workspace_id = ?").get("Project-Cloned").c,
  0,
  "stores rows removed"
);
assert.equal(
  db.prepare("SELECT COUNT(*) AS c FROM batches WHERE workspace_id = ?").get("Project-Cloned").c,
  0,
  "batches rows removed"
);
assert.equal(
  db.prepare("SELECT COUNT(*) AS c FROM findings WHERE workspace_id = ?").get("Project-Cloned").c,
  0,
  "findings rows removed"
);
assert.equal(
  db.prepare("SELECT COUNT(*) AS c FROM assets WHERE workspace_id = ?").get("Project-Cloned").c,
  0,
  "assets rows removed"
);
assert.equal(
  db.prepare("SELECT COUNT(*) AS c FROM audit_log WHERE workspace_id = ?").get("Project-Cloned").c,
  0,
  "audit_log rows removed"
);
assert.equal(
  db.prepare("SELECT COUNT(*) AS c FROM evidence WHERE workspace_id = ?").get("Project-Cloned").c,
  0,
  "evidence rows removed"
);

var getDeletedWsStores = await api("/api/stores/Project-Cloned");
assert.equal(getDeletedWsStores.status, 404, "fetching stores for deleted workspace returns 404");

// 8. Backwards compatibility: /api/ws/:name
console.log("-> Testing backwards compatibility (/api/ws/:name)");
var baseWsUrl = rootUrl + "/api/ws/Default";
var snapBlob = JSON.stringify({
  app: "VAPTLens",
  localStorage: { "vaptlens.scans.v2.enc": '{"ct":"..."}' },
  indexedDB: {},
});
var putWsLegacy = (version, blob = snapBlob, h = authHeaders) =>
  fetch(baseWsUrl, {
    method: "PUT",
    headers: h,
    body: JSON.stringify({ version, blob }),
  });

assert.equal((await fetch(baseWsUrl)).status, 401, "legacy no token");
assert.equal(
  (await fetch(baseWsUrl, { headers: { Authorization: "Bearer wrong" } })).status,
  401,
  "legacy wrong token"
);
assert.equal(
  (await fetch(baseWsUrl, { headers: authHeaders })).status,
  404,
  "legacy empty workspace returns 404"
);
assert.equal(
  (await putWsLegacy(0, '{"app":"x"}')).status,
  400,
  "legacy rejects non-snapshots"
);
assert.deepEqual((await (await putWsLegacy(0)).json()).version, 1, "legacy first push");
assert.equal((await putWsLegacy(0)).status, 409, "legacy stale push is refused");
assert.equal(
  (await (await putWsLegacy(1)).json()).version,
  2,
  "legacy push from current version"
);
var gotLegacy = await (await fetch(baseWsUrl, { headers: authHeaders })).json();
assert.equal(gotLegacy.version, 2);
assert.equal(gotLegacy.blob, snapBlob, "legacy round-trip matches");
assert.equal(
  (await fetch(baseWsUrl.replace("Default", "..%2Fetc"), { headers: authHeaders })).status,
  404,
  "legacy bad name returns 404"
);

// 9. Standalone mode (when SYNC_TOKEN is unset)
console.log("-> Testing standalone mode (no SYNC_TOKEN)");
delete process.env.SYNC_TOKEN;
var standaloneRes = await fetch(rootUrl + "/api/workspaces");
assert.equal(standaloneRes.status, 200, "standalone mode allows request without token");

srv.close();
console.log("All VAPTLens SQLite API checks passed successfully!");

/* cross-site protection (added): another website must not drive the API from a user's browser */
{
  var { crossSiteBlocked } = await import("./server.mjs");
  var mk = (h) => ({ headers: h });
  assert.equal(crossSiteBlocked(mk({ "sec-fetch-site": "cross-site" })), true, "cross-site blocked");
  assert.equal(crossSiteBlocked(mk({ "sec-fetch-site": "same-site" })), true, "same-site (other port/subdomain) blocked");
  assert.equal(crossSiteBlocked(mk({ "sec-fetch-site": "same-origin" })), false, "same-origin allowed");
  assert.equal(crossSiteBlocked(mk({ origin: "https://evil.example", host: "localhost:8080" })), true, "foreign Origin blocked");
  assert.equal(crossSiteBlocked(mk({ origin: "http://localhost:8080", host: "sync:8787", "x-forwarded-host": "localhost:8080" })), false, "proxied same origin allowed");
  assert.equal(crossSiteBlocked(mk({})), false, "non-browser clients (curl, tests) allowed");
  console.log("Cross-site protection checks passed.");
}
