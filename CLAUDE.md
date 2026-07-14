# VAPTLens

Universal client-side VAPT scan analytics dashboard (Power BI-style) for vulnerability scan data.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Tech
Vite + React 18 + TypeScript · Tailwind · recharts · zustand · react-grid-layout · papaparse.
Runs entirely client-side; no backend, no network calls with scan data.
