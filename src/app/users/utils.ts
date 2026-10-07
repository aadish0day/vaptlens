import { uniq } from "@/app/lib/common";
import { fingerprint } from "@/lib/engine";

export function genPassword() {
  var cs = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%*-_",
    a = crypto.getRandomValues(new Uint8Array(16)),
    s = "";
  for (var i = 0; i < 16; i++) s += cs[a[i] % cs.length];
  return (
    s.slice(0, 4) +
    "-" +
    s.slice(4, 8) +
    "-" +
    s.slice(8, 12) +
    "-" +
    s.slice(12) +
    "K7a"
  );
}

/* ================= App ================= */
/* v2 fingerprints (rule ID first, web paths kept): re-key uploaded rows once and carry governance over */
export function rekey(scans, boot) {
  if (!scans || scans.keyV === 2) return scans;
  var map = {};
  scans.data.forEach(function (x) {
    if (String(x.id || "").charAt(0) === "u") {
      var nk = fingerprint(x);
      if (x.key !== nk) {
        map[x.key] = nk;
        x.key = nk;
      }
    }
  });
  var ks = Object.keys(map);
  if (ks.length) {
    var g = boot.remediation || {},
      ng = {};
    Object.keys(g).forEach(function (k) {
      var t = map[k] || k;
      ng[t] = Object.assign({}, ng[t] || {}, g[k]);
    });
    boot.remediation = ng;
    (boot.campaigns || []).forEach(function (c) {
      c.keys = uniq(
        c.keys.map(function (k) {
          return map[k] || k;
        }),
      );
    });
    boot.rekeyed = ks.length;
  }
  scans.keyV = 2;
  return scans;
}

export function migrateScans(boot) {
  var x = boot.scans;
  if (x && x.v === 2 && Array.isArray(x.batches)) return rekey(x, boot);
  var old = null;
  try {
    old = JSON.parse(localStorage.getItem("vaptlens.scans.v1") || "null");
  } catch (e) {}
  if (old && old.v === 1 && Array.isArray(old.batches))
    return rekey(
      {
        v: 2,
        batches: old.batches,
        data: old.data.filter(function (f) {
          return f.lifecycle !== "Fixed";
        }),
      },
      boot,
    );
  return null;
}
/* days the SLA clock was paused within the current open cycle (closed pauses + an open one up to today) */
