/* ---------- Constants (spec §11) + enrichment heuristics ---------- */
export var SEV = ["critical", "high", "medium", "low", "info"];

export var SEV_W = {
  critical: 10,
  high: 7,
  medium: 5,
  low: 3,
  info: 1,
};

export var SLA_DAYS = {
  critical: 14,
  high: 30,
  medium: 90,
  low: 180,
  info: 360,
}; /* editable in SLA & RACI; saved per browser */

/* editable in SLA & RACI; saved per browser */
export var TEAMS = [
  "Server Team",
  "DevOps / Cloud",
  "Database DBAs",
  "SecOps",
  "Application Dev",
];

/* ---------- heuristics (spec §4) ---------- */

/* ---------- heuristics (spec §4) ---------- */
export var SEV_LABEL_G = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export var _dms = {};

export function _ms(d) {
  var v = _dms[d];
  if (v === undefined) {
    v = _dms[d] = new Date(d).getTime();
  }
  return v;
}

export function days(a, b) {
  return Math.round((_ms(b) - _ms(a)) / 864e5);
}

export function computeExploitable(f) {
  var txt = (f.name + " " + (f.desc || "") + " " + (f.sol || "")).toLowerCase(),
    s = 0;
  if (f.cves && f.cves.length) s += 2;
  if (f.cvss >= 9) s += 2;
  if (
    /\brce\b|remote code|sql injection|\bsqli\b|deserial|metasploit|\bpoc\b|proof[- ]of[- ]concept|exploit (code|is) (publicly )?available|default (password|credential|account|login)|unauthenticated|path traversal|cross-site scripting|authori[sz]ation bypass/.test(
      txt,
    )
  )
    s += 2;
  if (f.sev === "info" || /banner|disclosure|header/.test(txt)) s -= 2;
  return s >= 3;
}
/* CISA KEV subset — campaign names + CVE IDs (offline, bundled) */

/* CISA KEV subset — campaign names + CVE IDs (offline, bundled) */
export var KEV_NAMES =
  /eternalblue|bluekeep|log4shell|log4j|proxyshell|proxylogon|proxynotshell|spring4shell|moveit|citrixbleed|citrix bleed|printnightmare|zerologon|follina|heartbleed|shellshock|pwnkit|dirty ?pipe|text4shell|confluence ognl|papercut|goanywhere|screenconnect|regresshion/i;

export var KEV_IDS = [
  "CVE-2017-0144",
  "CVE-2017-0145",
  "CVE-2019-0708",
  "CVE-2021-44228",
  "CVE-2021-45046",
  "CVE-2021-34473",
  "CVE-2021-34523",
  "CVE-2021-31207",
  "CVE-2021-26855",
  "CVE-2022-41040",
  "CVE-2022-41082",
  "CVE-2022-22965",
  "CVE-2023-34362",
  "CVE-2023-4966",
  "CVE-2021-34527",
  "CVE-2020-1472",
  "CVE-2022-30190",
  "CVE-2014-0160",
  "CVE-2014-6271",
  "CVE-2021-4034",
  "CVE-2022-0847",
  "CVE-2021-41773",
  "CVE-2021-42013",
  "CVE-2024-21762",
  "CVE-2023-27997",
  "CVE-2022-40684",
  "CVE-2023-20198",
  "CVE-2024-3400",
  "CVE-2023-46805",
  "CVE-2024-21887",
  "CVE-2023-22515",
  "CVE-2022-26134",
  "CVE-2023-27350",
  "CVE-2023-0669",
  "CVE-2024-1709",
  "CVE-2019-11510",
  "CVE-2019-19781",
  "CVE-2018-13379",
  "CVE-2020-5902",
  "CVE-2023-3519",
  "CVE-2021-22986",
  "CVE-2024-6387",
  "CVE-2017-5638",
  "CVE-2023-44487",
];

export function isKev(f) {
  var cv = (f.cves || []).map(function (c) {
    return String(c).toUpperCase();
  });
  if (cv.length)
    return cv.some(function (c) {
      return KEV_IDS.indexOf(c) >= 0;
    });
  /* no CVE on the finding: fall back to campaign names, but not for end-of-life / version notices */
  var t = f.name + " " + (f.desc || "");
  return (
    KEV_NAMES.test(t) &&
    !/end[- ]of[- ]life|unsupported version|\beol\b|detection|version info|installed/i.test(
      f.name,
    )
  );
}

/* OWASP Top 10 (2021) mapping for uploaded findings — first match wins */

/* OWASP Top 10 (2021) mapping for uploaded findings — first match wins */
export var OWASP_RULES = [
  [
    /sql injection|sqli|command injection|os command|ldap injection|xpath|cross-site scripting|xss|template injection|ssti|code injection|header injection|crlf/i,
    "A03 Injection",
  ],
  [
    /access control|authori[sz]ation|idor|bola|object level|path traversal|directory traversal|directory listing|csrf|cross-site request|cors|null session|privilege|forced browsing/i,
    "A01 Broken Access Control",
  ],
  [/ssrf|server-side request/i, "A10 SSRF"],
  [
    /deserial|integrity|unsigned|subresource|sri|ci\/cd|auto-?update/i,
    "A08 Integrity Failures",
  ],
  [
    /password|credential|authentication|brute|session fixation|default (root|admin|login|account)|unauthenticated|nla|mfa|2fa|login/i,
    "A07 Auth Failures",
  ],
  [
    /tls|ssl|cipher|certificate|crypt|hash|md5|sha-?1|hsts|plaintext|cleartext|weak key|key exchange|rc4|3des/i,
    "A02 Cryptographic Failures",
  ],
  [
    /outdated|end-of-life|eol|unsupported|vulnerable (component|version|software)|cve-|eternalblue|smbv1|version [^\n]*(is|are) vulnerable|patch|upgrade to/i,
    "A06 Vulnerable Components",
  ],
  [/logging|monitoring|audit log/i, "A09 Logging Failures"],
  [/business logic|rate limit|insecure design|captcha/i, "A04 Insecure Design"],
  [
    /header|banner|disclosure|misconfig|debug|stack trace|verbose|default page|x-frame|clickjack|cookie|options method|trace method|exposed|listing/i,
    "A05 Security Misconfiguration",
  ],
];

export function owaspOf(text) {
  var t = String(text || "");
  for (var i = 0; i < OWASP_RULES.length; i++)
    if ((OWASP_RULES[i][0] as any).test(t)) return OWASP_RULES[i][1];
  return "Unmapped";
}

/* End-of-life detection — named products + semver floor checks */

/* End-of-life detection — named products + semver floor checks */
export var EOL_VERSION_RULES = [
  /windows (xp|vista|7|8(\.1)?)\b/i,
  /windows server (2003|2008|2012)\b/i,
  /centos (5|6|7|8)\b/i,
  /red ?hat enterprise linux (5|6|7)\b|rhel ?(5|6|7)\b/i,
  /ubuntu (1[0-9]|20)\.(04|10)\b/i,
  /debian (7|8|9|10)\b|debian (wheezy|jessie|stretch|buster)/i,
  /php ([4-7]\.\d+|8\.0)\b/i,
  /python (2\.\d+|3\.[0-8])\b/i,
  /node(\.js)? v?(1[0-7]|[4-9])\b/i,
  /tomcat [5-8]\.\d/i,
  /apache (http server )?2\.[02]\b/i,
  /iis [5-7]\.\d/i,
  /openssl (0\.9|1\.0|1\.1)/i,
  /openssh [1-6]\./i,
  /mysql (5\.[0-7])\b/i,
  /mariadb 10\.[0-4]\b/i,
  /postgres(ql)? ([7-9]\.\d|1[0-2])\b/i,
  /mongodb [2-5]\.\d/i,
  /redis [2-5]\.\d/i,
  /elasticsearch [1-6]\.\d/i,
  /jquery (1\.\d+|2\.\d+|3\.[0-4])\b/i,
  /angular ?js/i,
  /java (6|7|8u?\d{0,3})(\s|$)/i,
  /\.net framework [1-4]\.[0-5]/i,
  /exchange (2010|2013)/i,
  /sql server (2005|2008|2012|2014)/i,
  /struts 2\.[0-4]/i,
  /spring (framework )?[1-4]\./i,
  /log4j 1\./i,
  /wordpress [1-5]\./i,
  /drupal [6-9]\b/i,
  /joomla [1-3]\./i,
  /vmware esxi [5-6]\./i,
  /cisco ios 1[0-4]\./i,
  /nginx 1\.(1?\d)\.\d+\b/i,
  /flash player/i,
  /internet explorer/i,
];

export var SEMVER_FLOORS = [
  [/php[\s\/-]?v?(\d+\.\d+)/i, "8.1"],
  [/node(?:\.js)?[\s\/-]?v?(\d+\.\d+)/i, "18.0"],
  [/python[\s\/-]?v?(\d+\.\d+)/i, "3.9"],
  [/ubuntu[\s\/-]?(\d+\.\d+)/i, "22.04"],
  [/debian[\s\/-]?(\d+)(?:\.\d+)?/i, "11"],
  [/postgres(?:ql)?[\s\/-]?v?(\d+(?:\.\d+)?)/i, "13"],
  [/mysql[\s\/-]?v?(\d+\.\d+)/i, "8.0"],
  [/openssl[\s\/-]?v?(\d+\.\d+)/i, "3.0"],
];

export function vcmp(a, b) {
  var x = String(a).split("."),
    y = String(b).split(".");
  for (var i = 0; i < Math.max(x.length, y.length); i++) {
    var d = (parseInt(x[i], 10) || 0) - (parseInt(y[i], 10) || 0);
    if (d) return d;
  }
  return 0;
}

export function isEol(f) {
  var t = f.name + " " + (f.desc || "");
  if (
    /end-of-life|end of life|\(eol\)|outdated|unsupported version|no longer supported/i.test(
      t,
    )
  )
    return true;
  if (
    EOL_VERSION_RULES.some(function (r) {
      return r.test(t);
    })
  )
    return true;
  return SEMVER_FLOORS.some(function (r) {
    var m = (r[0] as any).exec(t);
    return m && vcmp(m[1], r[1]) < 0;
  });
}

export function isRansom(f) {
  return /smbv1|eternalblue|remote desktop|rdp|default root|unauthenticated|ssl-vpn|pre-auth/i.test(
    f.name,
  );
}

export function effortOf(f) {
  var n = f.name.toLowerCase();
  if (/header|cookie|banner/.test(n)) return 2.2 + ((Number(f.cvss) || 0) % 1) * 0.6;
  if (/default|password|unauthenticated access|null session/.test(n))
    return 2.8;
  if (/tls|ssh|smbv1|cors/.test(n)) return 3.4;
  if (/remote desktop|csrf/.test(n)) return 4.2;
  if (/path traversal|ssl-vpn|eternalblue/.test(n)) return 4.8;
  if (/sql injection|cross-site scripting|zero-day/.test(n)) return 6.4;
  if (/authorization/.test(n)) return 7.1;
  if (/end-of-life|eol|outdated/.test(n)) return 7.8;
  return 5;
}

export function subnetOf(host) {
  var m = /^(\d+\.\d+\.\d+)\.\d+$/.exec(host);
  return m ? m[1] + ".0/24" : "External";
}

/* ---------- remediation snippets (spec §8) ---------- */

/* ---------- remediation snippets (spec §8) ---------- */
export var SNIPPETS = [
  [
    /hsts|x-frame|header/i,
    [
      {
        label: "Nginx",
        code: 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\nadd_header X-Frame-Options "DENY" always;\nadd_header Content-Security-Policy "frame-ancestors \'none\'" always;',
      },
      {
        label: "Apache",
        code: 'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"\nHeader always set X-Frame-Options "DENY"',
      },
      {
        label: "IIS",
        code: '<system.webServer>\n  <httpProtocol>\n    <customHeaders>\n      <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />\n    </customHeaders>\n  </httpProtocol>\n</system.webServer>',
      },
    ],
  ],
  [
    /tls|ssl self|certificate/i,
    [
      {
        label: "Nginx",
        code: "ssl_protocols TLSv1.2 TLSv1.3;\nssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384;\nssl_prefer_server_ciphers on;",
      },
      {
        label: "PowerShell",
        code: "foreach ($p in 'TLS 1.0','TLS 1.1') {\n  $k = \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\$p\\Server\"\n  New-Item $k -Force | Out-Null\n  Set-ItemProperty $k -Name Enabled -Value 0 -Type DWord\n}",
      },
    ],
  ],
  [
    /smb|eternalblue/i,
    [
      {
        label: "PowerShell",
        code: "Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart\nSet-SmbServerConfiguration -EnableSMB1Protocol $false -Force",
      },
      {
        label: "Samba",
        code: "[global]\n  min protocol = SMB2\n  restrict anonymous = 2",
      },
    ],
  ],
  [
    /cors/i,
    [
      {
        label: "Express",
        code: "const allowed = new Set(['https://app.internal.corp']);\napp.use((req, res, next) => {\n  const o = req.headers.origin;\n  if (o && allowed.has(o)) res.set('Access-Control-Allow-Origin', o);\n  next();\n});",
      },
    ],
  ],
  [
    /cookie|csrf/i,
    [
      {
        label: "Express",
        code: "app.use(session({\n  secret: process.env.SESSION_SECRET,\n  cookie: { httpOnly: true, secure: true, sameSite: 'strict' }\n}));",
      },
      {
        label: "Nginx",
        code: "proxy_cookie_flags ~ secure httponly samesite=strict;",
      },
    ],
  ],
  [
    /ssh/i,
    [
      {
        label: "sshd_config",
        code: "PermitRootLogin no\nPasswordAuthentication no\nKexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org\nCiphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com",
      },
    ],
  ],
  [
    /redis|mysql default|mongo/i,
    [
      {
        label: "Redis",
        code: "bind 127.0.0.1 ::1\nprotected-mode yes\nrequirepass <long-random-secret>",
      },
      {
        label: "MySQL",
        code: "ALTER USER 'root'@'localhost' IDENTIFIED BY '<long-random-secret>';\n-- my.cnf\nbind-address = 127.0.0.1",
      },
    ],
  ],
  [
    /sql injection/i,
    [
      {
        label: "Node (pg)",
        code: "const { rows } = await pool.query(\n  'SELECT * FROM orders WHERE id = $1',\n  [req.query.id]\n);",
      },
      {
        label: "Python",
        code: 'cur.execute("SELECT * FROM orders WHERE id = %s", (order_id,))',
      },
    ],
  ],
  [
    /cross-site scripting|xss/i,
    [
      {
        label: "DOMPurify",
        code: "import DOMPurify from 'dompurify';\nel.innerHTML = DOMPurify.sanitize(userHtml);\n// plain text: el.textContent = userText;",
      },
    ],
  ],
];

export function snippetFor(name) {
  for (var i = 0; i < SNIPPETS.length; i++)
    if ((SNIPPETS[i][0] as any).test(name)) return SNIPPETS[i][1];
  return null;
}

/* ---------- scanner presets (spec §2.1) ---------- */

/* ---------- scanner presets (spec §2.1) ---------- */
export var PRESETS = [
  {
    tool: "Tenable Nessus",
    sig: ["Plugin ID", "Plugin Name", "Risk", "CVE", "See Also"],
    map: {
      host: "Host",
      severity: "Risk",
      cvss: "CVSS",
      cve: "CVE",
      pluginId: "Plugin ID",
      name: "Plugin Name",
      solution: "Solution",
      port: "Port",
      protocol: "Protocol",
      description: "Description",
    },
  },
  {
    tool: "OpenVAS / Greenbone",
    sig: ["NVT", "OID", "Threat", "QoD"],
    map: {
      host: "IP",
      severity: "Threat",
      cvss: "CVSS",
      cve: "CVEs",
      pluginId: "OID",
      name: "NVT",
      description: "Summary",
      port: "Port",
    },
  },
  {
    tool: "Qualys VM",
    sig: ["QID", "Title", "Severity", "Solution"],
    map: {
      host: "IP",
      severity: "Severity",
      cvss: "CVSS_Base",
      pluginId: "QID",
      name: "Title",
      solution: "Solution",
    },
  },
  {
    tool: "Burp Suite",
    sig: [
      "Issue type",
      "Issue Detail",
      "Host",
      "Path",
      "Severity",
      "Confidence",
    ],
    map: {
      host: "Host",
      severity: "Severity",
      name: "Issue type",
      description: "Issue Detail",
      port: "Port",
      url: "Path",
    },
  },
  {
    tool: "OWASP ZAP",
    sig: ["Alert", "Risk", "CWE ID", "URL", "Confidence"],
    map: {
      host: "URL",
      severity: "Risk",
      name: "Alert",
      description: "Description",
      cwe: "CWE ID",
    },
  },
  {
    tool: "Nikto",
    sig: ["OSVDB", "Target IP", "Target Hostname", "URI"],
    map: {
      host: "Target Hostname",
      name: "Description",
      port: "Port",
      pluginId: "OSVDB",
    },
  },
  {
    tool: "Acunetix",
    sig: ["Vulnerability", "CVSS3", "CWE", "CVE", "Solution", "Plugin"],
    map: {
      host: "Host",
      severity: "Severity",
      cvss: "CVSS3",
      cve: "CVE",
      cwe: "CWE",
      name: "Vulnerability",
      solution: "Solution",
    },
  },
  {
    tool: "Wapiti",
    sig: [
      "module",
      "http_request",
      "http_response",
      "wstg",
      "references",
      "cwe",
    ],
    map: {
      severity: "severity",
      name: "name",
      cwe: "cwe",
    },
  },
  {
    tool: "Nuclei",
    sig: [
      "template-id",
      "info.name",
      "info.severity",
      "matched-at",
      "matcher-name",
    ],
    map: {
      host: "host",
      port: "port",
      name: "info.name",
      severity: "info.severity",
      url: "url",
      pluginId: "template-id",
    },
  },
  {
    tool: "Dependency-Check",
    sig: [
      "Vulnerable Software",
      "CVSSv2",
      "CVSSv3",
      "CWE",
      "Notes",
      "References",
    ],
    map: {
      name: "Vulnerable Software",
      severity: "Severity",
      cvss: "CVSSv3",
      cve: "CVE",
    },
  },
];

export var TOKENS = {
  host: ["host", "ip", "target", "address", "asset"],
  severity: [
    "sev",
    "risk",
    "threat",
    "priority",
    "level",
    "critical",
    "impact",
    "rating",
  ],
  cvss: ["cvss", "score"],
  name: ["name", "title", "alert", "issue", "vuln", "finding"],
  cve: ["cve"],
  cwe: ["cwe"],
  vector: ["vector"],
  port: ["port"],
  protocol: ["proto"],
  description: ["desc", "detail", "summary"],
  solution: ["sol", "remed", "fix"],
  pluginId: ["plugin", "qid", "oid"],
  url: ["url", "uri", "path"],
  scanDate: ["date", "time"],
};

export function detectTool(headers) {
  var H = headers.map(function (x) {
      return x.trim();
    }),
    best = null;
  PRESETS.forEach(function (p) {
    var m = p.sig.filter(function (s) {
      return H.indexOf(s) >= 0;
    }).length;
    if (m >= 2 && (!best || m > best.matched))
      best = {
        preset: p,
        matched: m,
        total: p.sig.length,
      };
  });
  return best;
}
/* Column guessing: exact names first, then whole-word matches — "Description" must never map to host because it contains "ip" */

/* Column guessing: exact names first, then whole-word matches — "Description" must never map to host because it contains "ip" */
export var EXACT = {
  host: [
    "host",
    "ip",
    "ip address",
    "hostname",
    "target",
    "asset",
    "fqdn",
    "dns name",
  ],
  severity: ["severity", "risk", "threat", "risk rating"],
  cvss: [
    "cvss v3.0 base score",
    "cvss3",
    "cvss v3 base score",
    "cvss",
    "cvss score",
    "score",
  ],
  name: [
    "name",
    "title",
    "plugin name",
    "vulnerability",
    "finding",
    "issue",
    "alert",
  ],
  cve: ["cve", "cves", "cve id"],
  cwe: ["cwe", "cwe id"],
  port: ["port"],
  protocol: ["protocol"],
  description: ["description", "synopsis", "details"],
  solution: ["solution", "remediation", "fix"],
  pluginId: ["plugin id", "plugin", "qid", "oid", "rule id", "template-id"],
  url: ["url", "uri", "path", "endpoint"],
  vector: ["cvss vector", "cvss3 vector", "vector"],
  scanDate: ["scan date", "date", "last seen", "first seen"],
};

export function guessMapping(headers) {
  var map = {},
    used = {};
  function take(f, h) {
    if (h && !used[h] && !map[f]) {
      map[f] = h;
      used[h] = 1;
    }
  }
  Object.keys(EXACT).forEach(function (f) {
    EXACT[f].forEach(function (n) {
      take(
        f,
        headers.find(function (h) {
          return h.trim().toLowerCase() === n;
        }),
      );
    });
  });
  Object.keys(TOKENS).forEach(function (f) {
    if (map[f]) return;
    var hit = headers.find(function (h) {
      if (used[h]) return false;
      var l = " " + h.toLowerCase().replace(/[^a-z0-9]+/g, " ") + " ";
      return TOKENS[f].some(function (t) {
        return t.length > 2
          ? l.indexOf(" " + t) >= 0
          : l.indexOf(" " + t + " ") >= 0;
      });
    });
    take(f, hit);
  });
  return map;
}

export function normSev(raw, cvss?) {
  var s = String(raw == null ? "" : raw)
    .trim()
    .toLowerCase();
  if (/^crit/.test(s)) return "critical";
  if (/^high|important/.test(s)) return "high";
  if (/^med|moderate/.test(s)) return "medium";
  if (/^low/.test(s)) return "low";
  if (/^info|none|log/.test(s) || s === "0") return "info";

  var n = parseFloat(s);
  var c = parseFloat(cvss);
  if (!isNaN(n) && String(n) === s) {
    if (n > 5 || s.indexOf('.') >= 0 || n === c) {
      if (n >= 9) return "critical";
      if (n >= 7) return "high";
      if (n >= 4) return "medium";
      if (n >= 1) return "low";
      return "info";
    } else {
      if (n === 5) return "critical";
      if (n === 4) return "high";
      if (n === 3) return "medium";
      if (n === 2) return "low";
      if (n === 1) return "info";
    }
  }

  if (c >= 9) return "critical";
  if (c >= 7) return "high";
  if (c >= 4) return "medium";
  if (c > 0) return "low";
  return "info";
}
