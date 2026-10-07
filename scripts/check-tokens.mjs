#!/usr/bin/env node
/* Design-token lint: keeps component CSS on the token system (design/tokens.json → src/styles/tokens.css).
   Usage: node scripts/check-tokens.mjs        (exit 1 on any violation)
   Rules apply to component styles only; tokens.css and fonts.css are the token sources. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILES = [
  "src/styles/app.css",
  "src/styles/ui.css",
  "src/styles/ui-extra.css",
];

/* Breakpoints usable in media queries (CSS variables can't be used there).
   Scale: --bp-sm 480, --bp-md 768, --bp-lg 1024, --bp-xl 1280, --bp-2xl 1600 (max-width uses bp - 1).
   CONTENT lists the documented dashboard-only exceptions; prefer container queries for new work. */
const SCALE = new Set([479, 480, 767, 768, 1023, 1024, 1279, 1280, 1599, 1600]);
const CONTENT = new Set([1320, 1440, 1500]);

const RULES = [
  {
    id: "raw-color",
    re: /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\((?!var\(--av-h)/g,
    msg: "use a colour token (var(--…))",
  },
  {
    id: "raw-font-size",
    re: /(?:font-size:\s*|font:\s*(?:italic\s+)?(?:\d{3}\s+)?)\d+(?:\.\d+)?px/g,
    msg: "use a --text-* token",
  },
  {
    id: "transition-all",
    re: /transition:\s*all\b/g,
    msg: "list the transitioned properties explicitly",
  },
  {
    id: "z-index-raw",
    re: /z-index:\s*(\d{2,})/g,
    msg: "use a --z-* token (raw values only for local stacking 0–9)",
  },
  {
    id: "raw-duration",
    re: /animation:[^;]*?\b\d+(?:\.\d+)?m?s\b/g,
    msg: "use a --duration-* token",
  },
];

let total = 0;
for (const rel of FILES) {
  const src = readFileSync(path.join(root, rel), "utf8");
  const lines = src.split("\n");
  const noComments = (s) => s.replace(/\/\*.*?\*\//g, "");
  lines.forEach((raw, i) => {
    const line = noComments(raw);
    for (const r of RULES) {
      r.re.lastIndex = 0;
      if (r.re.test(line)) {
        total++;
        console.log(
          `${rel}:${i + 1}  ${r.id}  ${r.msg}\n    ${raw.trim().slice(0, 140)}`,
        );
      }
    }
    const mq = line.match(/@media[^{]*/);
    if (mq)
      for (const m of mq[0].matchAll(/(\d+)px/g)) {
        const v = +m[1];
        if (!SCALE.has(v) && !CONTENT.has(v)) {
          total++;
          console.log(
            `${rel}:${i + 1}  breakpoint  ${v}px is not on the breakpoint scale\n    ${raw.trim()}`,
          );
        }
      }
  });
}
if (total) {
  console.log(`\n${total} token violation(s).`);
  process.exit(1);
}
console.log("Token lint: no violations in " + FILES.length + " files.");
