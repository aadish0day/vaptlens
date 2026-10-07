# VAPTLens: full-spectrum production audit

**Date:** 2026-10-07 · **Scope:** the whole repository: app, engine, parsers, server, Docker/nginx, design system and docs. · **Method:** six parallel reviewers, each auditing a separate area: security/API/database, core logic, app state and workflows, UX/accessibility, design system, and engineering/testing/competitors. All were read-only on the repo. Findings marked **verified** were reproduced by running code: esbuild-bundled engine and parsers under Node, `node server/check.mjs`, `npm run build`, and Playwright with system Chromium against the dev server at 1440px and 390px in light and dark themes. Everything else was traced in code with `file:line` evidence. Source IDs (SEC-, LOGIC-, APP-, UX-/A11Y-, DS-, ENG-) refer to each reviewer's notes. Where reviewers overlapped, the findings are merged here.

> **Status update — 2026-10-07 (same day):** the owner chose **§6 option 2 (server-backed team product; the server may read the data)**. Implemented and verified (API self-check on SQLite and Postgres, Playwright end-to-end on the dev server and the production Docker stack):
> server accounts with scrypt, lockout, rate limit and HttpOnly/SameSite=Strict sessions; roles enforced per API route; versioned saves with 409 conflicts; per-user prefs; server-written hash-chained audit; full server-side backup/restore incl. evidence; DB-checked health, crash-proof handler, graceful shutdown, JSON request logs; `ALLOWED_HOSTS` DNS-rebinding guard; client storage rewritten (no localStorage fallback, no boot-wipe, no deadlocks, retry while offline, conflict banner, evidence error state); debug hooks dev-only; `.dockerignore`/`.gitignore`/docs fixed.
> **Resolved or superseded:** D-1–D-10, D-11 (server audit), S-1, S-4, S-6, S-7, S-10, R-1, R-3, R-4, R-6, E-2, and most of S-2/S-5/R-7/E-3/E-4.
> **Second pass (same day):** S-3 done — the server enforces separation of duties, the two-person rule, approver identity, `maxDays`, admin-only CVSS re-score and report approval (`checkRemediation`/`checkEngagement`, covered by `server/check.mjs`). Engine L-1 (cross-scanner dedup), L-2/L-3 (date validation, day/month order, no future dates), L-4 (severity words/decimals), L-5 (VEX scoped to SCA/SAST when no product), L-6, L-9, L-18 fixed with new self-tests (`npm run selftest`). UX U-1–U-5, U-8 done, plus a skip-to-main link, KEV/inbox/avatar contrast and ≥24px status-bar targets. CI: `.github/workflows/ci.yml` (build, self-tests, API check on SQLite and Postgres, `npm audit`, Docker build). The landing page is now React (`src/landing/`) at `/`; the app is at `/app/`.
> **Still open:** S-8/S-9 (size caps, evidence-key privacy), S-11 (jspdf, images), R-2 (scheduled `pg_dump`), R-5, R-8 (beyond the new `vl_meta` migrations), the rest of §3.4 (L-7, L-8, L-10, L-11 and below), the rest of §3.5/§3.6 (mobile "More" menu, chart text labels, settings-popover focus), E-1 (browser e2e tests aren't in CI yet), E-5, E-6, HTTPS in front of the stack.

---

## 1. Executive summary

VAPTLens has a strong analytics core. CVSS 3.1/4.0 scoring is spec-accurate, it ships the official CISA SSVC table and VEX precedence rules, and its fix inference is scope-aware: an Nmap sweep never closes a Nessus finding. The security headers at the edge are well made (strict CSP, CSRF guard, parameterised SQL). The design system is unusually thorough, with 17 themes that all pass contrast.

It is **not production-ready**, and the main reason is the persistence layer, not the UI. The product promises, in README, CLAUDE.md and on-screen text ("Nothing leaves this browser"), a zero-trust, browser-only tool where only an encrypted snapshot ever leaves the device. The code no longer works that way:

- Every save is sent to a server API (`/api/stores`). It goes in **plaintext** whenever the vault is locked or missing. Backups and team-sync snapshots contain plaintext **even when the vault is unlocked**.
- Failed saves report success. Failed loads are treated as "empty" and then **written back over server data** at startup.
- The local fallback cache is shared across workspaces, so one client's data can be saved into another client's workspace.
- **Two separate save-chain deadlocks** (verified) hang restore, team-sync pull, workspace switching and key rotation.
- Key rotation doesn't re-encrypt server data, which leaves the data **undecryptable**.
- The sync server **crashes on any database error**, and Docker gives up restarting it after 3 crashes.
- Every role and governance control (Security Auditor read-only, separation of duties, the two-person rule) is enforced **only in the browser**. Several are bypassable even inside the UI: exception renewal, CVSS re-score, false positives, SLA edits, report self-approval.

Below the persistence layer, the engine has correctness bugs that distort the numbers the product exists to produce (all verified):
- The same CVE reported by two scanners is never deduplicated.
- Invalid dates produce NaN, and NaN SLAs never breach.
- Ambiguous date formats and future-dated rows move the global "today".
- `"7.0"` and `"Urgent"` severities become Info.
- A VEX statement with no product suppresses that CVE across the whole estate.

There is no test runner, no CI and no git history yet. That is good timing: fix the repo hygiene before the first commit.

**Current score: 4.5/10. Realistic target after Phases 0–2: 8/10** (scorecard in §10).

---

## 2. Product model

- **Users:** pentest consultancies and small in-house security teams. Roles are Administrator, Remediation Lead and Security Auditor (read-only).
- **Core job:** import scanner output (about 20 formats), deduplicate it into findings, prioritise (risk, SSVC, KEV/EPSS, VEX), track remediation (board, campaigns, tickets, SLA, retest, exceptions), and report (DOCX, PDF, HTML, evidence ZIP, framework evidence).
- **Primary workflow:** first-run setup → import → triage → assign/ticket → remediate → retest → report.
- **Secondary workflows:** governance (exceptions, two-person approvals, policies, frameworks), metrics and goals, attack paths, assets and CMDB, rules automation, team sync, backup and restore, and an AI assistant (only inside claude.ai).
- **Security-sensitive workflows:** account setup and login (password-wrapped data key, or DEK), user management and key rotation, risk acceptance, backup/restore/pull, workspace deletion, exports sent to clients.

---

## 3. Master gap table (merged and deduplicated)

Severity: C = Critical, H = High, M = Medium, L = Low. Priority: P0 = fix now, P1 = before production, P2 = important, P3 = later. Effort: S/M/L.

### 3.1 Data integrity and persistence

| ID | Problem | Sev | Evidence | Why it matters | Recommendation | Eff | Pri |
|---|---|---|---|---|---|---|---|
| D-1 | Plaintext workspace data reaches the server: every store when the vault is locked, and **backup files and team-sync snapshots even when it's unlocked**. The server then copies findings into plaintext tables that nothing ever reads. | C | store.ts:599-604, 767, 861-891 (`P.loadAll` returns decrypted data and puts it into `stores`); sync.ts:67-73; DataDrawer.tsx:74, 922 ("findings stay ciphertext"); server.mjs:391-845 (no SELECT on findings/batches/assets/audit_log) | It breaks the product's core promise. Anyone with the token, DB access or a backup file can read client vulnerability data. *(SEC-1, ENG-2, SEC-16)* | Export only ciphertext (`VAULT.enc`) in `exportWorkspace`. Make the vault mandatory before any PUT. The server rejects non-`{ct}` payloads. Delete the denormalised tables and their helpers. | M | P0 |
| D-2 | **Deadlock #1:** `P.update` calls `P.save`, which waits on the update's own pending chain. It runs on mount (App.tsx:538) and then hangs `P.idle()` everywhere. | C | store.ts:637-654 with 562-585 (**verified**, deadlock.mjs) | Sync push/pull, restore, workspace switch and key rotation never complete. *(LOGIC-1)* | Inside `update`, bump `_seq` and call `_saveRemote` directly. | S | P0 |
| D-3 | **Deadlock #2:** `P.hold(gate)` waits on `importWorkspace`, whose saves wait on the same gate. After a manual reload, the server's old stores replace the restore. | C | store.ts:460-466, 574-581, 924-948; DataDrawer.tsx:111-128; sync.ts:84-88 (simulated) | Restore and team-sync pull hang, and the restore is silently lost. *(SEC-6)* | Call `_saveRemote` directly in import, or set the gate after queuing the saves. | S | P0 |
| D-4 | A failed load at boot is treated as "no data". Effects that run on mount then send DELETE or PUT with the empty or stale state. | C | App.tsx:554-558 (`P.save("scans", null)`), 214-219, 387-484; store.ts:519-521 | One server blip at startup can wipe or roll back the server copy. *(APP-1, APP-30)* | Track `loadFailed` per store and refuse writes, as `P.failed` already does. Never save on mount. Block startup with a "server unreachable: retry / read-only" screen. | M | P0 |
| D-5 | The localStorage fallback and cache keys aren't namespaced by workspace. A GET 404 is treated as "use the fallback". | C | store.ts:9-25, 523-560, 589-615, 108 | Creating workspace "ClientB" shows ClientA's findings, and the next save writes them to ClientB on the server. Names the server rejects (e.g. non-ASCII) always 404. *(SEC-8, APP-2, APP-22)* | Prefix every key with the workspace. Treat 404 as empty. Validate workspace names client-side with the server's regex. | S | P0 |
| D-6 | Save failures report success: a failed PUT returns `true`, and a localStorage quota error is swallowed. There's no save or offline indicator. | H | store.ts:603-630, 776-779; App.tsx:590-597 (that toast can never fire) | Users believe large scans and edits are saved when they're gone after a reload. *(ENG-3, SEC-7, APP-3)* | Return status from `_saveRemote` and show a "Saved / Offline / NOT SAVED" indicator plus a `beforeunload` guard. Retry with backoff from a dirty queue. | M | P0 |
| D-7 | Evidence: a failed load returns `[]` and the next add overwrites the server list. There's no local fallback, and backups and evidence ZIPs include only evidence loaded this session. | C | store.ts:731-781, 873-876; Evidence.tsx:14-45; integrations.ts:578-585 | Screenshots are silently destroyed, and client deliverables are incomplete. *(APP-4, APP-9)* | Add an error state that disables "add". Use per-item IDs or read-modify-write. Enumerate evidence from the server for backups and ZIPs, and fail loudly on gaps. | M | P0 |
| D-8 | Key rotation re-encrypts localStorage and IndexedDB only, not server stores, evidence, other workspaces or snapshots. | C | auth.ts:512-645 vs store.ts:476-521 | After a reload every store fails to decrypt (frozen, and evidence "empty" → overwritten by D-7). A removed user can still decrypt the old server data. *(SEC-9, APP-5)* | Inside `P.hold`, re-save every store and evidence item in every workspace with the new key, verify, then commit. Or version keys with a `kid`. | M | P0 |
| D-9 | `/api/stores` and `/api/evidence` are last-write-wins whole-document writes. There's no multi-tab coordination. `/api/ws`'s 409 check is a TOCTOU race on Postgres. | H | server.mjs:1175-1241, 943-977; store.ts:637-653 | Two analysts or two tabs silently erase each other's remediation decisions. *(ENG-4/5, SEC-13/14, APP-6)* | Add a per-store `version` with If-Match → 409, plus client merge and retry. Use a single-statement conditional upsert on `/api/ws`. Add a BroadcastChannel to invalidate the cache. | M | P1 |
| D-10 | Pull and restore write **arbitrary localStorage keys**, including `vaptlens.users.v1` and `vl-sync-token`, from the snapshot or file. A restore leaves extra server stores and evidence behind, and the RESTORE audit entry is lost. | H | store.ts:897-949, 916-920 | A malicious token holder can push modified accounts or roles to every teammate who pulls. *(SEC-5, APP-16)* | Only allow known store keys. Never import `vl-*` or users without admin confirmation. Delete stragglers, and append the audit entry after import. | M | P1 |
| D-11 | The audit log is client-authored: unkeyed SHA-256, the head is stored next to the log, unhashed entries are accepted, a failed hash drops the entry silently, it's capped at 2,000, and it's fully replaceable or deletable through the API. | M | store.ts:952-1030; App.tsx:1460-1469; server.mjs:589-615 | A tamper-evident trail for compliance can be rewritten without detection. *(SEC-10, LOGIC-23, APP-14)* | Use a server-side append-only table written by the server with the authenticated actor, and an HMAC head. Archive instead of truncating. | M | P2 |
| D-12 | Records are left orphaned: deleting a batch or clearing data leaves governance, campaign, evidence and ticket records behind. Requests on findings outside the latest batch never appear in Approvals. Users are referenced by username, which can be reused. | L | App.tsx:1322-1401; ApprovalsModal.tsx:8-16; auth.ts:511-524 | Pending requests never get decided, and a re-created user inherits someone else's history. *(LOGIC-22/28, APP-29)* | Add an orphan view and a cascade prompt. Store user IDs in `requestedBy`/`approvedBy`. | S | P2 |

### 3.2 Security: authentication, authorization and API

| ID | Problem | Sev | Evidence | Attack path | Recommendation | Eff | Pri |
|---|---|---|---|---|---|---|---|
| S-1 | No token by default, and nginx accepts any `Host`, so the loopback-only default is open to **DNS rebinding**. | H | .env.example:9; nginx.conf:4 `server_name _`; server.mjs:279, 849 | The victim visits attacker.com, which rebinds to 127.0.0.1:8080. The browser treats the requests as same-origin, and the attacker calls `/api/backup` and DELETE for every workspace. *(SEC-3)* | Refuse to start without `SYNC_TOKEN`, or generate one on first run. Add a Host allowlist in nginx (`return 421`) and in server.mjs. | S | P0 |
| S-2 | Every role, separation-of-duties and two-person control is client-side. Roles are stored unsigned in localStorage, every account unwraps the same DEK, and the server has one shared token. | H | auth.ts:16, 60-69; App.tsx:305, 1579, 1794-1893 (raw setters on `ctx`); server.mjs:277-288 | An Auditor edits `role` in localStorage, or calls `PUT /api/stores/<ws>/remediation` with the team token, and approves their own exception. *(SEC-2, APP-7, ENG-23)* | Short term: guard every mutator inside App.tsx (list in §4), stop exposing raw setters, sign the users store with an HMAC under the DEK, and **document that roles are advisory**. Long term: per-user server auth with server-side RBAC. | L | P1 |
| S-3 | Governance bypasses inside the UI: admin renewal ignores `sod`; renewing an expired exception revives it alone; CVSS re-score can downgrade severity without approval; the two-person rule doesn't cover false positives (which never expire); Leads can change SLA windows (stored plaintext per browser); an admin can approve their own report. | H | ExceptionRegister.tsx:80-117; CvssCalc.tsx:38-44; Detail.tsx:176; BulkBar.tsx:180-185; Sla.tsx:197-260; App.tsx:242-258; EngagementModal.tsx:49-94 | A single admin keeps a critical KEV exception alive indefinitely, or re-scores it to Low. *(APP-10/11/24, LOGIC-7/8/9/27)* | Route all of these through `decideRequest`'s `needSecond` logic. Move SLA into the encrypted, synced `policy`, admin-only. | S | P1 |
| S-4 | Every account's wrapped DEK and salt ship to the server on each push. PBKDF2 uses 310k iterations (OWASP 2023 recommends 600k). | H | store.ts:861-866; auth.ts | Anyone holding the token or the DB can guess every user's password offline, and lockout doesn't apply. *(SEC-4, SEC-18)* | Raise to 600k+ (or Argon2id via WASM). Stop shipping `users.v1` unless needed, and prefer per-user server auth. | M | P1 |
| S-5 | One static, shared, non-expiring team token is kept in localStorage. Removing a user doesn't revoke their access. There's no TLS or HSTS, but the README tells teams to bind `0.0.0.0`. | M | sync.ts:5-19; nginx.conf:5; security-headers.conf | An ex-teammate keeps full read/write/delete access, and on a LAN the token is sniffable. *(SEC-19, SEC-21)* | Per-user or rotatable hashed tokens. Ship a TLS proxy profile (Caddy) plus HSTS, and refuse non-loopback binding without TLS in the docs. | M | P1 |
| S-6 | `window.__vl` (AUTH, VAULT with the in-memory key, P, IDB) and `window.__vlTest` ship in production builds. | M | main.tsx:24-36 | Any XSS or extension can export the DEK in one line. *(ENG-22, SEC-17)* | Gate them behind `import.meta.env.DEV` or `VITE_E2E`. | S | P1 |
| S-7 | `.env` (holding the real token and DB password) isn't in `.dockerignore`, so `COPY . .` puts it into the build and dev image layers. | M | .dockerignore; Dockerfile:5, 14 | A shared image or build cache leaks secrets. *(SEC-22)* | Add `.env*`, `!.env.example`, `.git`, `.claude`, `test-data`, `*.db` and `.design-sync` to `.dockerignore`. | S | P1 |
| S-8 | DoS: 64 MB fully buffered bodies, synchronous `JSON.parse`, row-by-row inserts while holding a pool client, no rate limit, and no pool or statement timeouts. Imports and `.gz` decompression have no size cap and parse on the main thread. | M | server.mjs:25, 295-311, 638-743; store.ts:1037-1052; parsers.ts:1310 | A few large PUTs exhaust the pool, and a crafted scan file freezes the tab. *(SEC-12, SEC-28)* | Add `limit_req`, per-route caps of a few MB, `connectionTimeoutMillis` and `statement_timeout`. Cap decompressed bytes and parse in a Worker. | M | P2 |
| S-9 | Privacy leaks outside the encryption: workspace (client) names and evidence keys (`host\|port\|plugin\|path`) appear in URLs, nginx access logs and primary keys. Advanced filter rules are stored plaintext. The assistant's scrubbing misses URLs and credentials in descriptions. | M | store.ts:724; engine.ts:837-850; nginx.conf; Findings.tsx:22; Assistant.tsx:113-131 | Logs reveal which clients have which vulnerable hosts. *(SEC-20, APP-28, SEC-29)* | Hash evidence keys client-side and turn off the `/api/` access log. Encrypt filters. Widen the scrub and preview the outgoing prompt. | S | P2 |
| S-10 | API hygiene: 500 responses echo `e.message`; PUT database failures are masked as 400; `/api/backup` and `/api/restore` are unused by the client, and restore skips name and key validation; any store name is accepted (including `__proto__`); the `{data:x}` unwrap corrupts that shape. | L | server.mjs:1106-1286, 1465-1666, 1180-1186 | Information leak, extra exfiltration and wipe surface. *(SEC-26/27/32, ENG-28)* | Return generic errors. Delete both routes or validate them. Allowlist store names to `LS_NAMES`. Always wrap and unwrap. | S | P2 |
| S-11 | Supply chain: jspdf is pinned at 2.5.1, which has published advisories (pulls dompurify 2.5.9). `pg` and `@types/pg` are in the browser app's `dependencies`, so the sync image installs the whole frontend tree. Base images aren't pinned by digest, nginx runs as root, there's no `cap_drop`, and the app connects as the Postgres superuser. | M | package.json; Dockerfile; compose | Known-vulnerable libraries in a security product, and a wide blast radius. *(SEC-23/25, ENG-11/24)* | Upgrade jspdf to the latest 3.x and run `npm audit`. Give `server/` its own `package.json`. Use nginx-unprivileged, `cap_drop: [ALL]`, pinned digests and a least-privilege DB role. | S | P1 |

### 3.3 Reliability and operations

| ID | Problem | Sev | Evidence | Recommendation | Eff | Pri |
|---|---|---|---|---|---|---|
| R-1 | Any database error crashes the server (async handler with no catch, no `pool.on('error')`), and `restart: on-failure:3` then leaves it down for good. **Verified.** | C | server.mjs:866, 1693-1697; compose | Wrap the handler and return a generic 500. Add `pool.on('error')` and `restart: unless-stopped`. *(ENG-1, SEC-11)* | S | P0 |
| R-2 | No backup or restore procedure for the `pg-data` volume, which holds all client data. | H | compose; README | Add a `pg_dump` sidecar or cron with retention, write a restore runbook, and **test the restore**. *(ENG-14)* | S | P1 |
| R-3 | Client fetches have no timeout. One hung request blocks that store's save chain forever. | M | store.ts:94-127 | Use `AbortSignal.timeout(15000)`. *(ENG-7)* | S | P1 |
| R-4 | `/api/health` doesn't touch the DB, the sync service has no healthcheck, there's no SIGTERM handling or pool/statement timeouts, and no structured logs or request IDs. | M | server.mjs:57, 884-893 | Make health run `SELECT 1`, add a compose healthcheck, graceful close, and one JSON log line per request. Skip Prometheus until it's needed. *(ENG-12/13)* | S | P2 |
| R-5 | Only one ErrorBoundary, at the root: any widget error blanks the whole app. There's no `vite:preloadError` handler, so open tabs break after a deploy. | M | Root.tsx:54-56; main.tsx | Add per-view, per-drawer and per-widget boundaries, plus reload on preload error. *(APP-12, ENG-15)* | S | P1 |
| R-6 | Sign-out (manual or idle) reloads without flushing pending saves. Idle sign-out gives no warning and isn't logged. | M | shell/utils.ts:3-9; App.tsx:358-371, 2046-2050 | `await P.idle()` and the audit write before reloading. Warn 60 seconds ahead. *(APP-13)* | S | P1 |
| R-7 | Node versions are inconsistent: README says 20+, the build uses node:20, sync uses node:24, and the server's static `node:sqlite` import crashes on Node 20 **even in Postgres mode**. There's no `engines` field or `.nvmrc`. | M | Dockerfile:2, 11, 21; server.mjs:12 | Require Node ≥22.13 with `.nvmrc`, use one base image, and lazily `import('node:sqlite')`. *(ENG-10)* | S | P1 |
| R-8 | No database migrations (only `CREATE IF NOT EXISTS`), no foreign keys or cascades, and Postgres and SQLite schemas have drifted apart. | M | server.mjs:57-258 | Add a `schema_migrations` table and an FK from workspace to stores and evidence with `ON DELETE CASCADE`. *(SEC-30)* | M | P2 |

### 3.4 Core logic correctness

| ID | Problem | Sev | Evidence | Failure scenario | Recommendation | Eff | Pri |
|---|---|---|---|---|---|---|---|
| L-1 | No cross-scanner dedup: the fingerprint prefers a namespaced plugin ID. | H | engine.ts:847; parsers.ts:223, 271, 921, 1038 (**verified**) | Nessus and OpenVAS both report CVE-2021-44228 on 10.0.0.5:443 → 2 findings, so counts, risk, MTTR and SLA all double. *(LOGIC-2)* | Add a correlation key (host + port + sorted CVE set) that links findings across sources while keeping each source's lifecycle. | M | P1 |
| L-2 | Invalid dates are accepted and become NaN, and a NaN SLA never breaches. | H | parsers.ts:165-168; engine.ts:945, 1474 (**verified**) | `2026-13-45` → a critical finding that never breaches. *(LOGIC-3)* | Validate with a `Date.UTC` round-trip, and reject the row or batch with a message. | S | P1 |
| L-3 | Scan date is the max of the row dates, with US-style parsing and no future check. The global `AS_OF` ("today") jumps to the newest batch date. | H | Upload.tsx:118-126, 237-246; App.tsx:894-901 (**verified**) | `04.03.2026` (German for 4 March) → 3 April. One future row ages everything about 55 days and triggers mass SLA breaches. *(LOGIC-4, LOGIC-18)* | Reject dates beyond today+1 unless confirmed, ask for the date format, use the median date, and hold `asOf` in React state with a daily rollover. | S | P1 |
| L-4 | `normSev` maps `"4.0"`, `"10.0"`, `"Urgent"`, `"P1"` and `"error"` to info. | H | data.ts:698-720 (**verified**) | Critical findings disappear from the dashboards. *(LOGIC-5)* | Parse numbers with a regex, return "unknown", and ask in the mapping UI. | S | P1 |
| L-5 | A VEX statement with no product matches every finding with that CVE. | H | engine.ts:2462 (**verified**) | A vendor's `not_affected` hides the CVE across the whole estate, including network findings. *(LOGIC-6)* | Require a product match or limit to SCA/SAST findings, and route through approval. | S | P1 |
| L-6 | Jira status sync uses substring matching and resets `fixedAt` on every sync. | M | integrations.ts:262-276 | "Unresolved", "Not Done" and "Incomplete" all map to Remediated, and regressions get masked. *(LOGIC-10)* | Use anchored matching or Jira's statusCategory, and keep the existing `fixedAt`. | S | P1 |
| L-7 | A pending renewal removes the active exemption, and rejecting it deletes the original acceptance. | M | ExceptionRegister.tsx:93-107; App.tsx:888, 1620-1627 | A valid exception disappears just because someone asked to extend it. *(LOGIC-11)* | Store the request in a separate `pending` field. | S | P2 |
| L-8 | Program SLA metrics ignore pauses that per-finding SLA honours. The KEV due date applies even when the finding was first seen after it. | M | engine.ts:930-943, 1259-1292 | Compliance figures are inconsistent and a new Log4j finding shows as breached on day 0. *(LOGIC-12/13)* | Use one pause-clamp function everywhere, and set due = max(kevDue, firstSeen + window). | S | P2 |
| L-9 | Heuristic bugs: `/rdp/` matches "WordPress" (flagging it as ransomware); IPv6 normalisation is broken; empty hosts collapse into `unknown-host`; the CSV CVE column isn't validated; a same-day retest can't verify a fix; asset CSV values are substring-matched. | M | data.ts:267-271; parsers.ts:67-80, 132, 1593; engine.ts:1132; integrations.ts:96-127 (most **verified**) | Inflated risk, duplicate assets, fake CVEs, stuck "Not re-scanned". *(LOGIC-14/15/16/19/21/26)* | Add word boundaries, strip brackets and detect IPv6 first, warn on empty host, use `cvesIn()`, break same-date ties with `importedAt`, use exact matching. | S | P2 |
| L-10 | Performance: 540k rows → `runEngine` takes 8.8 s and `metricsOf` 4.5 s, with a 1.5 GB heap. The engine reruns on every governance change. XML is parsed on the main thread. `Math.max.apply` over a large array may throw. | M | engine.ts:1093-1332; dash.tsx:214 (**verified**) | The tab freezes on large engagements. *(LOGIC-17, ENG-17)* | Index rows by batch once, move parse and engine to a Worker, virtualise VulnTable (`VirtualList` already exists). | M | P2 |
| L-11 | Batch date and `full` flag can be edited with no approval, which rewrites history. Imports aren't idempotent: the same file twice makes a duplicate batch. Merge imports can't be undone by the person who imported. | M | DataDrawer.tsx:427; App.tsx:1402-1410, 2497-2512 | A single edit retroactively marks every unseen issue as Fixed. *(LOGIC-20, APP-19)* | Show an impact preview, add an import hash for dedup, and let the importer roll back their own import. | M | P2 |

### 3.5 UX and accessibility (from the running app)

| ID | Problem | Sev | Evidence | Recommendation | Eff | Pri |
|---|---|---|---|---|---|---|
| U-1 | Expanding a findings row remounts it, and keyboard focus drops to `<body>` (WCAG 2.4.3, 2.1.1). This is the most common action in the app. | H | VulnTable.tsx:350-362 (**verified**) | Wrap the row and its detail row in a keyed `React.Fragment`. *(A11Y-1)* | S | P0 |
| U-2 | Going Back to the entry URL leaves the old view on screen. | H | App.tsx:653-657 (**verified**) | Treat an empty hash as the dashboard. *(UX-1)* | S | P0 |
| U-3 | Clicking the backdrop or pressing Esc in Upload silently throws away the staged files and column mapping. No form in the app guards unsaved changes. | H | Upload.tsx:312-315; Modal overlay (**verified**) | Add a shared `useDirtyGuard` in `useDialog`. *(UX-2/3)* | S | P0 |
| U-4 | Kanban: after a keyboard move, focus goes to `<body>`, and the buttons are only named "Move forward/back". | M | KanbanCard.tsx:52, 61 (**verified**) | Name them "Move {title} to {column}" and refocus the moved card. *(A11Y-2)* | S | P1 |
| U-5 | Undo toasts disappear after 9 s with no pause on hover or focus. Danger toasts never dismiss and cover content across views. Live regions are nested. | M | App.tsx:1486-1495, 2589; Toast.tsx | Pause on hover/focus, keep actions ≥15 s, add Ctrl+Z for the last undo, use one live region, and dismiss on route change. *(A11Y-3, UX-9)* | S | P1 |
| U-6 | Charts are `role=img` with generic names and focusable children inside. The command palette isn't announced (no combobox wiring). | M | DonutChart.tsx:56-85; Palette.tsx:149-172 | Pass data-summary labels and use `role=group` for interactive marks. Add combobox, `aria-activedescendant` and option IDs to the palette. *(A11Y-4/5)* | M | P1 |
| U-7 | At 390px the nav becomes a 1,536px-wide horizontal strip with Upload off-screen, and the findings table scrolls sideways. | M | screenshots m-top, m-table | Use a "More" menu or bottom bar, pin Upload, and show card rows below 600px. *(UX-4)* | M | P1 |
| U-8 | Dead ends and empty states: NoData always says "Dashboard"; files dropped there are thrown away; Re-Test with one scan is a dead end; "Ask Claude" opens a not-available message outside claude.ai; there's no demo workspace. | M | NoData.tsx:8-16 | Use per-route titles, forward dropped files, add an "Upload a re-test scan" button, hide Ask when unavailable, add a "Load sample workspace". *(UX-5/11, APP-21)* | S | P1 |
| U-9 | Findings table: the title column is squeezed while other columns have room; ticking a row pushes the bulk bar in and shifts the rows by 58 px; "Remediate all" is a prominent red button in the filter bar; "Clear all data" offers no backup first. | M | screenshots; DataDrawer.tsx:241-276 | Set column min-widths, make the bulk bar sticky or overlaid, move Remediate all to an overflow menu, and offer a backup inside the confirmation. *(UX-8/12)* | S | P1 |
| U-10 | Smaller issues: no skip link (23 tab stops before content); targets under 24 px (status strip 13 px, chip × 20 px); settings popover doesn't take focus; labels are missing (tag input, ⌘K, DataDrawer, password mismatch); fake sortable headers; ":null" port in HostDrawer; three different risk scales (0–100, 0–1000, /100); rail shortcut digits look like counts; filters aren't in the URL. | L | (A11Y-6..11, UX-6/7/10/13/14) | Fix individually; most are S. Make the risk scale consistent across screens. | S–M | P2 |

### 3.6 Design system

| ID | Problem | Sev | Evidence | Recommendation | Eff | Pri |
|---|---|---|---|---|---|---|
| DS-A | White text on `--threat-kev` / the inbox badge is 3.22:1 at 9.5 px. Avatar white-on-hue drops to 2.93:1. The vintage theme has 4 sub-AA text pairs. | H | ui-extra.css:139, 474; app.css:3202 | Use `--on-danger`, clamp avatar lightness to ≤35%, and darken the 4 vintage values. *(DS-4/5/6)* | S | P0 |
| DS-B | Nothing generates `tokens.json` → `tokens.css`. 13 tokens exist only in the CSS, and three hand-made copies have drifted (Tailwind export v7, 85 hex values in `themes.ts`, the design bundle). | H | (DS-1) | Add one dependency-free `design/build-tokens.mjs` with `--check`, run from `npm run build`. | M | P1 |
| DS-C | The type scale exists only in JSON: 24 font sizes, 115 `font` shorthands, and 13 uses below the 10.5 px floor. | H | (DS-2) | Emit `--type-*` composite tokens and codemod onto the 12-step scale (DS notes §C). | L | P1 |
| DS-D | `--space-1-5` is referenced but undefined; the escaped half-step tokens (`--space-1\.5`) are unusable, so 255 raw px values crept in. | M | ui-extra.css:126, 330 | Rename the half-steps to `--space-0-5/1-5/2-5` and codemod the common px values. *(DS-3)* | S | P1 |
| DS-E | About 55 of the 119 library components are unused by the app, which hand-rolls 81 buttons, 16 selects and 12 tables. Prop names for appearance are inconsistent (`tone`, `variant`, `kind`, `status`). | M | (DS-9/10) | Adopt Select, Textarea, IconButton and Pagination in the views, and standardise on `tone: neutral\|info\|ok\|warn\|danger`. Merge Alert/Banner, EmptyState/StateView and the two icon-button classes. | L | P2 |
| DS-F | `design/components/index.d.ts` is missing **56** exports and has prop drift. 11 icon names in docs and assets don't exist in `ICONS`, so they render empty silently. SVG assets are about 95% C2PA metadata. Reduced-motion and the base font live only in `app.css`. Popover sits on the dropdown z-layer. Breakpoints overlap at 1600. | M | (DS-7/11/12/13/14/15) | Generate the d.ts (or check it in CI), align icon names with Lucide plus a dev warning, strip SVG metadata, move base and motion rules into `ui.css`. | S–M | P2 |

### 3.7 Engineering, testing and docs

| ID | Problem | Sev | Evidence | Recommendation | Eff | Pri |
|---|---|---|---|---|---|---|
| E-1 | No test runner, CI, lint, SAST or secret scanning. Only one parser fixture. Crypto, persistence, roles and exports have zero tests. The README mentions E2E tests that don't exist. | H | package.json; no `.github/` | Add Vitest (it reuses the Vite config) and port the 52 engine self-tests with `test.each`. Add `npm test` for `check.mjs`. Add one GitHub Actions job: typecheck, vitest, `check.mjs`, `check-postgres` with a PG service, `npm audit`, gitleaks, docker build. *(ENG-18, SEC-24)* | M | P1 |
| E-2 | Docs contradict reality: README and CLAUDE.md promise IndexedDB-only zero-trust with no Node at runtime. On-screen text says "Nothing is uploaded". | H | README:3, 22, 52, 63; CLAUDE.md:3; App.tsx:2085; DataDrawer.tsx:298 | Rewrite the architecture section with a data-flow diagram and a threat-model doc, and make the UI copy true (or make the claims true, see §6). *(ENG-19, SEC-15, APP-8)* | S | P0 |
| E-3 | First run is broken: `docker compose up` fails without `.env`; `npm run dev` silently falls back to localStorage because nothing starts the API; there's no `npm run server` script; 11 env vars are undocumented. | M | (ENG-20, §D) | Add `npm run server` and a "dev with server" step. Document `cp .env.example .env`, or put Postgres behind a compose profile. Add an env var reference. | S | P1 |
| E-4 | Repo hygiene **before the first commit**: `*.db`, `.claude/`, `.freebuff/`, "Claude outputs/" and `.audit-md5.txt` aren't ignored; `server.mjs` writes `./vaptlens.db` (possibly plaintext) into the working directory; 6 MB of source maps are served publicly. | M | .gitignore; server.mjs:155; vite.config.ts:14 | Add the ignores, and use `sourcemap:'hidden'` or deny `.map` in nginx. *(ENG-9/21, SEC-31)* | S | P1 |
| E-5 | First load is 439 kB gzip, of which 165 kB is jspdf + html2canvas preloaded eagerly. | M | main.tsx:4; export.ts:1-2 | Load them with dynamic `import()`, as docx and jszip already are. *(ENG-8)* | S | P1 |
| E-6 | God files: App.tsx is 2,611 lines in one function with 40 `useState`s and an `any` ctx rebuilt every render (no memo or useCallback). engine.ts is 3,650 lines. The server duplicates every route for PG and SQLite (about 800 lines). 35 empty catches. About 2,000 `var`. | M | (ENG-16/25/26, APP-26) | Make focused splits (`engine/{cvss,sla,ssvc,attack}`), a small `db.query` adapter in the server, split ctx into data/actions/ui with memoised views, and add ESLint `no-empty` as a warning. **Don't** mass-rewrite `var`. | M | P2 |

---

## 4. Unguarded mutations (client-side role checks)

Views hide the controls, but the shared mutators don't check the role. Fix this in **App.tsx** so every caller is covered (one guard per mutator, not one per view):

- **No `readOnly` check:** `patchGov` (1433), `govUndoable` (1529), `setGov` (1822), `setReport` (1290), `setEngagement` (1846; also admin-only for Approved), `setAssets`/`setLibrary`/`setCampaigns`/`setGoals`/`setRules`/`setVexList` (1825-1885), `runVex`/`clearVex` (1067, 1270), `saveIntel` (1654), `nextTicket` (1650).
- **Should be admin-only:** `setPolicy` (1892), `setSla`/`setSlaTier` (1827/1831), `addAliases` manual (1129), `removeAlias` (1313; currently has no check at all).
- **Should never be exposed:** `setAudit` (1817).
- **Handlers that rely on UI hiding only:**
  - Detail.tsx: `setState` (53), `addNote` (244), `addTag` (298), `toLibrary` (310)
  - CvssCalc.tsx: 39 and 66
  - SlaPause.tsx: 27 and 53
  - Campaigns.tsx:18; Goals.tsx:62; Rules.tsx:327; LibraryModal.tsx:14
  - HostDrawer.tsx:32: auto-saves on unmount for any role
  - Evidence.tsx:69: `del`
  - Assets CMDB import; Findings Jira sync
- A Security Auditor session still writes the saves on mount, the regression effect and prefs.

---

## 5. API surface (server/server.mjs)

Every route shares the same controls:
- A Sec-Fetch-Site/Origin cross-site guard; OPTIONS returns 405.
- A JSON content-type on writes; 64 MB cap; parameterised SQL.
- One shared bearer token, or **none** when `SYNC_TOKEN` is unset.
- No rate limiting, request IDs, per-user identity or server-written audit.

| Route | Side effects | Main risks |
|---|---|---|
| GET /api/health | none | Doesn't check the DB; reveals which engine is in use |
| GET/PUT /api/ws/:name | Snapshot upsert with a version check | TOCTOU race on PG; blob holds plaintext and users.v1 (D-1, S-4) |
| GET/POST/DELETE /api/workspaces[/:name] | Hard delete of all tables, audit included | Any token holder wipes a workspace and its audit trail |
| GET/PUT/DELETE /api/stores/:ws/:name, GET /api/stores/:ws | Upsert; for scans/assets/audit, delete everything and re-insert row by row | Last write wins; dead plaintext tables; duplicate IDs fail as 400; DoS |
| GET/PUT/DELETE /api/evidence/:ws/:key | Upsert per key | Plaintext fingerprint in the URL; no quota |
| GET /api/backup/:ws, POST /api/restore/:ws | Full export / full replace | **Unused by the client.** Restore skips validation. Delete both. |

---

## 6. Strategic decision you need to make first

Most of Phase 0 depends on one product decision. **Which promise does VAPTLens make?**

1. **Browser-first and zero-knowledge (recommended).** This matches the README and the product's differentiators. The server only ever stores ciphertext (stores, evidence and snapshots). The vault is mandatory before any network write. The server rejects plaintext. Standalone or offline mode is explicit. This fixes D-1, simplifies the server (drop the denormalised tables, backup and restore) and keeps the CSP story honest. **Cost:** no server-side search, reporting or role enforcement, so roles stay advisory against insiders who hold the team key. Document that.
2. **Server-backed team product.** Real per-user auth, server-enforced RBAC, SoD and the two-person rule, and a server-written audit. This is what enterprise buyers expect. **Cost:** much larger (L), and it contradicts "zero-trust" marketing unless you add end-to-end encryption on top.

Either way the code must stop *implying* option 1 while *behaving* like a weak version of option 2.

---

## 7. Roadmap

### Phase 0: critical security and data integrity (about 1–2 weeks)

Order matters, because later items depend on the earlier ones.
1. **R-1:** stop the server crashing (S).
2. **D-2, D-3:** the two save-chain deadlocks (S).
3. **D-5:** namespace the local cache per workspace (S).
4. **D-4, D-6:** boot-wipe guard and honest save status with an offline banner (M).
5. **D-7:** stop evidence overwrites; complete backups and ZIPs (M).
6. **D-1:** ciphertext-only server, a mandatory vault, plaintext rejected server-side, dead tables dropped. This assumes the §6 decision is option 1 (M).
7. **D-8:** key rotation re-encrypts server data (M).
8. **S-1:** mandatory token plus a Host allowlist (S).
9. **E-2:** make the docs and UI copy true (S).
10. **U-1, U-2, U-3, DS-A:** small, high-impact UX and accessibility fixes (S).

**Testing gate for Phase 0:** Vitest tests for the store layer with a mocked fetch:
- a failure surfaces to the user
- 404 means empty, not fallback
- a timeout unblocks the save chain
- `update` and `hold` resolve
- rotation leaves every store decryptable

Extend `check.mjs` with these cases:
- a DB error returns 500 and the process survives
- a plaintext PUT gets 400
- a wrong Host gets 421

### Phase 1: core correctness and governance (about 2–3 weeks)

- **L-1 to L-6:** dedup, dates, severity, VEX, Jira. Each fix ships with table-driven tests.
- **S-2 short term (§4 guards), S-3:** governance bypasses.
- **D-9:** store versions and 409 handling.
- **D-10:** import allowlist.
- **Security hardening:** S-4 to S-7, S-11.
- **Reliability:** R-2 to R-3, R-5 to R-7.
- **Engineering:** E-1 (CI), E-3, E-4, E-5.
- **UX:** U-4 to U-9.
- **Design system:** DS-B to DS-D.

### Phase 2: production readiness

R-4, R-8, S-8 to S-10, D-11, D-12, L-7 to L-11 (including the Worker and virtualisation), E-6, DS-E, DS-F, plus Playwright smoke tests: upload sample → filter → export CSV → read-only role, at 390px and in both themes.

### Phase 3: UX and product quality

- Retest workflow: request → assignee → verify → close, with "Remediated" counted as pending verification until a covering scan confirms it.
- Assign findings to individuals and add a "My work" view.
- Import diff preview (new / fixed / reopened) before committing.
- Duplicate-finding merge and split UI.
- Report templates (user-supplied DOCX) plus a write-up library pack for import and export.
- SLA and exception-expiry reminders in the inbox.
- Filters encoded in the URL.
- A demo workspace.

### Phase 4: advanced

- Headless or CLI import for CI pipelines. It must stay end-to-end encrypted, so the key is supplied client-side.
- An encrypted read-only "client view" export.
- Engagement checklists and methodology.
- Broader parser coverage, driven by fixtures.

### Phase 5: enterprise and scale

- Per-user server auth and RBAC (§6 option 2), or OIDC with key escrow.
- A DEK recovery key.
- WORM audit export and forwarding to a self-hosted SIEM.
- Multi-tenant read-only client logins.

---

## 8. "Not missing" list

**Should add:** everything in Phases 0–3. Plus a retest workflow, per-person assignment, import rollback, a visible save state, real backups, tests and CI.

**Should NOT add** (each one breaks the `connect-src 'self'` zero-trust positioning or the small-team scope):
- Live Jira, ServiceNow, Slack or email API calls from the browser. Keep CSV, or at most a self-hosted relay.
- Automatic KEV, EPSS or NVD fetching. Manual loading is correct.
- Analytics or telemetry.
- Remote scan agents or command execution.
- SaaS threat-intel feeds.
- An MSSP CRM or service catalogue.
- Server-side plaintext search.
- Mass rewrites of `var`.
- Prometheus or tracing before there is anything to alert on.

**Already good (keep):**
- CVSS 3.1/4.0 math, the CISA SSVC table, scope-aware fix inference, VEX precedence, and 52 self-tests that already run under Node.
- Strict CSP and edge headers, the CSRF guard, parameterised SQL, timing-safe token comparison, and transactions on writes.
- Fresh 96-bit IVs for AES-GCM, non-extractable per-tab session keys, and timing-equalised login.
- No `dangerouslySetInnerHTML` or `eval`, a React-element Markdown renderer, and formula-safe CSV exports.
- Dialog focus trap and restore, focus moving to the H1 on route change, severity that is never shown by colour alone, reduced motion, no page overflow at 320px or 200% zoom.
- Undo toasts and the undo design (`govUndoable` reverts only the fields it touched).
- 17 complete themes with engineered contrast.
- Lazy loading of docx and jszip.
- Honest security caveats in the README's team-sync section.

**Needs refactor:**
- store.ts: the persistence semantics.
- App.tsx: the god component and the raw setters exposed on ctx.
- The server: duplicated PG and SQLite routes, and the dead tables.
- engine.ts: split it by domain.
- The design-token pipeline.
- Component API naming.

**Optional:**
- Custom fields.
- Non-image evidence (PDF, pcap, txt).
- Keyboard triage (j/k).
- CVSS environmental presets per asset tier.
- Container queries.

---

## 9. Competitive position

| Product | What they have that matters for VAPTLens | Adopt? |
|---|---|---|
| DefectDojo | 200+ parsers, REST/CI import, configurable cross-tool dedup | **Yes:** a CI import path and cross-tool dedup (L-1). **No:** a live Jira API. |
| PlexTrac | A large write-up library and a client portal | **Yes:** library packs, and a "lite" encrypted read-only client export |
| Dradis | DOCX report templates and methodology checklists | **Yes** to both |
| AttackForge | Template-driven reports from JSON | **Yes**, client-side |
| Faraday, Reconmap | Remote agents and command execution | **No** (it's an RCE surface) |
| Nucleus, Vulcan, Tenable/Qualys | Live connectors, SaaS intel, auto-ticketing | **No:** this conflicts with the privacy model |

Sources: docs.defectdojo.com, plextrac.com, dradis.com, faradaysec.com, github.com/reconmap, nucleussec.com, docs.qualys.com.

**Genuine differentiators** (no competitor reviewed combines these):
- Browser-side parsing with client-held keys. This becomes true only after D-1 is fixed.
- No third-party network traffic, and offline operation.
- SSVC, CVSS 4.0, EPSS/KEV and OpenVEX in one place.
- Fix inference that respects each scanner's scope.
- ATT&CK attack paths.
- SLA pause with MTTR per fix cycle.
- A single docker-compose self-host.

---

## 10. Scorecard

| Area | Score | What keeps it from 10 |
|---|---|---|
| Architecture | 4 | Two overlapping persistence systems with unsafe fallbacks; a god App component; client-only enforcement |
| Code quality | 5 | No hacks or unsafe HTML, but god files, loose TS, 35 empty catches, no linter |
| Security | 3 | Plaintext reaches the server and backups, DNS rebinding, no TLS, debug hooks in prod |
| Authentication | 3 | Sound KEK/DEK design, but a shared static token, wrapped keys shipped to the server, client-side lockout, no MFA |
| Authorization | 2 | All roles and SoD are client-side and bypassable, even within the UI |
| API security | 4 | Good input names, JSON-only writes and CSRF guard; no concurrency control, rate limits or crash safety |
| Database | 3 | Parameterised and transactional; no migrations or FKs, drifted engines, dead plaintext tables, no backups |
| Reliability | 3 | Silent data loss, deadlocks, server crash plus restart cap |
| Performance | 5 | Engine is memoised and some chunks are lazy; 165 kB avoidable on first load, main-thread parsing, no virtualisation |
| UX | 6.5 | Deep, well-explained flows; focus loss, data-loss dialogs, dead ends, inconsistent risk scales |
| Accessibility | 6.5 | Strong dialog layer and labels; row expand and Kanban focus loss, opaque charts and palette, toast timing |
| Testing | 3 | Good engine self-tests; no runner, CI, parser fixtures, or crypto, store and role tests |
| Observability | 2 | Console logs only; health check doesn't touch the DB |
| DevOps | 5 | Good compose and nginx hardening; no CI, backups, TLS or SIGTERM handling; mixed Node versions |
| Documentation | 4 | Rich design docs; core architecture and security claims are false; no runbook or threat model |
| Maintainability | 4 | Clear layout, but large files plus no tests make changes risky |
| Product completeness | 7 | Unusually broad; missing a retest workflow, assignment, import rollback, safe collaboration |
| Enterprise readiness | 2 | No server RBAC or SSO, per-browser users, capped audit |
| Design system | 6 | Excellent themes and contrast; no token pipeline, type scale not emitted, half the library unused |

**Current: 4.5/10. Realistic target: 8/10** after Phases 0–2, which is about 6–8 weeks for one experienced developer.

What separates 8 from 10:
- The §6 option 2 work: server-enforced identity, RBAC and audit.
- SSO with key escrow.
- A broad, fixture-tested parser corpus.
- Sustained E2E and performance testing at 100k+ findings.

---

## Appendix: how the critical findings were verified

- **Deadlock D-2:** reproduced by running `store.ts` logic under Node with a mocked fetch. The `P.update` promise never resolves (scratchpad/logic/deadlock.mjs).
- **Server crash R-1:** reproduced by closing the DB, then calling GET `/api/workspaces`, which exits the process (scratchpad/eng/crash.mjs).
- **L-1 to L-5 and L-9:** reproduced with the esbuild-bundled engine, data and parsers (scratchpad/logic/t1.cjs, t2.cjs, perf.cjs).
- **U-1 to U-4:** reproduced with Playwright against the running app (scratchpad/ux/k*.mjs, screenshots in scratchpad/ux/shots/).
- **D-1, D-3 to D-8 and the security items:** traced in code. D-3 was confirmed with a promise simulation. Treat them as confirmed by reading but not exercised end to end against a live server. They should be the first tests written in Phase 0.
