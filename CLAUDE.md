# VAPTLens — notes for Claude Code

VAPT analytics workbench. Scans are parsed in the browser; workspace data is stored on the VAPTLens server (`server/server.mjs`: PostgreSQL in Docker, SQLite when `DATABASE_URL` is unset), reached same-origin under `/api/`, and encrypted in the browser with the signed-in user's data key (AES-GCM, wrapped per user with PBKDF2) while the vault is unlocked. nginx CSP enforces `connect-src 'self'`. Never send plaintext workspace data on purpose, never add analytics, CDNs, remote fonts or fetches to third parties.

## Commands
- `npm run dev` — Vite dev server (5173)
- `npm run build` — `tsc --noEmit` + production build into `dist/`
- `npm run typecheck`
- `docker compose up --build` — nginx on 127.0.0.1:8080 + sync server + Postgres (needs `POSTGRES_PASSWORD` in `.env`; sync/Postgres ports are not published; no `SYNC_TOKEN` = unauthenticated API) · `docker compose --profile dev up dev` — dev server in Docker
- `node server/check.mjs` — sync server self-check

## Layout
- `src/main.tsx` entry · `src/app/App.tsx` holds all app state and builds `ctx`, which every view receives as props
- `src/app/views/<view>/` one folder per screen; `src/app/components/` shared app components; `src/app/lib/` app helpers
- `src/lib/` framework-free core: `engine.ts` (risk, SLA, SSVC, metrics, self-tests), `parsers.ts` (scanner importers), `store.ts` (server storage client, vault, workspaces; per-tab session keys in the browser's IndexedDB so a reload keeps you signed in), `auth.ts` (local accounts/roles), `dash.tsx` (widget engine), `data.ts` (constants, KEV/OWASP/EOL heuristics, remediation snippets)
- `src/ui/` component library (one per file, re-exported from `src/ui/index.ts`, imported in the app as `import * as V from '@/ui'`). Extended set: Breadcrumbs, Pagination, Select, Textarea, RadioGroup, DateRangePicker, TagInput, Accordion, Popover, ProgressBar, Spinner, StatusIndicator, Avatar/AvatarGroup, CopyButton, KeyValueList, Wizard, QueryBuilder (+ `qbMatch`), Gauge, JsonViewer, DiffView, Kbd, FunnelChart, CalendarHeatmap, TruncatedText, Slider, CountBadge, ActivityTimeline; set 2: Alert, IconButton, ButtonGroup/ToggleButtonGroup, SplitButton, SearchInput, NumberInput, PasswordInput (+ `passwordStrength`), Combobox, DatePicker, TreeView, ContextMenu, NotificationCenter, FileUploadList, InlineEdit, ResizablePanels, BottomSheet, VirtualList, CvssVector (+ `parseCvss`), EpssMeter, CveLink, SeverityBar, SlaCountdown, BulletChart, StateView, Divider, ExternalLink, Illustration (`ILLUSTRATIONS`), ~90 extra icons in `icons-extra.ts` — styles in `src/styles/ui-extra.css`
- Standalone build: `VITE_STANDALONE=1` makes `store.ts` skip `/api` and use its localStorage fallback (used for the single-file hosted demo)
- `gallery.html` + `src/gallery.tsx`: dev-only playground of the extended components → `npm run dev`, open `/gallery.html`
- `src/styles/` — `tokens.css` (design tokens, generated from `design/tokens.json`), `ui.css`, `ui-extra.css`, `app.css`
- `server/server.mjs` storage + team sync API: PostgreSQL (`DATABASE_URL`) or `node:sqlite`, bearer `SYNC_TOKEN` (auth off when unset; listens on `HOST`, default 127.0.0.1), optimistic versions (409 on stale push)
- `design/` design system docs, tokens, SVG assets; `design/components/` is the /design-sync bundle (preview.html cards + bundle.js)

## Conventions
- Code was converted from ES5 scripts: `var`, `function` components, `useState` tuples used as `x[0]` / `x[1]`. Keep the style when editing nearby code; modernise only in focused refactors.
- JSX uses the classic runtime (`import React from 'react'` in every .tsx).
- TS is loose (`strict: false`, many `any`). Tighten types file by file; don't turn on strict globally in one go.
- `AS_OF` (engine "today") is a mutable export — change it only via `setAS_OF()`.
- Styling only through CSS tokens (`var(--space-4)`, `--radius-card`, `--shadow-md`, `--z-modal`, `--duration-fast`); no raw values.
- Security Auditor role is read-only: every mutation must check `ctx.readOnly` / role. Separation of duties and the two-person rule live in `decideRequest` (App.tsx).
- Exports go through `csvCell`/`toCsv` (formula-injection safe) and `saveFile` (uses the claude.ai downloads capability when present, else a browser download).
- Test hooks: `window.__vl` (AUTH, IDB, P, VAULT, WS, runSelfTests) and `window.__vlTest`.

## Checks before finishing a change
1. `npm run build` passes
2. `__vl.runSelfTests()` in the browser console reports all passed
3. Click through the affected view in light and dark themes and at 390px width

## Server API hardening
- `/api/` refuses cross-site requests (`crossSiteBlocked`: `Sec-Fetch-Site`, else Origin vs Host / `X-Forwarded-Host`), answers no CORS, and rejects non-JSON POST/PUT (415). Tests: `node server/check.mjs`.
- Known gap: accounts live per browser while data lives on the server, so a second browser that creates a new admin can't decrypt existing data. Accounts need to move server-side.
