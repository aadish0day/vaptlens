/* VAPTLens API server — accounts, sessions, roles, workspaces, stores, evidence and an append-only audit log.
   PostgreSQL when DATABASE_URL / POSTGRES_HOST is set, otherwise SQLite (node:sqlite, Node ≥ 22.13).
   The server is the source of truth: every request is authenticated with a session cookie and authorised by role.

   Admin recovery:  node server/server.mjs reset-password <username>   (prints a temporary password)
*/
import { createServer } from "node:http";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);

const PORT = +(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const MAX_BYTES =
  64 *
  1024 *
  1024; /* keep in step with client_max_body_size in docker/nginx.conf */
const MAX_AUTH_BYTES = 16 * 1024;
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const COOKIE_SECURE = process.env.COOKIE_SECURE === "1";
/* Host allowlist (stops DNS rebinding). Comma-separated hostnames; default is loopback only. */
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || "localhost,127.0.0.1,::1")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export const ROLES = ["Administrator", "Remediation Lead", "Security Auditor"];
const ADMIN = "Administrator";
const LEAD = "Remediation Lead";
const AUDITOR = "Security Auditor";

/* the only stores a client may write; anything else is rejected */
export const STORE_NAMES = [
  "scans",
  "remediation",
  "engagement",
  "assets",
  "library",
  "report",
  "campaigns",
  "rules",
  "goals",
  "vex",
  "aliases",
  "prefs",
  "policy",
];
const ADMIN_ONLY_STORES = new Set(["policy"]);
const SYSTEM_WS = "_system";

const LOCK_AFTER = 5;
const LOCK_MINUTES = 5;
const SESSION_MAX_HOURS = 12;
const SCRYPT = { N: 1 << 15, r: 8, p: 1, keylen: 32 };

const rawDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const isPostgres = !!(
  /^postgres(ql)?:\/\//.test(rawDbUrl) || process.env.POSTGRES_HOST
);

/* ---------- database adapter: one SQL dialect ($1 params, TEXT/INTEGER columns) for both engines ---------- */
let pool = null;
let sqlite = null;
let q; /* (sql, params) -> rows */
let tx; /* (async (q) => …) -> result, run inside one transaction */

if (isPostgres) {
  const pg = (await import("pg")).default;
  pool = new pg.Pool(
    Object.assign(
      rawDbUrl
        ? { connectionString: rawDbUrl }
        : {
            host: process.env.POSTGRES_HOST,
            port: process.env.POSTGRES_PORT
              ? Number(process.env.POSTGRES_PORT)
              : 5432,
            user: process.env.POSTGRES_USER || process.env.PGUSER,
            password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD,
            database: process.env.POSTGRES_DB || process.env.PGDATABASE,
          },
      {
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        statement_timeout: 30000,
      },
    ),
  );
  pool.on("error", (e) =>
    log({ level: "error", msg: "postgres pool error", err: e.message }),
  );
  const run = async (client, sql, params = []) =>
    (await client.query(sql, params)).rows;
  q = (sql, params) => run(pool, sql, params);
  tx = async (fn) => {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      const out = await fn((sql, params) => run(c, sql, params));
      await c.query("COMMIT");
      return out;
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      c.release();
    }
  };
} else {
  const { DatabaseSync } = await import("node:sqlite");
  const dbPath =
    process.env.DB_PATH ||
    (existsSync("/data") ? "/data/vaptlens.db" : "./vaptlens.db");
  const dir = dirname(dbPath);
  if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  sqlite = new DatabaseSync(dbPath);
  sqlite.exec(
    "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;",
  );
  const conv = (sql) => sql.replace(/\$(\d+)/g, "?$1");
  const exec = (sql, params = []) => {
    const st = sqlite.prepare(conv(sql));
    return /^\s*(select|with)\b|\breturning\b/i.test(sql)
      ? st.all(...params)
      : (st.run(...params), []);
  };
  /* node:sqlite is synchronous on one connection: serialise transactions so awaits inside one can't interleave with another */
  let lock = Promise.resolve();
  const serial = (fn) => {
    const next = lock.then(fn, fn);
    lock = next.catch(() => {});
    return next;
  };
  q = (sql, params) => serial(() => exec(sql, params));
  tx = (fn) =>
    serial(async () => {
      exec("BEGIN");
      try {
        const out = await fn(async (sql, params) => exec(sql, params));
        exec("COMMIT");
        return out;
      } catch (e) {
        exec("ROLLBACK");
        throw e;
      }
    });
}

/* ---------- schema + migrations (tables are vl_-prefixed so they never collide with the pre-2026-10 schema) ---------- */
const MIGRATIONS = [
  [
    `CREATE TABLE IF NOT EXISTS vl_users (
      id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL,
      pw_hash TEXT NOT NULL, must_change INTEGER NOT NULL DEFAULT 0, disabled INTEGER NOT NULL DEFAULT 0,
      failed INTEGER NOT NULL DEFAULT 0, locked_until TEXT, last_failed_at TEXT,
      created_at TEXT NOT NULL, created_by TEXT, last_login TEXT, prev_login TEXT, pw_changed_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS vl_sessions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES vl_users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL, last_seen TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS vl_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS vl_workspaces (name TEXT PRIMARY KEY, created_at TEXT NOT NULL, created_by TEXT)`,
    `CREATE TABLE IF NOT EXISTS vl_stores (
      workspace TEXT NOT NULL REFERENCES vl_workspaces(name) ON DELETE CASCADE, name TEXT NOT NULL,
      value TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT,
      PRIMARY KEY (workspace, name))`,
    `CREATE TABLE IF NOT EXISTS vl_evidence (
      workspace TEXT NOT NULL REFERENCES vl_workspaces(name) ON DELETE CASCADE, key TEXT NOT NULL,
      value TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT,
      PRIMARY KEY (workspace, key))`,
    /* append-only; deliberately no FK so deleting a workspace keeps its history */
    `CREATE TABLE IF NOT EXISTS vl_audit (
      workspace TEXT NOT NULL, seq INTEGER NOT NULL, at TEXT NOT NULL, user_id TEXT, username TEXT, role TEXT,
      action TEXT NOT NULL, detail TEXT, ref TEXT, prev TEXT, hash TEXT NOT NULL, PRIMARY KEY (workspace, seq))`,
  ],
];

async function migrate() {
  await q(
    "CREATE TABLE IF NOT EXISTS vl_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  );
  const row = (
    await q("SELECT value FROM vl_meta WHERE key = 'schema_version'")
  )[0];
  let v = row ? +row.value : 0;
  for (; v < MIGRATIONS.length; v++) {
    const steps = MIGRATIONS[v];
    await tx(async (t) => {
      for (const s of steps) await t(s);
      await t(
        "INSERT INTO vl_meta (key, value) VALUES ('schema_version', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
        [String(v + 1)],
      );
    });
  }
}
await migrate();

/* ---------- helpers ---------- */
const now = () => new Date().toISOString();
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

export function log(o) {
  if (process.env.VL_QUIET === "1" && o.level !== "error") return;
  process.stdout.write(JSON.stringify(Object.assign({ t: now() }, o)) + "\n");
}

class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
const fail = (status, message, extra) => {
  throw new HttpError(status, message, extra);
};

function send(res, code, obj, headers) {
  res.writeHead(
    code,
    Object.assign(
      {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
      headers || {},
    ),
  );
  res.end(obj === undefined ? "" : JSON.stringify(obj));
}

function readBody(req, limit = MAX_BYTES) {
  return new Promise((resolve, reject) => {
    const parts = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new HttpError(413, "Payload too large"));
        req.destroy();
      } else parts.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(parts).toString("utf8")));
    req.on("error", reject);
  });
}

async function readJson(req, limit) {
  const text = await readBody(req, limit);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    fail(400, "Body isn't valid JSON");
  }
}

export function isValidName(name) {
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

export function crossSiteBlocked(req) {
  /* modern browsers always send Sec-Fetch-Site: trust it; fall back to Origin vs Host for older clients */
  const site = req.headers["sec-fetch-site"];
  if (site) return site !== "same-origin" && site !== "none";
  const origin = req.headers.origin;
  if (origin) {
    const host = req.headers["x-forwarded-host"] || req.headers.host || "";
    try {
      if (new URL(origin).host !== String(host).split(",")[0].trim())
        return true;
    } catch (e) {
      return true;
    }
  }
  return false;
}

export function hostAllowed(req) {
  const raw = String(req.headers.host || "").toLowerCase();
  const name = raw.startsWith("[")
    ? raw.slice(1, raw.indexOf("]"))
    : raw.split(":")[0];
  return ALLOWED_HOSTS.includes("*") || ALLOWED_HOSTS.includes(name);
}

function clientIp(req) {
  if (TRUST_PROXY && req.headers["x-real-ip"])
    return String(req.headers["x-real-ip"]);
  return req.socket.remoteAddress || "?";
}

/* ---------- passwords ---------- */
export function passwordIssues(pw, username) {
  const out = [];
  if (typeof pw !== "string" || pw.length < 12)
    out.push("at least 12 characters");
  else {
    if (pw.length > 256) out.push("at most 256 characters");
    if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw))
      out.push("upper and lower case");
    if (!/\d/.test(pw) && !/[^A-Za-z0-9]/.test(pw))
      out.push("a number or symbol");
    if (username && pw.toLowerCase().includes(String(username).toLowerCase()))
      out.push("not containing the username");
    if (/^(password|passw0rd|letmein|qwerty|12345)/i.test(pw))
      out.push("not a common password");
  }
  return out;
}

async function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
    maxmem: 128 * SCRYPT.N * SCRYPT.r * 2,
  });
  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

async function verifyPassword(pw, stored) {
  const [kind, N, r, p, salt, hash] = String(stored).split("$");
  if (kind !== "scrypt") return false;
  const want = Buffer.from(hash, "base64");
  const got = await scrypt(
    String(pw),
    Buffer.from(salt, "base64"),
    want.length,
    { N: +N, r: +r, p: +p, maxmem: 128 * +N * +r * 2 },
  );
  return got.length === want.length && timingSafeEqual(got, want);
}
/* unknown usernames still pay for one scrypt so timing doesn't reveal which accounts exist */
const DUMMY_HASH = await hashPassword(randomBytes(12).toString("hex"));

function tempPassword() {
  /* 16 chars, always satisfies passwordIssues: mixed case + digit + symbol */
  return "Vl-" + randomBytes(9).toString("base64url") + "7a";
}

/* ---------- login rate limit (per client IP, in memory) ---------- */
const attempts = new Map();
function rateLimited(ip) {
  const t = Date.now();
  const a = (attempts.get(ip) || []).filter((x) => t - x < 5 * 60000);
  attempts.set(ip, a);
  return a.length >= 20;
}
function noteAttempt(ip) {
  attempts.set(ip, (attempts.get(ip) || []).concat([Date.now()]));
}

/* ---------- settings ---------- */
async function getSetting(key, dflt) {
  const r = (await q("SELECT value FROM vl_settings WHERE key = $1", [key]))[0];
  return r ? JSON.parse(r.value) : dflt;
}
async function putSetting(key, value) {
  await q(
    "INSERT INTO vl_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
    [key, JSON.stringify(value)],
  );
}
const idleMinutes = () => getSetting("idleMinutes", 15);

/* ---------- users & sessions ---------- */
export function publicUser(u) {
  return { id: u.id, username: u.username, name: u.name, role: u.role };
}
function adminView(u) {
  return Object.assign(publicUser(u), {
    disabled: !!u.disabled,
    mustChange: !!u.must_change,
    locked: !!(u.locked_until && u.locked_until > now()),
    createdAt: u.created_at,
    createdBy: u.created_by,
    lastLogin: u.last_login,
  });
}

const SID = "vl_sid";
function sessionCookie(req, token, maxAge) {
  const secure = COOKIE_SECURE || req.headers["x-forwarded-proto"] === "https";
  return [
    SID + "=" + token,
    "Path=/api",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=" + maxAge,
  ]
    .concat(secure ? ["Secure"] : [])
    .join("; ");
}
function readSid(req) {
  const m = new RegExp("(?:^|;\\s*)" + SID + "=([A-Za-z0-9_-]{20,})").exec(
    req.headers.cookie || "",
  );
  return m ? m[1] : null;
}

async function createSession(req, userId) {
  const token = randomBytes(32).toString("base64url");
  const t = now();
  await q(
    "INSERT INTO vl_sessions (id, user_id, created_at, last_seen) VALUES ($1, $2, $3, $3)",
    [sha256(token), userId, t],
  );
  return sessionCookie(req, token, SESSION_MAX_HOURS * 3600);
}

/* returns { user, sid } for a live session, or throws 401 */
async function requireSession(req) {
  const token = readSid(req);
  if (!token) fail(401, "Sign in to continue.", { code: "signed_out" });
  const sid = sha256(token);
  const row = (
    await q(
      `SELECT s.id AS sid, s.created_at AS s_created, s.last_seen, u.* FROM vl_sessions s JOIN vl_users u ON u.id = s.user_id WHERE s.id = $1`,
      [sid],
    )
  )[0];
  if (!row || row.disabled)
    fail(401, "Sign in to continue.", { code: "signed_out" });
  const t = Date.now();
  const idle = (await idleMinutes()) * 60000;
  if (
    t - Date.parse(row.last_seen) > idle ||
    t - Date.parse(row.s_created) > SESSION_MAX_HOURS * 3600000
  ) {
    await q("DELETE FROM vl_sessions WHERE id = $1", [sid]);
    fail(401, "Signed out after " + (await idleMinutes()) + " minutes idle.", {
      code: "idle",
    });
  }
  if (t - Date.parse(row.last_seen) > 60000)
    await q("UPDATE vl_sessions SET last_seen = $1 WHERE id = $2", [
      now(),
      sid,
    ]);
  return { user: row, sid };
}

function requireRole(user, roles) {
  if (!roles.includes(user.role))
    fail(403, "Your role (" + user.role + ") can't do that.");
}

async function activeAdmins(t, excludeId) {
  return (
    await t(
      "SELECT id FROM vl_users WHERE role = $1 AND disabled = 0 AND id <> $2",
      [ADMIN, excludeId || ""],
    )
  ).length;
}

/* ---------- audit (append-only, hash-chained, written only by the server) ---------- */
export function auditHash(e) {
  return sha256(
    JSON.stringify([
      e.workspace,
      e.seq,
      e.at,
      e.username || "",
      e.role || "",
      e.action,
      e.detail || "",
      e.ref || "",
      e.prev || "",
    ]),
  );
}

async function appendAudit(workspace, user, action, detail, ref) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await tx(async (t) => {
        const last = (
          await t(
            "SELECT seq, hash FROM vl_audit WHERE workspace = $1 ORDER BY seq DESC LIMIT 1",
            [workspace],
          )
        )[0];
        const e = {
          workspace,
          seq: last ? +last.seq + 1 : 1,
          at: now(),
          user_id: user ? user.id : null,
          username: user ? user.username : null,
          role: user ? user.role : null,
          action,
          detail: detail == null ? null : String(detail),
          ref:
            ref == null
              ? null
              : typeof ref === "string"
                ? ref
                : JSON.stringify(ref),
          prev: last ? last.hash : "",
        };
        e.hash = auditHash(e);
        await t(
          "INSERT INTO vl_audit (workspace, seq, at, user_id, username, role, action, detail, ref, prev, hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
          [
            e.workspace,
            e.seq,
            e.at,
            e.user_id,
            e.username,
            e.role,
            e.action,
            e.detail,
            e.ref,
            e.prev,
            e.hash,
          ],
        );
        return e;
      });
    } catch (e) {
      /* two writers raced for the same seq: retry */
      if (attempt === 2 || !/unique|duplicate|constraint/i.test(e.message))
        throw e;
    }
  }
}

function clientAuditEntry(r) {
  let ref = r.ref;
  if (ref && ref[0] === "[") {
    try {
      ref = JSON.parse(ref);
    } catch (e) {}
  }
  const o = {
    seq: +r.seq,
    at: r.at,
    user: r.username,
    role: r.role,
    action: r.action,
    detail: r.detail,
    hash: r.hash,
    prev: r.prev,
  };
  if (ref) o.ref = ref;
  return o;
}

export async function verifyAuditChain(workspace) {
  const rows = await q(
    "SELECT * FROM vl_audit WHERE workspace = $1 ORDER BY seq ASC",
    [workspace],
  );
  let prev = "";
  for (let i = 0; i < rows.length; i++) {
    const r = Object.assign({}, rows[i], { seq: +rows[i].seq });
    if (r.seq !== i + 1)
      return {
        ok: false,
        n: rows.length,
        at: r.seq,
        reason: "entries missing before #" + r.seq,
      };
    if ((r.prev || "") !== prev)
      return {
        ok: false,
        n: rows.length,
        at: r.seq,
        reason: "link broken at #" + r.seq,
      };
    if (auditHash(r) !== r.hash)
      return {
        ok: false,
        n: rows.length,
        at: r.seq,
        reason: "entry #" + r.seq + " changed",
      };
    prev = r.hash;
  }
  return { ok: true, n: rows.length };
}

/* ---------- workspaces / stores / evidence ---------- */
async function requireWorkspace(name) {
  if (!isValidName(name) || name === SYSTEM_WS) fail(404, "No such workspace");
  const r = (
    await q("SELECT name FROM vl_workspaces WHERE name = $1", [name])
  )[0];
  if (!r) fail(404, "No such workspace");
}

/* prefs are per user: the client sends/receives { [username]: prefs } but only ever sees and writes its own */
const prefsRow = (user) => "prefs@" + user.id;

function canWriteStore(user, name) {
  if (name === "prefs") return true;
  if (user.role === AUDITOR) return false;
  if (ADMIN_ONLY_STORES.has(name)) return user.role === ADMIN;
  return true;
}

async function putVersioned(
  table,
  keyCol,
  workspace,
  key,
  value,
  version,
  user,
) {
  const json = JSON.stringify(value === undefined ? null : value);
  const t = now();
  if (version === 0) {
    const ins = await q(
      `INSERT INTO ${table} (workspace, ${keyCol}, value, version, updated_at, updated_by) VALUES ($1, $2, $3, 1, $4, $5)
       ON CONFLICT (workspace, ${keyCol}) DO NOTHING RETURNING version`,
      [workspace, key, json, t, user.username],
    );
    if (ins.length) return 1;
  } else {
    const up = await q(
      `UPDATE ${table} SET value = $1, version = version + 1, updated_at = $2, updated_by = $3
       WHERE workspace = $4 AND ${keyCol} = $5 AND version = $6 RETURNING version`,
      [json, t, user.username, workspace, key, version],
    );
    if (up.length) return +up[0].version;
  }
  const cur = (
    await q(
      `SELECT value, version, updated_by FROM ${table} WHERE workspace = $1 AND ${keyCol} = $2`,
      [workspace, key],
    )
  )[0];
  fail(409, "Someone else changed this since you loaded it.", {
    code: "conflict",
    version: cur ? +cur.version : 0,
    data: cur ? JSON.parse(cur.value) : null,
    by: cur ? cur.updated_by : null,
  });
}

function parseVersion(v) {
  if (!Number.isInteger(v) || v < 0)
    fail(400, "Send the version you loaded (an integer, 0 for new).");
  return v;
}

/* ---------- governance rules (the server's copy of separation of duties and the two-person rule) ----------
   The client mirrors these for a friendly UI; these are the ones that count. They run on every PUT of
   the remediation and engagement stores, comparing the stored value with the new one. */
const KEV = JSON.parse(
  readFileSync(new URL("./kev-bundled.json", import.meta.url), "utf8"),
);
const KEV_IDS = new Set(KEV.ids);
const KEV_NAMES = new RegExp(KEV.namesPattern, "i");
const SEV_RANK = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
export const POLICY_DEFAULTS = {
  sod: true,
  twoPerson: false,
  maxDays: { critical: 30, high: 90, medium: 180, low: 365, info: 365 },
};

/* worst severity and KEV status per finding key, from the stored scans (same rule as isKev in src/lib/data.ts) */
export function findingFacts(scans) {
  const out = new Map();
  for (const r of (scans && scans.data) || []) {
    if (!r || !r.key) continue;
    const cves = (r.cves || []).map((c) => String(c).toUpperCase());
    const kev = cves.length
      ? cves.some((c) => KEV_IDS.has(c))
      : KEV_NAMES.test((r.name || "") + " " + (r.desc || "")) &&
        !/end[- ]of[- ]life|unsupported version|\beol\b|detection|version info|installed/i.test(
          r.name || "",
        );
    const cur = out.get(r.key);
    const sev = String(r.sev || "info").toLowerCase();
    if (!cur) out.set(r.key, { sev, kev });
    else
      out.set(r.key, {
        sev: (SEV_RANK[sev] || 0) > (SEV_RANK[cur.sev] || 0) ? sev : cur.sev,
        kev: cur.kev || kev,
      });
  }
  return out;
}

const decided = (s) => s === "accepted" || s === "fp";
const same = (a, b) => (a == null ? null : a) === (b == null ? null : b);
function addDaysIso(day, n) {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* throws 403/400 with a human reason; returns nothing when the change is allowed */
export function checkRemediation(oldGov, newGov, actor, policy, facts, today) {
  oldGov = oldGov || {};
  newGov = newGov || {};
  const pol = Object.assign({}, POLICY_DEFAULTS, policy || {});
  const sod = pol.sod !== false;
  const admin = actor.role === ADMIN;
  const me = actor.username;
  const keys = new Set(Object.keys(oldGov).concat(Object.keys(newGov)));
  for (const k of keys) {
    const o = oldGov[k] || {};
    const n = newGov[k] || {};
    const fact = facts.get(k);
    const critOrKev =
      !fact ||
      fact.sev === "critical" ||
      fact.kev; /* unknown finding: treat as sensitive */

    /* requests are always made in your own name (or put back by whoever approved them, when undoing) */
    if (
      n.state === "requested" &&
      (o.state !== "requested" ||
        !same(o.requestedBy, n.requestedBy) ||
        !same(o.requestedState, n.requestedState))
    ) {
      const undoOwnApproval =
        decided(o.state) &&
        o.approvedBy === me &&
        same(n.requestedBy, o.requestedBy);
      if (n.requestedBy !== me && !undoOwnApproval)
        fail(403, "A request has to be made in your own name.", {
          code: "governance",
          key: k,
        });
    }

    /* accepting risk or marking false positive (new, renewed, re-dated or re-approved) */
    if (
      decided(n.state) &&
      (o.state !== n.state ||
        !same(o.until, n.until) ||
        !same(o.approvedBy, n.approvedBy))
    ) {
      const vex =
        n.state === "fp" && n.by === "VEX" && n.vexId && !n.approvedBy;
      if (!admin)
        fail(
          403,
          "Only an administrator can accept risk or mark a false positive. Request it instead.",
          { code: "governance", key: k },
        );
      if (!vex) {
        if (n.approvedBy !== me)
          fail(400, "An approval has to be recorded in your own name.", {
            code: "governance",
            key: k,
          });
        const fromOthersRequest =
          o.state === "requested" &&
          o.requestedState === n.state &&
          o.requestedBy &&
          o.requestedBy !== me;
        if (sod && !fromOthersRequest)
          fail(
            403,
            "Separation of duties: someone else has to request this, and nobody approves their own request.",
            { code: "governance", key: k },
          );
        if (!sod && pol.twoPerson && critOrKev && !fromOthersRequest)
          fail(
            403,
            "Two-person rule: critical and KEV decisions need a request from a second person.",
            { code: "governance", key: k },
          );
      }
      if (n.state === "accepted") {
        const max =
          (pol.maxDays || {})[fact && fact.sev] ||
          Math.min(...Object.values(pol.maxDays || { x: 365 }).map(Number));
        if (!n.until || n.until > addDaysIso(today, max))
          fail(
            400,
            "Exceptions for this finding can last at most " +
              max +
              " days under your policy.",
            { code: "governance", key: k },
          );
      }
    }

    /* deciding someone else's pending request without approving it (reject) is for administrators; withdrawing your own is fine */
    if (
      o.state === "requested" &&
      n.state !== "requested" &&
      !decided(n.state) &&
      o.requestedBy !== me &&
      !admin
    )
      fail(403, "Only an administrator can reject someone else's request.", {
        code: "governance",
        key: k,
      });

    /* re-scoring changes severity, SLA and who must approve: administrators only */
    if (!same(o.cvssVector, n.cvssVector) && !admin)
      fail(403, "Only an administrator can re-score a finding.", {
        code: "governance",
        key: k,
      });
  }
}

const REPORT_META = ["status", "approvedAt", "approvedBy", "editedBy"];
const strip = (x) =>
  JSON.stringify(
    Object.keys(x)
      .sort()
      .filter((k) => !REPORT_META.includes(k))
      .map((k) => [k, x[k]]),
  );
export function checkEngagement(oldE, newE, actor, policy, lastEditor) {
  const pol = Object.assign({}, POLICY_DEFAULTS, policy || {});
  const o = oldE || {};
  const n = newE || {};
  if (n.status !== "Approved") return;
  if (o.status !== "Approved") {
    if (actor.role !== ADMIN)
      fail(403, "Only an administrator can approve the report.", {
        code: "governance",
      });
    if (n.approvedBy !== actor.username)
      fail(400, "An approval has to be recorded in your own name.", {
        code: "governance",
      });
    if (
      pol.sod !== false &&
      (lastEditor === actor.username || strip(o) !== strip(n))
    )
      fail(
        403,
        "Separation of duties: whoever edits the report can't also approve it.",
        { code: "governance" },
      );
    return;
  }
  if (strip(o) !== strip(n) || !same(o.approvedBy, n.approvedBy))
    fail(
      403,
      "The report changed after approval; save it as In review so it can be approved again.",
      { code: "governance" },
    );
}

/* ---------- routing ---------- */
const routes = [];
function route(method, pattern, opts, fn) {
  const keys = [];
  const re = new RegExp(
    "^" +
      pattern.replace(/:(\w+)/g, (_, k) => {
        keys.push(k);
        return "([^/]+)";
      }) +
      "$",
  );
  routes.push({ method, pattern, re, keys, opts, fn });
}

/* auth */
route("GET", "/api/auth/state", { auth: false }, async (req) => {
  const users = +(await q("SELECT COUNT(*) AS n FROM vl_users"))[0].n;
  if (!users) return { body: { setupNeeded: true } };
  try {
    const s = await requireSession(req);
    return {
      body: {
        user: publicUser(s.user),
        mustChange: !!s.user.must_change,
        idleMinutes: await idleMinutes(),
      },
    };
  } catch (e) {
    if (e.status === 401)
      return {
        body: {
          signedOut: e.extra && e.extra.code === "idle" ? e.message : "",
        },
      };
    throw e;
  }
});

route(
  "POST",
  "/api/auth/setup",
  { auth: false, limit: MAX_AUTH_BYTES },
  async (req, ctx) => {
    const b = ctx.body;
    const username = String(b.username || "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(username))
      fail(
        400,
        "Usernames are 3–32 characters: letters, numbers, dot, dash, underscore.",
      );
    const issues = passwordIssues(b.password, username);
    if (issues.length) fail(400, "Password needs " + issues.join(", ") + ".");
    const hash = await hashPassword(b.password);
    const u = {
      id: randomUUID(),
      username,
      name:
        String(b.name || "")
          .trim()
          .slice(0, 80) || username,
      role: ADMIN,
    };
    await tx(async (t) => {
      if (+(await t("SELECT COUNT(*) AS n FROM vl_users"))[0].n)
        fail(409, "Setup is already done. Sign in instead.");
      const ts = now();
      await t(
        "INSERT INTO vl_users (id, username, name, role, pw_hash, created_at, last_login, pw_changed_at) VALUES ($1,$2,$3,$4,$5,$6,$6,$6)",
        [u.id, u.username, u.name, u.role, hash, ts],
      );
      await t(
        "INSERT INTO vl_workspaces (name, created_at, created_by) VALUES ('Default', $1, $2) ON CONFLICT (name) DO NOTHING",
        [ts, username],
      );
    });
    await appendAudit(
      SYSTEM_WS,
      u,
      "SETUP",
      u.username + " created the first administrator",
    );
    return {
      body: { user: publicUser(u), mustChange: false, first: true },
      headers: { "Set-Cookie": await createSession(req, u.id) },
    };
  },
);

route(
  "POST",
  "/api/auth/login",
  { auth: false, limit: MAX_AUTH_BYTES },
  async (req, ctx) => {
    const ip = clientIp(req);
    if (rateLimited(ip))
      fail(
        429,
        "Too many sign-in attempts from this address. Wait a few minutes.",
      );
    noteAttempt(ip);
    const username = String(ctx.body.username || "")
      .trim()
      .toLowerCase();
    const pw = String(ctx.body.password || "");
    const u = (
      await q("SELECT * FROM vl_users WHERE username = $1", [username])
    )[0];
    const ok = await verifyPassword(pw, u ? u.pw_hash : DUMMY_HASH);
    const bad = () => fail(401, "Wrong username or password.", { code: "bad" });
    if (!u) bad();
    if (u.locked_until && u.locked_until > now())
      fail(423, "Too many failed attempts. Try again in a few minutes.", {
        code: "locked",
      });
    if (!ok) {
      const failed =
        (u.locked_until && u.locked_until <= now() ? 0 : +u.failed) + 1;
      const lock =
        failed >= LOCK_AFTER
          ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString()
          : null;
      await q(
        "UPDATE vl_users SET failed = $1, locked_until = $2, last_failed_at = $3 WHERE id = $4",
        [failed, lock, now(), u.id],
      );
      await appendAudit(
        SYSTEM_WS,
        u,
        "LOGIN_FAILED",
        u.username +
          " failed to sign in" +
          (lock ? "; account locked " + LOCK_MINUTES + " min" : ""),
      );
      if (lock)
        fail(
          423,
          "Too many failed attempts. Locked for " + LOCK_MINUTES + " minutes.",
          { code: "locked" },
        );
      bad();
    }
    if (u.disabled)
      fail(403, "This account is disabled. Ask an administrator.", {
        code: "disabled",
      });
    const hadFails = +u.failed;
    await q(
      "UPDATE vl_users SET failed = 0, locked_until = NULL, prev_login = last_login, last_login = $1 WHERE id = $2",
      [now(), u.id],
    );
    await appendAudit(
      SYSTEM_WS,
      u,
      "LOGIN",
      u.username +
        " signed in" +
        (hadFails ? " after " + hadFails + " failed attempt(s)" : ""),
    );
    return {
      body: {
        user: publicUser(u),
        mustChange: !!u.must_change,
        hadFails,
        prevLogin: u.last_login,
      },
      headers: { "Set-Cookie": await createSession(req, u.id) },
    };
  },
);

route("POST", "/api/auth/logout", { auth: false }, async (req) => {
  const token = readSid(req);
  if (token) {
    const sid = sha256(token);
    const row = (
      await q(
        "SELECT u.* FROM vl_sessions s JOIN vl_users u ON u.id = s.user_id WHERE s.id = $1",
        [sid],
      )
    )[0];
    await q("DELETE FROM vl_sessions WHERE id = $1", [sid]);
    if (row)
      await appendAudit(SYSTEM_WS, row, "LOGOUT", row.username + " signed out");
  }
  return {
    body: { ok: true },
    headers: { "Set-Cookie": sessionCookie(req, "", 0) },
  };
});

route(
  "POST",
  "/api/auth/password",
  { mustChangeOk: true, limit: MAX_AUTH_BYTES },
  async (req, ctx) => {
    const me = ctx.user;
    if (!(await verifyPassword(ctx.body.current, me.pw_hash)))
      fail(400, "Your current password is wrong.");
    const issues = passwordIssues(ctx.body.next, me.username);
    if (issues.length) fail(400, "Password needs " + issues.join(", ") + ".");
    if (ctx.body.next === ctx.body.current)
      fail(400, "Choose a password you haven't just used.");
    await q(
      "UPDATE vl_users SET pw_hash = $1, must_change = 0, pw_changed_at = $2 WHERE id = $3",
      [await hashPassword(ctx.body.next), now(), me.id],
    );
    /* every other session of this user ends; this one carries on */
    await q("DELETE FROM vl_sessions WHERE user_id = $1 AND id <> $2", [
      me.id,
      ctx.sid,
    ]);
    await appendAudit(
      SYSTEM_WS,
      me,
      "PASSWORD_CHANGE",
      me.username + " changed their password",
    );
    return { body: { ok: true } };
  },
);

/* users */
route("GET", "/api/users/directory", {}, async () => ({
  body: (
    await q("SELECT * FROM vl_users WHERE disabled = 0 ORDER BY username")
  ).map(publicUser),
}));

route("GET", "/api/users", { roles: [ADMIN] }, async () => ({
  body: (await q("SELECT * FROM vl_users ORDER BY username")).map(adminView),
}));

route(
  "POST",
  "/api/users",
  { roles: [ADMIN], limit: MAX_AUTH_BYTES },
  async (req, ctx) => {
    const b = ctx.body;
    const username = String(b.username || "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(username))
      fail(
        400,
        "Usernames are 3–32 characters: letters, numbers, dot, dash, underscore.",
      );
    if (!ROLES.includes(b.role)) fail(400, "Pick a role.");
    const issues = passwordIssues(b.password, username);
    if (issues.length) fail(400, "Password needs " + issues.join(", ") + ".");
    const u = {
      id: randomUUID(),
      username,
      name:
        String(b.name || "")
          .trim()
          .slice(0, 80) || username,
      role: b.role,
    };
    try {
      await q(
        "INSERT INTO vl_users (id, username, name, role, pw_hash, must_change, created_at, created_by, pw_changed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$7)",
        [
          u.id,
          u.username,
          u.name,
          u.role,
          await hashPassword(b.password),
          b.mustChange === false ? 0 : 1,
          now(),
          ctx.user.username,
        ],
      );
    } catch (e) {
      if (/unique|duplicate|constraint/i.test(e.message))
        fail(409, "That username is taken.");
      throw e;
    }
    await appendAudit(
      SYSTEM_WS,
      ctx.user,
      "USER_ADD",
      ctx.user.username + " added " + u.username + " (" + u.role + ")",
    );
    return {
      status: 201,
      body: adminView(
        (await q("SELECT * FROM vl_users WHERE id = $1", [u.id]))[0],
      ),
    };
  },
);

route(
  "PATCH",
  "/api/users/:id",
  { roles: [ADMIN], limit: MAX_AUTH_BYTES },
  async (req, ctx) => {
    const b = ctx.body;
    const what = [];
    let temp = null;
    await tx(async (t) => {
      const u = (
        await t("SELECT * FROM vl_users WHERE id = $1", [ctx.params.id])
      )[0];
      if (!u) fail(404, "No such user");
      const role = b.role !== undefined ? b.role : u.role;
      const disabled =
        b.disabled !== undefined ? (b.disabled ? 1 : 0) : +u.disabled;
      if (!ROLES.includes(role)) fail(400, "Pick a role.");
      if (
        (role !== ADMIN || disabled) &&
        u.role === ADMIN &&
        !(await activeAdmins(t, u.id))
      )
        fail(409, "Keep at least one active administrator.");
      const name =
        b.name !== undefined
          ? String(b.name).trim().slice(0, 80) || u.username
          : u.name;
      await t(
        "UPDATE vl_users SET name = $1, role = $2, disabled = $3 WHERE id = $4",
        [name, role, disabled, u.id],
      );
      if (role !== u.role) what.push("role " + u.role + " → " + role);
      if (disabled !== +u.disabled)
        what.push(disabled ? "disabled" : "enabled");
      if (b.resetPassword) {
        temp = tempPassword();
        await t(
          "UPDATE vl_users SET pw_hash = $1, must_change = 1, failed = 0, locked_until = NULL, pw_changed_at = $2 WHERE id = $3",
          [await hashPassword(temp), now(), u.id],
        );
        what.push("password reset");
      }
      if (b.unlock) {
        await t(
          "UPDATE vl_users SET failed = 0, locked_until = NULL WHERE id = $1",
          [u.id],
        );
        what.push("unlocked");
      }
      /* any change to who someone is or can do ends their sessions so it applies immediately */
      if (role !== u.role || disabled || b.resetPassword)
        await t("DELETE FROM vl_sessions WHERE user_id = $1", [u.id]);
      ctx.target = u;
    });
    if (what.length)
      await appendAudit(
        SYSTEM_WS,
        ctx.user,
        "USER_UPDATE",
        ctx.user.username +
          " changed " +
          ctx.target.username +
          ": " +
          what.join(", "),
      );
    const body = adminView(
      (await q("SELECT * FROM vl_users WHERE id = $1", [ctx.params.id]))[0],
    );
    if (temp) body.tempPassword = temp;
    return { body };
  },
);

route("DELETE", "/api/users/:id", { roles: [ADMIN] }, async (req, ctx) => {
  if (ctx.params.id === ctx.user.id)
    fail(409, "You can't delete your own account.");
  let gone;
  await tx(async (t) => {
    gone = (
      await t("SELECT * FROM vl_users WHERE id = $1", [ctx.params.id])
    )[0];
    if (!gone) fail(404, "No such user");
    if (gone.role === ADMIN && !(await activeAdmins(t, gone.id)))
      fail(409, "Keep at least one active administrator.");
    await t("DELETE FROM vl_users WHERE id = $1", [gone.id]);
  });
  await appendAudit(
    SYSTEM_WS,
    ctx.user,
    "USER_REMOVE",
    ctx.user.username + " removed " + gone.username,
  );
  return { body: { ok: true } };
});

/* settings */
route("GET", "/api/settings", {}, async () => ({
  body: { idleMinutes: await idleMinutes() },
}));
route(
  "PUT",
  "/api/settings",
  { roles: [ADMIN], limit: MAX_AUTH_BYTES },
  async (req, ctx) => {
    const m = ctx.body.idleMinutes;
    if (!Number.isInteger(m) || m < 5 || m > 720)
      fail(400, "Idle sign-out is 5–720 minutes.");
    await putSetting("idleMinutes", m);
    await appendAudit(
      SYSTEM_WS,
      ctx.user,
      "SETTINGS",
      ctx.user.username + " set idle sign-out to " + m + " min",
    );
    return { body: { idleMinutes: m } };
  },
);

/* workspaces */
route("GET", "/api/workspaces", {}, async () => ({
  body: (
    await q(
      "SELECT name, created_at, created_by FROM vl_workspaces ORDER BY name",
    )
  ).map((r) => ({
    name: r.name,
    createdAt: r.created_at,
    createdBy: r.created_by,
  })),
}));

route(
  "POST",
  "/api/workspaces",
  { roles: [ADMIN, LEAD], limit: MAX_AUTH_BYTES },
  async (req, ctx) => {
    const name = String(ctx.body.name || "").trim();
    if (!isValidName(name) || name === SYSTEM_WS)
      fail(
        400,
        "Workspace names are 1–128 letters, numbers, spaces and . @ # - _",
      );
    const ins = await q(
      "INSERT INTO vl_workspaces (name, created_at, created_by) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING RETURNING name",
      [name, now(), ctx.user.username],
    );
    if (!ins.length) fail(409, "A workspace with that name already exists.");
    await appendAudit(
      name,
      ctx.user,
      "WORKSPACE_CREATE",
      ctx.user.username + " created workspace " + name,
    );
    return { status: 201, body: { name } };
  },
);

route("DELETE", "/api/workspaces/:ws", { roles: [ADMIN] }, async (req, ctx) => {
  await requireWorkspace(ctx.params.ws);
  await q("DELETE FROM vl_workspaces WHERE name = $1", [ctx.params.ws]);
  await appendAudit(
    ctx.params.ws,
    ctx.user,
    "WORKSPACE_DELETE",
    ctx.user.username + " deleted workspace " + ctx.params.ws,
  );
  return { body: { ok: true } };
});

/* stores: whole-document, optimistic versions */
route("GET", "/api/stores/:ws", {}, async (req, ctx) => {
  await requireWorkspace(ctx.params.ws);
  const rows = await q(
    "SELECT name, value, version FROM vl_stores WHERE workspace = $1 AND (name NOT LIKE 'prefs@%' OR name = $2)",
    [ctx.params.ws, prefsRow(ctx.user)],
  );
  const out = {};
  for (const r of rows) {
    if (r.name.startsWith("prefs@"))
      out.prefs = {
        data: { [ctx.user.username]: JSON.parse(r.value) },
        version: +r.version,
      };
    else out[r.name] = { data: JSON.parse(r.value), version: +r.version };
  }
  return { body: out };
});

route("PUT", "/api/stores/:ws/:name", {}, async (req, ctx) => {
  const { ws, name } = ctx.params;
  if (!STORE_NAMES.includes(name)) fail(404, "Unknown store");
  if (!canWriteStore(ctx.user, name))
    fail(403, "Your role (" + ctx.user.role + ") can't change " + name + ".");
  await requireWorkspace(ws);
  const b = ctx.body;
  if (name === "prefs") {
    /* only the caller's own slice is stored; last write wins (it's one person's view settings) */
    const mine =
      b.data && typeof b.data === "object" ? b.data[ctx.user.username] : null;
    const json = JSON.stringify(mine === undefined ? null : mine);
    const r = await q(
      `INSERT INTO vl_stores (workspace, name, value, version, updated_at, updated_by) VALUES ($1, $2, $3, 1, $4, $5)
       ON CONFLICT (workspace, name) DO UPDATE SET value = $3, version = vl_stores.version + 1, updated_at = $4 RETURNING version`,
      [ws, prefsRow(ctx.user), json, now(), ctx.user.username],
    );
    return { body: { version: +r[0].version } };
  }
  const want = parseVersion(b.version);
  if (name === "remediation" || name === "engagement") {
    const cur = (
      await q(
        "SELECT value, version, updated_by FROM vl_stores WHERE workspace = $1 AND name = $2",
        [ws, name],
      )
    )[0];
    /* only validate against the version the client is replacing; a stale version gets the normal 409 below */
    if ((cur ? +cur.version : 0) === want) {
      const old = cur ? JSON.parse(cur.value) : null;
      const pRow = (
        await q(
          "SELECT value FROM vl_stores WHERE workspace = $1 AND name = 'policy'",
          [ws],
        )
      )[0];
      const policy = pRow ? JSON.parse(pRow.value) : null;
      if (name === "remediation") {
        const sRow = (
          await q(
            "SELECT value FROM vl_stores WHERE workspace = $1 AND name = 'scans'",
            [ws],
          )
        )[0];
        checkRemediation(
          old,
          b.data,
          ctx.user,
          policy,
          findingFacts(sRow ? JSON.parse(sRow.value) : null),
          now().slice(0, 10),
        );
      } else
        checkEngagement(
          old,
          b.data,
          ctx.user,
          policy,
          cur ? cur.updated_by : null,
        );
    }
  }
  const version = await putVersioned(
    "vl_stores",
    "name",
    ws,
    name,
    b.data,
    want,
    ctx.user,
  );
  return { body: { version } };
});

/* evidence: one list of images per finding key */
route("GET", "/api/evidence/:ws", {}, async (req, ctx) => {
  await requireWorkspace(ctx.params.ws);
  return {
    body: (
      await q("SELECT key FROM vl_evidence WHERE workspace = $1 ORDER BY key", [
        ctx.params.ws,
      ])
    ).map((r) => r.key),
  };
});

route("GET", "/api/evidence/:ws/:key", {}, async (req, ctx) => {
  await requireWorkspace(ctx.params.ws);
  if (!isValidKey(ctx.params.key)) fail(400, "Bad evidence key");
  const r = (
    await q(
      "SELECT value, version FROM vl_evidence WHERE workspace = $1 AND key = $2",
      [ctx.params.ws, ctx.params.key],
    )
  )[0];
  return {
    body: r
      ? { data: JSON.parse(r.value), version: +r.version }
      : { data: [], version: 0 },
  };
});

route(
  "PUT",
  "/api/evidence/:ws/:key",
  { roles: [ADMIN, LEAD] },
  async (req, ctx) => {
    await requireWorkspace(ctx.params.ws);
    if (!isValidKey(ctx.params.key)) fail(400, "Bad evidence key");
    if (!Array.isArray(ctx.body.data)) fail(400, "Evidence is a list.");
    const version = await putVersioned(
      "vl_evidence",
      "key",
      ctx.params.ws,
      ctx.params.key,
      ctx.body.data,
      parseVersion(ctx.body.version),
      ctx.user,
    );
    return { body: { version } };
  },
);

/* audit */
route("GET", "/api/audit/:ws", {}, async (req, ctx) => {
  const ws = ctx.params.ws;
  if (ws === SYSTEM_WS) requireRole(ctx.user, [ADMIN]);
  else await requireWorkspace(ws);
  const limit = Math.min(
    5000,
    Math.max(1, +(ctx.url.searchParams.get("limit") || 2000) || 2000),
  );
  const rows = await q(
    "SELECT * FROM vl_audit WHERE workspace = $1 ORDER BY seq DESC LIMIT " +
      limit,
    [ws],
  );
  const total = +(
    await q("SELECT COUNT(*) AS n FROM vl_audit WHERE workspace = $1", [ws])
  )[0].n;
  return { body: { entries: rows.map(clientAuditEntry), total } };
});

route("POST", "/api/audit/:ws", { limit: 256 * 1024 }, async (req, ctx) => {
  await requireWorkspace(ctx.params.ws);
  const b = ctx.body;
  if (typeof b.action !== "string" || !/^[A-Z0-9_-]{1,64}$/.test(b.action))
    fail(400, "Bad audit action");
  if (
    b.detail != null &&
    (typeof b.detail !== "string" || b.detail.length > 4000)
  )
    fail(400, "Audit detail is text up to 4000 characters.");
  const ref = b.ref;
  const refOk =
    ref == null ||
    (typeof ref === "string" && ref.length <= 512) ||
    (Array.isArray(ref) &&
      ref.length <= 50 &&
      ref.every((x) => typeof x === "string" && x.length <= 512));
  if (!refOk) fail(400, "Bad audit ref");
  const e = await appendAudit(ctx.params.ws, ctx.user, b.action, b.detail, ref);
  return { status: 201, body: clientAuditEntry(e) };
});

route("GET", "/api/audit/:ws/verify", {}, async (req, ctx) => {
  if (ctx.params.ws === SYSTEM_WS) requireRole(ctx.user, [ADMIN]);
  else await requireWorkspace(ctx.params.ws);
  return { body: await verifyAuditChain(ctx.params.ws) };
});

/* full workspace backup / restore (admin) */
route(
  "GET",
  "/api/workspaces/:ws/export",
  { roles: [ADMIN] },
  async (req, ctx) => {
    const ws = ctx.params.ws;
    await requireWorkspace(ws);
    const stores = {};
    for (const r of await q(
      "SELECT name, value FROM vl_stores WHERE workspace = $1 AND name NOT LIKE 'prefs@%'",
      [ws],
    ))
      stores[r.name] = JSON.parse(r.value);
    const evidence = {};
    for (const r of await q(
      "SELECT key, value FROM vl_evidence WHERE workspace = $1",
      [ws],
    ))
      evidence[r.key] = JSON.parse(r.value);
    await appendAudit(
      ws,
      ctx.user,
      "BACKUP",
      ctx.user.username + " exported a full backup",
    );
    return {
      body: {
        app: "VAPTLens",
        format: 2,
        workspace: ws,
        exportedAt: now(),
        stores,
        evidence,
      },
    };
  },
);

route(
  "POST",
  "/api/workspaces/:ws/import",
  { roles: [ADMIN] },
  async (req, ctx) => {
    const ws = ctx.params.ws;
    await requireWorkspace(ws);
    const b = ctx.body;
    if (
      b.app !== "VAPTLens" ||
      b.format !== 2 ||
      typeof b.stores !== "object" ||
      !b.stores
    )
      fail(400, "This isn't a VAPTLens backup (format 2).");
    const names = Object.keys(b.stores).filter(
      (n) => STORE_NAMES.includes(n) && n !== "prefs",
    );
    const ev = b.evidence && typeof b.evidence === "object" ? b.evidence : {};
    const evKeys = Object.keys(ev).filter(
      (k) => isValidKey(k) && Array.isArray(ev[k]),
    );
    const t0 = now();
    await tx(async (t) => {
      await t(
        "DELETE FROM vl_stores WHERE workspace = $1 AND name NOT LIKE 'prefs@%'",
        [ws],
      );
      await t("DELETE FROM vl_evidence WHERE workspace = $1", [ws]);
      for (const n of names)
        await t(
          "INSERT INTO vl_stores (workspace, name, value, version, updated_at, updated_by) VALUES ($1,$2,$3,1,$4,$5)",
          [ws, n, JSON.stringify(b.stores[n]), t0, ctx.user.username],
        );
      for (const k of evKeys)
        await t(
          "INSERT INTO vl_evidence (workspace, key, value, version, updated_at, updated_by) VALUES ($1,$2,$3,1,$4,$5)",
          [ws, k, JSON.stringify(ev[k]), t0, ctx.user.username],
        );
    });
    await appendAudit(
      ws,
      ctx.user,
      "RESTORE",
      ctx.user.username +
        " restored a backup from " +
        (b.exportedAt || "?") +
        " (" +
        names.length +
        " stores, " +
        evKeys.length +
        " evidence sets)",
    );
    return {
      body: { ok: true, stores: names.length, evidence: evKeys.length },
    };
  },
);

/* ---------- request handler ---------- */
export async function handler(req, res) {
  const started = Date.now();
  const ctx = { route: "?", user: null };
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(405, { Allow: "GET, POST, PUT, PATCH, DELETE" });
      return res.end();
    }
    if (!hostAllowed(req))
      return send(res, 421, {
        error: "Unknown host. Add it to ALLOWED_HOSTS on the server.",
      });
    if (crossSiteBlocked(req))
      return send(res, 403, { error: "Cross-site requests are not allowed" });
    /* writes must be JSON: a plain HTML form or text/plain beacon can't reach a mutating route */
    if (
      /^(POST|PUT|PATCH)$/.test(req.method) &&
      !/^application\/json\b/i.test(req.headers["content-type"] || "")
    )
      return send(res, 415, {
        error: "Send JSON (Content-Type: application/json)",
      });

    const url = new URL(req.url || "/", "http://localhost");
    ctx.url = url;
    if (url.pathname === "/api/health") {
      ctx.route = "/api/health";
      if (req.method !== "GET")
        return send(res, 405, { error: "Method not allowed" });
      try {
        await q("SELECT 1 AS ok");
        return send(res, 200, { ok: true });
      } catch (e) {
        return send(res, 503, { ok: false, error: "database unavailable" });
      }
    }

    let match = null;
    let pathMatched = false;
    for (const r of routes) {
      const m = r.re.exec(url.pathname);
      if (!m) continue;
      pathMatched = true;
      if (r.method !== req.method) continue;
      match = r;
      ctx.params = {};
      r.keys.forEach((k, i) => {
        try {
          ctx.params[k] = decodeURIComponent(m[i + 1]);
        } catch (e) {
          fail(400, "Bad URL");
        }
      });
      break;
    }
    if (!match)
      return send(res, pathMatched ? 405 : 404, {
        error: pathMatched ? "Method not allowed" : "Not found",
      });
    ctx.route = match.method + " " + match.pattern;

    if (match.opts.auth !== false) {
      const s = await requireSession(req);
      ctx.user = s.user;
      ctx.sid = s.sid;
      if (s.user.must_change && !match.opts.mustChangeOk)
        fail(403, "Change your temporary password first.", {
          code: "must_change",
        });
      if (match.opts.roles) requireRole(s.user, match.opts.roles);
    }
    if (/^(POST|PUT|PATCH)$/.test(req.method))
      ctx.body = await readJson(req, match.opts.limit);

    const out = await match.fn(req, ctx);
    send(res, out.status || 200, out.body, out.headers);
  } catch (e) {
    if (e instanceof HttpError) {
      send(
        res,
        e.status,
        Object.assign({ error: e.message }, e.extra || {}),
        e.status === 401 && readSid(req)
          ? { "Set-Cookie": sessionCookie(req, "", 0) }
          : undefined,
      );
    } else {
      log({
        level: "error",
        msg: "unhandled",
        route: ctx.route,
        err: e && e.stack ? e.stack : String(e),
      });
      if (!res.headersSent)
        send(res, 500, { error: "Something went wrong on the server." });
      else res.end();
    }
  } finally {
    /* the route pattern is logged, never the raw path: workspace names and evidence keys stay out of the logs */
    log({
      method: req.method,
      route: ctx.route,
      status: res.statusCode,
      ms: Date.now() - started,
      user: ctx.user ? ctx.user.username : undefined,
    });
  }
}

/* ---------- admin CLI + startup ---------- */
async function cliResetPassword(username) {
  const u = (
    await q("SELECT * FROM vl_users WHERE username = $1", [
      String(username || "").toLowerCase(),
    ])
  )[0];
  if (!u) {
    console.error("No user named " + username);
    process.exit(1);
  }
  const temp = tempPassword();
  await q(
    "UPDATE vl_users SET pw_hash = $1, must_change = 1, failed = 0, locked_until = NULL, disabled = 0 WHERE id = $2",
    [await hashPassword(temp), u.id],
  );
  await q("DELETE FROM vl_sessions WHERE user_id = $1", [u.id]);
  await appendAudit(
    SYSTEM_WS,
    null,
    "USER_UPDATE",
    "Password for " + u.username + " reset from the server console",
  );
  console.log(
    "Temporary password for " +
      u.username +
      ": " +
      temp +
      "\nThey must change it at next sign-in.",
  );
}

async function shutdown(server) {
  log({ msg: "shutting down" });
  if (server) await new Promise((r) => server.close(r));
  if (pool) await pool.end().catch(() => {});
  if (sqlite) sqlite.close();
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  import.meta.url.endsWith(
    process.argv[1].replace(/\\/g, "/").split("/").pop(),
  );
if (isMain) {
  if (process.argv[2] === "reset-password") {
    await cliResetPassword(process.argv[3]);
    await shutdown(null);
  } else {
    const server = createServer((req, res) => {
      handler(req, res).catch((e) =>
        log({ level: "error", msg: "handler crashed", err: String(e) }),
      );
    });
    server.listen(PORT, HOST, () =>
      log({
        msg: "listening",
        host: HOST,
        port: PORT,
        db: isPostgres ? "postgres" : "sqlite",
        allowedHosts: ALLOWED_HOSTS,
      }),
    );
    process.on("SIGTERM", () => shutdown(server));
    process.on("SIGINT", () => shutdown(server));
  }
  process.on("unhandledRejection", (e) =>
    log({
      level: "error",
      msg: "unhandledRejection",
      err: String(e && e.stack ? e.stack : e),
    }),
  );
}

export { q, tx, pool };
