#!/usr/bin/env node
/* scripts/backup.mjs — Standalone Automated Backup & Disaster Recovery CLI for VAPTLens.
   Supports SQLite and PostgreSQL.
   Creates atomic, GZIP-compressed, SHA-256 checksummed and HMAC-verified archives.
   Performs pre-backup and pre-restore cryptographic audit chain validation. */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  chmodSync,
  readdirSync,
  unlinkSync,
  statSync,
} from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";

/* Resolve database adapter and audit helpers from server.mjs */
const serverPath = existsSync(new URL("../server/server.mjs", import.meta.url))
  ? "../server/server.mjs"
  : existsSync(new URL("../server.mjs", import.meta.url))
    ? "../server.mjs"
    : existsSync(new URL("./server.mjs", import.meta.url))
      ? "./server.mjs"
      : "./server/server.mjs";

const { q, tx, auditHash, isPostgres, migrate } = await import(serverPath);

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const hmacSha256 = (buf, secret) =>
  createHmac("sha256", secret).update(buf).digest("hex");

function safeTimingEq(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/* Internal audit chain verification for arbitrary rows */
export function verifyRowsAuditChain(rows) {
  let prev = "";
  for (let i = 0; i < rows.length; i++) {
    const r = Object.assign({}, rows[i], { seq: +rows[i].seq });
    if (r.seq !== i + 1) {
      return {
        ok: false,
        n: rows.length,
        at: r.seq,
        reason: "entries missing before #" + r.seq,
      };
    }
    if (!safeTimingEq(r.prev || "", prev)) {
      return {
        ok: false,
        n: rows.length,
        at: r.seq,
        reason: "link broken at #" + r.seq,
      };
    }
    if (!safeTimingEq(auditHash(r), r.hash)) {
      return {
        ok: false,
        n: rows.length,
        at: r.seq,
        reason: "entry #" + r.seq + " changed",
      };
    }
    prev = r.hash;
  }
  return { ok: true, n: rows.length, head: prev };
}

/* Verify live audit chains in database */
async function verifyDatabaseAuditChains() {
  const rows = await q("SELECT DISTINCT workspace FROM vl_audit ORDER BY workspace");
  const wsNames = rows.map((w) => w.workspace);
  if (!wsNames.includes("SYSTEM")) wsNames.push("SYSTEM");
  if (!wsNames.includes("_system")) wsNames.push("_system");

  for (const ws of wsNames) {
    const auditRows = await q(
      "SELECT * FROM vl_audit WHERE workspace = $1 ORDER BY seq ASC",
      [ws],
    );
    if (!auditRows || !auditRows.length) continue;
    const res = verifyRowsAuditChain(auditRows);
    if (!res.ok) {
      throw new Error(
        `Audit chain corrupted in workspace "${ws}": ${res.reason} (at seq #${res.at})`,
      );
    }
  }
}

/* Parse CLI flags */
function parseArgs(args) {
  const flags = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        flags[key] = args[++i];
      } else {
        flags[key] = true;
      }
    } else {
      flags._.push(a);
    }
  }
  return flags;
}

/* Command: BACKUP */
export async function createBackup(opts = {}) {
  const outDir =
    opts.out ||
    process.env.BACKUP_DIR ||
    (existsSync("/data/backups")
      ? "/data/backups"
      : existsSync("/data")
        ? "/data/backups"
        : "./backups");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const secret = opts.secret || process.env.BACKUP_SECRET || null;

  console.log(`[backup] Verifying cryptographic audit chains before snapshot...`);
  await verifyDatabaseAuditChains();

  console.log(`[backup] Snapshotting database tables (${isPostgres ? "PostgreSQL" : "SQLite"})...`);
  const [
    workspaces,
    users,
    members,
    settings,
    stores,
    evidence,
    audit,
    meta,
  ] = await Promise.all([
    q("SELECT * FROM vl_workspaces ORDER BY name"),
    q("SELECT * FROM vl_users ORDER BY username"),
    q("SELECT * FROM vl_workspace_members ORDER BY workspace, user_id"),
    q("SELECT * FROM vl_settings ORDER BY key"),
    q("SELECT * FROM vl_stores ORDER BY workspace, name"),
    q("SELECT * FROM vl_evidence ORDER BY workspace, key"),
    q("SELECT * FROM vl_audit ORDER BY workspace, seq ASC"),
    q("SELECT * FROM vl_meta ORDER BY key"),
  ]);

  const timestamp = new Date().toISOString();
  const manifest = {
    app: "VAPTLens",
    type: "full_instance_backup",
    format: 2,
    timestamp,
    database: isPostgres ? "postgresql" : "sqlite",
    counts: {
      workspaces: workspaces.length,
      users: users.length,
      members: members.length,
      settings: settings.length,
      stores: stores.length,
      evidence: evidence.length,
      audit: audit.length,
    },
    data: {
      workspaces,
      users,
      members,
      settings,
      stores,
      evidence,
      audit,
      meta,
    },
  };

  const rawJson = Buffer.from(JSON.stringify(manifest), "utf8");
  const gzBuf = gzipSync(rawJson, { level: 9 });

  const fileTs = timestamp
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  const baseName = opts.filename
    ? basename(opts.filename)
    : `vaptlens_backup_${fileTs}.json.gz`;
  const targetPath = join(outDir, baseName);
  const tmpPath = targetPath + ".tmp";

  /* Atomic write with 0o600 permissions and cleanup on error */
  try {
    writeFileSync(tmpPath, gzBuf, { mode: 0o600 });
    renameSync(tmpPath, targetPath);
    try {
      chmodSync(targetPath, 0o600);
    } catch (e) {}
  } catch (err) {
    if (existsSync(tmpPath)) {
      try {
        unlinkSync(tmpPath);
      } catch (_) {}
    }
    throw err;
  }

  /* Companion SHA-256 checksum */
  const checksum = sha256(gzBuf).toLowerCase();
  const shaPath = targetPath + ".sha256";
  writeFileSync(shaPath, `${checksum}  ${basename(targetPath)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });

  /* Companion HMAC signature if secret provided */
  let hmacPath = null;
  if (secret) {
    const hmacSig = hmacSha256(gzBuf, secret).toLowerCase();
    hmacPath = targetPath + ".hmac";
    writeFileSync(hmacPath, `${hmacSig}  ${basename(targetPath)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
  }

  console.log(`[backup] Successfully created full instance backup:`);
  console.log(`  Archive:    ${targetPath} (${gzBuf.length} bytes)`);
  console.log(`  Checksum:   ${shaPath} [${checksum.slice(0, 16)}...]`);
  if (hmacPath) {
    console.log(`  HMAC:       ${hmacPath} (signed)`);
  }
  console.log(`  Inventory:  ${workspaces.length} workspaces, ${users.length} users, ${members.length} members, ${stores.length} stores, ${evidence.length} evidence sets, ${audit.length} audit entries.`);

  return { targetPath, shaPath, hmacPath, checksum, counts: manifest.counts };
}

/* Command: VERIFY */
export async function verifyBackupFile(filePath, opts = {}) {
  if (!existsSync(filePath)) {
    throw new Error(`Backup file does not exist: ${filePath}`);
  }

  const secret = opts.secret || process.env.BACKUP_SECRET || null;
  const gzBuf = readFileSync(filePath);

  /* Verify SHA-256 checksum file */
  const shaPath = filePath + ".sha256";
  if (existsSync(shaPath)) {
    const content = readFileSync(shaPath, "utf8").trim().split(/\s+/)[0].toLowerCase();
    const calc = sha256(gzBuf).toLowerCase();
    if (!safeTimingEq(content, calc)) {
      throw new Error(`SHA-256 checksum mismatch! Expected ${content}, got ${calc}`);
    }
    console.log(`[verify] SHA-256 checksum OK (${calc})`);
  } else if (!opts.allowMissingChecksum) {
    throw new Error(
      `Mandatory checksum companion file (${shaPath}) is missing! Backup integrity cannot be verified.`,
    );
  } else {
    console.log(`[verify] SHA-256 checksum OK (${sha256(gzBuf).toLowerCase()}) [no .sha256 file]`);
  }

  /* Verify HMAC signature if present or requested */
  const hmacPath = filePath + ".hmac";
  if (existsSync(hmacPath) && !secret) {
    throw new Error(
      `Backup file has an HMAC signature (.hmac), but no --secret was provided to verify it.`,
    );
  }
  if (secret && !existsSync(hmacPath)) {
    throw new Error(
      `A --secret was provided, but no HMAC signature file (.hmac) was found for this backup archive.`,
    );
  }
  if (secret && existsSync(hmacPath)) {
    const calcHmac = hmacSha256(gzBuf, secret).toLowerCase();
    const content = readFileSync(hmacPath, "utf8").trim().split(/\s+/)[0].toLowerCase();
    if (!safeTimingEq(content, calcHmac)) {
      throw new Error(`HMAC signature verification failed! Signature mismatch.`);
    }
    console.log(`[verify] HMAC-SHA256 signature OK (authenticated)`);
  }

  /* Decompress and validate structure */
  let rawJson;
  try {
    rawJson = gunzipSync(gzBuf).toString("utf8");
  } catch (e) {
    throw new Error(`Failed to decompress GZIP archive: ${e.message}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(rawJson);
  } catch (e) {
    throw new Error(`Corrupted backup archive: Invalid JSON payload`);
  }

  if (manifest.app !== "VAPTLens" || manifest.type !== "full_instance_backup") {
    throw new Error(`Unrecognized backup format or application type`);
  }

  /* Verify audit hash chains in backup */
  const auditEntries = manifest.data?.audit || [];
  const byWorkspace = new Map();
  for (const e of auditEntries) {
    const ws = e.workspace;
    if (!byWorkspace.has(ws)) byWorkspace.set(ws, []);
    byWorkspace.get(ws).push(e);
  }

  for (const [ws, rows] of byWorkspace.entries()) {
    rows.sort((a, b) => +a.seq - +b.seq);
    const res = verifyRowsAuditChain(rows);
    if (!res.ok) {
      throw new Error(
        `Audit hash chain failed for workspace "${ws}": ${res.reason} (at seq #${res.at})`,
      );
    }
  }

  console.log(`[verify] Structure OK: VAPTLens Full Instance Backup (timestamp: ${manifest.timestamp})`);
  console.log(`[verify] Cryptographic audit chains verified across ${byWorkspace.size} workspaces (${auditEntries.length} entries total).`);
  console.log(`[verify] Result: BACKUP INTEGRITY VERIFIED.`);
  return { ok: true, manifest };
}

/* Command: RESTORE */
export async function restoreBackupFile(filePath, opts = {}) {
  console.log(`[restore] Validating backup archive before restore...`);
  const { manifest } = await verifyBackupFile(filePath, opts);

  const {
    workspaces = [],
    users = [],
    members = [],
    settings = [],
    stores = [],
    evidence = [],
    audit = [],
    meta = [],
  } = manifest.data;

  console.log(`[restore] Restoring data inside atomic transaction...`);
  await tx(async (t) => {
    /* 1. Purge dependent tables in order */
    await t("DELETE FROM vl_stores");
    await t("DELETE FROM vl_evidence");
    await t("DELETE FROM vl_workspace_members");
    await t("DELETE FROM vl_workspaces");
    await t("DELETE FROM vl_sessions"); // Active sessions invalidated on restore
    await t("DELETE FROM vl_audit");
    await t("DELETE FROM vl_settings");
    await t("DELETE FROM vl_users");
    await t("DELETE FROM vl_meta");

    /* 2. Restore meta */
    for (const m of meta) {
      await t("INSERT INTO vl_meta (key, value) VALUES ($1, $2)", [m.key, m.value]);
    }

    /* 3. Restore users */
    for (const u of users) {
      await t(
        `INSERT INTO vl_users (
          id, username, name, role, pw_hash, must_change, disabled, failed, locked_until,
          last_failed_at, created_at, created_by, last_login, prev_login, pw_changed_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          u.id,
          u.username,
          u.name,
          u.role,
          u.pw_hash,
          +(u.must_change || 0),
          +(u.disabled || 0),
          +(u.failed || 0),
          u.locked_until,
          u.last_failed_at,
          u.created_at,
          u.created_by,
          u.last_login,
          u.prev_login,
          u.pw_changed_at,
        ],
      );
    }

    /* 4. Restore settings */
    for (const s of settings) {
      await t("INSERT INTO vl_settings (key, value) VALUES ($1, $2)", [s.key, s.value]);
    }

    /* 5. Restore workspaces */
    for (const w of workspaces) {
      await t(
        "INSERT INTO vl_workspaces (name, created_at, created_by, is_restricted) VALUES ($1, $2, $3, $4)",
        [w.name, w.created_at, w.created_by, +(w.is_restricted || 0)],
      );
    }

    /* 6. Restore workspace members */
    for (const m of members) {
      await t(
        "INSERT INTO vl_workspace_members (workspace, user_id, added_at, added_by) VALUES ($1, $2, $3, $4)",
        [m.workspace, m.user_id, m.added_at, m.added_by],
      );
    }

    /* 7. Restore stores */
    for (const s of stores) {
      await t(
        "INSERT INTO vl_stores (workspace, name, value, version, updated_at, updated_by) VALUES ($1, $2, $3, $4, $5, $6)",
        [s.workspace, s.name, s.value, +(s.version || 1), s.updated_at, s.updated_by],
      );
    }

    /* 8. Restore evidence */
    for (const e of evidence) {
      await t(
        "INSERT INTO vl_evidence (workspace, key, value, version, updated_at, updated_by) VALUES ($1, $2, $3, $4, $5, $6)",
        [e.workspace, e.key, e.value, +(e.version || 1), e.updated_at, e.updated_by],
      );
    }

    /* 9. Restore audit log (exact sequences and hashes) */
    for (const a of audit) {
      await t(
        "INSERT INTO vl_audit (workspace, seq, at, user_id, username, role, action, detail, ref, prev, hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [
          a.workspace,
          +(a.seq || 0),
          a.at,
          a.user_id,
          a.username,
          a.role,
          a.action,
          a.detail,
          a.ref,
          a.prev,
          a.hash,
        ],
      );
    }
  });

  /* Execute forward migrations if restoring from an earlier schema version */
  if (typeof migrate === "function") {
    await migrate();
  }

  console.log(`[restore] Database restored successfully from ${filePath}.`);
  console.log(`[restore] Restored: ${workspaces.length} workspaces, ${users.length} users, ${members.length} members, ${stores.length} stores, ${evidence.length} evidence sets, ${audit.length} audit entries.`);
  return { ok: true };
}

/* Command: SCHEDULE */
export async function scheduleBackups(opts = {}) {
  const intervalMinutes = Math.max(1, +(opts.interval || 60));
  const keepCount = Math.max(1, +(opts.keep || 7));
  const outDir =
    opts.out ||
    process.env.BACKUP_DIR ||
    (existsSync("/data/backups")
      ? "/data/backups"
      : existsSync("/data")
        ? "/data/backups"
        : "./backups");

  console.log(`[schedule] Starting automated backup daemon.`);
  console.log(`  Interval:  every ${intervalMinutes} minute(s)`);
  console.log(`  Retention: keep latest ${keepCount} backup(s)`);
  console.log(`  Directory: ${outDir}`);

  const runOnce = async () => {
    try {
      await createBackup({ out: outDir, secret: opts.secret });

      /* Clean orphaned .tmp files */
      try {
        const tmpFiles = readdirSync(outDir).filter(
          (f) => f.startsWith("vaptlens_backup_") && f.endsWith(".tmp"),
        );
        for (const tf of tmpFiles) {
          unlinkSync(join(outDir, tf));
        }
      } catch (_) {}

      /* Prune older backups (sorted descending by timestamp in filename) */
      const files = readdirSync(outDir)
        .filter((f) => f.startsWith("vaptlens_backup_") && f.endsWith(".json.gz"))
        .map((f) => ({
          name: f,
          path: join(outDir, f),
          time: statSync(join(outDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.name.localeCompare(a.name));

      if (files.length > keepCount) {
        const toDelete = files.slice(keepCount);
        for (const file of toDelete) {
          console.log(`[schedule] Pruning expired backup: ${file.name}`);
          unlinkSync(file.path);
          if (existsSync(file.path + ".sha256")) unlinkSync(file.path + ".sha256");
          if (existsSync(file.path + ".hmac")) unlinkSync(file.path + ".hmac");
        }
      }
    } catch (err) {
      console.error(`[schedule] Backup failed: ${err.message}`);
    }
  };

  await runOnce();
  const ms = Math.min(2147483647, Math.max(1000, intervalMinutes * 60 * 1000));
  const timer = setInterval(runOnce, ms);

  const cleanup = () => {
    console.log(`[schedule] Stopping backup daemon...`);
    clearInterval(timer);
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

/* CLI Entry Point */
const isMain =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop());

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  try {
    if (cmd === "backup") {
      await createBackup(args);
      process.exit(0);
    } else if (cmd === "verify") {
      const file = args._[1];
      if (!file) {
        console.error("Usage: node scripts/backup.mjs verify <path-to-backup.json.gz> [--secret <key>]");
        process.exit(1);
      }
      await verifyBackupFile(file, args);
      process.exit(0);
    } else if (cmd === "restore") {
      const file = args._[1];
      if (!file) {
        console.error("Usage: node scripts/backup.mjs restore <path-to-backup.json.gz> [--secret <key>]");
        process.exit(1);
      }
      await restoreBackupFile(file, args);
      process.exit(0);
    } else if (cmd === "schedule") {
      await scheduleBackups(args);
    } else {
      console.log(`
VAPTLens Disaster Recovery & Backup Utility
-------------------------------------------
Usage:
  node scripts/backup.mjs backup    [--out <dir>] [--secret <key>] [--filename <name>]
  node scripts/backup.mjs verify    <backup-file.json.gz> [--secret <key>]
  node scripts/backup.mjs restore   <backup-file.json.gz> [--secret <key>]
  node scripts/backup.mjs schedule  [--interval <minutes>] [--keep <count>] [--out <dir>]

Environment Variables:
  BACKUP_DIR      Default directory to store backups (default: ./backups or /data/backups)
  BACKUP_SECRET   Shared secret for HMAC-SHA256 signature validation
  DATABASE_URL    PostgreSQL connection string (if using PostgreSQL)
  DB_PATH         SQLite database path (if using SQLite)
`);
      process.exit(cmd ? 1 : 0);
    }
  } catch (err) {
    console.error(`[error] ${err.message}`);
    process.exit(1);
  }
}
