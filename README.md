# VAPTLens

Self-hosted VAPT analytics workbench for pentest and vulnerability-management teams. Scan files are parsed in the browser; findings, decisions, evidence and the audit log are stored on your own VAPTLens server, so they follow your sign-in to any browser. Each person has their own account and role, and the server enforces those roles on every request. The page talks only to its own server: no analytics, CDNs or third-party calls.

**Stack:** React 18 · TypeScript · Vite 5 · Node (API) · PostgreSQL (or SQLite) · nginx

## Run with Docker

```bash
cp .env.example .env               # then set POSTGRES_PASSWORD (openssl rand -hex 24)
docker compose up --build          # http://localhost:8080 (landing page) · the app is at /app/ — the first visit creates the administrator
docker compose --profile dev up dev  # Vite dev server with hot reload on http://localhost:5173
```

Three containers: `web` (nginx: the built app plus `/api/` proxy), `sync` (the API server) and `postgres`. Only `web` is published, on `127.0.0.1:8080` by default. It ships a strict Content-Security-Policy (`connect-src 'self'`), `/healthz`, long-cache headers on hashed assets, and the containers run read-only with `no-new-privileges`.

**Letting teammates in:** set `BIND_ADDR=0.0.0.0` and `ALLOWED_HOSTS=<hostname or IP they type>` in `.env`, put HTTPS in front (Caddy, Traefik or your reverse proxy) and set `COOKIE_SECURE=1`. The server refuses requests for hostnames not in `ALLOWED_HOSTS` (DNS-rebinding guard).

## Run locally (Node ≥ 22.13)

```bash
npm install
npm run server     # API on 127.0.0.1:8787, SQLite in ./vaptlens.db (or set DATABASE_URL for Postgres)
npm run dev        # http://localhost:5173 landing · /app/ the app (proxies /api to the server)
npm run build      # typecheck + production build into dist/
npm test           # API self-check (temp SQLite; DATABASE_URL=… runs it against Postgres)
```

## Accounts, roles and data

- **Roles:** *Administrator* (everything, incl. users, policy, deleting workspaces, backup/restore), *Remediation Lead* (triage, scans, tickets, exception requests; not policy or users), *Security Auditor* (read-only; exports). The API checks the role on every call, so hiding a button is never the only protection.
- **Sessions:** HttpOnly, SameSite=Strict cookie; idle sign-out (default 15 min, set in Users), 12 h maximum. Passwords are scrypt-hashed; 5 wrong attempts lock an account for 5 minutes; sign-in is rate-limited per IP. Disabling a user or changing their role ends their sessions immediately.
- **Forgotten password:** an administrator resets it from Users (a one-time temporary password is shown). If the only administrator is locked out: `node server/server.mjs reset-password <username>` on the server (in Docker: `docker compose exec sync node server.mjs reset-password <username>`).
- **Concurrent edits:** every save carries a version. If someone else saved first, you get a banner to reload instead of silently overwriting them.
- **Offline:** if the server is unreachable, changes are kept in the tab and retried; the status strip shows it.
- **Audit log:** written by the server with the signed-in user, append-only and hash-chained; *Verify* checks the chain. Sign-ins, user changes and settings go to an admin-only system log.
- **Backups:** *Data → Backup* exports a workspace (every store and evidence image) as JSON. Back up the `pg-data` volume too, e.g. `docker compose exec postgres pg_dump -U vaptlens vaptlens > backup.sql`.
- **Who can read the data:** anyone who administers the server or its database, as with any self-hosted web app. Serve it over HTTPS and keep the volume on an encrypted disk.

## Project layout

```
index.html              landing page entry (/) → src/landing/
app/index.html          app entry (/app/) → src/main.tsx
src/
  landing/              landing page: Landing.tsx, scene.ts (WebGL scroll scene), landing.css, fonts
  main.tsx              app entry: styles, theme, mounts <Root/>
  app/
    App.tsx             app state + routing (the "ctx" passed to every view)
    shell/              Root (sign-in gate), ThemePicker
    auth/               setup, login, change-password screens
    users/              user management
    views/<view>/       one folder per screen: dashboard, assets, sla, metrics, attack,
                        priority, remediation, network, retest, report, governance, findings
    components/         shared app components (FindingDrawer, Inbox, Palette, …)
    upload/ data/ automation/ assistant/
    lib/                app helpers: export (files, PDF, PNG), filters, integrations, …
  lib/                  framework-free core: engine (risk, SLA, SSVC, metrics), parsers
                        (Nessus, Burp, ZAP, Nuclei, Trivy, SARIF, Nmap, CSV…), store
                        (API client: stores, evidence, audit), auth (accounts API), dash (widgets), data
  ui/                   VAPTLens component library, one component per file (index.ts re-exports)
  styles/               fonts, design tokens, component and app CSS
server/
  server.mjs            API: accounts, sessions, roles, workspaces, stores, evidence, audit (Postgres or SQLite)
  check.mjs             API self-check (npm test)
design/                 design system: tokens.json, DESIGN.md, SVG logos/icons, fonts,
                        component docs (synced to claude.ai with /design-sync)
docker/                 nginx config + security headers
docs/audit/             full product/security audit and roadmap
```

Imports use the `@/` alias for `src/`. Types are deliberately loose for now (`strict: false`); tighten file by file.

## Notes

- Exports (CSV, PDF, PNG, Word, ZIP) are built in the browser and downloaded directly.
- The in-app AI assistant needs the claude.ai runtime; when self-hosted it reports that it is unavailable.
- Test hooks for end-to-end scripts (`window.__vl`, `window.__vlTest`) exist only on the dev server or in a build made with `VITE_E2E=1`.

## UI components

`src/ui/` holds the VAPTLens component library. Besides the core set (tables, charts, drawers, badges…) it includes form and workflow pieces: Select, DateRangePicker, TagInput, RadioGroup, Textarea, Slider, QueryBuilder, Wizard, Pagination, Breadcrumbs, Accordion, Popover, JsonViewer, DiffView, FunnelChart, CalendarHeatmap, Gauge, ActivityTimeline and more. Run `npm run dev` and open `/gallery.html` to try them all.
