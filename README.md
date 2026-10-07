# VAPTLens

Zero-trust VAPT analytics workbench. Scan files are parsed in the browser, data is encrypted in IndexedDB, and the page never talks to third parties. nginx serves the static files; an optional [team sync](#team-sync-optional) server stores encrypted snapshots only.

**Stack:** React 18 · TypeScript · Vite 5 · nginx (Docker)

## Run with Docker

```bash
docker compose up --build          # production build on http://localhost:8080
docker compose --profile dev up dev  # Vite dev server with hot reload on http://localhost:5173
```

Without Compose:

```bash
docker build -t vaptlens .
docker run --rm -p 8080:8080 vaptlens
```

The image is multi-stage: Node builds `dist/`, then `nginx:alpine` serves it (no Node at runtime). It ships a strict Content-Security-Policy (`connect-src 'self'`, no third-party scripts), `/healthz` for health checks, long-cache headers on hashed assets, and the Compose service runs read-only with `no-new-privileges`.

## Run locally (Node 20+)

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ on http://localhost:4173
```

## Project layout

```
src/
  main.tsx              entry: styles, theme, mounts <Root/>
  app/
    App.tsx             app state + routing (the "ctx" passed to every view)
    shell/              Root (sign-in gate), ThemePicker
    auth/               setup, login, change-password screens
    users/              user management, key rotation
    views/<view>/       one folder per screen: dashboard, assets, sla, metrics, attack,
                        priority, remediation, network, retest, report, governance, findings
    components/         shared app components (FindingDrawer, Inbox, Palette, …)
    upload/ data/ automation/ assistant/
    lib/                app helpers: export (files, PDF, PNG), filters, integrations, …
  lib/                  framework-free core: engine (risk, SLA, SSVC, metrics), parsers
                        (Nessus, Burp, ZAP, Nuclei, Trivy, SARIF, Nmap, CSV…), store
                        (IndexedDB + vault), auth (local accounts), dash (widgets), data
  ui/                   VAPTLens component library, one component per file (index.ts re-exports)
  styles/               fonts, design tokens, component and app CSS
design/                 design system: tokens.json, DESIGN.md, SVG logos/icons, fonts,
                        component docs (synced to claude.ai with /design-sync)
docker/                 nginx config + security headers
```

Imports use the `@/` alias for `src/`. Types are deliberately loose for now (`strict: false`); tighten file by file.

## Notes

- Self-hosted downloads (CSV, PDF, PNG, Word, ZIP) use a normal browser download; nothing is uploaded.

## Team sync (optional)

Share a workspace between browsers through a small sync server that only stores the encrypted snapshot (the same file as *Export workspace*). Findings stay AES-GCM ciphertext; each teammate signs in with their own account, whose password unwraps the shared data key.

```bash
echo "SYNC_TOKEN=$(openssl rand -hex 24)" >> .env   # turns sync on
docker compose up --build
```

- **First person:** sign in, open *Data → Team sync*, paste the token, **Push to team**. Add teammates' accounts in *Users* and push again.
- **Teammates:** on the first screen open *Joining a team?*, paste the token and pull; then sign in with the account made for you.
- A push is refused if a teammate pushed since your last pull: pull (replaces your copy), redo the change, push. There is no merge.
- Security Auditors can pull but not push. The server can't read the data, so it can't enforce roles; it only checks the team token.
- The snapshot contains usernames, roles and password-wrapped keys, so whoever holds the server database can try to guess passwords offline. Use long passwords, keep the token secret, and serve over HTTPS.

Data lives in PostgreSQL (`pg-data` volume). Set `POSTGRES_PASSWORD` in `.env` before the first `docker compose up`; neither Postgres (5432) nor the sync server (8787) is published to the host, and the app on 8080 binds to `127.0.0.1` unless you set `BIND_ADDR`. **Without `SYNC_TOKEN` the API is unauthenticated**: anyone who can reach port 8080 can read and write every workspace, so set a token before using `BIND_ADDR=0.0.0.0`.
- The in-app AI assistant needs the claude.ai runtime; when self-hosted it reports that it is unavailable. Everything else works offline.
- Test hooks for end-to-end scripts live on `window.__vl` and `window.__vlTest`.

## UI components

`src/ui/` holds the VAPTLens component library. Besides the core set (tables, charts, drawers, badges…) it includes form and workflow pieces: Select, DateRangePicker, TagInput, RadioGroup, Textarea, Slider, QueryBuilder, Wizard, Pagination, Breadcrumbs, Accordion, Popover, JsonViewer, DiffView, FunnelChart, CalendarHeatmap, Gauge, ActivityTimeline and more. Run `npm run dev` and open `/gallery.html` to try them all.
