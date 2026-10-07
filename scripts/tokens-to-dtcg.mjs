#!/usr/bin/env node
/* Export design/tokens.json to the W3C Design Tokens Community Group format (Format Module 2025.10):
   design/tokens.dtcg.json — $value/$type/$description, dimensions as {value, unit}, colours as
   {colorSpace, components, alpha, hex}, aliases as {group.token}. The default (dark) theme is the
   $value; every other theme is listed under $extensions["com.vaptlens.themes"].
   Shadows and composed CSS values stay CSS-only (listed under $extensions["com.vaptlens.css"]).
   Usage: node scripts/tokens-to-dtcg.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(
  readFileSync(path.join(root, "design/tokens.json"), "utf8"),
);
const out = {
  $description: `${T.name} design tokens v${T.version}, exported from design/tokens.json. Do not edit by hand.`,
};

/* name -> group lookup so {surface-300} style references become {color.surface-300} */
const where = {};
const reg = (group, name) => {
  where[name] = group;
};
for (const t of T.color.tokens) reg("color", t.name);
for (const t of (T.color.fixed || {}).tokens || []) reg("color", t.name);
for (const g of [
  "spacing",
  "radius",
  "size",
  "zIndex",
  "opacity",
  "breakpoint",
  "motion",
])
  for (const t of T[g].tokens) reg(g, t.name);

function alias(v) {
  const m =
    typeof v === "string" && v.match(/^\{([\w.-]+)\}$|^var\(--([\w.-]+)\)$/);
  if (!m) return null;
  const n = m[1] || m[2];
  return where[n] ? `{${where[n]}.${n}}` : null;
}
function color(v) {
  const a = alias(v);
  if (a) return a;
  let r,
    g,
    b,
    al = 1,
    m;
  if ((m = /^#([0-9a-f]{6})$/i.exec(v)))
    [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  else if (
    (m =
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/i.exec(
        v,
      ))
  ) {
    [r, g, b] = [m[1], m[2], m[3]].map(Number);
    al = m[4] == null ? 1 : +m[4];
  } else return undefined;
  const hex =
    "#" +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
  return {
    colorSpace: "srgb",
    components: [r / 255, g / 255, b / 255].map((x) => +x.toFixed(4)),
    alpha: al,
    hex,
  };
}
function dimension(v) {
  const a = alias(v);
  if (a) return a;
  if (v === 0 || v === "0") return { value: 0, unit: "px" };
  const m = /^(-?[\d.]+)(px|rem)$/.exec(String(v));
  return m ? { value: +m[1], unit: m[2] } : undefined;
}
function duration(v) {
  const m = /^([\d.]+)(ms|s)$/.exec(String(v));
  return m ? { value: +m[1], unit: m[2] } : undefined;
}
function bezier(v) {
  const m = /cubic-bezier\(([^)]+)\)/.exec(String(v));
  return m ? m[1].split(",").map(Number) : undefined;
}

let skipped = 0;
function put(group, name, $type, $value, description, ext) {
  if ($value === undefined) {
    skipped++;
    (out[group] ??= {})[name] = {
      $description: description || "",
      $extensions: { "com.vaptlens.css": ext },
    };
    return;
  }
  const tok = { $type, $value };
  if (description) tok.$description = description;
  (out[group] ??= {})[name] = tok;
  return tok;
}

/* colours: dark is the default value, other themes as extensions */
const themes = T.color.themes.map((t) => t.id);
for (const t of T.color.tokens) {
  const tok = put(
    "color",
    t.name,
    "color",
    color(t.value.dark),
    t.usage,
    t.value.dark,
  );
  if (tok)
    tok.$extensions = {
      "com.vaptlens.themes": Object.fromEntries(
        themes
          .filter((id) => id !== "dark")
          .map((id) => [id, color(t.value[id]) ?? t.value[id]]),
      ),
    };
}
for (const t of (T.color.fixed || {}).tokens || [])
  put("color", t.name, "color", color(t.value), t.usage, t.value);

for (const g of ["spacing", "radius", "size", "breakpoint"])
  for (const t of T[g].tokens)
    put(g, t.name, "dimension", dimension(t.value), t.usage, t.value);
for (const t of (T.spacing.roles || {}).tokens || []) {
  const tok = put(
    "spacing",
    t.name,
    "dimension",
    alias(t.value),
    t.usage,
    t.value,
  );
  const modes = Object.assign({}, t.responsive || {}, t.density || {});
  if (tok && Object.keys(modes).length)
    tok.$extensions = {
      "com.vaptlens.modes": Object.fromEntries(
        Object.entries(modes).map(([k, v]) => [k, alias(v) ?? v]),
      ),
    };
}
for (const t of T.zIndex.tokens)
  put("zIndex", t.name, "number", Number(t.value), t.usage);
for (const t of T.opacity.tokens)
  put("opacity", t.name, "number", Number(t.value), t.usage);
for (const t of T.motion.tokens) {
  if (/^duration/.test(t.name))
    put("motion", t.name, "duration", duration(t.value), t.usage, t.value);
  else put("motion", t.name, "cubicBezier", bezier(t.value), t.usage, t.value);
}
for (const [k, v] of Object.entries(T.type.families))
  put(
    "font",
    "family-" + k,
    "fontFamily",
    v.split(",").map((s) => s.trim().replace(/^"|"$/g, "")),
  );
for (const t of T.type.weight.tokens)
  put("font", t.name, "fontWeight", t.value);
for (const t of T.type.scale.tokens)
  put("font", t.name, "dimension", dimension(t.value), t.usage, t.value);
for (const t of T.type.leading.tokens)
  put(
    "font",
    t.name,
    t.value === "1" ? "number" : "dimension",
    t.value === "1" ? 1 : dimension(t.value),
  );
for (const g of T.type.groups)
  for (const s of g.styles) {
    const fam = s.family || g.family;
    put(
      "typography",
      s.name,
      "typography",
      {
        fontFamily: `{font.family-${fam}}`,
        fontSize: dimension(s.fontSize),
        fontWeight: s.fontWeight,
        lineHeight: +(
          parseFloat(s.lineHeight) / parseFloat(s.fontSize)
        ).toFixed(3),
        letterSpacing: s.letterSpacing
          ? {
              value: parseFloat(s.letterSpacing) * parseFloat(s.fontSize),
              unit: "px",
            }
          : { value: 0, unit: "px" },
      },
      s.usage,
    );
  }
for (const t of T.shadow.tokens)
  put("shadow", t.name, undefined, undefined, t.usage, t.value);
for (const t of T.shadow.composed || [])
  put("shadow", t.name, undefined, undefined, t.usage, t.value);

writeFileSync(
  path.join(root, "design/tokens.dtcg.json"),
  JSON.stringify(out, null, 2) + "\n",
);
const count = Object.values(out)
  .filter((v) => typeof v === "object")
  .reduce((n, g) => n + Object.keys(g).length, 0);
console.log(
  `design/tokens.dtcg.json: ${count} tokens (${skipped} kept CSS-only under $extensions).`,
);
