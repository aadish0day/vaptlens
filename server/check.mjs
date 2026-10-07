/* node server/check.mjs — API self-check. SQLite in a temp dir by default; set DATABASE_URL to run it against Postgres
   (use a throwaway database: the check creates users and workspaces). */
import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

if (!process.env.DATABASE_URL) {
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRES_HOST;
  process.env.DB_PATH = join(
    mkdtempSync(join(tmpdir(), "vl-test-")),
    "test.db",
  );
}
process.env.VL_QUIET = "1";
const { handler, verifyAuditChain, q } = await import("./server.mjs");
const srv = createServer(handler);
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + srv.address().port;

/* a tiny cookie-jar client per user */
function client() {
  let cookie = "";
  return async function api(path, o = {}) {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      cookie ? { Cookie: cookie } : {},
      o.headers || {},
    );
    const res = await fetch(base + path, {
      method: o.method || "GET",
      headers,
      body:
        o.body === undefined
          ? undefined
          : typeof o.body === "string"
            ? o.body
            : JSON.stringify(o.body),
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
const step = (s) => console.log("-> " + s);
const PW = "Correct-Horse-9";

step("health checks the database");
assert.equal((await fetch(base + "/api/health")).status, 200);

step("fresh install needs setup; nothing else is reachable");
const admin = client();
assert.deepEqual((await admin("/api/auth/state")).data, { setupNeeded: true });
assert.equal((await admin("/api/workspaces")).status, 401);
assert.equal(
  (
    await admin("/api/auth/setup", {
      method: "POST",
      body: { username: "root", password: "short" },
    })
  ).status,
  400,
);

step("setup creates the admin, a session and the Default workspace");
const s = await admin("/api/auth/setup", {
  method: "POST",
  body: { username: "Root", name: "Root User", password: PW },
});
assert.equal(s.status, 200);
assert.equal(s.data.user.role, "Administrator");
assert.equal(s.data.user.username, "root");
assert.equal(
  (
    await client()("/api/auth/setup", {
      method: "POST",
      body: { username: "evil", password: PW },
    })
  ).status,
  409,
  "setup only once",
);
assert.deepEqual(
  (await admin("/api/workspaces")).data.map((w) => w.name),
  ["Default"],
);

step("host allowlist and cross-site guard");
const rebound = await new Promise((r) =>
  request(
    base + "/api/health",
    { headers: { Host: "attacker.example:8080" } },
    (res) => r(res.statusCode),
  ).end(),
);
assert.equal(rebound, 421, "DNS-rebinding host refused");
assert.equal(
  (
    await admin("/api/workspaces", {
      headers: { "Sec-Fetch-Site": "cross-site" },
    })
  ).status,
  403,
);
assert.equal(
  (
    await admin("/api/workspaces", {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "text/plain" },
    })
  ).status,
  415,
);

step("users: add a lead and an auditor with temporary passwords");
const addLead = await admin("/api/users", {
  method: "POST",
  body: {
    username: "lead",
    name: "Lea",
    role: "Remediation Lead",
    password: PW + "x",
  },
});
assert.equal(addLead.status, 201);
assert.equal(addLead.data.mustChange, true);
const addAud = await admin("/api/users", {
  method: "POST",
  body: { username: "aud", role: "Security Auditor", password: PW + "y" },
});
assert.equal(addAud.status, 201);
assert.equal(
  (
    await admin("/api/users", {
      method: "POST",
      body: { username: "lead", role: "Security Auditor", password: PW },
    })
  ).status,
  409,
);

step("login: wrong password, must-change gate, change password");
const lead = client();
assert.equal(
  (
    await lead("/api/auth/login", {
      method: "POST",
      body: { username: "lead", password: "nope" },
    })
  ).status,
  401,
);
const li = await lead("/api/auth/login", {
  method: "POST",
  body: { username: "lead", password: PW + "x" },
});
assert.equal(li.status, 200);
assert.equal(li.data.mustChange, true);
assert.equal(li.data.hadFails, 1);
assert.equal(
  (await lead("/api/workspaces")).status,
  403,
  "temporary password must be changed first",
);
assert.equal(
  (
    await lead("/api/auth/password", {
      method: "POST",
      body: { current: PW + "x", next: "Remediate-Now-22" },
    })
  ).status,
  200,
);
assert.equal((await lead("/api/workspaces")).status, 200);

step("lockout after 5 failures");
const brute = client();
for (let i = 0; i < 4; i++)
  assert.equal(
    (
      await brute("/api/auth/login", {
        method: "POST",
        body: { username: "aud", password: "bad" },
      })
    ).status,
    401,
  );
assert.equal(
  (
    await brute("/api/auth/login", {
      method: "POST",
      body: { username: "aud", password: "bad" },
    })
  ).status,
  423,
);
assert.equal(
  (
    await brute("/api/auth/login", {
      method: "POST",
      body: { username: "aud", password: PW + "y" },
    })
  ).status,
  423,
  "locked even with the right password",
);
const unlocked = await admin("/api/users/" + addAud.data.id, {
  method: "PATCH",
  body: { unlock: true, resetPassword: true },
});
assert.equal(unlocked.status, 200);
const auditor = client();
assert.equal(
  (
    await auditor("/api/auth/login", {
      method: "POST",
      body: { username: "aud", password: unlocked.data.tempPassword },
    })
  ).status,
  200,
);
assert.equal(
  (
    await auditor("/api/auth/password", {
      method: "POST",
      body: { current: unlocked.data.tempPassword, next: "Read-Only-View-33" },
    })
  ).status,
  200,
);

step("stores: versions, conflicts and the store allowlist");
const put = (api, name, data, version) =>
  api("/api/stores/Default/" + name, {
    method: "PUT",
    body: { data, version },
  });
assert.equal((await put(admin, "scans", { data: [1] }, 0)).data.version, 1);
assert.equal((await put(admin, "scans", { data: [1, 2] }, 1)).data.version, 2);
const stale = await put(lead, "scans", { data: ["stale"] }, 1);
assert.equal(stale.status, 409, "a stale write is refused");
assert.deepEqual(stale.data.data, { data: [1, 2] });
assert.equal(stale.data.version, 2);
assert.equal(
  (await put(lead, "scans", { data: [1, 2, 3] }, 2)).data.version,
  3,
);
assert.equal(
  (await put(admin, "scans", { data: [] }, 0)).status,
  409,
  "create-only when version is 0",
);
assert.equal((await put(admin, "nonsense", {}, 0)).status, 404);
assert.equal((await put(admin, "scans", {}, "1")).status, 400);
const all = (await lead("/api/stores/Default")).data;
assert.deepEqual(all.scans, { data: { data: [1, 2, 3] }, version: 3 });
assert.equal((await admin("/api/stores/Nope")).status, 404);

step("roles: auditor is read-only, lead can't touch policy or users");
assert.equal((await put(auditor, "remediation", {}, 0)).status, 403);
assert.equal(
  (
    await auditor("/api/evidence/Default/k1", {
      method: "PUT",
      body: { data: [], version: 0 },
    })
  ).status,
  403,
);
assert.equal(
  (await auditor("/api/workspaces", { method: "POST", body: { name: "X" } }))
    .status,
  403,
);
assert.equal((await put(lead, "policy", { sod: false }, 0)).status, 403);
assert.equal((await put(admin, "policy", { sod: true }, 0)).status, 200);
assert.equal((await lead("/api/users")).status, 403);
assert.equal(
  (
    await lead("/api/users/" + addAud.data.id, {
      method: "PATCH",
      body: { role: "Administrator" },
    })
  ).status,
  403,
);
assert.equal(
  (await lead("/api/workspaces/Default", { method: "DELETE" })).status,
  403,
);
assert.equal(
  (await auditor("/api/stores/Default")).status,
  200,
  "auditor can read",
);

step("prefs are per user, any role, and private");
assert.equal(
  (
    await put(
      auditor,
      "prefs",
      { aud: { cols: ["risk"] }, root: { cols: ["hacked"] } },
      0,
    )
  ).status,
  200,
);
assert.equal(
  (await put(admin, "prefs", { root: { cols: ["mine"] } }, 0)).status,
  200,
);
assert.deepEqual((await auditor("/api/stores/Default")).data.prefs.data, {
  aud: { cols: ["risk"] },
});
assert.deepEqual((await admin("/api/stores/Default")).data.prefs.data, {
  root: { cols: ["mine"] },
});

step("evidence: list keys, versioned writes");
assert.deepEqual((await lead("/api/evidence/Default/a%7C1")).data, {
  data: [],
  version: 0,
});
assert.equal(
  (
    await lead("/api/evidence/Default/a%7C1", {
      method: "PUT",
      body: { data: [{ img: "x" }], version: 0 },
    })
  ).data.version,
  1,
);
assert.equal(
  (
    await admin("/api/evidence/Default/a%7C1", {
      method: "PUT",
      body: { data: [], version: 0 },
    })
  ).status,
  409,
);
assert.deepEqual((await admin("/api/evidence/Default")).data, ["a|1"]);

step("audit: server stamps the user, chain verifies, nobody can rewrite it");
const a1 = await lead("/api/audit/Default", {
  method: "POST",
  body: { action: "ACCEPT_RISK", detail: "accepted X", ref: "a|1" },
});
assert.equal(a1.status, 201);
assert.equal(a1.data.user, "lead");
assert.equal(a1.data.role, "Remediation Lead");
assert.equal(
  (
    await auditor("/api/audit/Default", {
      method: "POST",
      body: { action: "EXPORT", detail: "pdf" },
    })
  ).status,
  201,
);
assert.equal(
  (
    await lead("/api/audit/Default", {
      method: "POST",
      body: { action: "bad action!" },
    })
  ).status,
  400,
);
const log1 = (await auditor("/api/audit/Default")).data;
assert.equal(log1.entries[0].action, "EXPORT");
assert.equal(log1.entries[0].user, "aud");
assert.deepEqual((await admin("/api/audit/Default/verify")).data.ok, true);
assert.equal(
  (await lead("/api/audit/_system")).status,
  403,
  "system log is admin-only",
);
const sys = (await admin("/api/audit/_system")).data.entries.map(
  (e) => e.action,
);
assert.ok(
  sys.includes("LOGIN_FAILED") &&
    sys.includes("USER_ADD") &&
    sys.includes("SETUP"),
);
await q(
  "UPDATE vl_audit SET detail = 'edited' WHERE workspace = 'Default' AND seq = 2",
);
assert.equal(
  (await verifyAuditChain("Default")).ok,
  false,
  "tampering in the DB is detected",
);

step("workspaces: create, backup, restore, delete keeps audit");
assert.equal(
  (
    await lead("/api/workspaces", {
      method: "POST",
      body: { name: "Client A" },
    })
  ).status,
  201,
);
assert.equal(
  (
    await lead("/api/workspaces", {
      method: "POST",
      body: { name: "Client A" },
    })
  ).status,
  409,
);
assert.equal(
  (await lead("/api/workspaces", { method: "POST", body: { name: "../x" } }))
    .status,
  400,
);
assert.equal(
  (await lead("/api/workspaces", { method: "POST", body: { name: "_system" } }))
    .status,
  400,
);
const bk = await admin("/api/workspaces/Default/export");
assert.equal(bk.status, 200);
assert.deepEqual(bk.data.evidence, { "a|1": [{ img: "x" }] });
assert.equal(bk.data.stores.prefs, undefined, "prefs stay out of backups");
assert.equal((await lead("/api/workspaces/Default/export")).status, 403);
const rs = await admin("/api/workspaces/Client%20A/import", {
  method: "POST",
  body: bk.data,
});
assert.deepEqual(rs.data, { ok: true, stores: 2, evidence: 1 });
assert.deepEqual((await lead("/api/stores/Client%20A")).data.scans.data, {
  data: [1, 2, 3],
});
assert.equal(
  (await admin("/api/workspaces/Client%20A", { method: "DELETE" })).status,
  200,
);
assert.equal((await lead("/api/stores/Client%20A")).status, 404);
assert.ok(
  (await admin("/api/audit/Client%20A/verify")).status === 404,
  "deleted workspace is gone from the API",
);
assert.ok(
  (
    await q("SELECT COUNT(*) AS n FROM vl_audit WHERE workspace = 'Client A'")
  )[0].n > 0,
  "but its audit rows remain",
);

step(
  "governance: separation of duties, two-person rule, policy limits — enforced by the server",
);
assert.equal(
  (await admin("/api/workspaces", { method: "POST", body: { name: "Gov" } }))
    .status,
  201,
);
const addA2 = await admin("/api/users", {
  method: "POST",
  body: {
    username: "root2",
    role: "Administrator",
    password: PW + "z",
    mustChange: false,
  },
});
const admin2 = client();
assert.equal(
  (
    await admin2("/api/auth/login", {
      method: "POST",
      body: { username: "root2", password: PW + "z" },
    })
  ).status,
  200,
);
const gput = (api, name, data, version) =>
  api("/api/stores/Gov/" + name, { method: "PUT", body: { data, version } });
const gver = async (name) =>
  ((await admin("/api/stores/Gov")).data[name] || { version: 0 }).version;
const gdata = async (name) =>
  ((await admin("/api/stores/Gov")).data[name] || {}).data;
await gput(
  admin,
  "scans",
  {
    v: 2,
    data: [
      {
        key: "crit|kev",
        sev: "critical",
        cves: ["CVE-2021-44228"],
        name: "Log4Shell",
      },
      { key: "low|1", sev: "low", cves: [], name: "Banner disclosure" },
    ],
  },
  0,
);
const day = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const withKey = (base, k, v) => Object.assign({}, base || {}, { [k]: v });
let rem = {};
const save = async (api, next) => {
  const r = await gput(api, "remediation", next, await gver("remediation"));
  if (r.status === 200) rem = next;
  return r;
};

const lead2 = lead;
const leadAccept = await save(
  lead2,
  withKey(rem, "low|1", {
    state: "accepted",
    until: day(30),
    approvedBy: "lead",
  }),
);
assert.equal(leadAccept.status, 403, "a lead can't accept risk directly");
const forged = await save(
  lead2,
  withKey(rem, "low|1", {
    state: "requested",
    requestedState: "accepted",
    requestedBy: "root",
    until: day(30),
  }),
);
assert.equal(forged.status, 403, "can't file a request in someone else's name");
assert.equal(
  (
    await save(
      lead2,
      withKey(rem, "low|1", {
        state: "requested",
        requestedState: "accepted",
        requestedBy: "lead",
        until: day(30),
      }),
    )
  ).status,
  200,
);
assert.equal(
  (
    await save(
      admin,
      withKey(rem, "low|1", {
        state: "accepted",
        until: day(30),
        requestedBy: "lead",
        approvedBy: "root2",
      }),
    )
  ).status,
  400,
  "approval must be in your own name",
);
assert.equal(
  (
    await save(
      admin,
      withKey(rem, "low|1", {
        state: "accepted",
        until: day(30),
        requestedBy: "lead",
        approvedBy: "root",
      }),
    )
  ).status,
  200,
  "admin approves a lead's request",
);

const selfDirect = await save(
  admin,
  withKey(rem, "crit|kev", {
    state: "accepted",
    until: day(10),
    approvedBy: "root",
  }),
);
assert.equal(
  selfDirect.status,
  403,
  "SoD: an admin can't accept risk without someone else's request",
);
assert.equal(selfDirect.data.code, "governance");
assert.equal(
  (
    await save(
      admin,
      withKey(rem, "crit|kev", {
        state: "requested",
        requestedState: "accepted",
        requestedBy: "root",
        until: day(10),
      }),
    )
  ).status,
  200,
);
assert.equal(
  (
    await save(
      admin,
      withKey(rem, "crit|kev", {
        state: "accepted",
        until: day(10),
        requestedBy: "root",
        approvedBy: "root",
      }),
    )
  ).status,
  403,
  "SoD: nobody approves their own request",
);
assert.equal(
  (
    await save(
      admin2,
      withKey(rem, "crit|kev", {
        state: "accepted",
        until: day(60),
        requestedBy: "root",
        approvedBy: "root2",
      }),
    )
  ).status,
  400,
  "critical exceptions are capped by policy (30 days)",
);
assert.equal(
  (
    await save(
      admin2,
      withKey(rem, "crit|kev", {
        state: "accepted",
        until: day(10),
        requestedBy: "root",
        approvedBy: "root2",
      }),
    )
  ).status,
  200,
  "a second admin approves",
);
assert.equal(
  (
    await save(
      lead2,
      withKey(
        rem,
        "crit|kev",
        Object.assign({}, rem["crit|kev"], { until: day(25) }),
      ),
    )
  ).status,
  403,
  "a lead can't extend an exception",
);
assert.equal(
  (
    await save(
      admin,
      withKey(
        rem,
        "crit|kev",
        Object.assign({}, rem["crit|kev"], {
          until: day(25),
          approvedBy: "root",
        }),
      ),
    )
  ).status,
  403,
  "renewing alone is blocked by SoD",
);

assert.equal(
  (
    await save(
      lead2,
      withKey(
        rem,
        "low|1",
        Object.assign({}, rem["low|1"], {
          cvssVector: "CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:N",
        }),
      ),
    )
  ).status,
  403,
  "leads can't re-score",
);
assert.equal(
  (
    await save(
      admin,
      withKey(
        rem,
        "low|1",
        Object.assign({}, rem["low|1"], {
          cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        }),
      ),
    )
  ).status,
  200,
);
assert.equal(
  (
    await save(
      admin,
      withKey(rem, "vex|1", { state: "fp", by: "VEX", vexId: "CVE-1|lib" }),
    )
  ).status,
  200,
  "admins can apply VEX suppressions",
);
assert.equal(
  (
    await save(
      lead2,
      withKey(rem, "vex|2", { state: "fp", by: "VEX", vexId: "CVE-2|lib" }),
    )
  ).status,
  403,
  "leads only request them",
);

step("two-person rule when separation of duties is off");
assert.equal(
  (await gput(admin, "policy", { sod: false, twoPerson: true }, 0)).status,
  200,
);
const rem2 = Object.assign({}, rem);
delete rem2["low|1"].approvedBy;
rem = await gdata("remediation");
assert.equal(
  (
    await save(
      admin,
      withKey(rem, "low|2", { state: "fp", approvedBy: "root" }),
    )
  ).status,
  403,
  "unknown finding is treated as sensitive",
);
await gput(
  admin,
  "scans",
  {
    v: 2,
    data: [
      { key: "crit|kev", sev: "critical", cves: ["CVE-2021-44228"] },
      { key: "low|1", sev: "low", cves: [] },
      { key: "low|2", sev: "low", cves: [] },
    ],
  },
  await gver("scans"),
);
assert.equal(
  (
    await save(
      admin,
      withKey(rem, "low|2", { state: "fp", approvedBy: "root" }),
    )
  ).status,
  200,
  "low, non-KEV: one admin is enough",
);
assert.equal(
  (
    await save(
      admin,
      withKey(rem, "crit|kev", { state: "fp", approvedBy: "root" }),
    )
  ).status,
  403,
  "critical/KEV needs a second person",
);

step(
  "report approval: admins only, not by the last editor, and edits after approval are refused",
);
const eput = (api, data) => gput(api, "engagement", data, null);
const ever = () => gver("engagement");
await gput(admin, "policy", { sod: true }, await gver("policy"));
assert.equal(
  (
    await gput(
      lead2,
      "engagement",
      { client: "Acme", status: "Approved", approvedBy: "lead" },
      0,
    )
  ).status,
  403,
);
assert.equal(
  (await gput(admin, "engagement", { client: "Acme", status: "In review" }, 0))
    .status,
  200,
);
assert.equal(
  (
    await gput(
      admin,
      "engagement",
      { client: "Acme", status: "Approved", approvedBy: "root" },
      await ever(),
    )
  ).status,
  403,
  "last editor can't approve",
);
assert.equal(
  (
    await gput(
      admin2,
      "engagement",
      { client: "Acme", status: "Approved", approvedBy: "root2" },
      await ever(),
    )
  ).status,
  200,
);
assert.equal(
  (
    await gput(
      admin,
      "engagement",
      { client: "Acme Corp", status: "Approved", approvedBy: "root2" },
      await ever(),
    )
  ).status,
  403,
  "approved report can't be edited silently",
);
assert.equal(
  (
    await gput(
      admin,
      "engagement",
      { client: "Acme Corp", status: "In review" },
      await ever(),
    )
  ).status,
  200,
);
void eput;
void rem2;

step("disabling a user ends their session at once");
assert.equal(
  (
    await admin("/api/users/" + addLead.data.id, {
      method: "PATCH",
      body: { disabled: true },
    })
  ).status,
  200,
);
assert.equal((await lead("/api/workspaces")).status, 401);
assert.equal(
  (
    await admin("/api/users/" + addA2.data.id, {
      method: "PATCH",
      body: { disabled: true },
    })
  ).status,
  200,
);
assert.equal(
  (
    await admin("/api/users/" + s.data.user.id, {
      method: "PATCH",
      body: { role: "Security Auditor" },
    })
  ).status,
  409,
  "last admin stays admin",
);
assert.equal(
  (await admin("/api/users/" + s.data.user.id, { method: "DELETE" })).status,
  409,
);

step("idle timeout signs people out on the server");
await q("UPDATE vl_sessions SET last_seen = '2000-01-01T00:00:00.000Z'");
const idle = await auditor("/api/workspaces");
assert.equal(idle.status, 401);
assert.equal(idle.data.code, "idle");

step("logout clears the session");
const again = client();
await again("/api/auth/login", {
  method: "POST",
  body: { username: "root", password: PW },
});
assert.equal((await again("/api/workspaces")).status, 200);
await again("/api/auth/logout", { method: "POST", body: {} });
assert.equal((await again("/api/workspaces")).status, 401);

step("a database error is a 500, not a crash");
await q("DROP TABLE vl_evidence");
const boom = await again("/api/auth/login", {
  method: "POST",
  body: { username: "root", password: PW },
}).then(() => again("/api/evidence/Default"));
assert.equal(boom.status, 500);
assert.equal(
  boom.data.error,
  "Something went wrong on the server.",
  "no internals leak",
);
assert.equal(
  (await fetch(base + "/api/health")).status,
  200,
  "server still up",
);

console.log("All API checks passed.");
process.exit(0);
