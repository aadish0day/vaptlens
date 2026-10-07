/* VAPTLens Backend & Team Sync API
   Provides a robust REST API for VAPTLens workspaces, stores, findings, batches,
   assets, audit log, and evidence, with native PostgreSQL support and seamless
   SQLite fallback.
*/
import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import pg from "pg";
var { Pool, types } = pg;

// Parse bigint and numeric types as JavaScript numbers
types.setTypeParser(20, function (val) {
  return val === null ? null : parseInt(val, 10);
});
types.setTypeParser(1700, function (val) {
  return val === null ? null : parseFloat(val);
});

var PORT = +(process.env.PORT || 8787);
/* loopback unless told otherwise: without SYNC_TOKEN anyone who can connect has full access */
var HOST = process.env.HOST || "127.0.0.1";
var MAX_BYTES = 64 * 1024 * 1024; /* keep in step with client_max_body_size in docker/nginx.conf */

var rawDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
var isPostgres = !!(
  (rawDbUrl &&
    (rawDbUrl.startsWith("postgres://") || rawDbUrl.startsWith("postgresql://"))) ||
  process.env.POSTGRES_HOST
);

var pool = null;
var sqliteDb = null;
var db = null;
var getWs = null;
var putWs = null;

if (isPostgres) {
  var poolConfig = rawDbUrl
    ? { connectionString: rawDbUrl }
    : {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
        user: process.env.POSTGRES_USER || process.env.PGUSER || "postgres",
        password:
          process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || "postgres",
        database:
          process.env.POSTGRES_DB || process.env.PGDATABASE || "postgres",
      };

  pool = new Pool(poolConfig);
  db = pool;

  // Initialize PostgreSQL Schema
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workspaces (
      name TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stores (
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      PRIMARY KEY(workspace_id, name)
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER NOT NULL,
      workspace_id TEXT NOT NULL,
      name TEXT,
      tool TEXT,
      filename TEXT,
      count INTEGER DEFAULT 0,
      imported_at TIMESTAMPTZ,
      raw_size BIGINT,
      meta JSONB,
      PRIMARY KEY(workspace_id, id)
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      batch_id INTEGER,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER,
      sev TEXT,
      cvss NUMERIC,
      vector TEXT,
      cves JSONB,
      cwe JSONB,
      plugin_id TEXT,
      tool TEXT,
      "desc" TEXT,
      sol TEXT,
      url TEXT,
      raw_data JSONB,
      PRIMARY KEY(workspace_id, id)
    );

    CREATE TABLE IF NOT EXISTS assets (
      workspace_id TEXT NOT NULL,
      host TEXT NOT NULL,
      criticality TEXT,
      owner TEXT,
      tags JSONB,
      meta JSONB,
      PRIMARY KEY(workspace_id, host)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id BIGSERIAL PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      role TEXT,
      at TIMESTAMPTZ NOT NULL,
      prev TEXT,
      "user" TEXT,
      hash TEXT,
      ref TEXT
    );

    CREATE TABLE IF NOT EXISTS evidence (
      workspace_id TEXT NOT NULL,
      finding_key TEXT NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      PRIMARY KEY(workspace_id, finding_key)
    );

    CREATE TABLE IF NOT EXISTS ws (
      name TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      blob TEXT NOT NULL,
      updated TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_log_ws ON audit_log (workspace_id);
    CREATE INDEX IF NOT EXISTS idx_findings_batch ON findings (workspace_id, batch_id);
  `);

  // Ensure initial 'Default' workspace exists
  await pool.query(`
    INSERT INTO workspaces (name, created_at, updated_at)
    VALUES ('Default', NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
  `);
} else {
  var defaultDb = existsSync("/data") ? "/data/vaptlens.db" : "./vaptlens.db";
  var dbPath = process.env.DB_PATH || defaultDb;
  try {
    mkdirSync(dirname(dbPath), { recursive: true });
  } catch (e) {}

  sqliteDb = new DatabaseSync(dbPath);
  db = sqliteDb;

  // Enable WAL mode and foreign keys
  sqliteDb.exec("PRAGMA journal_mode = WAL;");
  sqliteDb.exec("PRAGMA foreign_keys = ON;");

  // Initialize SQLite Schema
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      name TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stores (
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(workspace_id, name)
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER NOT NULL,
      workspace_id TEXT NOT NULL,
      name TEXT,
      tool TEXT,
      filename TEXT,
      count INTEGER DEFAULT 0,
      imported_at TEXT,
      raw_size INTEGER,
      meta TEXT,
      PRIMARY KEY(workspace_id, id)
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      batch_id INTEGER,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER,
      sev TEXT,
      cvss REAL,
      vector TEXT,
      cves TEXT,
      cwe TEXT,
      plugin_id TEXT,
      tool TEXT,
      desc TEXT,
      sol TEXT,
      url TEXT,
      raw_data TEXT,
      PRIMARY KEY(workspace_id, id)
    );

    CREATE TABLE IF NOT EXISTS assets (
      workspace_id TEXT NOT NULL,
      host TEXT NOT NULL,
      criticality TEXT,
      owner TEXT,
      tags TEXT,
      meta TEXT,
      PRIMARY KEY(workspace_id, host)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      role TEXT,
      at TEXT,
      prev TEXT,
      user TEXT,
      hash TEXT,
      ref TEXT
    );

    CREATE TABLE IF NOT EXISTS evidence (
      workspace_id TEXT NOT NULL,
      finding_key TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(workspace_id, finding_key)
    );

    CREATE TABLE IF NOT EXISTS ws (
      name TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      blob TEXT NOT NULL,
      updated TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_log_ws ON audit_log (workspace_id);
    CREATE INDEX IF NOT EXISTS idx_findings_batch ON findings (workspace_id, batch_id);
  `);

  var initialNow = new Date().toISOString();
  sqliteDb
    .prepare(
      "INSERT OR IGNORE INTO workspaces (name, created_at, updated_at) VALUES ('Default', ?, ?)"
    )
    .run(initialNow, initialNow);

  getWs = sqliteDb.prepare("SELECT version, blob, updated FROM ws WHERE name = ?");
  putWs = sqliteDb.prepare(
    "INSERT INTO ws (name, version, blob, updated) VALUES (?, ?, ?, ?) ON CONFLICT(name) DO UPDATE SET version = excluded.version, blob = excluded.blob, updated = excluded.updated"
  );
}

function digest(s) {
  return createHash("sha256").update(s).digest();
}

function authed(req) {
  var token = process.env.SYNC_TOKEN || "";
  if (!token) return true;
  var authHeader = req.headers.authorization || "";
  var m = /^Bearer (.+)$/i.exec(authHeader);
  if (!m) return false;
  return timingSafeEqual(digest(m[1].trim()), digest(token));
}

function send(res, code, obj) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    var parts = [],
      size = 0;
    req.on("data", function (c) {
      size += c.length;
      if (size > MAX_BYTES) {
        reject(Object.assign(new Error("Payload too large"), { code: 413 }));
        req.destroy();
      } else parts.push(c);
    });
    req.on("end", function () {
      resolve(Buffer.concat(parts).toString("utf8"));
    });
    req.on("error", reject);
  });
}

function isValidName(name) {
  return (
    typeof name === "string" &&
    name.length > 0 &&
    name.length <= 128 &&
    /^[\w .@#-]+$/.test(name) &&
    !name.includes("..")
  );
}

function isValidKey(key) {
  return (
    typeof key === "string" &&
    key.length > 0 &&
    key.length <= 512 &&
    key !== ".."
  );
}

function toIso(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function parseJson(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}

function toJsonb(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    try {
      JSON.parse(val);
      return val;
    } catch {
      return JSON.stringify(val);
    }
  }
  return JSON.stringify(val);
}

function toArrayJsonb(val) {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === "string") {
    var trimmed = val.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        var parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return JSON.stringify(parsed);
      } catch {}
    }
    if (trimmed.includes(",")) {
      return JSON.stringify(
        trimmed.split(",").map(function (s) {
          return s.trim();
        }).filter(Boolean)
      );
    }
    if (trimmed.length > 0) {
      return JSON.stringify([trimmed]);
    }
    return null;
  }
  return JSON.stringify([val]);
}

function saveStoreHelperSqlite(workspace, storeName, payload, now) {
  if (!now) now = new Date().toISOString();
  var jsonValue = JSON.stringify(payload);

  sqliteDb.prepare(`
    INSERT INTO stores (workspace_id, name, value, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(workspace_id, name) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(workspace, storeName, jsonValue, now);

  if (storeName === "scans" && payload && typeof payload === "object") {
    var batches = Array.isArray(payload.batches) ? payload.batches : null;
    var findings = Array.isArray(payload.data) ? payload.data : null;
    if (batches !== null && findings !== null) {
      sqliteDb.prepare("DELETE FROM batches WHERE workspace_id = ?").run(workspace);
      sqliteDb.prepare("DELETE FROM findings WHERE workspace_id = ?").run(workspace);

      var insertBatch = sqliteDb.prepare(`
        INSERT INTO batches (id, workspace_id, name, tool, filename, count, imported_at, raw_size, meta)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (var b of batches) {
        if (!b) continue;
        var bId = b.id != null ? Number(b.id) : 0;
        var bName = b.name ?? b.label ?? null;
        var tool = b.tool ?? b.tools ?? null;
        var filename = b.filename ?? b.file ?? null;
        var count = b.count != null ? Number(b.count) : 0;
        var importedAt = b.imported_at ?? b.importedAt ?? b.date ?? null;
        var rawSize = b.raw_size ?? b.rawSize ?? b.size ?? null;
        var meta =
          b.meta != null
            ? typeof b.meta === "string"
              ? b.meta
              : JSON.stringify(b.meta)
            : null;
        insertBatch.run(
          bId,
          workspace,
          bName != null ? String(bName) : null,
          tool != null ? String(tool) : null,
          filename != null ? String(filename) : null,
          count,
          importedAt != null ? String(importedAt) : null,
          rawSize != null ? Number(rawSize) : null,
          meta
        );
      }

      var insertFinding = sqliteDb.prepare(`
        INSERT INTO findings (id, workspace_id, batch_id, name, host, port, sev, cvss, vector, cves, cwe, plugin_id, tool, desc, sol, url, raw_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (var f of findings) {
        if (!f) continue;
        var fId =
          f.id != null
            ? String(f.id)
            : f.key != null
              ? String(f.key)
              : null;
        if (!fId) continue;
        var batchId =
          f.batch_id != null
            ? Number(f.batch_id)
            : f.batchId != null
              ? Number(f.batchId)
              : f.batch != null
                ? Number(f.batch)
                : null;
        var fName = String(f.name ?? "");
        var host = String(f.host ?? "");
        var port = f.port != null ? parseInt(f.port, 10) || null : null;
        var sev = f.sev != null ? String(f.sev) : null;
        var cvss =
          f.cvss != null && !isNaN(Number(f.cvss)) ? Number(f.cvss) : null;
        var vector = f.vector != null ? String(f.vector) : null;
        var cves =
          f.cves != null
            ? Array.isArray(f.cves)
              ? f.cves.join(",")
              : String(f.cves)
            : null;
        var cwe =
          f.cwe != null
            ? Array.isArray(f.cwe)
              ? f.cwe.join(",")
              : String(f.cwe)
            : null;
        var pluginId =
          f.pluginId != null
            ? String(f.pluginId)
            : f.plugin_id != null
              ? String(f.plugin_id)
              : null;
        var fTool = f.tool != null ? String(f.tool) : null;
        var desc =
          f.desc != null
            ? String(f.desc)
            : f.description != null
              ? String(f.description)
              : null;
        var sol =
          f.sol != null
            ? String(f.sol)
            : f.solution != null
              ? String(f.solution)
              : null;
        var url = f.url != null ? String(f.url) : null;
        var rawData = JSON.stringify(f);

        insertFinding.run(
          fId,
          workspace,
          batchId,
          fName,
          host,
          port,
          sev,
          cvss,
          vector,
          cves,
          cwe,
          pluginId,
          fTool,
          desc,
          sol,
          url,
          rawData
        );
      }
    }
  }

  if (
    storeName === "assets" &&
    payload &&
    (Array.isArray(payload) || typeof payload === "object")
  ) {
    sqliteDb.prepare("DELETE FROM assets WHERE workspace_id = ?").run(workspace);
    var insertAsset = sqliteDb.prepare(`
      INSERT INTO assets (workspace_id, host, criticality, owner, tags, meta)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    if (Array.isArray(payload)) {
      for (var item of payload) {
        if (!item || !item.host) continue;
        var aCrit = item.criticality ?? item.tier ?? null;
        var aOwner = item.owner ?? null;
        var aTags =
          item.tags != null
            ? Array.isArray(item.tags)
              ? item.tags.join(",")
              : String(item.tags)
            : null;
        var aMeta =
          item.meta != null
            ? typeof item.meta === "string"
              ? item.meta
              : JSON.stringify(item.meta)
            : JSON.stringify(item);
        insertAsset.run(
          workspace,
          String(item.host),
          aCrit != null ? String(aCrit) : null,
          aOwner != null ? String(aOwner) : null,
          aTags,
          aMeta
        );
      }
    } else {
      for (var [h, val] of Object.entries(payload)) {
        if (!h) continue;
        var aHost =
          val && typeof val === "object" && val.host ? String(val.host) : h;
        var aCrit =
          val && typeof val === "object"
            ? (val.criticality ?? val.tier ?? null)
            : null;
        var aOwner =
          val && typeof val === "object" ? (val.owner ?? null) : null;
        var aTags =
          val && typeof val === "object" && val.tags != null
            ? Array.isArray(val.tags)
              ? val.tags.join(",")
              : String(val.tags)
            : null;
        var aMeta = JSON.stringify(val);
        insertAsset.run(
          workspace,
          String(aHost),
          aCrit != null ? String(aCrit) : null,
          aOwner != null ? String(aOwner) : null,
          aTags,
          aMeta
        );
      }
    }
  }

  if (storeName === "audit" && Array.isArray(payload)) {
    sqliteDb.prepare("DELETE FROM audit_log WHERE workspace_id = ?").run(workspace);
    var insertAudit = sqliteDb.prepare(`
      INSERT INTO audit_log (workspace_id, action, detail, role, at, prev, user, hash, ref)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (var entry of payload) {
      if (!entry || !entry.action) continue;
      var refStr =
        entry.ref != null
          ? typeof entry.ref === "string"
            ? entry.ref
            : JSON.stringify(entry.ref)
          : null;
      insertAudit.run(
        workspace,
        String(entry.action),
        entry.detail != null ? String(entry.detail) : null,
        entry.role != null ? String(entry.role) : null,
        entry.at != null ? String(entry.at) : null,
        entry.prev != null ? String(entry.prev) : null,
        entry.user != null ? String(entry.user) : null,
        entry.hash != null ? String(entry.hash) : null,
        refStr
      );
    }
  }
}

async function saveStoreHelperPg(client, workspace, storeName, payload, now) {
  if (!now) now = new Date().toISOString();
  var jsonValue = JSON.stringify(payload);

  await client.query(
    `INSERT INTO stores (workspace_id, name, value, updated_at)
     VALUES ($1, $2, $3::jsonb, $4)
     ON CONFLICT(workspace_id, name) DO UPDATE SET
       value = EXCLUDED.value,
       updated_at = EXCLUDED.updated_at`,
    [workspace, storeName, jsonValue, now]
  );

  if (storeName === "scans" && payload && typeof payload === "object") {
    var batches = Array.isArray(payload.batches) ? payload.batches : null;
    var findings = Array.isArray(payload.data) ? payload.data : null;
    if (batches !== null && findings !== null) {
      await client.query("DELETE FROM batches WHERE workspace_id = $1", [workspace]);
      await client.query("DELETE FROM findings WHERE workspace_id = $1", [workspace]);

      for (var b of batches) {
        if (!b) continue;
        var bId = b.id != null ? Number(b.id) : 0;
        var bName = b.name ?? b.label ?? null;
        var tool = b.tool ?? b.tools ?? null;
        var filename = b.filename ?? b.file ?? null;
        var count = b.count != null ? Number(b.count) : 0;
        var importedAt = b.imported_at ?? b.importedAt ?? b.date ?? null;
        var rawSize = b.raw_size ?? b.rawSize ?? b.size ?? null;
        var meta = toJsonb(b.meta);

        var validImportedAt = null;
        if (importedAt) {
          var d = new Date(importedAt);
          if (!isNaN(d.getTime())) validImportedAt = d.toISOString();
        }

        await client.query(
          `INSERT INTO batches (id, workspace_id, name, tool, filename, count, imported_at, raw_size, meta)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
          [
            bId,
            workspace,
            bName != null ? String(bName) : null,
            tool != null ? String(tool) : null,
            filename != null ? String(filename) : null,
            count,
            validImportedAt,
            rawSize != null ? Number(rawSize) : null,
            meta,
          ]
        );
      }

      for (var f of findings) {
        if (!f) continue;
        var fId =
          f.id != null
            ? String(f.id)
            : f.key != null
              ? String(f.key)
              : null;
        if (!fId) continue;
        var batchId =
          f.batch_id != null
            ? Number(f.batch_id)
            : f.batchId != null
              ? Number(f.batchId)
              : f.batch != null
                ? Number(f.batch)
                : null;
        var fName = String(f.name ?? "");
        var host = String(f.host ?? "");
        var port = f.port != null ? parseInt(f.port, 10) || null : null;
        var sev = f.sev != null ? String(f.sev) : null;
        var cvss =
          f.cvss != null && !isNaN(Number(f.cvss)) ? Number(f.cvss) : null;
        var vector = f.vector != null ? String(f.vector) : null;
        var cves = toArrayJsonb(f.cves);
        var cwe = toArrayJsonb(f.cwe);
        var pluginId =
          f.pluginId != null
            ? String(f.pluginId)
            : f.plugin_id != null
              ? String(f.plugin_id)
              : null;
        var fTool = f.tool != null ? String(f.tool) : null;
        var desc =
          f.desc != null
            ? String(f.desc)
            : f.description != null
              ? String(f.description)
              : null;
        var sol =
          f.sol != null
            ? String(f.sol)
            : f.solution != null
              ? String(f.solution)
              : null;
        var url = f.url != null ? String(f.url) : null;
        var rawData = JSON.stringify(f);

        await client.query(
          `INSERT INTO findings (id, workspace_id, batch_id, name, host, port, sev, cvss, vector, cves, cwe, plugin_id, tool, "desc", sol, url, raw_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13, $14, $15, $16, $17::jsonb)`,
          [
            fId,
            workspace,
            batchId,
            fName,
            host,
            port,
            sev,
            cvss,
            vector,
            cves,
            cwe,
            pluginId,
            fTool,
            desc,
            sol,
            url,
            rawData,
          ]
        );
      }
    }
  }

  if (
    storeName === "assets" &&
    payload &&
    (Array.isArray(payload) || typeof payload === "object")
  ) {
    await client.query("DELETE FROM assets WHERE workspace_id = $1", [workspace]);
    if (Array.isArray(payload)) {
      for (var item of payload) {
        if (!item || !item.host) continue;
        var aCrit = item.criticality ?? item.tier ?? null;
        var aOwner = item.owner ?? null;
        var aTags = toArrayJsonb(item.tags);
        var aMeta = toJsonb(item.meta ?? item);

        await client.query(
          `INSERT INTO assets (workspace_id, host, criticality, owner, tags, meta)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
          [
            workspace,
            String(item.host),
            aCrit != null ? String(aCrit) : null,
            aOwner != null ? String(aOwner) : null,
            aTags,
            aMeta,
          ]
        );
      }
    } else {
      for (var [h, val] of Object.entries(payload)) {
        if (!h) continue;
        var aHost =
          val && typeof val === "object" && val.host ? String(val.host) : h;
        var aCrit =
          val && typeof val === "object"
            ? (val.criticality ?? val.tier ?? null)
            : null;
        var aOwner =
          val && typeof val === "object" ? (val.owner ?? null) : null;
        var aTags =
          val && typeof val === "object" && val.tags != null
            ? toArrayJsonb(val.tags)
            : null;
        var aMeta = toJsonb(val);

        await client.query(
          `INSERT INTO assets (workspace_id, host, criticality, owner, tags, meta)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
          [
            workspace,
            String(aHost),
            aCrit != null ? String(aCrit) : null,
            aOwner != null ? String(aOwner) : null,
            aTags,
            aMeta,
          ]
        );
      }
    }
  }

  if (storeName === "audit" && Array.isArray(payload)) {
    await client.query("DELETE FROM audit_log WHERE workspace_id = $1", [workspace]);
    for (var entry of payload) {
      if (!entry || !entry.action) continue;
      var refStr =
        entry.ref != null
          ? typeof entry.ref === "string"
            ? entry.ref
            : JSON.stringify(entry.ref)
          : null;
      var auditAt = null;
      if (entry.at) {
        var dAt = new Date(entry.at);
        if (!isNaN(dAt.getTime())) auditAt = dAt.toISOString();
      }
      if (!auditAt) auditAt = now;

      await client.query(
        `INSERT INTO audit_log (workspace_id, action, detail, role, at, prev, "user", hash, ref)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          workspace,
          String(entry.action),
          entry.detail != null ? String(entry.detail) : null,
          entry.role != null ? String(entry.role) : null,
          auditAt,
          entry.prev != null ? String(entry.prev) : null,
          entry.user != null ? String(entry.user) : null,
          entry.hash != null ? String(entry.hash) : null,
          refStr,
        ]
      );
    }
  }
}

/* The app reaches this API same-origin (nginx / Vite proxy), so no CORS is ever needed.
   Refusing cross-site requests stops any other website from driving the API from a user's
   browser — important in standalone mode, where there is no token to stop it. */
export function crossSiteBlocked(req) {
  /* modern browsers always send Sec-Fetch-Site: trust it; fall back to Origin vs Host for older clients */
  var site = req.headers["sec-fetch-site"];
  if (site) return site !== "same-origin" && site !== "none";
  var origin = req.headers.origin;
  if (origin) {
    var host = req.headers["x-forwarded-host"] || req.headers.host || "";
    try {
      if (new URL(origin).host !== String(host).split(",")[0].trim()) return true;
    } catch (e) {
      return true;
    }
  }
  return false;
}

export async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(405, { Allow: "GET, POST, PUT, DELETE" });
    return res.end();
  }
  if (crossSiteBlocked(req)) {
    return send(res, 403, { error: "Cross-site requests are not allowed" });
  }
  /* writes must be JSON: a plain HTML form or text/plain beacon can't reach a mutating route */
  if ((req.method === "POST" || req.method === "PUT") && !/^application\/json\b/i.test(req.headers["content-type"] || "")) {
    return send(res, 415, { error: "Send JSON (Content-Type: application/json)" });
  }

  var url;
  try {
    url = new URL(req.url || "/", "http://localhost");
  } catch (e) {
    return send(res, 400, { error: "Invalid URL" });
  }
  var pathname = url.pathname;

  // Health check: does not require authentication
  if (pathname === "/api/health") {
    if (req.method === "GET") {
      return send(res, 200, { ok: true, db: isPostgres ? "postgres" : "sqlite" });
    }
    return send(res, 405, { error: "Method not allowed" });
  }

  // Backwards compatibility: /api/ws/:name
  var mWs = /^\/api\/ws\/([^/?]+)$/.exec(pathname);
  if (mWs) {
    var wsName = "";
    try {
      wsName = decodeURIComponent(mWs[1]);
    } catch (e) {
      return send(res, 400, { error: "Bad Request: invalid URI component" });
    }
    if (!isValidName(wsName)) {
      return send(res, 404, { error: "Not found" });
    }
    if (!authed(req)) {
      return send(res, 401, { error: "Wrong or missing team token" });
    }

    if (req.method === "GET") {
      if (isPostgres) {
        var resWs = await pool.query(
          "SELECT version, blob, updated FROM ws WHERE name = $1",
          [wsName]
        );
        var row = resWs.rows[0];
        return row
          ? send(res, 200, {
              version: Number(row.version),
              blob: row.blob,
              updated: toIso(row.updated),
            })
          : send(res, 404, {
              error: "Nothing pushed for this workspace yet",
              version: 0,
            });
      } else {
        var row = getWs.get(wsName);
        return row
          ? send(res, 200, row)
          : send(res, 404, {
              error: "Nothing pushed for this workspace yet",
              version: 0,
            });
      }
    }
    if (req.method === "PUT") {
      try {
        var text = await readBody(req);
        var b = JSON.parse(text);
        var snap = JSON.parse(b.blob);
        if (snap.app !== "VAPTLens" || !snap.localStorage) {
          return send(res, 400, { error: "Not a VAPTLens snapshot" });
        }
        var have = 0;
        if (isPostgres) {
          var resWs = await pool.query(
            "SELECT version FROM ws WHERE name = $1",
            [wsName]
          );
          have = resWs.rows[0] ? Number(resWs.rows[0].version) : 0;
        } else {
          var cur = getWs.get(wsName);
          have = cur ? cur.version : 0;
        }

        if (b.version !== have) {
          return send(res, 409, {
            error: "Someone pushed a newer version",
            version: have,
          });
        }
        var updated = new Date().toISOString();
        if (isPostgres) {
          await pool.query(
            `INSERT INTO ws (name, version, blob, updated)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT(name) DO UPDATE SET
               version = EXCLUDED.version,
               blob = EXCLUDED.blob,
               updated = EXCLUDED.updated`,
            [wsName, have + 1, b.blob, updated]
          );
        } else {
          putWs.run(wsName, have + 1, b.blob, updated);
        }
        return send(res, 200, { version: have + 1, updated: updated });
      } catch (e) {
        return send(res, e.code === 413 ? 413 : 400, {
          error: e.code === 413 ? e.message : "Bad request body",
        });
      }
    }
    return send(res, 405, { error: "Method not allowed" });
  }

  // Authentication check for all other /api/ routes
  if (!authed(req)) {
    return send(res, 401, { error: "Wrong or missing team token" });
  }

  // Route: /api/workspaces
  if (pathname === "/api/workspaces") {
    if (req.method === "GET") {
      var wsRows = isPostgres
        ? (
            await pool.query(
              "SELECT name, created_at, updated_at FROM workspaces ORDER BY name"
            )
          ).rows
        : sqliteDb
            .prepare(
              "SELECT name, created_at, updated_at FROM workspaces ORDER BY name"
            )
            .all();

      var list = wsRows.map(function (r) {
        var cAt = toIso(r.created_at);
        var uAt = toIso(r.updated_at);
        return {
          name: r.name,
          savedAt: uAt,
          updated_at: uAt,
          created_at: cAt,
        };
      });
      return send(res, 200, list);
    }
    if (req.method === "POST") {
      try {
        var text = await readBody(req);
        var body = JSON.parse(text);
        if (!body || typeof body.name !== "string" || !body.name.trim()) {
          return send(res, 400, { error: "Workspace name is required" });
        }
        var name = body.name.trim();
        if (!isValidName(name)) {
          return send(res, 400, { error: "Invalid workspace name" });
        }
        var now = new Date().toISOString();
        try {
          if (isPostgres) {
            await pool.query(
              "INSERT INTO workspaces (name, created_at, updated_at) VALUES ($1, $2, $3)",
              [name, now, now]
            );
          } else {
            sqliteDb
              .prepare(
                "INSERT INTO workspaces (name, created_at, updated_at) VALUES (?, ?, ?)"
              )
              .run(name, now, now);
          }
          return send(res, 201, {
            ok: true,
            name: name,
            savedAt: now,
            updated_at: now,
          });
        } catch (e) {
          if (
            (e.code && e.code === "23505") ||
            (e.message &&
              (e.message.includes("UNIQUE constraint failed") ||
                e.message.includes("duplicate key") ||
                e.message.includes("unique constraint")))
          ) {
            return send(res, 409, { error: "Workspace already exists" });
          }
          throw e;
        }
      } catch (e) {
        return send(res, e.code === 413 ? 413 : 400, {
          error: e.code === 413 ? e.message : "Bad request body",
        });
      }
    }
    return send(res, 405, { error: "Method not allowed" });
  }

  // Route: DELETE /api/workspaces/:name
  var mWsDelete = /^\/api\/workspaces\/([^/?]+)$/.exec(pathname);
  if (mWsDelete) {
    if (req.method === "DELETE") {
      var delName = "";
      try {
        delName = decodeURIComponent(mWsDelete[1]);
      } catch (e) {
        return send(res, 400, { error: "Bad Request: invalid URI component" });
      }
      if (!isValidName(delName)) {
        return send(res, 404, { error: "Workspace not found" });
      }

      if (isPostgres) {
        var existingPg = await pool.query(
          "SELECT name FROM workspaces WHERE name = $1",
          [delName]
        );
        if (existingPg.rows.length === 0) {
          return send(res, 404, { error: "Workspace not found" });
        }

        var client = await pool.connect();
        try {
          await client.query("BEGIN");
          await client.query("DELETE FROM stores WHERE workspace_id = $1", [delName]);
          await client.query("DELETE FROM batches WHERE workspace_id = $1", [delName]);
          await client.query("DELETE FROM findings WHERE workspace_id = $1", [delName]);
          await client.query("DELETE FROM assets WHERE workspace_id = $1", [delName]);
          await client.query("DELETE FROM audit_log WHERE workspace_id = $1", [delName]);
          await client.query("DELETE FROM evidence WHERE workspace_id = $1", [delName]);
          await client.query("DELETE FROM ws WHERE name = $1", [delName]);
          await client.query("DELETE FROM workspaces WHERE name = $1", [delName]);
          await client.query("COMMIT");
          return send(res, 200, { ok: true, deleted: delName });
        } catch (e) {
          await client.query("ROLLBACK");
          return send(res, 500, { error: e.message });
        } finally {
          client.release();
        }
      } else {
        var existing = sqliteDb
          .prepare("SELECT name FROM workspaces WHERE name = ?")
          .get(delName);
        if (!existing) {
          return send(res, 404, { error: "Workspace not found" });
        }

        sqliteDb.exec("BEGIN");
        try {
          sqliteDb.prepare("DELETE FROM stores WHERE workspace_id = ?").run(delName);
          sqliteDb.prepare("DELETE FROM batches WHERE workspace_id = ?").run(delName);
          sqliteDb.prepare("DELETE FROM findings WHERE workspace_id = ?").run(delName);
          sqliteDb.prepare("DELETE FROM assets WHERE workspace_id = ?").run(delName);
          sqliteDb.prepare("DELETE FROM audit_log WHERE workspace_id = ?").run(delName);
          sqliteDb.prepare("DELETE FROM evidence WHERE workspace_id = ?").run(delName);
          sqliteDb.prepare("DELETE FROM ws WHERE name = ?").run(delName);
          sqliteDb.prepare("DELETE FROM workspaces WHERE name = ?").run(delName);
          sqliteDb.exec("COMMIT");
          return send(res, 200, { ok: true, deleted: delName });
        } catch (e) {
          sqliteDb.exec("ROLLBACK");
          return send(res, 500, { error: e.message });
        }
      }
    }
    return send(res, 405, { error: "Method not allowed" });
  }

  // Route: /api/stores/:workspace/:name
  var mStoreOne = /^\/api\/stores\/([^/?]+)\/([^/?]+)$/.exec(pathname);
  if (mStoreOne) {
    var workspace = "";
    var storeName = "";
    try {
      workspace = decodeURIComponent(mStoreOne[1]);
      storeName = decodeURIComponent(mStoreOne[2]);
    } catch (e) {
      return send(res, 400, { error: "Bad Request: invalid URI component" });
    }
    if (!isValidName(workspace) || !isValidName(storeName)) {
      return send(res, 404, { error: "Not found" });
    }

    if (req.method === "GET") {
      var row = isPostgres
        ? (
            await pool.query(
              "SELECT name, value FROM stores WHERE workspace_id = $1 AND name = $2",
              [workspace, storeName]
            )
          ).rows[0]
        : sqliteDb
            .prepare(
              "SELECT name, value FROM stores WHERE workspace_id = ? AND name = ?"
            )
            .get(workspace, storeName);

      if (!row) {
        return send(res, 404, { error: "Store not found" });
      }
      var parsedData = parseJson(row.value);
      return send(res, 200, { name: row.name, data: parsedData });
    }

    if (req.method === "PUT") {
      try {
        var text = await readBody(req);
        var body = JSON.parse(text);
        var payload = body;
        if (body && typeof body === "object" && !Array.isArray(body)) {
          if ("batches" in body && "data" in body) {
            payload = body;
          } else if ("data" in body && Object.keys(body).length === 1) {
            payload = body.data;
          }
        }

        var now = new Date().toISOString();
        if (isPostgres) {
          var client = await pool.connect();
          try {
            await client.query("BEGIN");
            await client.query(
              `INSERT INTO workspaces (name, created_at, updated_at)
               VALUES ($1, $2, $3)
               ON CONFLICT(name) DO UPDATE SET updated_at = EXCLUDED.updated_at`,
              [workspace, now, now]
            );
            await saveStoreHelperPg(client, workspace, storeName, payload, now);
            await client.query("COMMIT");
            return send(res, 200, {
              ok: true,
              name: storeName,
              updated_at: now,
            });
          } catch (e) {
            await client.query("ROLLBACK");
            throw e;
          } finally {
            client.release();
          }
        } else {
          sqliteDb.exec("BEGIN");
          try {
            sqliteDb
              .prepare(
                "INSERT OR IGNORE INTO workspaces (name, created_at, updated_at) VALUES (?, ?, ?)"
              )
              .run(workspace, now, now);
            sqliteDb
              .prepare("UPDATE workspaces SET updated_at = ? WHERE name = ?")
              .run(now, workspace);

            saveStoreHelperSqlite(workspace, storeName, payload, now);
            sqliteDb.exec("COMMIT");
            return send(res, 200, {
              ok: true,
              name: storeName,
              updated_at: now,
            });
          } catch (e) {
            sqliteDb.exec("ROLLBACK");
            throw e;
          }
        }
      } catch (e) {
        return send(res, e.code === 413 ? 413 : 400, {
          error: e.code === 413 ? e.message : "Bad request body",
        });
      }
    }

    if (req.method === "DELETE") {
      if (isPostgres) {
        var client = await pool.connect();
        try {
          await client.query("BEGIN");
          await client.query(
            "DELETE FROM stores WHERE workspace_id = $1 AND name = $2",
            [workspace, storeName]
          );
          if (storeName === "scans") {
            await client.query("DELETE FROM batches WHERE workspace_id = $1", [workspace]);
            await client.query("DELETE FROM findings WHERE workspace_id = $1", [workspace]);
          } else if (storeName === "assets") {
            await client.query("DELETE FROM assets WHERE workspace_id = $1", [workspace]);
          } else if (storeName === "audit") {
            await client.query("DELETE FROM audit_log WHERE workspace_id = $1", [workspace]);
          }
          await client.query("COMMIT");
          return send(res, 200, { ok: true, name: storeName });
        } catch (e) {
          await client.query("ROLLBACK");
          return send(res, 500, { error: e.message });
        } finally {
          client.release();
        }
      } else {
        sqliteDb.exec("BEGIN");
        try {
          sqliteDb
            .prepare("DELETE FROM stores WHERE workspace_id = ? AND name = ?")
            .run(workspace, storeName);
          if (storeName === "scans") {
            sqliteDb.prepare("DELETE FROM batches WHERE workspace_id = ?").run(workspace);
            sqliteDb.prepare("DELETE FROM findings WHERE workspace_id = ?").run(workspace);
          } else if (storeName === "assets") {
            sqliteDb.prepare("DELETE FROM assets WHERE workspace_id = ?").run(workspace);
          } else if (storeName === "audit") {
            sqliteDb.prepare("DELETE FROM audit_log WHERE workspace_id = ?").run(workspace);
          }
          sqliteDb.exec("COMMIT");
          return send(res, 200, { ok: true, name: storeName });
        } catch (e) {
          sqliteDb.exec("ROLLBACK");
          return send(res, 500, { error: e.message });
        }
      }
    }
    return send(res, 405, { error: "Method not allowed" });
  }

  // Route: /api/stores/:workspace
  var mStoreAll = /^\/api\/stores\/([^/?]+)$/.exec(pathname);
  if (mStoreAll) {
    var wsNameAll = "";
    try {
      wsNameAll = decodeURIComponent(mStoreAll[1]);
    } catch (e) {
      return send(res, 400, { error: "Bad Request: invalid URI component" });
    }
    if (!isValidName(wsNameAll)) {
      return send(res, 404, { error: "Not found" });
    }

    if (req.method === "GET") {
      if (isPostgres) {
        var wsExistPg = await pool.query(
          "SELECT name FROM workspaces WHERE name = $1",
          [wsNameAll]
        );
        if (wsExistPg.rows.length === 0) {
          return send(res, 404, { error: "Workspace not found" });
        }
        var allRowsPg = (
          await pool.query(
            "SELECT name, value FROM stores WHERE workspace_id = $1",
            [wsNameAll]
          )
        ).rows;
        var resultPg = {};
        for (var r of allRowsPg) {
          resultPg[r.name] = parseJson(r.value);
        }
        return send(res, 200, resultPg);
      } else {
        var wsExist = sqliteDb
          .prepare("SELECT name FROM workspaces WHERE name = ?")
          .get(wsNameAll);
        if (!wsExist) {
          return send(res, 404, { error: "Workspace not found" });
        }
        var allRows = sqliteDb
          .prepare("SELECT name, value FROM stores WHERE workspace_id = ?")
          .all(wsNameAll);
        var result = {};
        for (var r of allRows) {
          result[r.name] = parseJson(r.value);
        }
        return send(res, 200, result);
      }
    }
    return send(res, 405, { error: "Method not allowed" });
  }

  // Route: /api/evidence/:workspace/:key
  var mEvidence = /^\/api\/evidence\/([^/?]+)\/([^/?]+)$/.exec(pathname);
  if (mEvidence) {
    var evWorkspace = "";
    var evKey = "";
    try {
      evWorkspace = decodeURIComponent(mEvidence[1]);
      evKey = decodeURIComponent(mEvidence[2]);
    } catch (e) {
      return send(res, 400, { error: "Bad Request: invalid URI component" });
    }
    if (!isValidName(evWorkspace) || !isValidKey(evKey)) {
      return send(res, 404, { error: "Not found" });
    }

    if (req.method === "GET") {
      var evRow = isPostgres
        ? (
            await pool.query(
              "SELECT finding_key, data FROM evidence WHERE workspace_id = $1 AND finding_key = $2",
              [evWorkspace, evKey]
            )
          ).rows[0]
        : sqliteDb
            .prepare(
              "SELECT finding_key, data FROM evidence WHERE workspace_id = ? AND finding_key = ?"
            )
            .get(evWorkspace, evKey);

      if (!evRow) {
        return send(res, 200, { key: evKey, data: [] });
      }
      var evData = parseJson(evRow.data);
      if (!Array.isArray(evData)) evData = [evData];
      return send(res, 200, { key: evRow.finding_key, data: evData });
    }

    if (req.method === "PUT") {
      try {
        var text = await readBody(req);
        var body = JSON.parse(text);
        var evData =
          body && typeof body === "object" && "data" in body ? body.data : body;
        var now = new Date().toISOString();

        if (isPostgres) {
          var client = await pool.connect();
          try {
            await client.query("BEGIN");
            await client.query(
              `INSERT INTO workspaces (name, created_at, updated_at)
               VALUES ($1, $2, $3)
               ON CONFLICT(name) DO UPDATE SET updated_at = EXCLUDED.updated_at`,
              [evWorkspace, now, now]
            );
            await client.query(
              `INSERT INTO evidence (workspace_id, finding_key, data, updated_at)
               VALUES ($1, $2, $3::jsonb, $4)
               ON CONFLICT(workspace_id, finding_key) DO UPDATE SET
                 data = EXCLUDED.data,
                 updated_at = EXCLUDED.updated_at`,
              [evWorkspace, evKey, JSON.stringify(evData), now]
            );
            await client.query("COMMIT");
            return send(res, 200, { ok: true, key: evKey, updated_at: now });
          } catch (e) {
            await client.query("ROLLBACK");
            throw e;
          } finally {
            client.release();
          }
        } else {
          sqliteDb.exec("BEGIN");
          try {
            sqliteDb
              .prepare(
                "INSERT OR IGNORE INTO workspaces (name, created_at, updated_at) VALUES (?, ?, ?)"
              )
              .run(evWorkspace, now, now);
            sqliteDb.prepare(`
              INSERT INTO evidence (workspace_id, finding_key, data, updated_at)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(workspace_id, finding_key) DO UPDATE SET
                data = excluded.data,
                updated_at = excluded.updated_at
            `).run(evWorkspace, evKey, JSON.stringify(evData), now);
            sqliteDb.exec("COMMIT");
            return send(res, 200, { ok: true, key: evKey, updated_at: now });
          } catch (e) {
            sqliteDb.exec("ROLLBACK");
            throw e;
          }
        }
      } catch (e) {
        return send(res, e.code === 413 ? 413 : 400, {
          error: e.code === 413 ? e.message : "Bad request body",
        });
      }
    }

    if (req.method === "DELETE") {
      if (isPostgres) {
        await pool.query(
          "DELETE FROM evidence WHERE workspace_id = $1 AND finding_key = $2",
          [evWorkspace, evKey]
        );
      } else {
        sqliteDb
          .prepare(
            "DELETE FROM evidence WHERE workspace_id = ? AND finding_key = ?"
          )
          .run(evWorkspace, evKey);
      }
      return send(res, 200, { ok: true, key: evKey });
    }
    return send(res, 405, { error: "Method not allowed" });
  }

  // Route: /api/backup/:workspace
  var mBackup = /^\/api\/backup\/([^/?]+)$/.exec(pathname);
  if (mBackup) {
    var bWorkspace = "";
    try {
      bWorkspace = decodeURIComponent(mBackup[1]);
    } catch (e) {
      return send(res, 400, { error: "Bad Request: invalid URI component" });
    }
    if (!isValidName(bWorkspace)) {
      return send(res, 404, { error: "Workspace not found" });
    }

    if (req.method === "GET") {
      if (isPostgres) {
        var wsExistPg = await pool.query(
          "SELECT name FROM workspaces WHERE name = $1",
          [bWorkspace]
        );
        if (wsExistPg.rows.length === 0) {
          return send(res, 404, { error: "Workspace not found" });
        }

        var storeRowsPg = (
          await pool.query(
            "SELECT name, value FROM stores WHERE workspace_id = $1",
            [bWorkspace]
          )
        ).rows;
        var bStoresPg = {};
        for (var sr of storeRowsPg) {
          bStoresPg[sr.name] = parseJson(sr.value);
        }

        var evRowsPg = (
          await pool.query(
            "SELECT finding_key, data FROM evidence WHERE workspace_id = $1",
            [bWorkspace]
          )
        ).rows;
        var bEvidencePg = {};
        for (var er of evRowsPg) {
          bEvidencePg[er.finding_key] = parseJson(er.data);
        }

        return send(res, 200, {
          app: "VAPTLens",
          workspace: bWorkspace,
          stores: bStoresPg,
          evidence: bEvidencePg,
        });
      } else {
        var wsExist = sqliteDb
          .prepare("SELECT name FROM workspaces WHERE name = ?")
          .get(bWorkspace);
        if (!wsExist) {
          return send(res, 404, { error: "Workspace not found" });
        }

        var storeRows = sqliteDb
          .prepare("SELECT name, value FROM stores WHERE workspace_id = ?")
          .all(bWorkspace);
        var bStores = {};
        for (var sr of storeRows) {
          bStores[sr.name] = parseJson(sr.value);
        }

        var evRows = sqliteDb
          .prepare("SELECT finding_key, data FROM evidence WHERE workspace_id = ?")
          .all(bWorkspace);
        var bEvidence = {};
        for (var er of evRows) {
          bEvidence[er.finding_key] = parseJson(er.data);
        }

        return send(res, 200, {
          app: "VAPTLens",
          workspace: bWorkspace,
          stores: bStores,
          evidence: bEvidence,
        });
      }
    }
    return send(res, 405, { error: "Method not allowed" });
  }

  // Route: /api/restore/:workspace
  var mRestore = /^\/api\/restore\/([^/?]+)$/.exec(pathname);
  if (mRestore) {
    var rWorkspace = "";
    try {
      rWorkspace = decodeURIComponent(mRestore[1]);
    } catch (e) {
      return send(res, 400, { error: "Bad Request: invalid URI component" });
    }
    if (!isValidName(rWorkspace)) {
      return send(res, 404, { error: "Invalid workspace name" });
    }

    if (req.method === "POST") {
      try {
        var text = await readBody(req);
        var snap = JSON.parse(text);
        if (!snap || typeof snap !== "object") {
          return send(res, 400, { error: "Snapshot must be an object" });
        }
        if (snap.app && snap.app !== "VAPTLens") {
          return send(res, 400, { error: "Not a VAPTLens snapshot" });
        }

        var now = new Date().toISOString();
        if (isPostgres) {
          var client = await pool.connect();
          try {
            await client.query("BEGIN");
            await client.query(
              `INSERT INTO workspaces (name, created_at, updated_at)
               VALUES ($1, $2, $3)
               ON CONFLICT(name) DO UPDATE SET updated_at = EXCLUDED.updated_at`,
              [rWorkspace, now, now]
            );

            await client.query("DELETE FROM stores WHERE workspace_id = $1", [rWorkspace]);
            await client.query("DELETE FROM batches WHERE workspace_id = $1", [rWorkspace]);
            await client.query("DELETE FROM findings WHERE workspace_id = $1", [rWorkspace]);
            await client.query("DELETE FROM assets WHERE workspace_id = $1", [rWorkspace]);
            await client.query("DELETE FROM audit_log WHERE workspace_id = $1", [rWorkspace]);
            await client.query("DELETE FROM evidence WHERE workspace_id = $1", [rWorkspace]);

            if (snap.stores && typeof snap.stores === "object") {
              for (var [sName, sVal] of Object.entries(snap.stores)) {
                await saveStoreHelperPg(client, rWorkspace, sName, sVal, now);
              }
            }

            if (snap.evidence && typeof snap.evidence === "object") {
              for (var [eKey, eVal] of Object.entries(snap.evidence)) {
                await client.query(
                  `INSERT INTO evidence (workspace_id, finding_key, data, updated_at)
                   VALUES ($1, $2, $3::jsonb, $4)`,
                  [rWorkspace, eKey, JSON.stringify(eVal), now]
                );
              }
            }

            await client.query("COMMIT");
            return send(res, 200, { ok: true, workspace: rWorkspace });
          } catch (e) {
            await client.query("ROLLBACK");
            throw e;
          } finally {
            client.release();
          }
        } else {
          sqliteDb.exec("BEGIN");
          try {
            sqliteDb
              .prepare(
                "INSERT OR IGNORE INTO workspaces (name, created_at, updated_at) VALUES (?, ?, ?)"
              )
              .run(rWorkspace, now, now);
            sqliteDb
              .prepare("UPDATE workspaces SET updated_at = ? WHERE name = ?")
              .run(now, rWorkspace);

            sqliteDb.prepare("DELETE FROM stores WHERE workspace_id = ?").run(rWorkspace);
            sqliteDb.prepare("DELETE FROM batches WHERE workspace_id = ?").run(rWorkspace);
            sqliteDb.prepare("DELETE FROM findings WHERE workspace_id = ?").run(rWorkspace);
            sqliteDb.prepare("DELETE FROM assets WHERE workspace_id = ?").run(rWorkspace);
            sqliteDb.prepare("DELETE FROM audit_log WHERE workspace_id = ?").run(rWorkspace);
            sqliteDb.prepare("DELETE FROM evidence WHERE workspace_id = ?").run(rWorkspace);

            if (snap.stores && typeof snap.stores === "object") {
              for (var [sName, sVal] of Object.entries(snap.stores)) {
                saveStoreHelperSqlite(rWorkspace, sName, sVal, now);
              }
            }

            if (snap.evidence && typeof snap.evidence === "object") {
              var insertEv = sqliteDb.prepare(`
                INSERT INTO evidence (workspace_id, finding_key, data, updated_at)
                VALUES (?, ?, ?, ?)
              `);
              for (var [eKey, eVal] of Object.entries(snap.evidence)) {
                insertEv.run(rWorkspace, eKey, JSON.stringify(eVal), now);
              }
            }

            sqliteDb.exec("COMMIT");
            return send(res, 200, { ok: true, workspace: rWorkspace });
          } catch (e) {
            sqliteDb.exec("ROLLBACK");
            throw e;
          }
        }
      } catch (e) {
        return send(res, e.code === 413 ? 413 : 400, {
          error: e.code === 413 ? e.message : "Bad request body",
        });
      }
    }
    return send(res, 405, { error: "Method not allowed" });
  }

  return send(res, 404, { error: "Not found" });
}

export { db, pool, isPostgres };

var TOKEN = process.env.SYNC_TOKEN || "";
var dbEngineName = isPostgres ? "PostgreSQL" : "SQLite";
if (!TOKEN) {
  console.log(
    `VAPTLens ${dbEngineName} server: SYNC_TOKEN not set; authentication is disabled (standalone mode).`
  );
  if (!/^(127\.|::1$|localhost$)/.test(HOST))
    console.warn(
      `WARNING: listening on ${HOST} with no SYNC_TOKEN. Anyone who can reach this port can read and write every workspace. Only do this behind a proxy that is itself not exposed.`
    );
} else {
  console.log(
    `VAPTLens ${dbEngineName} server: SYNC_TOKEN set; team authentication is active.`
  );
}

if (
  import.meta.url === "file://" + process.argv[1] ||
  (process.argv[1] && import.meta.url.endsWith(process.argv[1]))
) {
  createServer(handler).listen(PORT, HOST, function () {
    console.log(`vaptlens server listening on ${HOST}:${PORT} (${dbEngineName})`);
  });
}
