import { guessMapping } from "@/lib/data";

/* ================= Upload (multi-file, multi-format) ================= */
/* scanner presets drift between versions: keep the preset's columns that exist, fill the rest by name */
export function presetMap(pm, headers) {
  var g2 = guessMapping(headers),
    out: any = {};
  Object.keys(pm).forEach(function (k) {
    if (headers.indexOf(pm[k]) >= 0) out[k] = pm[k];
  });
  Object.keys(g2).forEach(function (k) {
    if (!out[k] && Object.values(out).indexOf(g2[k]) < 0) out[k] = g2[k];
  });
  var v3 = headers.find(function (hh) {
    return /cvss\s*v?3/i.test(hh) && /base|score/i.test(hh);
  });
  if (v3) out.cvss = v3;
  return out;
}
