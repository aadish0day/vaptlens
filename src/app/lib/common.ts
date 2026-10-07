export var SEV_LABEL = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export var VIEWS = [
  ["dashboard", "Dashboard"],
  ["assets", "Asset Inventory"],
  ["sla", "SLA & RACI"],
  ["metrics", "Metrics & KPIs"],
  ["attack", "Attack Paths"],
  ["priority", "Prioritization Matrix"],
  ["remediation", "Remediation Board"],
  ["network", "Network Map"],
  ["retest", "Re-Test Verification"],
  ["report", "Executive Report"],
  ["governance", "Risk & Compliance"],
];

export var COLS = ["To Do", "In Progress", "In Review", "Remediated"];

export var RO_REASON = "Security Auditors have read-only access.";

export function store(k, v?) {
  try {
    if (v === undefined) {
      var x = localStorage.getItem(k);
      return x ? JSON.parse(x) : null;
    }
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    return null;
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function fmtTime(iso) {
  var d = new Date(iso);
  function p(n) {
    return String(n).padStart(2, "0");
  }
  return (
    d.getFullYear() +
    "-" +
    p(d.getMonth() + 1) +
    "-" +
    p(d.getDate()) +
    " " +
    p(d.getHours()) +
    ":" +
    p(d.getMinutes())
  );
}

export function tagsOf(f) {
  var t = [];
  if (f.kev) t.push("kev");
  if (f.zeroday) t.push("zeroday");
  if (f.ransomware) t.push("ransomware");
  if (f.exploitable && !f.kev && !f.zeroday) t.push("exploitable");
  if (f.eol) t.push("eol");
  if (f.breached) t.push("breached");
  return t;
}

export function cvssTxt(f) {
  return f && f.cvss > 0 ? f.cvss.toFixed(1) : "—";
}

export function hostLabel(f) {
  return f.host + (f.port ? ":" + f.port : "");
}

export function count(arr, fn) {
  return arr.reduce(function (a, x) {
    return a + (fn(x) ? 1 : 0);
  }, 0);
}

export function uniq(a) {
  var seen = new Set(),
    o = [];
  for (var i = 0; i < a.length; i++) {
    if (!seen.has(a[i])) {
      seen.add(a[i]);
      o.push(a[i]);
    }
  }
  return o;
}

/* ================= Root: sign in → boot ================= */
