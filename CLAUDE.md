# VAPTLens — notes for Claude Code

VAPT analytics workbench, self-hosted and multi-user. Scans are parsed in the browser; accounts, sessions, workspace data, evidence and the audit log live on the VAPTLens server (`server/server.mjs`: PostgreSQL in Docker, SQLite when `DATABASE_URL` is unset), reached same-origin under `/api/`. The server is the source of truth and enforces roles on every request; it can read the data (decided 2026-10-07: no client-side vault — protect the server with HTTPS and disk encryption). nginx CSP enforces `connect-src 'self'`; never add analytics, CDNs, remote fonts or fetches to third parties. Roadmap: `docs/audit/2026-10-07-full-audit.md`.

## Commands
- `npm run dev` — Vite dev server (5173)
- `npm run build` — `tsc --noEmit` + production build into `dist/`
- `npm run typecheck`
- `npm run server` — API on 127.0.0.1:8787 (SQLite `./vaptlens.db`, or `DATABASE_URL`); `npm run dev` proxies `/api` to it
- `npm test` — API self-check (`node server/check.mjs`; temp SQLite, or `DATABASE_URL=…` for Postgres)
- `docker compose up --build` — nginx on 127.0.0.1:8080 + API (`sync`) + Postgres (needs `POSTGRES_PASSWORD` in `.env`; only 8080 is published; `ALLOWED_HOSTS` lists accepted hostnames) · `docker compose --profile dev up dev` — dev server in Docker

## Layout
- Two pages (Vite multi-page, `vite.config.ts` `input`): `/` = landing page (`index.html` → `src/landing/main.tsx`: `Landing.tsx` markup, `scene.ts` WebGL/scroll engine with cleanup, `data.ts`, `landing.css`, `fonts/`), `/app/` = the app (`app/index.html` → `src/main.tsx`). Landing links go to `app/`. Docker builds in `/src`, not `/app` (Vite confuses `/app/app/index.html` with `/app/index.html`).
- `src/main.tsx` app entry · `src/app/App.tsx` holds all app state and builds `ctx`, which every view receives as props
- `src/app/views/<view>/` one folder per screen; `src/app/components/` shared app components; `src/app/lib/` app helpers
- `src/lib/` framework-free core: `engine.ts` (risk, SLA, SSVC, metrics, self-tests), `parsers.ts` (scanner importers), `store.ts` (API client: versioned stores with conflict/offline/refused events via `P.on`, evidence, `AUDIT`, workspaces, backup/restore — no localStorage fallback), `auth.ts` (accounts/users/settings API; session is an HttpOnly cookie), `dash.tsx` (widget engine), `data.ts` (constants, KEV/OWASP/EOL heuristics, remediation snippets)
- `src/ui/` component library (one per file, re-exported from `src/ui/index.ts`, imported in the app as `import * as V from '@/ui'`). Extended set: Breadcrumbs, Pagination, Select, Textarea, RadioGroup, DateRangePicker, TagInput, Accordion, Popover, ProgressBar, Spinner, StatusIndicator, Avatar/AvatarGroup, CopyButton, KeyValueList, Wizard, QueryBuilder (+ `qbMatch`), Gauge, JsonViewer, DiffView, Kbd, FunnelChart, CalendarHeatmap, TruncatedText, Slider, CountBadge, ActivityTimeline; set 2: Alert, IconButton, ButtonGroup/ToggleButtonGroup, SplitButton, SearchInput, NumberInput, PasswordInput (+ `passwordStrength`), Combobox, DatePicker, TreeView, ContextMenu, NotificationCenter, FileUploadList, InlineEdit, ResizablePanels, BottomSheet, VirtualList, CvssVector (+ `parseCvss`), EpssMeter, CveLink, SeverityBar, SlaCountdown, BulletChart, StateView, Divider, ExternalLink, Illustration (`ILLUSTRATIONS`), ~90 extra icons in `icons-extra.ts` — styles in `src/styles/ui-extra.css`
- Standalone (no-server) build: removed with the move to server accounts (2026-10-07). A hosted demo would need a mock `/api` (e.g. an in-browser fetch shim implementing the routes in `server.mjs`).
- `gallery.html` + `src/gallery.tsx`: dev-only playground of the extended components → `npm run dev`, open `/gallery.html`
- `src/styles/` — `tokens.css` (design tokens, generated from `design/tokens.json`), `ui.css`, `ui-extra.css`, `app.css`
- `server/server.mjs` API: session-cookie auth (scrypt, lockout, rate limit), roles per route, `vl_*` tables (Postgres or `node:sqlite`), optimistic versions (409 on stale save), per-user `prefs`, server-written hash-chained audit, admin backup/restore, `reset-password` CLI
- `design/` design system docs, tokens, SVG assets; `design/components/` is the /design-sync bundle (preview.html cards + bundle.js)

## Conventions
- Code was converted from ES5 scripts: `var`, `function` components, `useState` tuples used as `x[0]` / `x[1]`. Keep the style when editing nearby code; modernise only in focused refactors.
- JSX uses the classic runtime (`import React from 'react'` in every .tsx).
- TS is loose (`strict: false`, many `any`). Tighten types file by file; don't turn on strict globally in one go.
- `AS_OF` (engine "today") is a mutable export — change it only via `setAS_OF()`.
- Styling only through CSS tokens (`var(--space-4)`, `--radius-card`, `--shadow-md`, `--z-modal`, `--duration-fast`); no raw values.
- Roles are enforced by the server per route (Auditor: read-only except own prefs; Lead: no policy/users/workspace delete). Keep the UI checks (`ctx.readOnly` / role) for UX, but never rely on them alone — add the rule to `server.mjs` too. Separation of duties and the two-person rule still live only in `decideRequest` (App.tsx): moving them server-side is the next roadmap item.
- Audit entries go through `ctx.log` → `AUDIT.append` (server stamps user/role/time); never write audit data from the client any other way.
- Exports go through `csvCell`/`toCsv` (formula-injection safe) and `saveFile` (uses the claude.ai downloads capability when present, else a browser download).
- Test hooks (dev server or `VITE_E2E=1` builds only): `window.__vl` (AUTH, IDB, P, WS, runSelfTests) and `window.__vlTest`.

## Checks before finishing a change
1. `npm run build` passes and `npm test` passes
2. `__vl.runSelfTests()` in the browser console reports all passed
3. Click through the affected view in light and dark themes and at 390px width

## Server API hardening
- `/api/` refuses cross-site requests (`crossSiteBlocked`: `Sec-Fetch-Site`, else Origin vs Host / `X-Forwarded-Host`), answers no CORS, and rejects non-JSON POST/PUT (415). Tests: `node server/check.mjs`.
- Every route is authenticated (session cookie) and role-checked; `ALLOWED_HOSTS` guards against DNS rebinding (421). Users with a temporary password can only call `/api/auth/*` until they change it.
- Next server-side gap: approval content rules (separation of duties, two-person rule, SLA/policy edits) are still client-only in `decideRequest`; enforce them by diffing `remediation`/`policy` on PUT.
