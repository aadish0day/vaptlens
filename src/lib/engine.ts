import {
  SEV,
  SLA_DAYS,
  computeExploitable,
  days,
  effortOf,
  isEol,
  isKev,
  isRansom,
  normSev,
  owaspOf,
  subnetOf,
} from "@/lib/data";
import {
  hostOf,
  imageName,
  isoDay,
  num,
  parseOpenVAS,
  parseTrivy,
} from "@/lib/parsers";

/* ---------- VAPTLens engine: lifecycle, scoring, SSVC, metrics (all in-browser) ---------- */
export var AS_OF =
  localDay(); /* the "today" every age and SLA is measured to (local date); set by the app */

/* the "today" every age and SLA is measured to; set by the app */
export var DEFAULT_CVSS = {
  critical: 9.5,
  high: 8,
  medium: 5.5,
  low: 3,
  info: 0,
};

export var SLA_DEFAULTS = {
  critical: 14,
  high: 30,
  medium: 90,
  low: 180,
  info: 360,
};

export var MTTR_TARGET = {
  critical: 15,
  high: 30,
  medium: 90,
  low: 180,
  info: 360,
};

/* ===== CVSS vectors ===== */

/* ===== CVSS vectors ===== */
export function parseVector(v) {
  if (!v) return null;
  var s = String(v).trim(),
    m: any = {},
    ver = "3.1";
  s = s.replace(/^\((.*)\)$/, "$1");
  s = s.replace(/^\(?CVSS2#/i, "").replace(/\)$/, "");
  var mm = /^CVSS:(\d\.\d)\//.exec(s);
  if (mm) {
    ver = mm[1];
    s = s.slice(mm[0].length);
  } else if (/AV:[NALP]\/AC:[LHM]\/Au:/.test(s)) ver = "2.0";
  s.split("/").forEach(function (p) {
    var kv = p.split(":");
    if (kv.length === 2) m[kv[0]] = kv[1];
  });
  if (!m.AV) return null;
  return {
    version: ver,
    m: m,
  };
}

export function roundUp1(x) {
  var i = Math.round(x * 100000);
  return i % 10000 === 0 ? i / 100000 : (Math.floor(i / 10000) + 1) / 10;
}
/* CVSS v3.0/3.1 base score (FIRST spec §7) */

/* CVSS v3.0/3.1 base score (FIRST spec §7) */
export function cvss3Score(pv) {
  if (!pv || !/^3/.test(pv.version)) return null;
  var m = pv.m;
  var AV = {
      N: 0.85,
      A: 0.62,
      L: 0.55,
      P: 0.2,
    }[m.AV],
    AC = {
      L: 0.77,
      H: 0.44,
    }[m.AC],
    UI = {
      N: 0.85,
      R: 0.62,
    }[m.UI],
    S = m.S;
  var PR =
    S === "C"
      ? {
          N: 0.85,
          L: 0.68,
          H: 0.5,
        }[m.PR]
      : {
          N: 0.85,
          L: 0.62,
          H: 0.27,
        }[m.PR];
  var CIA = {
      H: 0.56,
      L: 0.22,
      N: 0,
    },
    C = CIA[m.C],
    I = CIA[m.I],
    A = CIA[m.A];
  if (
    [AV, AC, UI, PR, C, I, A].some(function (x) {
      return x == null;
    }) ||
    (S !== "U" && S !== "C")
  )
    return null;
  var iss = 1 - (1 - C) * (1 - I) * (1 - A);
  var imp =
    S === "U"
      ? 6.42 * iss
      : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  var ex = 8.22 * AV * AC * PR * UI;
  if (imp <= 0) return 0;
  return S === "U"
    ? roundUp1(Math.min(imp + ex, 10))
    : roundUp1(Math.min(1.08 * (imp + ex), 10));
}
/* ===== CVSS v4.0 base/threat/environmental score =====
   Port of the FIRST reference calculator (github.com/FIRSTdotorg/cvss-v4-calculator).
   Copyright (c) 2023 FIRST.ORG, Inc., Red Hat, and contributors. BSD-2-Clause. */

/* ===== CVSS v4.0 base/threat/environmental score =====
   Port of the FIRST reference calculator (github.com/FIRSTdotorg/cvss-v4-calculator).
   Copyright (c) 2023 FIRST.ORG, Inc., Red Hat, and contributors. BSD-2-Clause. */
export var CVSS4_LOOKUP = (function () {
  var o = {};
  "100000:9.8,100001:9.5,100010:9.4,100011:8.7,100020:9.1,100021:8.1,100100:9.4,100101:8.9,100110:8.6,100111:7.4,100120:7.7,100121:6.4,100200:8.7,100201:7.5,100210:7.4,100211:6.3,100220:6.3,100221:4.9,101000:9.4,101001:8.9,101010:8.8,101011:7.7,101020:7.6,101021:6.7,101100:8.6,101101:7.6,101110:7.4,101111:5.8,101120:5.9,101121:5,101200:7.2,101201:5.7,101210:5.7,101211:5.2,101220:5.2,101221:2.5,102001:8.3,102011:7,102021:5.4,102101:6.5,102111:5.8,102121:2.6,102201:5.3,102211:2.1,102221:1.3,110000:9.5,110001:9,110010:8.8,110011:7.6,110020:7.6,110021:7,110100:9,110101:7.7,110110:7.5,110111:6.2,110120:6.1,110121:5.3,110200:7.7,110201:6.6,110210:6.8,110211:5.9,110220:5.2,110221:3,111000:8.9,111001:7.8,111010:7.6,111011:6.7,111020:6.2,111021:5.8,111100:7.4,111101:5.9,111110:5.7,111111:5.7,111120:4.7,111121:2.3,111200:6.1,111201:5.2,111210:5.7,111211:2.9,111220:2.4,111221:1.6,112001:7.1,112011:5.9,112021:3,112101:5.8,112111:2.6,112121:1.5,112201:2.3,112211:1.3,112221:0.6,200000:9.3,200001:8.7,200010:8.6,200011:7.2,200020:7.5,200021:5.8,200100:8.6,200101:7.4,200110:7.4,200111:6.1,200120:5.6,200121:3.4,200200:7,200201:5.4,200210:5.2,200211:4,200220:4,200221:2.2,201000:8.5,201001:7.5,201010:7.4,201011:5.5,201020:6.2,201021:5.1,201100:7.2,201101:5.7,201110:5.5,201111:4.1,201120:4.6,201121:1.9,201200:5.3,201201:3.6,201210:3.4,201211:1.9,201220:1.9,201221:0.8,202001:6.4,202011:5.1,202021:2,202101:4.7,202111:2.1,202121:1.1,202201:2.4,202211:0.9,202221:0.4,210000:8.8,210001:7.5,210010:7.3,210011:5.3,210020:6,210021:5,210100:7.3,210101:5.5,210110:5.9,210111:4,210120:4.1,210121:2,210200:5.4,210201:4.3,210210:4.5,210211:2.2,210220:2,210221:1.1,211000:7.5,211001:5.5,211010:5.8,211011:4.5,211020:4,211021:2.1,211100:6.1,211101:5.1,211110:4.8,211111:1.8,211120:2,211121:0.9,211200:4.6,211201:1.8,211210:1.7,211211:0.7,211220:0.8,211221:0.2,212001:5.3,212011:2.4,212021:1.4,212101:2.4,212111:1.2,212121:0.5,212201:1,212211:0.3,212221:0.1,000000:10,000001:9.9,000010:9.8,000011:9.5,000020:9.5,000021:9.2,000100:10,000101:9.6,000110:9.3,000111:8.7,000120:9.1,000121:8.1,000200:9.3,000201:9,000210:8.9,000211:8,000220:8.1,000221:6.8,001000:9.8,001001:9.5,001010:9.5,001011:9.2,001020:9,001021:8.4,001100:9.3,001101:9.2,001110:8.9,001111:8.1,001120:8.1,001121:6.5,001200:8.8,001201:8,001210:7.8,001211:7,001220:6.9,001221:4.8,002001:9.2,002011:8.2,002021:7.2,002101:7.9,002111:6.9,002121:5,002201:6.9,002211:5.5,002221:2.7,010000:9.9,010001:9.7,010010:9.5,010011:9.2,010020:9.2,010021:8.5,010100:9.5,010101:9.1,010110:9,010111:8.3,010120:8.4,010121:7.1,010200:9.2,010201:8.1,010210:8.2,010211:7.1,010220:7.2,010221:5.3,011000:9.5,011001:9.3,011010:9.2,011011:8.5,011020:8.5,011021:7.3,011100:9.2,011101:8.2,011110:8,011111:7.2,011120:7,011121:5.9,011200:8.4,011201:7,011210:7.1,011211:5.2,011220:5,011221:3,012001:8.6,012011:7.5,012021:5.2,012101:7.1,012111:5.2,012121:2.9,012201:6.3,012211:2.9,012221:1.7"
    .split(",")
    .forEach(function (p) {
      var kv = p.split(":");
      o[kv[0]] = +kv[1];
    });
  return o;
})();

export var CVSS4_MAXC = {
  eq1: {
    0: ["AV:N/PR:N/UI:N/"],
    1: ["AV:A/PR:N/UI:N/", "AV:N/PR:L/UI:N/", "AV:N/PR:N/UI:P/"],
    2: ["AV:P/PR:N/UI:N/", "AV:A/PR:L/UI:P/"],
  },
  eq2: {
    0: ["AC:L/AT:N/"],
    1: ["AC:H/AT:N/", "AC:L/AT:P/"],
  },
  eq3: {
    0: {
      "0": ["VC:H/VI:H/VA:H/CR:H/IR:H/AR:H/"],
      "1": ["VC:H/VI:H/VA:L/CR:M/IR:M/AR:H/", "VC:H/VI:H/VA:H/CR:M/IR:M/AR:M/"],
    },
    1: {
      "0": ["VC:L/VI:H/VA:H/CR:H/IR:H/AR:H/", "VC:H/VI:L/VA:H/CR:H/IR:H/AR:H/"],
      "1": [
        "VC:L/VI:H/VA:L/CR:H/IR:M/AR:H/",
        "VC:L/VI:H/VA:H/CR:H/IR:M/AR:M/",
        "VC:H/VI:L/VA:H/CR:M/IR:H/AR:M/",
        "VC:H/VI:L/VA:L/CR:M/IR:H/AR:H/",
        "VC:L/VI:L/VA:H/CR:H/IR:H/AR:M/",
      ],
    },
    2: {
      "1": ["VC:L/VI:L/VA:L/CR:H/IR:H/AR:H/"],
    },
  },
  eq4: {
    0: ["SC:H/SI:S/SA:S/"],
    1: ["SC:H/SI:H/SA:H/"],
    2: ["SC:L/SI:L/SA:L/"],
  },
  eq5: {
    0: ["E:A/"],
    1: ["E:P/"],
    2: ["E:U/"],
  },
};

export var CVSS4_MAXS = {
  eq1: {
    0: 1,
    1: 4,
    2: 5,
  },
  eq2: {
    0: 1,
    1: 2,
  },
  eq3eq6: {
    0: {
      0: 7,
      1: 6,
    },
    1: {
      0: 8,
      1: 8,
    },
    2: {
      1: 10,
    },
  },
  eq4: {
    0: 6,
    1: 5,
    2: 4,
  },
};

export var CVSS4_LV = {
  AV: {
    N: 0,
    A: 0.1,
    L: 0.2,
    P: 0.3,
  },
  PR: {
    N: 0,
    L: 0.1,
    H: 0.2,
  },
  UI: {
    N: 0,
    P: 0.1,
    A: 0.2,
  },
  AC: {
    L: 0,
    H: 0.1,
  },
  AT: {
    N: 0,
    P: 0.1,
  },
  VC: {
    H: 0,
    L: 0.1,
    N: 0.2,
  },
  VI: {
    H: 0,
    L: 0.1,
    N: 0.2,
  },
  VA: {
    H: 0,
    L: 0.1,
    N: 0.2,
  },
  SC: {
    H: 0.1,
    L: 0.2,
    N: 0.3,
  },
  SI: {
    S: 0,
    H: 0.1,
    L: 0.2,
    N: 0.3,
  },
  SA: {
    S: 0,
    H: 0.1,
    L: 0.2,
    N: 0.3,
  },
  CR: {
    H: 0,
    M: 0.1,
    L: 0.2,
  },
  IR: {
    H: 0,
    M: 0.1,
    L: 0.2,
  },
  AR: {
    H: 0,
    M: 0.1,
    L: 0.2,
  },
};

export function cvss4Score(pv) {
  if (!pv || pv.version !== "4.0") return null;
  var sel = pv.m;
  var base = {
    AV: "NALP",
    AC: "LH",
    AT: "NP",
    PR: "NLH",
    UI: "NPA",
    VC: "HLN",
    VI: "HLN",
    VA: "HLN",
    SC: "HLN",
    SI: "HLNS",
    SA: "HLNS",
  };
  for (var b in base) if (!sel[b] || base[b].indexOf(sel[b]) < 0) return null;
  function m(k) {
    var s = sel[k] == null ? "X" : sel[k];
    if (k === "E" && s === "X") return "A";
    if ((k === "CR" || k === "IR" || k === "AR") && s === "X") return "H";
    var mm = sel["M" + k];
    if (mm != null && mm !== "X") return mm;
    return s;
  }
  if (
    ["VC", "VI", "VA", "SC", "SI", "SA"].every(function (k) {
      return m(k) === "N";
    })
  )
    return 0;
  var eq1 =
    m("AV") === "N" && m("PR") === "N" && m("UI") === "N"
      ? 0
      : (m("AV") === "N" || m("PR") === "N" || m("UI") === "N") &&
          m("AV") !== "P"
        ? 1
        : 2;
  var eq2 = m("AC") === "L" && m("AT") === "N" ? 0 : 1;
  var eq3 =
    m("VC") === "H" && m("VI") === "H"
      ? 0
      : m("VC") === "H" || m("VI") === "H" || m("VA") === "H"
        ? 1
        : 2;
  var eq4 =
    m("MSI") === "S" || m("MSA") === "S" || m("SI") === "S" || m("SA") === "S"
      ? 0
      : m("SC") === "H" || m("SI") === "H" || m("SA") === "H"
        ? 1
        : 2;
  var eq5 = {
    A: 0,
    P: 1,
    U: 2,
  }[m("E")];
  if (eq5 == null) return null;
  var eq6 =
    (m("CR") === "H" && m("VC") === "H") ||
    (m("IR") === "H" && m("VI") === "H") ||
    (m("AR") === "H" && m("VA") === "H")
      ? 0
      : 1;
  var mv = "" + eq1 + eq2 + eq3 + eq4 + eq5 + eq6,
    L = CVSS4_LOOKUP,
    value = L[mv];
  if (value == null) return null;
  function key(a) {
    return a.join("");
  }
  var s1 = L[key([eq1 + 1, eq2, eq3, eq4, eq5, eq6])],
    s2 = L[key([eq1, eq2 + 1, eq3, eq4, eq5, eq6])],
    s36;
  if (eq3 === 1 && eq6 === 1) s36 = L[key([eq1, eq2, eq3 + 1, eq4, eq5, eq6])];
  else if (eq3 === 0 && eq6 === 1)
    s36 = L[key([eq1, eq2, eq3 + 1, eq4, eq5, eq6])];
  else if (eq3 === 1 && eq6 === 0)
    s36 = L[key([eq1, eq2, eq3, eq4, eq5, eq6 + 1])];
  else if (eq3 === 0 && eq6 === 0) {
    var l = L[key([eq1, eq2, eq3, eq4, eq5, eq6 + 1])],
      r = L[key([eq1, eq2, eq3 + 1, eq4, eq5, eq6])];
    s36 = l > r ? l : r;
  } else s36 = L[key([eq1, eq2, eq3 + 1, eq4, eq5, eq6 + 1])];
  var s4 = L[key([eq1, eq2, eq3, eq4 + 1, eq5, eq6])],
    s5 = L[key([eq1, eq2, eq3, eq4, eq5 + 1, eq6])];
  var maxes = [];
  CVSS4_MAXC.eq1[eq1].forEach(function (a) {
    CVSS4_MAXC.eq2[eq2].forEach(function (b2) {
      (CVSS4_MAXC.eq3[eq3][eq6] || []).forEach(function (c) {
        CVSS4_MAXC.eq4[eq4].forEach(function (d) {
          CVSS4_MAXC.eq5[eq5].forEach(function (e) {
            maxes.push(a + b2 + c + d + e);
          });
        });
      });
    });
  });
  function ext(k, str) {
    var x = str.slice(str.indexOf(k) + k.length + 1);
    return x.indexOf("/") > 0 ? x.slice(0, x.indexOf("/")) : x;
  }
  var ks = [
      "AV",
      "PR",
      "UI",
      "AC",
      "AT",
      "VC",
      "VI",
      "VA",
      "SC",
      "SI",
      "SA",
      "CR",
      "IR",
      "AR",
    ],
    d: any = {};
  for (var i = 0; i < maxes.length; i++) {
    ks.forEach(function (k) {
      d[k] = CVSS4_LV[k][m(k)] - CVSS4_LV[k][ext(k, maxes[i])];
    });
    if (
      !ks.some(function (k) {
        return d[k] < 0;
      })
    )
      break;
  }
  var c1 = d.AV + d.PR + d.UI,
    c2 = d.AC + d.AT,
    c36 = d.VC + d.VI + d.VA + d.CR + d.IR + d.AR,
    c4 = d.SC + d.SI + d.SA;
  var n = 0,
    tot = 0,
    st = 0.1;
  function add(av, cur, mx) {
    if (!isNaN(av)) {
      n++;
      tot += av * (cur / mx);
    }
  }
  add(value - s1, c1, CVSS4_MAXS.eq1[eq1] * st);
  add(value - s2, c2, CVSS4_MAXS.eq2[eq2] * st);
  add(value - s36, c36, CVSS4_MAXS.eq3eq6[eq3][eq6] * st);
  add(value - s4, c4, CVSS4_MAXS.eq4[eq4] * st);
  if (!isNaN(value - s5)) n++;
  value -= n ? tot / n : 0;
  return Math.round(Math.max(0, Math.min(10, value)) * 10) / 10;
}
/* any supported vector → base score (v4.0, v3.x) */

/* any supported vector → base score (v4.0, v3.x) */
export function vectorScore(pv) {
  if (!pv) return null;
  return pv.version === "4.0" ? cvss4Score(pv) : cvss3Score(pv);
}

export function sevFromScore(x) {
  return x >= 9
    ? "critical"
    : x >= 7
      ? "high"
      : x >= 4
        ? "medium"
        : x > 0
          ? "low"
          : "info";
}
/* network-reachable, no privileges, no user action */

/* network-reachable, no privileges, no user action */
export function vecAutomatable(pv) {
  if (!pv) return null;
  var m = pv.m;
  return (
    m.AV === "N" &&
    (m.PR === "N" || m.Au === "N") &&
    (m.UI === "N" || m.UI == null) &&
    m.AT !== "P" &&
    m.AC !== "H"
  );
}

export function vecTotalImpact(pv) {
  if (!pv) return null;
  var m = pv.m;
  return pv.version === "4.0"
    ? m.VC === "H" && m.VI === "H"
    : pv.version === "2.0"
      ? m.C === "C" && m.I === "C"
      : m.C === "H" && m.I === "H";
}

/* ===== asset context ===== */

/* ===== asset context ===== */
export function isPrivate(host) {
  host = String(host || "").replace(/^\[|\]$/g, "");
  if (/:/.test(host) && !/\./.test(host))
    return /^(fc|fd|fe8|fe9|fea|feb)|^::1$/i.test(host);
  return (
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|169\.254\.)/.test(
      host,
    ) ||
    /\.(internal|corp|local|lan|intranet|home\.arpa)$/i.test(host) ||
    !/\./.test(host)
  );
}

export function defaultTier(host) {
  return 2;
}

export function assetOf(host, assets) {
  var a = (assets && assets[host]) || {};
  return {
    tier: a.tier || defaultTier(host),
    exposure: a.exposure || (isPrivate(host) ? "internal" : "internet"),
    owner: a.owner || "SecOps",
    device: a.device || "Server",
    os: a.os || "Unknown",
    bu: a.bu || "",
    tags: a.tags || [],
    wellbeing: a.wellbeing || "minimal",
    retired: !!a.retired,
  };
}

/* ===== SSVC (CISA decision tree: Exploitation × Automatable × Technical impact × Mission & well-being) ===== */

/* ===== SSVC (CISA decision tree: Exploitation × Automatable × Technical impact × Mission & well-being) ===== */
export var SSVC_TREE = {
  "none|no|partial": ["Track", "Track", "Track"],
  "none|no|total": ["Track", "Track", "Track*"],
  "none|yes|partial": ["Track", "Track", "Attend"],
  "none|yes|total": ["Track", "Track", "Attend"],
  "poc|no|partial": ["Track", "Track", "Track*"],
  "poc|no|total": ["Track", "Track*", "Attend"],
  "poc|yes|partial": ["Track", "Track", "Attend"],
  "poc|yes|total": ["Track", "Track*", "Attend"],
  "active|no|partial": ["Track", "Track", "Attend"],
  "active|no|total": ["Track", "Attend", "Act"],
  "active|yes|partial": ["Attend", "Attend", "Act"],
  "active|yes|total": ["Attend", "Act", "Act"],
};

export var SSVC_HELP = {
  Act: "Fix now, out of cycle; brief leadership.",
  Attend: "Fix sooner than the standard window; notify owners.",
  "Track*": "Standard window, watch closely for change.",
  Track: "Standard remediation window.",
};

export var SSVC_RANK = {
  Act: 4,
  Attend: 3,
  "Track*": 2,
  Track: 1,
};

export function ssvcOf(f, asset) {
  var txt = (f.name + " " + (f.desc || "")).toLowerCase(),
    pv = parseVector(f.vector);
  /* CISA: active = reliable evidence of exploitation in the wild (KEV); PoC = public exploit or proven in our own test */
  var exploitation = f.kev
    ? "active"
    : f.validation === "confirmed"
      ? "poc"
      : f.validation === "not_reproducible"
        ? "none"
        : f.exploitable || (f.epss || 0) >= 0.1 || f.zeroday
          ? "poc"
          : "none";
  var auto = vecAutomatable(pv);
  if (auto == null)
    auto =
      (asset.exposure === "internet" &&
        /unauthenticated|remote code|pre-auth|\brce\b|injection|default .*password|null session|eternalblue|smbv1/.test(
          txt,
        )) ||
      /unauthenticated access|default root|eternalblue|smbv1/.test(txt);
  var total = vecTotalImpact(pv);
  if (total == null)
    total =
      /remote code|\brce\b|arbitrary code|command execution|sql injection|default root|unauthenticated access|takeover|eternalblue|pre-auth/.test(
        txt,
      );
  /* Mission & well-being (CISA): mission prevalence from tier (1 essential, 2 support, 3 minimal) × public well-being impact */
  var prev =
      asset.tier === 1 ? "essential" : asset.tier === 2 ? "support" : "minimal",
    wb = asset.wellbeing || "minimal";
  var mission =
    prev === "essential" || wb === "irreversible"
      ? 2
      : prev === "support" || wb === "material"
        ? 1
        : 0;
  var k =
    exploitation +
    "|" +
    (auto ? "yes" : "no") +
    "|" +
    (total ? "total" : "partial");
  return {
    decision: SSVC_TREE[k][mission],
    exploitation: exploitation,
    automatable: auto ? "yes" : "no",
    impact: total ? "total" : "partial",
    mission: ["low", "medium", "high"][mission],
  };
}

/* ===== risk model (0–100, documented) ===== */

/* ===== risk model (0–100, documented) ===== */
export function riskModel(f, asset) {
  if (f.lifecycle === "Fixed" || (f.sev === "info" && !(f.cvss > 0)))
    return {
      risk: 0,
      parts: null,
    };
  var S = (f.cvss > 0 ? f.cvss : DEFAULT_CVSS[f.sev]) / 10;
  var L = Math.max(
    0.05,
    f.epss || 0,
    f.kev ? 1 : 0,
    f.zeroday ? 0.6 : 0,
    f.exploitable ? 0.35 : 0,
  );
  if (f.validation === "confirmed") L = 1;
  else if (f.validation === "not_reproducible") L = Math.max(0.02, L * 0.4);
  var A =
    {
      1: 1,
      2: 0.75,
      3: 0.5,
    }[asset.tier] || 0.75;
  if (asset.exposure === "internet") A = Math.min(1, A + 0.15);
  var base = 100 * S * (0.35 + 0.65 * L) * (0.55 + 0.45 * A);
  var bonus =
    (f.ransomware ? 6 : 0) +
    (f.eol ? 4 : 0) +
    (f.breached ? 5 : 0) +
    (f.ageDays > 180 ? 3 : 0);
  return {
    risk: Math.min(100, Math.round(base + bonus)),
    parts: {
      severity: +S.toFixed(2),
      likelihood: +L.toFixed(2),
      asset: +A.toFixed(2),
      base: Math.round(base),
      bonus: bonus,
    },
  };
}
/* Threat index: chance-style union of the top 10 risks, each weighted 0.35 */

/* Threat index: chance-style union of the top 10 risks, each weighted 0.35 */
export function threatIndex(active) {
  var top = active
    .map(function (x) {
      return x.risk;
    })
    .sort(function (a, b) {
      return b - a;
    })
    .slice(0, 10);
  return Math.round(
    100 *
      (1 -
        top.reduce(function (p, r) {
          return p * (1 - (0.35 * r) / 100);
        }, 1)),
  );
}

/* ===== compliance mapping by OWASP category ===== */

/* ===== compliance mapping by OWASP category ===== */
export var COMPLIANCE = {
  "A01 Broken Access Control": {
    pci: ["6.2.4", "7.2.1"],
    iso: ["A.8.3", "A.8.26"],
    nist: ["AC-3", "AC-6"],
  },
  "A02 Cryptographic Failures": {
    pci: ["4.2.1", "3.5.1"],
    iso: ["A.8.24"],
    nist: ["SC-8", "SC-13"],
  },
  "A03 Injection": {
    pci: ["6.2.4"],
    iso: ["A.8.28"],
    nist: ["SI-10"],
  },
  "A04 Insecure Design": {
    pci: ["6.2.1"],
    iso: ["A.8.27"],
    nist: ["SA-8"],
  },
  "A05 Security Misconfiguration": {
    pci: ["2.2.1", "2.2.4"],
    iso: ["A.8.9"],
    nist: ["CM-6", "CM-7"],
  },
  "A06 Vulnerable Components": {
    pci: ["6.3.3", "11.3.1"],
    iso: ["A.8.8"],
    nist: ["RA-5", "SI-2"],
  },
  "A07 Auth Failures": {
    pci: ["8.3.1", "8.3.6", "8.4.2"],
    iso: ["A.8.5", "A.5.17"],
    nist: ["IA-2", "IA-5"],
  },
  "A08 Integrity Failures": {
    pci: ["6.3.2"],
    iso: ["A.8.32"],
    nist: ["SI-7"],
  },
  "A09 Logging Failures": {
    pci: ["10.2.1"],
    iso: ["A.8.15", "A.8.16"],
    nist: ["AU-2", "AU-6"],
  },
  "A10 SSRF": {
    pci: ["6.2.4", "1.4.2"],
    iso: ["A.8.28"],
    nist: ["SC-7"],
  },
};

export function complianceOf(f) {
  return (
    COMPLIANCE[f.owasp] || {
      pci: ["11.3.1"],
      iso: ["A.8.8"],
      nist: ["RA-5"],
    }
  );
}

/* ===== fingerprint for de-duplication (same issue, any scanner) ===== */

/* ===== fingerprint for de-duplication (same issue, any scanner) ===== */
export function normName(n) {
  return String(n || "")
    .toLowerCase()
    .replace(/\b\d+(\.\d+)+\b/g, "#")
    .replace(/[^a-z0-9#]+/g, " ")
    .trim();
}
/* Tool families: a scan only proves "fixed" for findings its own kind of tool could see */

/* Tool families: a scan only proves "fixed" for findings its own kind of tool could see */
export var FAMILY_RULES = [
  [/nmap|masscan|rustscan/i, "discovery"],
  [/nessus|openvas|greenbone|qualys|rapid7|nexpose|insightvm/i, "network"],
  [/burp|zap|nuclei|wapiti|acunetix|nikto|invicti|netsparker|appscan/i, "web"],
  [/trivy|dependency-check|cyclonedx|snyk|grype|osv|sbom/i, "sca"],
  [/semgrep|codeql|sarif|sonar|checkmarx|bandit|gosec|eslint/i, "sast"],
];

export function familyOf(tool) {
  var t = String(tool || "");
  for (var i = 0; i < FAMILY_RULES.length; i++)
    if ((FAMILY_RULES[i][0] as any).test(t)) return FAMILY_RULES[i][1];
  return "other";
}
/* Scanner source: a scan only proves "fixed" for findings the SAME scanner reported (each has its own rule IDs).
   Nessus not seeing an OpenVAS OID proves nothing; neither does an Nmap port sweep. */

/* Scanner source: a scan only proves "fixed" for findings the SAME scanner reported (each has its own rule IDs).
   Nessus not seeing an OpenVAS OID proves nothing; neither does an Nmap port sweep. */
export var SOURCE_RULES = [
  [/nessus|tenable/i, "nessus"],
  [/openvas|greenbone|gvm/i, "openvas"],
  [/qualys/i, "qualys"],
  [/nexpose|rapid7|insightvm/i, "nexpose"],
  [/nmap/i, "nmap"],
  [/burp/i, "burp"],
  [/zap/i, "zap"],
  [/nuclei/i, "nuclei"],
  [/nikto/i, "nikto"],
  [/wapiti/i, "wapiti"],
  [/acunetix|invicti|netsparker/i, "acunetix"],
  [/trivy/i, "trivy"],
  [/grype|anchore/i, "grype"],
  [/dependency-check/i, "dependency-check"],
  [/osv/i, "osv"],
  [/snyk/i, "snyk"],
  [/cyclonedx|sbom/i, "cyclonedx"],
  [/semgrep/i, "semgrep"],
  [/codeql/i, "codeql"],
];

export function sourceOf(tool) {
  var t = String(tool || "").trim();
  if (!t) return "other";
  for (var i = 0; i < SOURCE_RULES.length; i++)
    if ((SOURCE_RULES[i][0] as any).test(t)) return SOURCE_RULES[i][1];
  return t.toLowerCase();
}

export function sourcesOf(tools) {
  var l = String(tools || "")
    .split(/\s*\+\s*/)
    .filter(Boolean);
  return l.length ? uniqA(l.map(sourceOf)) : ["other"];
}
/* rule-ID namespace per scanner, so a CSV export and the native export of the same scanner fingerprint the same */

/* rule-ID namespace per scanner, so a CSV export and the native export of the same scanner fingerprint the same */
export var PLUGIN_NS = {
  nessus: "nessus",
  openvas: "oid",
  qualys: "qid",
  nexpose: "nexpose",
  burp: "burp",
  zap: "zap",
  nuclei: "nuclei",
};

export function familiesOf(tools) {
  return uniqA(
    String(tools || "")
      .split(/\s*\+\s*/)
      .map(familyOf),
  );
}
/* Fingerprint priority: scanner rule ID (stable when CVE lists grow) → CVE list → normalised title.
   Web findings keep the path, so the same bug class on two URLs stays two findings. */

/* Fingerprint priority: scanner rule ID (stable when CVE lists grow) → CVE list → normalised title.
   Web findings keep the path, so the same bug class on two URLs stays two findings. */
export function fingerprint(x) {
  var host = String(x.host || "").toLowerCase(),
    where = host + "|" + (x.port || ""),
    web = familyOf(x.tool) === "web";
  var path = x.url
    ? "|" + String(x.url).split("?")[0].split("#")[0].replace(/\/+$/, "")
    : "";
  /* the scanner's rule ID outranks the CVE list: rule IDs are stable when a scanner's CVE coverage
     grows, while a new CVE would otherwise split one finding into "fixed" + "new" */
  if (x.pluginId) return where + "|" + x.pluginId + (web ? path : "");
  if (x.cves && x.cves.length)
    return where + "|" + x.cves.slice().sort().join(",") + (web ? path : "");
  return where + "|" + normName(x.name) + path;
}

/* ===== enrichment of one occurrence ===== */

/* ===== enrichment of one occurrence ===== */
export function enrichWith(f, env) {
  env = env || {};
  var intel = env.intel || {},
    asset = assetOf(f.host, env.assets),
    sla = env.sla || SLA_DAYS;
  /* dependency and code findings name an image, repo or lockfile, not a reachable host: internal unless someone says otherwise */
  if (
    !(env.assets && env.assets[f.host] && env.assets[f.host].exposure) &&
    familiesOf(f.tool).every(function (fm) {
      return fm === "sca" || fm === "sast";
    })
  )
    asset = Object.assign({}, asset, {
      exposure: "internal",
    });
  var cv = (f.cves || []).map(function (c) {
    return String(c).toUpperCase();
  });
  /* an analyst's own CVSS assessment (pentest re-score) overrides the scanner's vector, score and severity */
  var ov = env.vectorOf ? env.vectorOf(f) : null;
  if (ov && parseVector(ov)) {
    var osc = vectorScore(parseVector(ov));
    if (osc != null) {
      f.scannerVector = f.vector;
      f.scannerCvss = f.cvss;
      f.scannerSev = f.sev;
      f.vector = ov;
      f.cvss = osc;
      f.sev = sevFromScore(osc);
      f.cvssSrc = "analyst";
    }
  }
  var pv = parseVector(f.vector);
  if ((!f.cvss || f.cvss === 0) && pv) {
    var sc = vectorScore(pv);
    if (sc != null) f.cvss = sc;
  }
  f.cvssVer = pv ? pv.version : null;
  f.exploitable = computeExploitable(f);
  var kevHit = cv
    .map(function (c) {
      return intel.kev && intel.kev[c];
    })
    .filter(Boolean)[0];
  var kevLoaded = !!(intel.kev && intel.kevCount);
  f.kev = !!kevHit || (!kevLoaded && isKev(f));
  f.kevSrc = kevHit ? "CISA" : f.kev ? "bundled" : null;
  f.kevDue = kevHit ? kevHit.due : null;
  f.kevAdded = kevHit ? kevHit.added : null;
  f.ransomware = !!(kevHit && kevHit.ransom) || isRansom(f);
  var ep = cv
    .map(function (c) {
      return intel.epss && intel.epss[c];
    })
    .filter(Boolean)
    .sort(function (a, b) {
      return b[0] - a[0];
    })[0];
  if (ep) {
    f.epss = ep[0];
    f.epssPct = ep[1];
    f.epssSrc = "FIRST";
  } else {
    f.epss = null;
  }
  f.eol = !!f.eol || isEol(f);
  f.zeroday = !!f.zeroday || /zero-day|0-day/i.test(f.name);
  var open = f.lifecycle !== "Fixed";
  var end = open ? AS_OF : f.fixedAt || AS_OF;
  /* age of the current open cycle: a finding reopened last week is a week old, not a year */
  f.ageDays = Math.max(0, days(f.slaStart || f.firstSeen, end));
  f.firstAgeDays = Math.max(0, days(f.firstSeen, end));
  f.slaDays = env.slaFor ? env.slaFor(f.sev, asset.tier) : sla[f.sev];
  /* SLA clock pauses (e.g. waiting on a vendor patch) inside the current open cycle don't count */
  f.pausedDays = env.pausedDays ? env.pausedDays(f) : 0;
  var clock = Math.max(
    0,
    days(f.slaStart || f.firstSeen, f.fixedAt || AS_OF) - f.pausedDays,
  );
  f.daysLeft = f.slaDays - clock;
  /* CISA BOD 22-01: a KEV due date overrides a longer internal SLA */
  if (f.kevDue && open) {
    var kd = days(AS_OF, f.kevDue);
    if (kd < f.daysLeft) {
      f.daysLeft = kd;
      f.slaSource = "KEV due " + f.kevDue;
    }
  }
  var exempt = env.exempt && env.exempt(f);
  f.breached = open && !exempt && f.daysLeft < 0;
  f.atRisk = open && !exempt && f.daysLeft >= 0 && f.daysLeft <= 7;
  f.tier = asset.tier;
  f.exposure = asset.exposure;
  f.bu = asset.bu || "";
  f.wellbeing = asset.wellbeing || "minimal";
  f.validation = env.validation ? env.validation(f) : f.validation;
  f.ssvc = ssvcOf(f, asset);
  var r = riskModel(f, asset);
  f.risk = r.risk;
  f.riskParts = r.parts;
  f.effort = Math.round(effortOf(f) * 10) / 10;
  f.subnet = subnetOf(f.host);
  f.team = f.team || asset.owner;
  if (!f.owasp) f.owasp = owaspOf(f.name + " " + (f.desc || ""));
  f.compliance = complianceOf(f);
  return f;
}

export function enrich(f) {
  return enrichWith(f, {});
}

/* ===== lifecycle engine =====
   raw: occurrences exactly as scanned (no synthetic rows)
   returns { data, latest, order, scope, findings } where data adds:
     - "Fixed" rows in the first later scan that covered the host but no longer saw the issue
     - "Not re-scanned" carry-overs when a later scan didn't cover the host (never assumed fixed)
     - lifecycle New / Open / Reopened, firstSeen, slaStart, fixedAt, reopenCount */

/* ===== lifecycle engine =====
   raw: occurrences exactly as scanned (no synthetic rows)
   returns { data, latest, order, scope, findings } where data adds:
     - "Fixed" rows in the first later scan that covered the host but no longer saw the issue
     - "Not re-scanned" carry-overs when a later scan didn't cover the host (never assumed fixed)
     - lifecycle New / Open / Reopened, firstSeen, slaStart, fixedAt, reopenCount */
/* Two different scanners reporting the same CVE set on the same host:port are one issue. Their fingerprints differ
   (each prefers its own rule ID), so map the later source's key onto the key first seen (in batch order): the first
   key keeps its governance, and the merged finding lists both tools. Web findings keep their path-based keys, and two
   checks from the SAME scanner stay separate. */
export function crossSourceAliases(rows) {
  var first = {},
    alias = {};
  rows.forEach(function (x) {
    if (!x.cves || !x.cves.length || familyOf(x.tool) === "web") return;
    var k = x.key || fingerprint(x),
      src = sourceOf(x.tool),
      corr =
        String(x.host || "").toLowerCase() +
        "|" +
        (x.port || "") +
        "|" +
        x.cves
          .map(function (c) {
            return String(c).toUpperCase();
          })
          .sort()
          .join(",");
    var g = first[corr];
    if (!g) first[corr] = { key: k, src: src };
    else if (g.key !== k && g.src !== src && !alias[k]) alias[k] = g.key;
  });
  return alias;
}

export function runEngine(raw, batches, env?) {
  env = env || {};
  var order = batches.slice().sort(function (a, b) {
    return a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id;
  });
  var bPos = {};
  order.forEach(function (b, i) {
    bPos[b.id] = i;
  });
  var keyAlias = crossSourceAliases(
    raw
      .filter(function (x) {
        return x.batch in bPos;
      })
      .sort(function (a, b) {
        return bPos[a.batch] - bPos[b.batch];
      }),
  );
  var bById = {};
  order.forEach(function (b) {
    bById[b.id] = b;
  });
  var byBatch = {},
    allHosts = {},
    scope = {};
  raw.forEach(function (x) {
    if (!bById[x.batch]) return;
    if (x.host) x.host = String(x.host).toLowerCase();
    var k = x.key || fingerprint(x);
    k = keyAlias[k] || k;
    var bb = (byBatch[x.batch] = byBatch[x.batch] || {});
    var ex = bb[k];
    if (!ex)
      bb[k] = Object.assign({}, x, {
        key: k,
        tools: [x.tool],
      });
    else {
      /* same issue twice in one scan (two scanners) → one finding */
      if (SEV.indexOf(x.sev) < SEV.indexOf(ex.sev)) ex.sev = x.sev;
      ex.cvss = Math.max(ex.cvss || 0, x.cvss || 0);
      ex.vector = ex.vector || x.vector;
      ex.cves = uniqA((ex.cves || []).concat(x.cves || []));
      ex.cwe = uniqA((ex.cwe || []).concat(x.cwe || []));
      if (ex.tools.indexOf(x.tool) < 0) ex.tools.push(x.tool);
      ex.dupes = (ex.dupes || 1) + 1;
    }
  });
  var seenHosts = {},
    seenPairs = {},
    fscope = {};
  order.forEach(function (b) {
    var rows = Object.keys(byBatch[b.id] || {}).map(function (k) {
      return byBatch[b.id][k];
    });
    var bf = sourcesOf(b.tools);
    var s = {},
      fs = {};
    function mark(hh, src) {
      var p = hh + "|" + src;
      fs[p] = 1;
      seenPairs[p] = 1;
    }
    rows.forEach(function (r) {
      s[r.host] = 1;
      seenHosts[r.host] = 1;
      r.tools.forEach(function (t) {
        mark(r.host, sourceOf(t));
      });
    });
    /* per-file scope when known (one upload of Nessus on A + Burp on B must not say Burp re-tested A) */
    if (b.scopeBy)
      Object.keys(b.scopeBy).forEach(function (src) {
        (b.scopeBy[src] || []).forEach(function (hh0) {
          var hh = String(hh0).toLowerCase();
          s[hh] = 1;
          seenHosts[hh] = 1;
          mark(hh, src);
        });
      });
    else
      (b.scope || []).forEach(function (hh0) {
        var hh = String(hh0).toLowerCase();
        s[hh] = 1;
        seenHosts[hh] = 1;
        bf.forEach(function (fm) {
          mark(hh, fm);
        });
      });
    if (b.full) {
      Object.keys(seenHosts).forEach(function (hh) {
        s[hh] = 1;
      });
      Object.keys(seenPairs).forEach(function (p) {
        if (bf.indexOf(p.split("|").pop()) >= 0) fs[p] = 1;
      });
    }
    scope[b.id] = s;
    fscope[b.id] = fs;
  });
  function covers(bid, f) {
    var fs = fscope[bid] || {};
    return sourcesOf((f.tools || [f.tool]).join(" + ")).some(function (src) {
      return fs[f.host + "|" + src];
    });
  }
  var keys = {};
  order.forEach(function (b) {
    Object.keys(byBatch[b.id] || {}).forEach(function (k) {
      keys[k] = 1;
    });
  });
  var out = [],
    findings = {};
  Object.keys(keys).forEach(function (k) {
    var st = null,
      first = null,
      slaStart = null,
      last = null,
      fixedAt = null,
      reopen = 0,
      proto = null,
      hist = [],
      cycles = [],
      cur = null,
      lastB = null;
    order.forEach(function (b) {
      var occ = (byBatch[b.id] || {})[k];
      if (occ) {
        proto = occ;
        var lc;
        if (!st) {
          lc = "New";
          first = b.date;
          slaStart = b.date;
          cur = {
            start: b.date,
          };
        } else if (st === "fixed") {
          lc = "Reopened";
          reopen++;
          slaStart = b.date;
          fixedAt = null;
          cur = {
            start: b.date,
          };
        } else lc = st === "reopened" ? "Reopened" : "Open";
        st = lc === "Reopened" ? "reopened" : "open";
        last = b.date;
        lastB = b.id;
        out.push(
          Object.assign({}, occ, {
            id: k + "@" + b.id,
            batch: b.id,
            lifecycle: lc,
            firstSeen: first,
            slaStart: slaStart,
            lastSeen: b.date,
            reopenCount: reopen,
            tool: occ.tools.join(" + "),
          }),
        );
        hist.push([b.id, lc]);
      } else if (st && st !== "fixed") {
        /* fixed only by a strictly later scan of the same tool family that covered the host */
        if (b.date > last && covers(b.id, proto)) {
          st = "fixed";
          fixedAt = b.date;
          if (cur) {
            cur.end = b.date;
            cycles.push(cur);
            cur = null;
          }
          out.push(
            Object.assign({}, proto, {
              id: k + "@fixed" + b.id,
              batch: b.id,
              lifecycle: "Fixed",
              firstSeen: first,
              slaStart: slaStart,
              fixedAt: b.date,
              lastSeen: last,
              reopenCount: reopen,
              tool: proto.tools.join(" + "),
            }),
          );
          hist.push([b.id, "Fixed"]);
        } else {
          out.push(
            Object.assign({}, proto, {
              id: k + "@carry" + b.id,
              batch: b.id,
              lifecycle: st === "reopened" ? "Reopened" : "Open",
              unverified: true,
              firstSeen: first,
              slaStart: slaStart,
              lastSeen: last,
              reopenCount: reopen,
              tool: proto.tools.join(" + "),
            }),
          );
          hist.push([b.id, "Not re-scanned"]);
        }
      }
    });
    findings[k] = {
      key: k,
      firstSeen: first,
      lastSeen: last,
      fixedAt: fixedAt,
      reopenCount: reopen,
      state: st,
      history: hist,
      cycles: cycles,
      openSince: cur ? cur.start : null,
      sev: proto.sev,
      host: proto.host,
      name: proto.name,
      tools: proto.tools,
      lastBatch: lastB,
    };
  });
  out.forEach(function (f) {
    enrichWith(f, env);
    if (findings[f.key] && f.cvssSrc === "analyst") findings[f.key].sev = f.sev;
  });
  return {
    data: out,
    order: order,
    latest: order.length ? order[order.length - 1].id : 0,
    scope: scope,
    fscope: fscope,
    covers: covers,
    findings: findings,
  };
}

export function uniqA(a) {
  var seen = new Set(),
    o = [];
  a.forEach(function (x) {
    if (x && !seen.has(x)) {
      seen.add(x);
      o.push(x);
    }
  });
  return o;
}

/* ===== program metrics ===== */

/* ===== program metrics ===== */
export function metricsOf(eng, gov, sla?, opt?) {
  gov = gov || {};
  sla = sla || SLA_DAYS;
  opt = opt || {};
  var slaFor =
      opt.slaFor ||
      function (sev) {
        return sla[sev];
      },
    assets = opt.assets || {};
  var F = Object.keys(eng.findings).map(function (k) {
    return eng.findings[k];
  });
  var latest = eng.latest,
    latestB = eng.order[eng.order.length - 1];
  function exempt(k) {
    var g = gov[k] || {};
    return (
      g.state === "fp" ||
      (g.state === "accepted" && g.until && g.until >= AS_OF)
    );
  }
  var cyc = [],
    manual = [],
    open = [],
    accepted = 0,
    fp = 0,
    closedN = 0;
  F.forEach(function (x) {
    var g = gov[x.key] || {};
    if (g.state === "fp") {
      fp++;
      return;
    }
    if (g.state === "accepted" && g.until && g.until >= AS_OF) {
      accepted++;
      return;
    }
    var tier = assetOf(x.host, assets).tier;
    /* every closed remediation cycle counts, including earlier cycles of findings that later reopened */
    (x.cycles || []).forEach(function (c) {
      cyc.push({
        sev: x.sev,
        days: Math.max(0, days(c.start, c.end)),
        sla: slaFor(x.sev, tier),
      });
    });
    if (x.state === "fixed") closedN++;
    else if (
      g.fixed &&
      !(opt.isRegression
        ? opt.isRegression(g, x)
        : g.fixedAt && x.lastSeen >= localDay(g.fixedAt))
    )
      manual.push(x);
    else open.push(x);
  });
  var mttr = {},
    within = 0;
  SEV.forEach(function (s) {
    var c = cyc.filter(function (x) {
      return x.sev === s;
    });
    mttr[s] = c.length
      ? Math.round(
          c.reduce(function (t, x) {
            return t + x.days;
          }, 0) / c.length,
        )
      : null;
  });
  cyc.forEach(function (x) {
    if (x.days <= x.sla) within++;
  });
  var all = cyc.length
    ? Math.round(
        cyc.reduce(function (t, x) {
          return t + x.days;
        }, 0) / cyc.length,
      )
    : null;
  var everFixed = F.filter(function (x) {
    return (x.cycles || []).length > 0;
  }).length;
  var buckets = [
    [0, 30, "0–30 days"],
    [31, 60, "31–60 days"],
    [61, 90, "61–90 days"],
    [91, 1e9, "90+ days"],
  ].map(function (bk) {
    return {
      label: bk[2],
      values: SEV.map(function (s) {
        return open.filter(function (x) {
          var a = days(x.openSince || x.firstSeen, AS_OF);
          return (
            x.sev === s && a >= (bk[0] as number) && a <= (bk[1] as number)
          );
        }).length;
      }),
    };
  });
  var manualKeys = {};
  manual.forEach(function (x) {
    manualKeys[x.key] = 1;
  }); /* marked remediated, awaiting re-scan: out of the latest backlog like everywhere else */
  var flow = eng.order.map(function (b, bi) {
    var r = eng.data.filter(function (x) {
      return (
        x.batch === b.id &&
        !exempt(x.key) &&
        !(b.id === latest && manualKeys[x.key])
      );
    });
    return {
      label: b.label,
      date: b.date,
      baseline: bi === 0,
      open: r.filter(function (x) {
        return x.lifecycle !== "Fixed";
      }).length,
      added: r.filter(function (x) {
        return x.lifecycle === "New";
      }).length,
      fixed: r.filter(function (x) {
        return x.lifecycle === "Fixed";
      }).length,
      reopened: r.filter(function (x) {
        return (
          x.lifecycle === "Reopened" &&
          !x.unverified &&
          x.reopenCount &&
          x.slaStart === b.date
        );
      }).length,
      unverified: r.filter(function (x) {
        return x.unverified;
      }).length,
    };
  });
  /* coverage: hosts seen in the last 180 days and not retired */
  var hosts = {};
  eng.order.forEach(function (b) {
    Object.keys(eng.scope[b.id]).forEach(function (hh) {
      hosts[hh] = b.date;
    });
  });
  var live = Object.keys(hosts).filter(function (hh) {
    return !(assets[hh] && assets[hh].retired) && days(hosts[hh], AS_OF) <= 180;
  });
  var inLatest = latestB ? eng.scope[latestB.id] : {};
  var liveIn = live.filter(function (hh) {
    return inLatest[hh];
  });
  var stale = live
    .filter(function (hh) {
      return !inLatest[hh];
    })
    .map(function (hh) {
      return {
        host: hh,
        lastScanned: hosts[hh],
        days: days(hosts[hh], AS_OF),
      };
    })
    .sort(function (a, b) {
      return b.days - a.days;
    });
  var openKeys = {};
  open.forEach(function (x) {
    openKeys[x.key] = 1;
  });
  var openBreached = eng.data.filter(function (x) {
    return (
      x.batch === latest &&
      x.lifecycle !== "Fixed" &&
      x.breached &&
      openKeys[x.key]
    );
  }).length;
  var kevOver = eng.data.filter(function (x) {
    return (
      x.batch === latest &&
      x.lifecycle !== "Fixed" &&
      x.kevDue &&
      x.kevDue < AS_OF &&
      !exempt(x.key) &&
      !manualKeys[x.key]
    );
  }).length;
  return {
    mttr: mttr,
    mttrAll: all,
    closed: closedN,
    cycles: cyc.length,
    manualPending: manual.length,
    open: open.length,
    accepted: accepted,
    fp: fp,
    kevOverdue: kevOver,
    /* SLA compliance counts open findings already past their SLA as misses (otherwise never fixing anything scores 100%) */
    slaCompliance:
      cyc.length + openBreached
        ? Math.round((100 * within) / (cyc.length + openBreached))
        : null,
    slaClosedCompliance: cyc.length
      ? Math.round((100 * within) / cyc.length)
      : null,
    openBreached: openBreached,
    recurrence: everFixed
      ? Math.round(
          (100 *
            F.filter(function (x) {
              return x.reopenCount > 0;
            }).length) /
            everFixed,
        )
      : 0,
    reopened: F.filter(function (x) {
      return x.reopenCount > 0;
    }).length,
    acceptanceRate:
      open.length + manual.length + accepted + closedN
        ? Math.round(
            (100 * accepted) /
              (open.length + manual.length + accepted + closedN),
          )
        : 0,
    coverage: live.length
      ? Math.round((100 * liveIn.length) / live.length)
      : 100,
    hostsKnown: live.length,
    hostsLatest: liveIn.length,
    stale: stale,
    retired: Object.keys(hosts).length - live.length,
    buckets: buckets,
    flow: flow,
    cvssSum: (function () {
      var byKey = {};
      eng.data.forEach(function (d) {
        if (d.batch === latest && d.lifecycle !== "Fixed")
          byKey[d.key] = d.cvss || 0;
      });
      return Math.round(
        open.reduce(function (t, x) {
          return t + (byKey[x.key] || 0);
        }, 0),
      );
    })(),
  };
}
/* local calendar day (yyyy-mm-dd) of a Date or ISO timestamp — never the UTC day */

/* local calendar day (yyyy-mm-dd) of a Date or ISO timestamp — never the UTC day */
export function localDay(v?) {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  var d = v ? new Date(v) : new Date();
  if (isNaN(d as any)) return String(v || "").slice(0, 10);
  function p(n) {
    return String(n).padStart(2, "0");
  }
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

/* ===== threat-intel feeds (user-supplied files; parsed locally) ===== */

/* ===== threat-intel feeds (user-supplied files; parsed locally) ===== */
export function parseKevFeed(text) {
  var j = JSON.parse(text),
    out = {};
  (j.vulnerabilities || []).forEach(function (v) {
    if (v.cveID)
      out[v.cveID.toUpperCase()] = {
        added: v.dateAdded,
        due: v.dueDate,
        ransom: /^known$/i.test(
          String(v.knownRansomwareCampaignUse || "").trim(),
        ),
        name: v.vulnerabilityName,
      };
  });
  if (!Object.keys(out).length)
    throw new Error(
      "no vulnerabilities[] with cveID found — is this the CISA KEV JSON?",
    );
  return {
    kev: out,
    kevVersion: j.catalogVersion || j.dateReleased || "",
    kevCount: Object.keys(out).length,
  };
}

export function parseEpssCsv(text) {
  var lines = text.split(/\r?\n/),
    out = {},
    meta = "",
    n = 0,
    ci = 0,
    ei = 1,
    pi = 2;
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    if (!l) continue;
    if (l[0] === "#") {
      meta = l.slice(1);
      continue;
    }
    if (/^cve,/i.test(l)) {
      var hd = l.toLowerCase().split(",");
      ci = hd.indexOf("cve");
      ei = hd.indexOf("epss");
      pi = hd.indexOf("percentile");
      continue;
    }
    var c = l.split(",");
    if (!/^CVE-/i.test(c[ci])) continue;
    out[c[ci].toUpperCase()] = [parseFloat(c[ei]), parseFloat(c[pi])];
    n++;
  }
  if (!n)
    throw new Error(
      "no cve,epss,percentile rows found — is this the FIRST EPSS CSV?",
    );
  var sd = /score_date:([0-9-]{10})/.exec(meta);
  return {
    epss: out,
    epssCount: n,
    epssDate: sd ? sd[1] : "",
    epssModel: (/model_version:([^,]+)/.exec(meta) || [])[1] || "",
  };
}

/* ===== built-in self-tests (run from Data → Self-test) ===== */

/* ===== built-in self-tests (run from Data → Self-test) ===== */
export var SELF_TESTS = [
  [
    "CVSS 3.1 AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H = 9.8",
    function () {
      return (
        cvss3Score(
          parseVector("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"),
        ) === 9.8
      );
    },
  ],
  [
    "CVSS 3.1 scope-changed XSS vector = 6.1",
    function () {
      return (
        cvss3Score(
          parseVector("CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N"),
        ) === 6.1
      );
    },
  ],
  [
    "CVSS 3.1 local low vector = 3.3",
    function () {
      return (
        cvss3Score(
          parseVector("CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N"),
        ) === 3.3
      );
    },
  ],
  [
    "Fingerprint matches the same CVE from two scanners",
    function () {
      return (
        fingerprint({
          host: "h",
          port: 443,
          cves: ["CVE-1"],
          name: "a",
        }) ===
        fingerprint({
          host: "h",
          port: 443,
          cves: ["CVE-1"],
          name: "different title",
        })
      );
    },
  ],
  [
    "Fingerprint ignores version numbers in titles",
    function () {
      return (
        fingerprint({
          host: "h",
          port: 80,
          cves: [],
          name: "Apache 2.4.49 Path Traversal",
        }) ===
        fingerprint({
          host: "h",
          port: 80,
          cves: [],
          name: "apache 2.4.50 path traversal",
        })
      );
    },
  ],
  [
    "Partial-scope scan never marks unscanned hosts fixed",
    function () {
      var e = runEngine(
        [
          {
            key: "k1",
            batch: 1,
            host: "a",
            name: "x",
            sev: "high",
            cvss: 7,
            cves: [],
          },
          {
            key: "k2",
            batch: 2,
            host: "b",
            name: "y",
            sev: "low",
            cvss: 2,
            cves: [],
          },
        ],
        [
          {
            id: 1,
            date: "2026-01-01",
          },
          {
            id: 2,
            date: "2026-02-01",
            scope: ["b"],
          },
        ],
      );
      return (
        (e.findings as any).k1.state === "open" &&
        e.data.some(function (x) {
          return x.key === "k1" && x.batch === 2 && x.unverified;
        })
      );
    },
  ],
  [
    "Full-scope scan without the issue marks it fixed",
    function () {
      var e = runEngine(
        [
          {
            key: "k1",
            batch: 1,
            host: "a",
            name: "x",
            sev: "high",
            cvss: 7,
            cves: [],
          },
          {
            key: "k2",
            batch: 2,
            host: "a",
            name: "y",
            sev: "low",
            cvss: 2,
            cves: [],
          },
        ],
        [
          {
            id: 1,
            date: "2026-01-01",
          },
          {
            id: 2,
            date: "2026-02-01",
          },
        ],
      );
      return (
        (e.findings as any).k1.state === "fixed" &&
        (e.findings as any).k1.fixedAt === "2026-02-01"
      );
    },
  ],
  [
    "Issue that returns after a fix is Reopened",
    function () {
      var r = [
        {
          key: "k",
          batch: 1,
          host: "a",
          name: "x",
          sev: "high",
          cvss: 7,
          cves: [],
        },
        {
          key: "z",
          batch: 2,
          host: "a",
          name: "z",
          sev: "low",
          cvss: 1,
          cves: [],
        },
        {
          key: "k",
          batch: 3,
          host: "a",
          name: "x",
          sev: "high",
          cvss: 7,
          cves: [],
        },
      ];
      var e = runEngine(r, [
        {
          id: 1,
          date: "2026-01-01",
        },
        {
          id: 2,
          date: "2026-02-01",
        },
        {
          id: 3,
          date: "2026-03-01",
        },
      ]);
      return (
        (e.findings as any).k.reopenCount === 1 &&
        e.data.some(function (x) {
          return x.key === "k" && x.batch === 3 && x.lifecycle === "Reopened";
        })
      );
    },
  ],
  [
    "SSVC: KEV + automatable + total impact on a tier-1 asset = Act",
    function () {
      return (
        ssvcOf(
          {
            name: "x",
            kev: true,
            vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
          },
          {
            tier: 1,
            exposure: "internet",
          },
        ).decision === "Act"
      );
    },
  ],
  [
    "SSVC: no exploit, partial impact, tier 3 = Track",
    function () {
      return (
        ssvcOf(
          {
            name: "Missing header",
            vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N",
          },
          {
            tier: 3,
            exposure: "internal",
          },
        ).decision === "Track"
      );
    },
  ],
  [
    "EOL: PHP 7.4 flagged, PHP 8.3 not",
    function () {
      return (
        isEol({
          name: "PHP 7.4 detected",
        }) &&
        !isEol({
          name: "PHP 8.3.1 detected",
        })
      );
    },
  ],
  [
    "OWASP: SQL injection → A03",
    function () {
      return owaspOf("SQL Injection in id") === "A03 Injection";
    },
  ],
  [
    "EPSS CSV parser reads score date and rows",
    function () {
      var r = parseEpssCsv(
        "#model_version:v2025.03.14,score_date:2026-09-24T00:00:00+0000\ncve,epss,percentile\nCVE-2017-0144,0.94,0.99\n",
      );
      return (
        r.epssCount === 1 &&
        r.epssDate === "2026-09-24" &&
        r.epss["CVE-2017-0144"][0] === 0.94
      );
    },
  ],
  [
    "KEV parser reads ransomware flag",
    function () {
      var r = parseKevFeed(
        '{"catalogVersion":"x","vulnerabilities":[{"cveID":"CVE-2019-0708","dueDate":"2021-11-17","knownRansomwareCampaignUse":"Known"}]}',
      );
      return r.kev["CVE-2019-0708"].ransom === true;
    },
  ],
  [
    "Risk is 0 for fixed findings and ≤ 100 otherwise",
    function () {
      var a = {
        tier: 1,
        exposure: "internet",
      };
      return (
        riskModel(
          {
            lifecycle: "Fixed",
            sev: "critical",
          },
          a,
        ).risk === 0 &&
        riskModel(
          {
            sev: "critical",
            cvss: 10,
            kev: true,
            epss: 1,
            ransomware: true,
            eol: true,
            breached: true,
            ageDays: 400,
          },
          a,
        ).risk === 100
      );
    },
  ],
];

SELF_TESTS.push(
  [
    "Severity: the 0-5 scanner scale is kept apart from CVSS scores",
    function () {
      return (
        normSev("1") === "info" &&
        normSev("2") === "low" &&
        normSev("3") === "medium" &&
        normSev("4") === "high" &&
        normSev("5") === "critical" &&
        normSev("6.5") === "medium" &&
        normSev("9.8") === "critical" &&
        normSev("2.1") === "low" &&
        normSev("High") === "high"
      );
    },
  ],
  [
    "EOL: 'Java 8' at the end of a title is caught",
    function () {
      return (
        isEol({ name: "OpenJDK Java 8" }) &&
        isEol({ name: "Java 8u202 detected" }) &&
        !isEol({ name: "Java 17 runtime" })
      );
    },
  ],
);

/* audit fixes (2026-10-07): cross-scanner dedup, dates, severities, VEX scope, IPv6 hosts, heuristics */
SELF_TESTS.push(
  [
    "Dedup: Nessus + OpenVAS with the same CVE on one host:port are one finding with both tools",
    function () {
      var r = runEngine(
        [
          { batch: 1, host: "10.0.0.5", port: "443", name: "Log4j RCE", sev: "critical", cvss: 10, cves: ["CVE-2021-44228"], pluginId: "nessus:156014", tool: "Nessus" },
          { batch: 1, host: "10.0.0.5", port: "443", name: "Apache Log4j RCE", sev: "critical", cvss: 10, cves: ["CVE-2021-44228"], pluginId: "oid:1.3.6.1.4.1.25623.1.0.117825", tool: "OpenVAS" },
        ],
        [{ id: 1, date: "2026-01-10", full: false }],
      );
      var rows = r.data.filter(function (x) {
        return x.batch === 1;
      });
      return rows.length === 1 && rows[0].tools.length === 2;
    },
  ],
  [
    "Dates: impossible calendar dates are rejected; dotted dates are day-first; slashes month-first unless impossible",
    function () {
      return (
        isoDay("2026-13-45") === null &&
        isoDay("2026-02-30") === null &&
        isoDay("04.03.2026") === "2026-03-04" &&
        isoDay("03/04/2026") === "2026-03-04" &&
        isoDay("25/03/2026") === "2026-03-25" &&
        isoDay("2024-02-29") === "2024-02-29"
      );
    },
  ],
  [
    "Severity: decimal scores and unfamiliar words aren't buried as info",
    function () {
      return (
        normSev("4.0") === "medium" &&
        normSev("7.0") === "high" &&
        normSev("10.0") === "critical" &&
        normSev("Urgent") === "critical" &&
        normSev("P1") === "critical" &&
        normSev("error") === "high" &&
        normSev("Serious") === "high" &&
        normSev("Weird") === "medium" &&
        normSev("") === "info"
      );
    },
  ],
  [
    "VEX without a product covers dependency findings only, never a network host",
    function () {
      var v = { cve: "CVE-2021-44228", status: "not_affected" };
      return (
        !vexMatches(v, { cves: ["CVE-2021-44228"], tool: "Nessus", host: "dc01", name: "Log4j" }) &&
        vexMatches(v, { cves: ["CVE-2021-44228"], tool: "Trivy", host: "app:1.2", name: "log4j-core" })
      );
    },
  ],
  [
    "Hosts: bare and bracketed IPv6 normalise to the same host; link-local is private",
    function () {
      return (
        hostOf("fe80::1") === "fe80::1" &&
        hostOf("https://[fe80::1]:8443/x") === "fe80::1" &&
        hostOf("https://app.example.com/login") === "app.example.com" &&
        isPrivate("[fe80::1]") === true
      );
    },
  ],
  [
    "Heuristics: 'WordPress' is not RDP ransomware exposure",
    function () {
      return !isRansom({ name: "WordPress Plugin XSS" }) && isRansom({ name: "RDP exposed to the internet" });
    },
  ],
);

export function runSelfTests() {
  return SELF_TESTS.map(function (t) {
    var ok = false,
      err = "";
    try {
      ok = !!(t[1] as () => boolean)();
    } catch (e) {
      err = e && e.message ? e.message : String(e);
    }
    return {
      name: t[0],
      ok: ok,
      err: err,
    };
  });
}

/* ===================== v12: exposure analytics ===================== */
/* MITRE ATT&CK technique a finding enables (first match wins; exposure decides initial access vs lateral) */

/* ===================== v12: exposure analytics ===================== */
/* MITRE ATT&CK technique a finding enables (first match wins; exposure decides initial access vs lateral) */
export var ATTACK_RULES = [
  [
    /default .*password|default root|default credential|unauthenticated access|null session|anonymous (login|access)|weak password|blank password/i,
    function (ext) {
      return ext
        ? ["T1078", "Valid Accounts", "Initial Access"]
        : ["T1078", "Valid Accounts", "Lateral Movement"];
    },
  ],
  [
    /remote desktop|\brdp\b|\bvnc\b|telnet|winrm/i,
    function (ext) {
      return ext
        ? ["T1133", "External Remote Services", "Initial Access"]
        : ["T1021", "Remote Services", "Lateral Movement"];
    },
  ],
  [
    /smbv1|eternalblue|ms17-010|bluekeep|\bsmb\b/i,
    function (ext) {
      return ext
        ? ["T1190", "Exploit Public-Facing Application", "Initial Access"]
        : ["T1210", "Exploitation of Remote Services", "Lateral Movement"];
    },
  ],
  [
    /sql injection|sqli|remote code|\brce\b|path traversal|deserial|pre-auth|ssl-vpn|zero-day|command injection|ssrf|object level authorization|bola|file upload|xxe|log4|struts/i,
    function (ext) {
      return ext
        ? ["T1190", "Exploit Public-Facing Application", "Initial Access"]
        : ["T1210", "Exploitation of Remote Services", "Lateral Movement"];
    },
  ],
  [
    /privilege escalation|local privilege|sudo|kernel|setuid/i,
    function () {
      return [
        "T1068",
        "Exploitation for Privilege Escalation",
        "Privilege Escalation",
      ];
    },
  ],
  [
    /cross-site scripting|\bxss\b|cookie|session|csrf|clickjack|x-frame|cors/i,
    function () {
      return ["T1539", "Steal Web Session Cookie", "Credential Access"];
    },
  ],
  [
    /\btls\b|\bssl\b|cipher|hsts|cleartext|certificate|key exchange|weak key/i,
    function () {
      return ["T1557", "Adversary-in-the-Middle", "Credential Access"];
    },
  ],
  [
    /disclosure|banner|directory listing|header|version/i,
    function () {
      return ["T1592", "Gather Victim Host Information", "Reconnaissance"];
    },
  ],
];

export var ATTACK_TACTICS = [
  "Reconnaissance",
  "Initial Access",
  "Credential Access",
  "Privilege Escalation",
  "Lateral Movement",
];

export function attackOf(f, asset) {
  var t = f.name + " " + (f.desc || ""),
    ext = (asset ? asset.exposure : f.exposure) === "internet";
  for (var i = 0; i < ATTACK_RULES.length; i++)
    if ((ATTACK_RULES[i][0] as any).test(t)) {
      var r = (ATTACK_RULES[i][1] as (ext: any) => string[])(ext);
      return {
        id: r[0],
        name: r[1],
        tactic: r[2],
      };
    }
  return null;
}
/* Attack graph: Internet → entry hosts (initial-access findings on internet-facing hosts) → hosts reachable
   by a lateral-movement finding (internal hosts are assumed mutually reachable unless marked isolated) → crown jewels (tier 1). */

/* Attack graph: Internet → entry hosts (initial-access findings on internet-facing hosts) → hosts reachable
   by a lateral-movement finding (internal hosts are assumed mutually reachable unless marked isolated) → crown jewels (tier 1). */
export function buildAttackGraph(active, assets) {
  var hosts = {},
    entry = [],
    pivotBy = {};
  active.forEach(function (f) {
    var a = assetOf(f.host, assets);
    if (f.exposure)
      a = Object.assign({}, a, {
        exposure: f.exposure,
      });
    var at = attackOf(f, a);
    f.attack = at;
    var hN =
      hosts[f.host] ||
      (hosts[f.host] = {
        host: f.host,
        tier: a.tier,
        exposure: a.exposure,
        bu: a.bu,
        initial: [],
        lateral: [],
      });
    if (!at || f.sev === "info") return;
    if (at.tactic === "Initial Access" && a.exposure === "internet")
      hN.initial.push(f);
    if (
      at.tactic === "Lateral Movement" ||
      (at.tactic === "Initial Access" && a.exposure !== "isolated")
    )
      hN.lateral.push(f);
  });
  Object.keys(hosts).forEach(function (hh) {
    var n = hosts[hh];
    n.initial.sort(byRisk);
    n.lateral.sort(byRisk);
    if (n.initial.length) entry.push(hh);
  });
  function byRisk(a, b) {
    return b.risk - a.risk;
  }
  var jewels = Object.keys(hosts).filter(function (hh) {
    return hosts[hh].tier === 1;
  });
  /* enumerate simple paths up to 4 hops, best (highest-risk) finding per hop */
  /* breadth-first per entry (shortest paths first), a fair share of paths for every entry host */
  var paths = [],
    MAXP = 60,
    PER = 12;
  var pivots = Object.keys(hosts).filter(function (hh) {
    var n = hosts[hh];
    return n.lateral.length && n.exposure !== "isolated" && !n.initial.length;
  });
  if (jewels.length)
    entry.forEach(function (e0) {
      var queue = [[e0]],
        qi = 0,
        budget = 6000,
        got = 0;
      while (qi < queue.length && budget-- > 0 && got < PER) {
        var p = queue[qi++],
          last = p[p.length - 1];
        if (hosts[last].tier === 1) {
          paths.push(p);
          got++;
          continue;
        }
        if (p.length >= 4) continue;
        pivots
          .concat(
            jewels.filter(function (j) {
              return (
                pivots.indexOf(j) < 0 &&
                hosts[j].lateral.length &&
                hosts[j].exposure !== "isolated"
              );
            }),
          )
          .forEach(function (nx) {
            if (p.indexOf(nx) >= 0) return;
            if (
              hosts[last].exposure === "internet" &&
              hosts[nx].exposure === "internet"
            )
              return;
            queue.push(p.concat([nx]));
          });
      }
    });
  var seen = {},
    out = [];
  paths.forEach(function (p) {
    var k = p.join(">");
    if (seen[k]) return;
    seen[k] = 1;
    var steps = p.map(function (hh, i) {
      var f = i === 0 ? hosts[hh].initial[0] : hosts[hh].lateral[0];
      return {
        host: hh,
        finding: f,
        attack: f && f.attack,
      };
    });
    var score = Math.round(
      (steps.reduce(function (s, x) {
        return s + (x.finding ? x.finding.risk : 0);
      }, 0) /
        steps.length) *
        (1 + 0.15 * (4 - p.length)),
    );
    out.push({
      id: k,
      hosts: p,
      steps: steps,
      target: p[p.length - 1],
      score: score,
    });
  });
  out.sort(function (a, b) {
    return b.score - a.score || a.hosts.length - b.hosts.length;
  });
  out = out.slice(0, MAXP);
  /* choke points: the (host, finding) step that sits on the most paths */
  var chk = {};
  out.forEach(function (p) {
    p.steps.forEach(function (s) {
      if (!s.finding) return;
      var k = s.finding.key;
      var c =
        chk[k] ||
        (chk[k] = {
          key: k,
          finding: s.finding,
          host: s.host,
          attack: s.attack,
          paths: 0,
        });
      c.paths++;
    });
  });
  var chokes = Object.keys(chk)
    .map(function (k) {
      return chk[k];
    })
    .sort(function (a, b) {
      return b.paths - a.paths || b.finding.risk - a.finding.risk;
    });
  var onPath = {};
  out.forEach(function (p) {
    p.steps.forEach(function (s) {
      if (s.finding) onPath[s.finding.key] = 1;
    });
  });
  active.forEach(function (f) {
    f.onPath = !!onPath[f.key];
  });
  var reached = {};
  out.forEach(function (p) {
    reached[p.target] = 1;
  });
  var tech = {};
  active.forEach(function (f) {
    if (f.attack && f.sev !== "info") {
      var k = f.attack.id;
      var t2 =
        tech[k] ||
        (tech[k] = {
          id: k,
          name: f.attack.name,
          tactic: f.attack.tactic,
          n: 0,
          hosts: {},
        });
      t2.n++;
      t2.hosts[f.host] = 1;
    }
  });
  return {
    hosts: hosts,
    entry: entry,
    jewels: jewels,
    reached: Object.keys(reached),
    paths: out,
    chokes: chokes,
    techniques: Object.keys(tech).map(function (k) {
      var t3 = tech[k];
      t3.hostN = Object.keys(t3.hosts).length;
      return t3;
    }),
  };
}

/* Asset risk on a 0–1000 scale: union of the host's finding risks (each weighted 0.5) */

/* Asset risk on a 0–1000 scale: union of the host's finding risks (each weighted 0.5) */
export function assetRisk(rows) {
  return Math.round(
    1000 *
      (1 -
        rows.reduce(function (p, x) {
          return p * (1 - (0.5 * (x.risk || 0)) / 100);
        }, 1)),
  );
}

export function assetBand(s) {
  return s >= 850 ? "Severe" : s >= 700 ? "High" : s >= 500 ? "Medium" : "Low";
}

/* Group findings by the fix that closes them ("Top fixes") */

/* Group findings by the fix that closes them ("Top fixes") */
export function fixKey(f) {
  var s = String(f.sol || "").toLowerCase();
  var m =
    /(upgrade|update|migrate|patch)\s+(?:the\s+)?([a-z][a-z0-9 .+_-]{2,40}?)\s+(?:to|firmware|server|package)/.exec(
      s,
    );
  if (
    m &&
    /^(the |a |an )?(affected|latest|vendor|web|relevant|following|installed|vulnerable|packages?|software|application|system|component)s?\b/.test(
      m[2],
    )
  )
    m = null;
  if (f.eol || m) {
    var prod = m
      ? m[2]
      : f.name
          .toLowerCase()
          .replace(/end-of-life|\(eol\)|outdated|\d+(\.\d+)*/g, "");
    return "upgrade:" + prod.replace(/\s+/g, " ").trim();
  }
  if (f.pluginId) return "rule:" + f.pluginId;
  if (/ms17-010|eternalblue|smbv1/.test(s + f.name.toLowerCase()))
    return "disable:smbv1";
  return (
    "vuln:" +
    normName(f.name)
      .replace(/ on \S+$/, "")
      .slice(0, 70)
  );
}

export function topFixes(active) {
  var g = {},
    total =
      active.reduce(function (t, x) {
        return t + x.risk;
      }, 0) || 1;
  active.forEach(function (f) {
    var k = fixKey(f);
    var x =
      g[k] ||
      (g[k] = {
        key: k,
        sol: f.sol,
        sample: f.name,
        findings: [],
        hosts: {},
        risk: 0,
        kev: 0,
        crit: 0,
      });
    x.findings.push(f);
    x.hosts[f.host] = 1;
    x.risk += f.risk;
    if (f.kev) x.kev++;
    if (f.sev === "critical") x.crit++;
  });
  return Object.keys(g)
    .map(function (k) {
      var x = g[k];
      x.hostN = Object.keys(x.hosts).length;
      x.share = Math.round((100 * x.risk) / total);
      x.effort =
        Math.round(
          (x.findings.reduce(function (t, f) {
            return t + f.effort;
          }, 0) /
            x.findings.length) *
            10,
        ) / 10;
      return x;
    })
    .sort(function (a, b) {
      return b.risk - a.risk;
    });
}

/* Automation rules: first-class "if this, then that" over active findings */

/* Automation rules: first-class "if this, then that" over active findings */
export function ruleMatches(r, f, ctx) {
  var w = r.when || {};
  if (w.sev && w.sev.length && w.sev.indexOf(f.sev) < 0) return false;
  if (w.kev && !f.kev) return false;
  if (w.onPath && !f.onPath) return false;
  if (w.ssvc && w.ssvc.length && w.ssvc.indexOf(f.ssvc.decision) < 0)
    return false;
  if (w.exposure && f.exposure !== w.exposure) return false;
  if (w.tier && +w.tier !== f.tier) return false;
  if (w.bu && (ctx.buOf(f.host) || "") !== w.bu) return false;
  if (w.host && f.host.toLowerCase().indexOf(String(w.host).toLowerCase()) < 0)
    return false;
  if (w.name && f.name.toLowerCase().indexOf(String(w.name).toLowerCase()) < 0)
    return false;
  if (w.tool && f.tool.toLowerCase().indexOf(String(w.tool).toLowerCase()) < 0)
    return false;
  if (w.owasp && (f.owasp || "").indexOf(w.owasp) !== 0) return false;
  return true;
}

export function applyRules(rules, active, gov, ctx) {
  var patches = {},
    hits = [];
  (rules || [])
    .filter(function (r) {
      return r.enabled !== false;
    })
    .forEach(function (r) {
      var n = 0,
        rk = [];
      active.forEach(function (f) {
        if (!ruleMatches(r, f, ctx)) return;
        var g0 = Object.assign({}, gov[f.key] || {}, patches[f.key] || {}),
          p = patches[f.key] || {},
          t = r.then || {},
          changed = false;
        if (t.team && g0.team !== t.team && !g0.manualTeam) {
          p.team = t.team;
          p.assigned = true;
          changed = true;
        }
        if (t.raci && g0.raci !== t.raci) {
          p.raci = t.raci;
          changed = true;
        }
        if (t.tag) {
          var tags = (g0.tags || []).slice();
          if (tags.indexOf(t.tag) < 0) {
            tags.push(t.tag);
            p.tags = tags;
            changed = true;
          }
        }
        if (t.status && !g0.status) {
          p.status = t.status;
          changed = true;
        }
        if (t.ticket && !g0.ticket) {
          p.ticket = "__new__";
          p.assigned = true;
          changed = true;
        }
        if (
          t.campaign &&
          !(ctx.campaignHas && ctx.campaignHas(t.campaign, f.key))
        ) {
          p.campaign = t.campaign;
          changed = true;
        }
        if (changed) {
          patches[f.key] = p;
          n++;
          rk.push(f.key);
        }
      });
      hits.push({
        rule: r.name,
        n: n,
        keys: rk,
      });
    });
  /* net effect only: when two rules fight (team X then team Y), a field ending where it started isn't a change */
  Object.keys(patches).forEach(function (k) {
    var g0 = gov[k] || {},
      p = patches[k];
    Object.keys(p).forEach(function (fld) {
      if (
        fld !== "ticket" &&
        JSON.stringify(p[fld]) === JSON.stringify(g0[fld])
      )
        delete p[fld];
    });
    if (p.assigned && Object.keys(p).length === 1 && g0.assigned)
      delete p.assigned;
    if (!Object.keys(p).length) delete patches[k];
  });
  hits.forEach(function (h0) {
    h0.n = h0.keys.filter(function (k) {
      return patches[k];
    }).length;
    delete h0.keys;
  });
  return {
    patches: patches,
    hits: hits,
  };
}

/* ===== VEX: product-aware, persisted statements ===== */
/* product id → {name, ver}: purl (pkg:npm/lodash@4.17.20), "name 1.2.3", "name@1.2.3" or a bare name */

/* ===== VEX: product-aware, persisted statements ===== */
/* product id → {name, ver}: purl (pkg:npm/lodash@4.17.20), "name 1.2.3", "name@1.2.3" or a bare name */
export function vexProduct(p) {
  p = String(p || "")
    .trim()
    .toLowerCase();
  if (!p)
    return {
      name: "",
      ver: "",
    };
  var m = /^pkg:[^/]+\/(?:[^@?#]*\/)?([^@?#/]+)(?:@([^?#]+))?/.exec(p);
  if (m)
    return {
      name: decodeURIComponent(m[1]),
      ver: m[2] ? decodeURIComponent(m[2]) : "",
    };
  var m2 = /^(.+?)[ @:]v?(\d[\w.+~-]*)$/.exec(p);
  if (m2)
    return {
      name: m2[1].trim(),
      ver: m2[2],
    };
  return {
    name: p,
    ver: "",
  };
}

export function reEsc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/* does statement v apply to finding f? CVE must match; a named product must appear in the finding (host, title,
   rule or description); a versioned product must not contradict a different version named next to it */

/* does statement v apply to finding f? CVE must match; a named product must appear in the finding (host, title,
   rule or description); a versioned product must not contradict a different version named next to it */
export function vexMatches(v, f) {
  if (
    (f.cves || [])
      .map(function (c) {
        return String(c).toUpperCase();
      })
      .indexOf(v.cve) < 0
  )
    return false;
  var pr = vexProduct(v.product);
  /* no product: a VEX statement speaks for software components, so it only covers dependency/code findings —
     never a network finding on some host that happens to carry the same CVE */
  if (!pr.name)
    return familiesOf(f.tool || (f.tools || []).join(" + ")).some(function (fm) {
      return fm === "sca" || fm === "sast";
    });
  var text = [f.host, f.name, f.pluginId, f.desc].join(" ").toLowerCase();
  var nm = new RegExp(
    "(^|[^a-z0-9_.-])" +
      reEsc(pr.name) +
      "(?![a-z0-9_-])(?!\\.[a-z0-9])(?:[ @:/]v?(\\d[\\w.+~-]*))?",
  );
  var hit = nm.exec(text);
  if (!hit) return false;
  if (!pr.ver) return true;
  if (hit[2]) return hit[2].replace(/[.,;)]+$/, "") === pr.ver;
  return text.indexOf(pr.ver) >= 0 || !/\d+\.\d+/.test(text);
}
/* newest statement per CVE+product wins. Returns governance patches: {key: {vex state}} to set, {key: null} to lift */

/* newest statement per CVE+product wins. Returns governance patches: {key: {vex state}} to set, {key: null} to lift */
export function applyVex(statements, findings, gov) {
  gov = gov || {};
  var latest = {};
  (statements || []).forEach(function (v, i) {
    var k =
      v.cve +
      "|" +
      vexProduct(v.product).name +
      "|" +
      vexProduct(v.product).ver;
    var o = latest[k];
    if (!o || (v.at || "") >= (o.at || ""))
      latest[k] = Object.assign(
        {
          _i: i,
        },
        v,
      );
  });
  var list = Object.keys(latest).map(function (k) {
    return latest[k];
  });
  var out = {},
    seen = {};
  (findings || []).forEach(function (f) {
    if (seen[f.key]) return;
    seen[f.key] = 1;
    var hits = list.filter(function (v) {
      return vexMatches(v, f);
    });
    if (!hits.length) return;
    /* most specific (versioned, then named) and newest statement decides */
    hits.sort(function (a, b) {
      var sa =
          (vexProduct(a.product).ver ? 2 : 0) +
          (vexProduct(a.product).name ? 1 : 0),
        sb =
          (vexProduct(b.product).ver ? 2 : 0) +
          (vexProduct(b.product).name ? 1 : 0);
      return sb - sa || String(b.at || "").localeCompare(String(a.at || ""));
    });
    var v = hits[0],
      g = gov[f.key] || {};
    if (g.vexOverride)
      return; /* a person reopened or rejected this VEX suppression: documents don't override them */
    if (/not_affected|false_positive/.test(v.status)) {
      if (
        (g.state === "fp" || g.state === "requested") &&
        g.by === "VEX" &&
        g.vexId === v.cve + "|" + (v.product || "")
      )
        return;
      if (g.state && g.by !== "VEX")
        return; /* a human decision outranks a VEX document */
      out[f.key] = {
        state: "fp",
        by: "VEX",
        vexId: v.cve + "|" + (v.product || ""),
        reason:
          "VEX " +
          v.status +
          (v.justification ? " (" + v.justification + ")" : "") +
          (v.detail ? ": " + v.detail : "") +
          (v.product ? " · " + v.product : ""),
      };
    } else if (
      /^(affected|exploitable|in_triage|under_investigation)$/.test(v.status) &&
      (g.state === "fp" || g.state === "requested") &&
      g.by === "VEX"
    )
      out[f.key] = null;
  });
  return out;
}
/* merge new statements into the stored list (same CVE+product+status+justification = same statement) */

/* merge new statements into the stored list (same CVE+product+status+justification = same statement) */
export function mergeVex(stored, incoming, at, source?) {
  var seen = {},
    out = [];
  (stored || [])
    .concat(
      (incoming || []).map(function (v) {
        return Object.assign({}, v, {
          at: v.at || at,
          source: v.source || source,
        });
      }),
    )
    .forEach(function (v) {
      var k = [v.cve, v.product || "", v.status, v.justification || ""].join(
        "|",
      );
      if (seen[k] != null) {
        out[seen[k]] = v;
        return;
      }
      seen[k] = out.length;
      out.push(v);
    });
  return out;
}

/* ===== host aliases (FQDN / NetBIOS / IP → one canonical host) ===== */

/* ===== host aliases (FQDN / NetBIOS / IP → one canonical host) ===== */
export function canonHost(h, aliases) {
  var k = String(h || "").toLowerCase(),
    seen = 0;
  while (aliases && aliases[k] && seen++ < 5) k = aliases[k];
  return k;
}
/* rewrite rows to canonical hosts; returns { rows, map: oldKey → newKey } */

/* rewrite rows to canonical hosts; returns { rows, map: oldKey → newKey } */
export function aliasRows(rows, aliases) {
  var map = {};
  var out = rows.map(function (x) {
    var c = canonHost(x.host, aliases);
    if (c === String(x.host || "").toLowerCase()) return x;
    var n = Object.assign({}, x, {
      host: c,
    });
    n.key = fingerprint(n);
    if (x.key && x.key !== n.key) map[x.key] = n.key;
    return n;
  });
  return {
    rows: out,
    map: map,
  };
}

/* Backlog forecast from the scan-to-scan flow */

/* Backlog forecast from the scan-to-scan flow */
export function forecastOf(m, order) {
  var fl = m.flow.filter(function (x) {
    return !x.baseline;
  });
  if (fl.length < 1 || m.flow.length < 2) return null;
  var gaps = [];
  for (var i = 1; i < order.length; i++)
    gaps.push(Math.max(1, days(order[i - 1].date, order[i].date)));
  if (gaps.length === 0) return null;
  var gap = Math.round(
    gaps.reduce(function (a, b) {
      return a + b;
    }, 0) / gaps.length,
  );
  var recent = fl.slice(-3),
    inflow =
      recent.reduce(function (t, x) {
        return t + x.added + x.reopened;
      }, 0) / recent.length,
    outflow =
      recent.reduce(function (t, x) {
        return t + x.fixed;
      }, 0) / recent.length;
  var net = inflow - outflow,
    open = m.flow[m.flow.length - 1].open,
    pts = [];
  for (var k = 1; k <= 3; k++)
    pts.push(Math.max(0, Math.round(open + net * k)));
  return {
    gapDays: gap,
    inflow: Math.round(inflow * 10) / 10,
    outflow: Math.round(outflow * 10) / 10,
    net: Math.round(net * 10) / 10,
    next: pts,
    clearIn: net < 0 ? Math.ceil(open / -net) : null,
  };
}

SELF_TESTS.push(
  [
    "An SLA pause stops the clock",
    function () {
      var B = [
        {
          id: 1,
          date: "2026-01-01",
          tools: "Nessus",
        },
      ];
      var e0 = runEngine(
        [
          {
            batch: 1,
            host: "a",
            name: "x",
            tool: "Nessus",
            sev: "high",
            cvss: 7,
            cves: [],
          },
        ],
        B,
      );
      var e1 = runEngine(
        [
          {
            batch: 1,
            host: "a",
            name: "x",
            tool: "Nessus",
            sev: "high",
            cvss: 7,
            cves: [],
          },
        ],
        B,
        {
          pausedDays: function () {
            return 10;
          },
        },
      );
      return e1.data[0].daysLeft - e0.data[0].daysLeft === 10;
    },
  ],
  [
    "Image IDs and digests keep distinct asset names",
    function () {
      return (
        typeof imageName !== "function" ||
        (imageName("sha256:abcdef0123") === "sha256:abcdef0123" &&
          imageName("app:1.2@sha256:abc") === "app")
      );
    },
  ],
  [
    "A reopened VEX suppression stays reopened on the next import",
    function () {
      var p = applyVex(
        [
          {
            cve: "CVE-1",
            status: "not_affected",
            product: "",
          },
        ],
        [
          {
            key: "k",
            cves: ["CVE-1"],
          },
        ],
        {
          k: {
            by: "alice",
            vexOverride: "CVE-1|",
          },
        },
      );
      return !("k" in p);
    },
  ],
  [
    "Trivy prefers a vendor CVSS 3 over an NVD CVSS 2",
    function () {
      if (typeof parseTrivy !== "function") return true;
      var r = parseTrivy({
        ArtifactName: "img:1",
        Results: [
          {
            Vulnerabilities: [
              {
                VulnerabilityID: "CVE-2020-1",
                PkgName: "p",
                InstalledVersion: "1",
                Severity: "HIGH",
                SeveritySource: "redhat",
                CVSS: {
                  nvd: {
                    V2Score: 5.0,
                    V2Vector: "AV:N/AC:L/Au:N/C:P/I:N/A:N",
                  },
                  redhat: {
                    V3Score: 7.5,
                    V3Vector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
                  },
                },
              },
            ],
          },
        ],
      });
      return r[0].cvss === 7.5 && r[0].host === "img";
    },
  ],
  [
    "SSVC: support tier × material well-being is medium mission",
    function () {
      var r = ssvcOf(
        {
          name: "x",
          kev: true,
          vector: "CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N",
        },
        {
          tier: 2,
          exposure: "internal",
          wellbeing: "material",
        },
      );
      return r.mission === "medium";
    },
  ],
  [
    "Rules that fight over the team make no net change",
    function () {
      var R = [
        {
          name: "a",
          when: {},
          then: {
            team: "X",
          },
        },
        {
          name: "b",
          when: {},
          then: {
            team: "Y",
          },
        },
      ];
      var r = applyRules(
        R,
        [
          {
            key: "k",
            sev: "high",
            ssvc: {
              decision: "Track",
            },
            host: "h",
            name: "n",
            tool: "t",
            tier: 2,
          },
        ],
        {
          k: {
            team: "Y",
            assigned: true,
          },
        },
        {
          buOf: function () {
            return "";
          },
        },
      );
      return (
        !(r.patches as any).k &&
        r.hits.every(function (h0) {
          return h0.n === 0;
        })
      );
    },
  ],
  [
    "Info findings carry no risk",
    function () {
      return (
        riskModel(
          {
            sev: "info",
            cvss: 0,
            ageDays: 400,
            breached: true,
          },
          {
            tier: 1,
            exposure: "internet",
          },
        ).risk === 0
      );
    },
  ],
  [
    "SLA compliance counts open breaches as misses",
    function () {
      var B = [
        {
          id: 1,
          date: "2025-01-01",
          tools: "Nessus",
        },
        {
          id: 2,
          date: "2025-01-06",
          tools: "Nessus",
        },
      ];
      var e = runEngine(
        [
          {
            batch: 1,
            host: "a",
            name: "fixed",
            tool: "Nessus",
            sev: "critical",
            cvss: 9,
            cves: [],
          },
          {
            batch: 1,
            host: "a",
            name: "old",
            tool: "Nessus",
            sev: "critical",
            cvss: 9,
            cves: [],
          },
          {
            batch: 2,
            host: "a",
            name: "old",
            tool: "Nessus",
            sev: "critical",
            cvss: 9,
            cves: [],
          },
        ],
        B,
        {
          sla: {
            critical: 14,
            high: 30,
            medium: 90,
            low: 180,
            info: 360,
          },
        },
      );
      var m = metricsOf(e, {});
      return (
        m.slaClosedCompliance === 100 &&
        (m.openBreached === 0 || m.slaCompliance < 100)
      );
    },
  ],
  [
    "Top fixes don't merge unrelated 'update the affected packages' advisories",
    function () {
      return (
        fixKey({
          sol: "Update the affected packages.",
          name: "RHSA-1: openssl",
          pluginId: "nessus:1",
        }) !==
        fixKey({
          sol: "Update the affected packages.",
          name: "RHSA-2: curl",
          pluginId: "nessus:2",
        })
      );
    },
  ],
  [
    "Container image tags are dropped from the asset name",
    function () {
      return (
        typeof imageName !== "function" ||
        (imageName("shop:2.0") === "shop" &&
          imageName("registry.local:5000/shop:2.1") ===
            "registry.local:5000/shop" &&
          imageName("app@sha256:abc123") === "app")
      );
    },
  ],
  [
    "CVSS 4.0: FIRST reference vectors",
    function () {
      function sc(v) {
        return cvss4Score(parseVector(v));
      }
      return (
        sc(
          "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N",
        ) === 9.3 &&
        sc(
          "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:N/SC:N/SI:N/SA:N",
        ) === 0 &&
        sc(
          "CVSS:4.0/AV:L/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N/E:U",
        ) <
          sc("CVSS:4.0/AV:L/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N")
      );
    },
  ],
  [
    "An analyst's CVSS vector re-scores the finding",
    function () {
      var e = runEngine(
        [
          {
            batch: 1,
            host: "a",
            name: "x",
            tool: "Nessus",
            sev: "critical",
            cvss: 9.8,
            cves: [],
          },
        ],
        [
          {
            id: 1,
            date: "2026-01-01",
            tools: "Nessus",
          },
        ],
        {
          vectorOf: function () {
            return "CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N";
          },
        },
      );
      var f = e.data[0];
      return (
        f.cvss ===
          cvss3Score(
            parseVector("CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N"),
          ) &&
        f.sev === "low" &&
        f.scannerCvss === 9.8
      );
    },
  ],
  [
    "An Nmap port sweep never marks a Nessus finding fixed",
    function () {
      var e = runEngine(
        [
          {
            batch: 1,
            host: "a",
            port: 445,
            name: "EternalBlue",
            pluginId: "nessus:97833",
            tool: "Tenable Nessus",
            sev: "critical",
            cvss: 9.8,
            cves: [],
          },
          {
            batch: 2,
            host: "a",
            port: 22,
            name: "Open port 22",
            pluginId: "nmap:22/tcp:ssh",
            tool: "Nmap",
            sev: "info",
            cvss: 0,
            cves: [],
          },
        ],
        [
          {
            id: 1,
            date: "2026-01-01",
            tools: "Tenable Nessus",
          },
          {
            id: 2,
            date: "2026-02-01",
            tools: "Nmap",
            scope: ["a"],
          },
        ],
      );
      return e.findings["a|445|nessus:97833"].state === "open";
    },
  ],
  [
    "Nessus not seeing an OpenVAS rule proves nothing",
    function () {
      var e = runEngine(
        [
          {
            batch: 1,
            host: "a",
            port: 22,
            name: "x",
            pluginId: "oid:1.3.6",
            tool: "OpenVAS / Greenbone",
            sev: "high",
            cvss: 7,
            cves: [],
          },
        ],
        [
          {
            id: 1,
            date: "2026-01-01",
            tools: "OpenVAS / Greenbone",
          },
          {
            id: 2,
            date: "2026-02-01",
            tools: "Tenable Nessus",
            scope: ["a"],
          },
        ],
      );
      return e.findings["a|22|oid:1.3.6"].state === "open";
    },
  ],
  [
    "One upload of Nessus on A + Burp on B doesn't re-test A's web bugs",
    function () {
      var e = runEngine(
        [
          {
            batch: 1,
            host: "app",
            port: 443,
            name: "XSS",
            pluginId: "burp:1",
            url: "/s",
            tool: "Burp Suite",
            sev: "high",
            cvss: 6,
            cves: [],
          },
        ],
        [
          {
            id: 1,
            date: "2026-01-01",
            tools: "Burp Suite",
          },
          {
            id: 2,
            date: "2026-02-01",
            tools: "Tenable Nessus + Burp Suite",
            scope: ["app", "shop"],
            scopeBy: {
              nessus: ["app"],
              burp: ["shop"],
            },
          },
        ],
      );
      return e.findings["app|443|burp:1|/s"].state === "open";
    },
  ],
  [
    "Dates: compact ISO keeps its calendar day; decimal commas parse",
    function () {
      return (
        (typeof isoDay !== "function" ||
          isoDay("20260926T101112") === "2026-09-26") &&
        localDay("2026-09-26") === "2026-09-26" &&
        (typeof num !== "function" || num("9,8") === 9.8)
      );
    },
  ],
  [
    "Exploitable heuristic ignores 'source' and 'by default'",
    function () {
      return !computeExploitable({
        name: "OpenSSH < 9.3 multiple issues",
        cves: ["CVE-2023-1"],
        sev: "medium",
        cvss: 6.5,
        desc: "enabled by default",
        sol: "Upgrade from the vendor source.",
      });
    },
  ],
  [
    "CVSS v2 vectors with a CVSS2# prefix parse",
    function () {
      var pv = parseVector("CVSS2#AV:N/AC:L/Au:N/C:P/I:P/A:P");
      return !!pv && pv.version === "2.0" && (pv.m as any).AV === "N";
    },
  ],
  [
    "OpenVAS: the result's own severity, not the NVT's",
    function () {
      if (
        typeof parseOpenVAS !== "function" ||
        typeof DOMParser === "undefined"
      )
        return true;
      var d = new DOMParser().parseFromString(
        '<report><results><result><host>10.0.0.1</host><port>22/tcp</port><nvt oid="1.2"><name>X</name><severities><severity type="cvss_base_v3"><date>2021-01-01</date><value>CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H</value></severity></severities></nvt><threat>High</threat><severity>7.5</severity></result></results></report>',
        "application/xml",
      );
      var r = parseOpenVAS(d);
      return r.length === 1 && r[0].cvss === 7.5;
    },
  ],
  [
    "VEX: purl product matches only its own component",
    function () {
      var f1 = {
          key: "a",
          host: "shop@1.0",
          name: "lodash 4.17.20 · Prototype pollution",
          cves: ["CVE-2021-23337"],
        },
        f2 = {
          key: "b",
          host: "shop@1.0",
          name: "lodash-es 4.17.20 · Prototype pollution",
          cves: ["CVE-2021-23337"],
        };
      var p: any = applyVex(
        [
          {
            cve: "CVE-2021-23337",
            status: "not_affected",
            product: "pkg:npm/lodash@4.17.20",
          },
        ],
        [f1, f2],
        {},
      );
      return !!p.a && !("b" in p);
    },
  ],
  [
    "VEX: a different version isn't covered",
    function () {
      return (
        !vexMatches(
          {
            cve: "CVE-1",
            product: "openssl 3.0.7",
          },
          {
            name: "openssl 1.1.1 · bug",
            cves: ["CVE-1"],
          },
        ) &&
        vexMatches(
          {
            cve: "CVE-1",
            product: "openssl 3.0.7",
          },
          {
            name: "openssl 3.0.7 · bug",
            cves: ["CVE-1"],
          },
        )
      );
    },
  ],
  [
    "VEX: a newer 'affected' lifts an older VEX suppression, never a human one",
    function () {
      var S = [
        {
          cve: "CVE-1",
          status: "not_affected",
          product: "",
          at: "2026-01-01",
        },
        {
          cve: "CVE-1",
          status: "affected",
          product: "",
          at: "2026-02-01",
        },
      ];
      var p: any = applyVex(
        S,
        [
          {
            key: "k",
            cves: ["CVE-1"],
            tool: "Trivy",
          },
          {
            key: "h",
            cves: ["CVE-1"],
            tool: "Trivy",
          },
        ],
        {
          k: {
            state: "fp",
            by: "VEX",
          },
          h: {
            state: "fp",
            by: "alice",
          },
        },
      );
      return p.k === null && !("h" in p);
    },
  ],
  [
    "Aliases: FQDN folds into the IP and keeps one finding",
    function () {
      var r = aliasRows(
        [
          {
            key: "old",
            host: "WEB01.corp.local",
            port: 443,
            pluginId: "n:1",
            tool: "Nessus",
          },
        ],
        {
          "web01.corp.local": "10.0.0.5",
        },
      );
      return (
        r.rows[0].host === "10.0.0.5" &&
        (r.map as any).old ===
          fingerprint({
            host: "10.0.0.5",
            port: 443,
            pluginId: "n:1",
            tool: "Nessus",
          })
      );
    },
  ],
  [
    "Nmap: a service version bump keeps the same finding",
    function () {
      return (
        fingerprint({
          host: "h",
          port: 22,
          pluginId: "nmap:22/tcp:ssh",
          name: "Open port 22/tcp ssh (OpenSSH 8.2p1)",
          tool: "Nmap",
        }) ===
        fingerprint({
          host: "h",
          port: 22,
          pluginId: "nmap:22/tcp:ssh",
          name: "Open port 22/tcp ssh (OpenSSH 9.6p1)",
          tool: "Nmap",
        })
      );
    },
  ],
  [
    "A web scan never marks a network finding fixed",
    function () {
      var e = runEngine(
        [
          {
            batch: 1,
            host: "a",
            port: 445,
            name: "x",
            pluginId: "nessus:1",
            tool: "Tenable Nessus",
            sev: "high",
            cvss: 7,
            cves: [],
          },
          {
            batch: 2,
            host: "a",
            port: 443,
            name: "xss",
            pluginId: "burp:1",
            tool: "Burp Suite",
            sev: "high",
            cvss: 7,
            cves: [],
            url: "/s",
          },
        ],
        [
          {
            id: 1,
            date: "2026-01-01",
            tools: "Tenable Nessus",
          },
          {
            id: 2,
            date: "2026-02-01",
            tools: "Burp Suite",
            scope: ["a"],
          },
        ],
      );
      return e.findings["a|445|nessus:1"].state === "open";
    },
  ],
  [
    "Fingerprint stays stable when a scanner adds a CVE",
    function () {
      return (
        fingerprint({
          host: "h",
          port: 1,
          pluginId: "n:5",
          cves: ["A"],
          tool: "Nessus",
        }) ===
        fingerprint({
          host: "H",
          port: 1,
          pluginId: "n:5",
          cves: ["A", "B"],
          tool: "Nessus",
        })
      );
    },
  ],
  [
    "Same web bug on two URLs stays two findings",
    function () {
      return (
        fingerprint({
          host: "h",
          port: 443,
          pluginId: "burp:1",
          tool: "Burp Suite",
          url: "/a",
        }) !==
        fingerprint({
          host: "h",
          port: 443,
          pluginId: "burp:1",
          tool: "Burp Suite",
          url: "/b",
        })
      );
    },
  ],
  [
    "Two scans on the same day don't fix each other",
    function () {
      var e = runEngine(
        [
          {
            batch: 1,
            host: "a",
            name: "x",
            tool: "Nessus",
            sev: "high",
            cvss: 7,
            cves: [],
          },
          {
            batch: 2,
            host: "a",
            name: "y",
            tool: "Nessus",
            sev: "low",
            cvss: 1,
            cves: [],
          },
        ],
        [
          {
            id: 1,
            date: "2026-01-01",
            tools: "Nessus",
          },
          {
            id: 2,
            date: "2026-01-01",
            tools: "Nessus",
          },
        ],
      );
      return (
        e.findings[
          fingerprint({
            host: "a",
            name: "x",
            tool: "Nessus",
          })
        ].state === "open"
      );
    },
  ],
  [
    "MTTR counts each fix cycle, not time spent fixed",
    function () {
      var B = [
        {
          id: 1,
          date: "2026-01-01",
          tools: "Nessus",
        },
        {
          id: 2,
          date: "2026-02-01",
          tools: "Nessus",
        },
        {
          id: 3,
          date: "2026-06-01",
          tools: "Nessus",
        },
        {
          id: 4,
          date: "2026-07-01",
          tools: "Nessus",
        },
      ];
      var r = [1, 3]
        .map(function (b) {
          return {
            batch: b,
            host: "a",
            name: "x",
            tool: "Nessus",
            sev: "high",
            cvss: 7,
            cves: [],
          };
        })
        .concat(
          [2, 4].map(function (b) {
            return {
              batch: b,
              host: "a",
              name: "z",
              tool: "Nessus",
              sev: "low",
              cvss: 1,
              cves: [],
            };
          }),
        );
      var m = metricsOf(runEngine(r, B), {});
      return (m.mttr as any).high === 31 && m.cycles >= 2;
    },
  ],
  [
    "SSVC table matches CISA (spot checks)",
    function () {
      return (
        SSVC_TREE["none|yes|partial"][2] === "Attend" &&
        SSVC_TREE["poc|yes|total"][1] === "Track*" &&
        SSVC_TREE["active|yes|partial"][0] === "Attend" &&
        SSVC_TREE["active|no|total"][1] === "Attend"
      );
    },
  ],
  [
    "ATT&CK: SQL injection on an internet host is T1190 Initial Access",
    function () {
      var a = attackOf(
        {
          name: "SQL Injection in /api",
          desc: "",
        },
        {
          exposure: "internet",
        },
      );
      return a.id === "T1190" && a.tactic === "Initial Access";
    },
  ],
  [
    "ATT&CK: RDP on an internal host is T1021 Lateral Movement",
    function () {
      return (
        attackOf(
          {
            name: "Remote Desktop Exposed",
            desc: "",
          },
          {
            exposure: "internal",
          },
        ).id === "T1021"
      );
    },
  ],
  [
    "Attack graph finds Internet → web → database path",
    function () {
      var A = {
        "w.example.com": {
          tier: 2,
          exposure: "internet",
        },
        "10.0.0.5": {
          tier: 1,
          exposure: "internal",
        },
      };
      var act = [
        {
          key: "a",
          host: "w.example.com",
          name: "SQL Injection",
          sev: "critical",
          risk: 90,
        },
        {
          key: "b",
          host: "10.0.0.5",
          name: "MySQL Default Root Password",
          sev: "critical",
          risk: 70,
        },
      ];
      var g = buildAttackGraph(act, A);
      return (
        g.paths.length === 1 &&
        g.paths[0].hosts.join(">") === "w.example.com>10.0.0.5" &&
        g.chokes[0].paths === 1
      );
    },
  ],
  [
    "Asset risk is 0 for no findings and < 1000 for one max finding",
    function () {
      return (
        assetRisk([]) === 0 &&
        assetRisk([
          {
            risk: 100,
          },
        ]) === 500
      );
    },
  ],
  [
    "Rules: KEV critical → Server Team",
    function () {
      var r = applyRules(
        [
          {
            name: "x",
            when: {
              sev: ["critical"],
              kev: true,
            },
            then: {
              team: "Server Team",
            },
          },
        ],
        [
          {
            key: "k",
            sev: "critical",
            kev: true,
            host: "h",
            name: "n",
            tool: "t",
            ssvc: {
              decision: "Act",
            },
          },
        ],
        {},
        {
          buOf: function () {
            return "";
          },
        },
      );
      return (r.patches as any).k.team === "Server Team";
    },
  ],
);

export function setAS_OF(v: any) {
  AS_OF = v;
}
