import type {
  Aggregation,
  ChartType,
  FieldKey,
  FilterState,
  Finding,
  Severity,
  ScanBatch,
} from "./types";
import { findingRiskContribution } from "./risk";

type FieldValues = string | string[] | undefined;

function bucketOfCvss(cvss?: number): string | undefined {
  if (cvss === undefined || Number.isNaN(cvss)) return undefined;
  if (cvss >= 9.0) return "9.0–10.0";
  if (cvss >= 7.0) return "7.0–8.9";
  if (cvss >= 4.0) return "4.0–6.9";
  if (cvss > 0) return "0.1–3.9";
  return "0.0";
}

export function getFieldValue(f: Finding, field: FieldKey): FieldValues {
  switch (field) {
    case "severity":
      return f.severity;
    case "host":
      return f.host;
    case "tool":
      return f.tool;
    case "scanLabel":
      return f.scanLabel;
    case "port":
      return f.port;
    case "protocol":
      return f.protocol;
    case "cve":
      return f.cve;
    case "pluginId":
      return f.pluginId;
    case "name":
      return f.name;
    case "cvssBucket":
      return bucketOfCvss(f.cvss);
    case "scanDate":
      return f.scanDate ? f.scanDate.slice(0, 10) : undefined;
    case "lifecycle":
      return f.lifecycle ?? "New";
    case "slaStatus":
      return f.slaStatus ?? "Met";
    case "isExploitable":
      return f.isExploitable ?? "Not Exploitable";
    case "isEol":
      return f.isEol ?? "Supported";
    case "isZeroDay":
      return f.isZeroDay ?? "Known";
    case "unpatchedAge":
      return f.unpatchedAge ?? "Unpatched < 6 Months";
    case "url":
      return f.url;
    case "scanMonth": {
      if (!f.scanDate) return undefined;
      const date = new Date(f.scanDate);
      if (Number.isNaN(date.getTime())) return f.scanDate.slice(0, 7);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    case "cisaKev":
      return f.cisaKev ?? "Not in KEV";
    case "ransomwareVector":
      return f.ransomwareVector ?? "Standard Risk";
    case "publicExploit":
      return f.publicExploit ?? "No Public Exploit";
    case "owaspCategory":
      return f.owaspCategory;
    case "agingBucket":
      return f.agingBucket;
    case "subnet":
      return f.subnet;
    default:
      return undefined;
  }
}

function matchesValue(fieldValue: FieldValues, target: string): boolean {
  if (fieldValue === undefined) return false;
  if (Array.isArray(fieldValue)) return fieldValue.includes(target);
  return fieldValue === target;
}

function matchesSearch(f: Finding, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.toLowerCase();
  return (
    f.host.toLowerCase().includes(q) ||
    f.name.toLowerCase().includes(q) ||
    f.tool.toLowerCase().includes(q) ||
    (f.description?.toLowerCase().includes(q) ?? false) ||
    (f.pluginId?.toLowerCase().includes(q) ?? false) ||
    (f.cve?.some((c) => c.toLowerCase().includes(q)) ?? false)
  );
}

export function applyFilters(findings: Finding[], filters: FilterState): Finding[] {
  const { severities, hosts, tools, scanIds, ports, dateRange, search, crossFilters } =
    filters;

  const minDate = dateRange?.[0];
  const maxDate = dateRange?.[1];

  return findings.filter((f) => {
    if (severities.length && !severities.includes(f.severity)) return false;
    if (hosts.length && !hosts.includes(f.host)) return false;
    if (tools.length && !tools.includes(f.tool)) return false;
    if (scanIds.length && !scanIds.includes(f.scanId)) return false;
    if (ports.length && !(f.port && ports.includes(f.port))) return false;
    if (minDate || maxDate) {
      const d = f.scanDate ? f.scanDate.slice(0, 10) : "";
      if (minDate && (!d || d < minDate)) return false;
      if (maxDate && (!d || d > maxDate)) return false;
    }
    if (!matchesSearch(f, search)) return false;
    for (const cf of crossFilters) {
      if (!matchesValue(getFieldValue(f, cf.field), cf.value)) return false;
    }
    return true;
  });
}

interface AggInput {
  groupBy: FieldKey;
  colorBy?: FieldKey;
  aggregation: Aggregation;
  sortBy?: "value" | "label";
  topN?: number;
}

export interface AggRow {
  key: string;
  value: number;
  series: string;
}

export interface AggregateOutput {
  rows: AggRow[];
  series: string[];
  pivot: Array<Record<string, number | string>>;
}

const CVSS_BUCKETS = ["0.0", "0.1–3.9", "4.0–6.9", "7.0–8.9", "9.0–10.0"];
const SEVERITY_ORDER_INDEX: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Info: 4,
};

function computeMeasure(group: Finding[], agg: Aggregation, groupBy?: FieldKey): number {
  // If we are not grouping by lifecycle, filter out Fixed findings so they don't count in active metrics
  const activeGroup = groupBy === "lifecycle" ? group : group.filter(f => f.lifecycle !== "Fixed");

  switch (agg) {
    case "count":
      return activeGroup.length;
    case "avgCvss": {
      const vals = activeGroup.map((f) => f.cvss).filter((c): c is number => c !== undefined);
      if (!vals.length) return 0;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    case "maxCvss": {
      const vals = activeGroup.map((f) => f.cvss).filter((c): c is number => c !== undefined);
      return vals.length ? Math.max(...vals) : 0;
    }
    case "distinctHosts":
      return new Set(activeGroup.map((f) => f.host)).size;
    case "distinctFindings":
      return new Set(activeGroup.map((f) => f.name)).size;
  }
}

export function aggregate(filtered: Finding[], input: AggInput): AggregateOutput {
  const { groupBy, colorBy, aggregation, sortBy, topN } = input;

  // Build groups: key -> series -> findings
  const groups = new Map<string, Map<string, Finding[]>>();

  for (const f of filtered) {
    const gvals = getFieldValue(f, groupBy);
    const garr = Array.isArray(gvals) ? gvals : gvals ? [gvals] : ["(none)"];
    for (const g of garr) {
      if (!groups.has(g)) groups.set(g, new Map());
      const seriesMap = groups.get(g)!;
      const svals = colorBy ? getFieldValue(f, colorBy) : "";
      const sarr = colorBy ? (Array.isArray(svals) ? svals : svals ? [svals] : ["(none)"]) : [""];
      for (const s of sarr) {
        if (!seriesMap.has(s)) seriesMap.set(s, []);
        seriesMap.get(s)!.push(f);
      }
    }
  }

  const rows: AggRow[] = [];
  for (const [key, seriesMap] of groups) {
    for (const [series, items] of seriesMap) {
      rows.push({ key, series, value: computeMeasure(items, aggregation) });
    }
  }

  // Sort rows
  if (sortBy === "label") {
    rows.sort((a, b) => a.key.localeCompare(b.key) || a.series.localeCompare(b.series));
  } else {
    rows.sort((a, b) => b.value - a.value || a.key.localeCompare(b.key));
  }

  const series = colorBy
    ? Array.from(new Set(rows.map((r) => r.series))).sort((a, b) => a.localeCompare(b))
    : [];

  // Pivot for recharts: one row per group with a column per series
  const pivotMap = new Map<string, Record<string, number | string>>();
  for (const r of rows) {
    if (!pivotMap.has(r.key)) pivotMap.set(r.key, { key: r.key });
    const row = pivotMap.get(r.key)!;
    if (colorBy) {
      row[r.series] = (typeof row[r.series] === "number" ? (row[r.series] as number) : 0) + r.value;
    } else {
      row.value = r.value;
    }
  }
  let pivot = Array.from(pivotMap.values());
  if (sortBy === "label") {
    pivot.sort((a, b) => String(a.key).localeCompare(String(b.key)));
  } else {
    pivot.sort(
      (a, b) =>
        (Number(b.value) || 0) - (Number(a.value) || 0) || String(a.key).localeCompare(String(b.key))
    );
  }

  if (topN && pivot.length > topN) pivot = pivot.slice(0, topN);

  // Stable ordering for known ordinal fields
  if (groupBy === "cvssBucket") {
    pivot.sort(
      (a, b) => CVSS_BUCKETS.indexOf(String(a.key)) - CVSS_BUCKETS.indexOf(String(b.key))
    );
  } else if (groupBy === "severity") {
    pivot.sort(
      (a, b) =>
        SEVERITY_ORDER_INDEX[a.key as Severity] - SEVERITY_ORDER_INDEX[b.key as Severity]
    );
  } else if (groupBy === "agingBucket") {
    const order = ["0–30 Days", "31–90 Days", "91–180 Days", "180+ Days", "Remediated"];
    pivot.sort(
      (a, b) => order.indexOf(String(a.key)) - order.indexOf(String(b.key))
    );
  }

  return { rows, series, pivot };
}

export function aggregateGlobal(filtered: Finding[], aggregation: Aggregation, groupBy?: FieldKey): number {
  return computeMeasure(filtered, aggregation, groupBy);
}

export function supportedChartTypes(): ChartType[] {
  return ["bar", "donut", "line", "histogram", "table", "kpi"];
}

/* ---------------------------------------------------------------------------
   Enrichment heuristics — keyword patterns used by enrichFindings().
   All matching is case-insensitive over `name + description + solution`.
--------------------------------------------------------------------------- */

/** Signals that a product/version is end-of-life or no longer supported. */
const EOL_PATTERNS: RegExp[] = [
  /\beol\b/i,
  /end[- ]of[- ](life|support|service|sale)/i,
  /no longer (supported|maintained|updated|available)/i,
  /discontinued/i,
  /unsupported (version|release|software|product|os|firmware)/i,
  /obsolete/i,
  /outdated/i,
  /deprecated/i,
  /legacy/i,
  /old version/i,
  /reached end of/i,
  /past (its|the) (end|support|life)/i,
  /smbv1/i,
  /smb ?v1/i,
  /\bsslv[23]\b/i,
  /\bssl ?v[23]\b/i,
  /\btls ?1\.[01]\b/i,
  /weak (mac|hmac|cipher|encryption)/i,
  // Known-EOL OS editions
  /windows (xp|vista|7|8|8\.1|10|2000|server 2003|server 2008|server 2012)/i,
  /centos (6|7|8)/i,
  // Known-EOL software
  /internet explorer (6|7|8|9|10|11)/i,
  /php (4|5|7\.0)/i,
  /apache (1\.3|2\.0|2\.2)/i,
  /openssl (0\.9|1\.0|1\.1)/i,
  /java (6|7)(_|\.|$)/i,
  // Tomcat 9.x is still supported (EOL ~2028) — only flag 6|7|8.x and 10.0
  /tomcat (6|7|8|10\.0)(\.|$)/i,
  /jboss (4|5|6)/i,
  /exchange (2003|2007|2010|2013|2016)/i,
  /sql server (2000|2005|2008|2012)/i,
  /flash player/i,
  /silverlight/i,
  /angularjs/i,
  /coldfusion (11|2016)/i,
  /drupal (7|8)/i,
  /joomla (1|2|3)\./i,
  /magento (1|2\.[0-3])/i,
  /wordpress (4|5\.[0-2])(\.|$)/i,
];

/**
 * Structured version-range EOL checks. Cutoffs reflect vendor end-of-support
 * dates as of 2026; only versions that are clearly EOL are flagged so the
 * heuristic stays conservative. NOTE: these cutoffs go stale over time —
 * refresh this table periodically. `match` must capture major (group 1) and
 * optionally minor (group 2).
 */
const EOL_VERSION_RULES: {
  match: RegExp;
  isEol: (major: number, minor?: number) => boolean;
}[] = [
  {
    match: /\bphp\s+(\d+)\.(\d+)/i,
    // PHP 8.0 EOL Nov 2023, 8.1 EOL Dec 2025
    isEol: (maj, min) => maj < 8 || (maj === 8 && (min ?? 0) <= 1),
  },
  {
    match: /\bnode(?:\.?js)?\s+v?(\d+)/i,
    // Node <= 20 EOL by Apr 2026
    isEol: (maj) => maj <= 20,
  },
  {
    match: /\bpython\s+(\d+)\.(\d+)/i,
    // Python 3.9 EOL Oct 2025
    isEol: (maj, min) => maj < 3 || (maj === 3 && (min ?? 0) <= 9),
  },
  {
    match: /\bubuntu\s+(\d+)\.(\d+)/i,
    // Ubuntu 20.04 EOL May 2025; 22.04 LTS still supported (EOL Jun 2027).
    // Interim releases (e.g. 22.10) EOL quickly — conservatively ignored.
    isEol: (maj) => maj < 22,
  },
  {
    match: /\bdebian\s+(\d+)/i,
    // Debian 10 EOL Jun 2024
    isEol: (maj) => maj <= 10,
  },
  {
    match: /\bopenssl\s+(\d+)\.(\d+)/i,
    // OpenSSL 1.1.1 EOL Sep 2023
    isEol: (maj) => maj <= 1,
  },
  {
    match: /\bruby\s+(\d+)\.(\d+)/i,
    // Ruby 3.2 EOL Mar 2026
    isEol: (maj, min) => maj < 3 || (maj === 3 && (min ?? 0) <= 2),
  },
  {
    match: /\bpostgres(?:ql)?\s+(\d+)/i,
    // PostgreSQL 13 EOL Nov 2025
    isEol: (maj) => maj <= 13,
  },
  {
    match: /\bmysql\s+(\d+)\.(\d+)/i,
    // MySQL 8.0 EOL Apr 2026
    isEol: (maj, min) => maj < 8 || (maj === 8 && (min ?? 0) === 0),
  },
];

function matchesEolVersion(text: string): boolean {
  for (const rule of EOL_VERSION_RULES) {
    const m = text.match(rule.match);
    if (!m) continue;
    const major = Number(m[1]);
    const minor = m[2] !== undefined ? Number(m[2]) : undefined;
    if (rule.isEol(major, minor)) return true;
  }
  return false;
}

/** High-confidence signals that a finding is likely actively exploitable. */
const EXPLOIT_STRONG_PATTERNS: RegExp[] = [
  /(remote )?code execution/i,
  /\brce\b/i,
  /arbitrary (code|file|command|script)/i,
  /(unrestricted|arbitrary|malicious) (file )?upload/i,
  /file upload (vulnerability|to web root|web shell|allows|permitted)/i,
  /command injection/i,
  /sql injection/i,
  /\bsqli\b/i,
  /xss/i,
  /cross[- ]site scripting/i,
  /traversal/i,
  /\bbola\b/i,
  /\bidor\b/i,
  /\bcsrf\b/i,
  /\bssrf\b/i,
  /weak credential/i,
  /default (password|account|credential)/i,
  /backdoor/i,
  /eternalblue/i,
  /ms17-010/i,
  /log4shell/i,
  /shellshock/i,
  /heartbleed/i,
  /bluekeep/i,
  /zerologon/i,
  /proxy(logon|shell)/i,
  /printnightmare/i,
  /poodle/i,
  /\bbeast\b/i,
  /deserialization/i,
  /authentication bypass/i,
  /privilege escalation/i,
  /metasploit/i,
  /public exploit/i,
  /proof[- ]of[- ]concept/i,
  /\bpoc\b/i,
  /weaponized/i,
  /in the wild/i,
];

/** Lower-confidence signals that weakly suggest exploitability. */
const EXPLOIT_MODERATE_PATTERNS: RegExp[] = [
  /injection/i,
  /exploit/i,
  /malicious/i,
  /drown/i,
  /freak/i,
];

/**
 * Passive / hardening / informational signals that suppress exploitability.
 * NOTE: several patterns (e.g. /configuration/i) are deliberately broad —
 * they are only applied when a finding has NO CVE and NO exploit keyword
 * (see isExploitableFinding), so real vulnerabilities are never downgraded.
 */
const INFO_PATTERNS: RegExp[] = [
  /information disclosure/i,
  /info disclosure/i,
  /banner (disclosure|grabbing|revealed)/i,
  /version disclosure/i,
  /self[- ]signed/i,
  /certificate (expir|valid)/i,
  /missing (header|httponly|secure attribute|flag)/i,
  /\bhsts\b/i,
  /cookie (missing|without|not set|secure)/i,
  /http (security )?header/i,
  /(password|security|group|account) policy/i,
  /compliance/i,
  /best practice/i,
  /configuration/i,
  /enumeration/i,
  /fingerprint/i,
  /os detection/i,
  /service detection/i,
  /debug (mode|enabled)/i,
  /verbose (error|messages?)/i,
  /stack trace/i,
  /deprecated/i,
  /outdated/i,
  /legacy/i,
  /\beol\b/i,
  /obsolete/i,
  /unsupported/i,
  /port (scan|scanning)/i,
  /network (scan|scanning)/i,
  /\btls ?1\.[01]\b/i,
  /\bssl ?(v[23]|[23])\b/i,
  /weak (cipher|mac|encryption|protocol)/i,
  /signing not required/i,
  /smtp (banner|command|protocol)/i,
  /directory (listing|index)/i,
  /http (trace|options|method)/i,
  /clickjacking/i,
  /x[- ]frame[- ]options/i,
  /content[- ]type/i,
  /charset/i,
  /session (cookie|name|token)/i,
  /default (page|settings|config)/i,
  /error page/i,
];

/**
 * Score-based exploitability estimate.
 *
 *   +2  known CVE identifiers present
 *   +2  CVSS >= 9.0
 *   +1  CVSS >= 4.0
 *   +2  strong exploit keyword matched
 *   +1  moderate exploit keyword matched
 *   -2  informational / hardening signal matched (only when no CVE or
 *       exploit keyword is present, so real vulns aren't downgraded)
 *
 * A finding is considered exploitable at score >= 3.
 */
function computeExploitability(
  f: Finding,
  text: string
): { label: "Exploitable" | "Not Exploitable"; score: number } {
  const cvss = f.cvss ?? 0;
  const hasCve = (f.cve?.length ?? 0) > 0;
  const hasStrong = EXPLOIT_STRONG_PATTERNS.some((r) => r.test(text));
  const hasModerate = EXPLOIT_MODERATE_PATTERNS.some((r) => r.test(text));
  const hasExploit = hasStrong || hasModerate;
  const hasInfo = INFO_PATTERNS.some((r) => r.test(text));

  let score = 0;
  if (hasCve) score += 2;
  if (cvss >= 9) score += 2;
  else if (cvss >= 4) score += 1;
  if (hasStrong) score += 2;
  else if (hasModerate) score += 1;
  if (hasInfo && !hasCve && !hasExploit) score -= 2;

  // Clamp so the stored confidence is never negative (doc: "0+").
  return { label: score >= 3 ? "Exploitable" : "Not Exploitable", score: Math.max(0, score) };
}

/**
 * Ordered OWASP Top 10 (2021) classification rules — order is significant;
 * the first rule whose patterns match wins (e.g. A02 Crypto precedes A06
 * Outdated, so an "OpenSSL 1.0 / TLS 1.0" EOL finding classifies as A02).
 */
const OWASP_RULES: { category: string; patterns: RegExp[] }[] = [
  {
    category: "A03:2021-Injection",
    patterns: [
      /sql injection/i,
      /\bsqli\b/i,
      /command injection/i,
      /os command/i,
      /ldap injection/i,
      /xpath injection/i,
      /no[s]?ql injection/i,
      /template injection/i,
      /\bssti\b/i,
      /xml injection/i,
      /formula injection/i,
      /cross[- ]site scripting/i,
      /\bxss\b/i,
      /html injection/i,
      /(remote )?code execution/i,
      /\brce\b/i,
      /arbitrary code/i,
      /injection/i,
    ],
  },
  {
    category: "A10:2021-SSRF",
    patterns: [/\bssrf\b/i, /server[- ]side request forgery/i],
  },
  {
    category: "A08:2021-Software and Data Integrity Failures",
    patterns: [
      /deserialization/i,
      /(insecure )?serialization/i,
      /signature (verification|check|bypass)/i,
      /unsigned (update|code|installer|package)/i,
      /integrity (check|verification|failure)/i,
      /supply chain/i,
      /dependency confusion/i,
      /insecure (update|plugin|installer|package)/i,
      /\bjwt\b/i,
      /token (signature|verification)/i,
    ],
  },
  {
    category: "A01:2021-Broken Access Control",
    patterns: [
      /\bbola\b/i,
      /broken object[- ]level/i,
      /\bbrola\b/i,
      /\bidor\b/i,
      /insecure direct object/i,
      /access control/i,
      /authorization/i,
      /unauthorized (access|resource)/i,
      /privilege escalation/i,
      /forced browsing/i,
      /mass assignment/i,
      /path traversal/i,
      /directory traversal/i,
      /\blfi\b/i,
      /\brfi\b/i,
      /cross[- ]origin resource sharing/i,
      /\bcors\b/i,
      /\bcsrf\b/i,
      /cross[- ]site request forgery/i,
    ],
  },
  {
    category: "A07:2021-Identification and Authentication Failures",
    patterns: [
      /default (account|password|credential|username)/i,
      /empty (root )?password/i,
      /weak (password|credential|authentication)/i,
      /password (policy|strength|complexity|reuse)/i,
      /session (fixation|hijacking|management)/i,
      /logout/i,
      /captcha/i,
      /credential stuffing/i,
      /brute[- ]?force/i,
      /admin session/i,
      /null session/i,
      /anonymous (access|login|authentication)/i,
      /authentication (bypass|failure|weak)/i,
    ],
  },
  {
    category: "A02:2021-Cryptographic Failures",
    patterns: [
      /\bssl\b/i,
      /\btls\b/i,
      /cryptograph/i,
      /encryption/i,
      /cipher/i,
      /self[- ]signed/i,
      /certificate (expir|valid)/i,
      /\bbeast\b/i,
      /sweet32/i,
      /\bpoodle\b/i,
      /drown/i,
      /freak/i,
      /logjam/i,
      /\bmd5\b/i,
      /\bsha[- ]?1\b/i,
      /weak (mac|cipher|hash|encryption|randomness|protocol)/i,
      /plaintext/i,
      /\brc4\b/i,
      /\bssl ?v[23]\b/i,
      /\btls ?1\.[01]\b/i,
      /in transit/i,
    ],
  },
  {
    category: "A04:2021-Insecure Design",
    patterns: [
      /insecure design/i,
      /rate limit/i,
      /business logic/i,
      /design (flaw|weakness)/i,
      /security by (obscurity|design)/i,
      /lack of (threat|security) (model|design)/i,
      /client[- ]side (validation|trust|control)/i,
      /insecure (default|pattern|feature)/i,
      /insufficient (input )?validation/i,
    ],
  },
  {
    category: "A06:2021-Vulnerable and Outdated Components",
    patterns: [
      /\beol\b/i,
      /end[- ]of[- ](life|support|service)/i,
      /outdated/i,
      /deprecated/i,
      /obsolete/i,
      /legacy/i,
      /unsupported/i,
      /no longer supported/i,
      /old version/i,
      /discontinued/i,
      /smbv1/i,
      /eternalblue/i,
      /vulnerable (component|version|software|plugin)/i,
      /known (vulnerable|affected) version/i,
    ],
  },
  {
    category: "A09:2021-Security Logging and Monitoring Failures",
    patterns: [
      /stack trace/i,
      /information disclosure/i,
      /info disclosure/i,
      /banner disclosure/i,
      /\bleakage\b/i,
      /verbose (error|messages?)/i,
      /(insufficient|missing|no) (logging|monitoring|audit)/i,
      /audit (log|trail|record)/i,
      /error (handling|messages?|reporting)/i,
    ],
  },
  {
    category: "A05:2021-Security Misconfiguration",
    patterns: [
      /misconfiguration/i,
      /default configuration/i,
      /default settings/i,
      /directory (listing|index)/i,
      /open (port|service)/i,
      /unnecessary (service|feature)/i,
      /missing (header|httponly|secure attribute|flag|x[- ]frame)/i,
      /\bhsts\b/i,
      /x[- ]frame[- ]options/i,
      /x[- ]content[- ]type[- ]options/i,
      /xxe/i,
      /xml external entit/i,
      /error page/i,
      /debug (mode|enabled)/i,
      /sample (file|page|app)/i,
      /backup file/i,
      /phpinfo/i,
      /http (trace|options|method|verb)/i,
      /signing not required/i,
      /cookie (missing|without|not set|secure attribute)/i,
      /session cookie/i,
      /smtp (banner|command|protocol|header)/i,
    ],
  },
];

export function enrichFindings(findings: Finding[], batches: ScanBatch[]): Finding[] {
  if (findings.length === 0) return [];

  // Sort batches chronologically
  const sortedBatches = [...batches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Reference/latest scan date
  const latestScanDateStr =
    sortedBatches.length > 0
      ? sortedBatches[sortedBatches.length - 1].date
      : new Date().toISOString().slice(0, 10);
  const latestTime = new Date(latestScanDateStr).getTime();

  // Keyword maps for zero-day detection
  const zeroDayKeywords = [
    /zero-day/i,
    /0-day/i,
    /zero day/i,
    /0day/i,
    /unpatched vulnerability/i,
  ];

  // Map to store first scan where a vulnerability key appeared
  // key: host|name|port|protocol|tool -> first scan details
  const vulnHistory = new Map<string, { firstScanDate: string; firstScanId: string }>();

  // Sort all findings chronologically based on their scan's date or scanDate field
  // Group findings by scanId
  const findingsByScan = new Map<string, Finding[]>();
  for (const f of findings) {
    // Exclude existing synthesized Fixed findings from reprocessing
    if (f.lifecycle === "Fixed") continue;
    if (!findingsByScan.has(f.scanId)) {
      findingsByScan.set(f.scanId, []);
    }
    findingsByScan.get(f.scanId)!.push(f);
  }

  // Track history batch by batch in chronological order
  for (const batch of sortedBatches) {
    const scanFindings = findingsByScan.get(batch.id) || [];
    const batchDate = batch.date;

    for (const f of scanFindings) {
      const fDate = f.scanDate ? f.scanDate.slice(0, 10) : batchDate;
      const key = `${f.host}|${f.name}|${f.port ?? ""}|${f.protocol ?? ""}|${f.tool}`;

      if (!vulnHistory.has(key)) {
        vulnHistory.set(key, { firstScanDate: fDate, firstScanId: batch.id });
      }
    }
  }

  // Build enriched findings list
  const enriched: Finding[] = [];

  // Enrich existing findings (excluding synthesized Fixed ones)
  const activeFindings = findings.filter(f => f.lifecycle !== "Fixed");
  for (const f of activeFindings) {
    const batch = batches.find((b) => b.id === f.scanId);
    const batchDate = batch?.date || latestScanDateStr;
    const fDateStr = f.scanDate ? f.scanDate.slice(0, 10) : batchDate;
    const fDate = new Date(fDateStr);
    const key = `${f.host}|${f.name}|${f.port ?? ""}|${f.protocol ?? ""}|${f.tool}`;

    // SLA Calculation
    // Critical: 14, High: 30, Medium: 90, Low: 180, Info: 360
    const ageInDays = Math.max(
      0,
      Math.floor((latestTime - fDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    let slaLimit = 90;
    if (f.severity === "Critical") slaLimit = 14;
    else if (f.severity === "High") slaLimit = 30;
    else if (f.severity === "Medium") slaLimit = 90;
    else if (f.severity === "Low") slaLimit = 180;
    else if (f.severity === "Info") slaLimit = 360;

    const slaStatus = ageInDays > slaLimit ? "Breached" : "Met";
    const unpatchedAge = ageInDays > 180 ? "Unpatched > 6 Months" : "Unpatched < 6 Months";

    // SLA deadline projection: first-seen date + severity target days
    const slaDeadlineDate = new Date(fDate);
    slaDeadlineDate.setDate(slaDeadlineDate.getDate() + slaLimit);
    const slaDeadline = slaDeadlineDate.toISOString().slice(0, 10);
    const slaDaysLeft = slaLimit - ageInDays;

    // Exploitability / EOL — scored keyword + CVSS heuristics
    const nameDesc = `${f.name} ${f.description ?? ""} ${f.solution ?? ""}`;
    const { label: isExploitable, score: exploitabilityScore } =
      computeExploitability(f, nameDesc);

    // EOL — keyword signals plus structured version-range checks
    const isEol =
      EOL_PATTERNS.some((r) => r.test(nameDesc)) || matchesEolVersion(nameDesc)
        ? "EOL/Obsolete"
        : "Supported";

    // Zero-day
    const isZeroDay =
      zeroDayKeywords.some((r) => r.test(nameDesc)) ||
      (f.cve && f.cve.some((c) => c.includes("2026") || c.includes("9999") || c.toLowerCase().includes("zero")))
        ? "Zero-day"
        : "Known";

    // Lifecycle: compare this finding's scanDate/scanId with the first time it appeared
    const hist = vulnHistory.get(key);
    let lifecycle: "New" | "Open" | "Fixed" = "New";
    if (hist && hist.firstScanId !== f.scanId) {
      lifecycle = "Open";
    }

    // New Computed Fields
    let agingBucket = "0–30 Days";
    if (ageInDays > 180) agingBucket = "180+ Days";
    else if (ageInDays > 90) agingBucket = "91–180 Days";
    else if (ageInDays > 30) agingBucket = "31–90 Days";

    const owaspCategory = getOwaspCategory(f);
    const subnet = getSubnet(f.host);

    // Threat Intelligence Fields
    const cisaKevKeywords = [
      /cisa/i, /kev/i, /log4shell/i, /eternalblue/i, /ms17-010/i, /proxyshell/i,
      /proxylogon/i, /spring4shell/i, /moveit/i, /citrixbleed/i, /heartbleed/i,
      /bluekeep/i, /zerologon/i, /printnightmare/i, /f5 big-ip/i, /confluence rce/i
    ];
    const cisaKev = (
      cisaKevKeywords.some((r) => r.test(nameDesc)) ||
      (f.cvss !== undefined && f.cvss >= 9.0 && isExploitable === "Exploitable")
    ) ? "CISA KEV" : "Not in KEV";

    const ransomwareKeywords = [
      /smbv1/i, /eternalblue/i, /ms17-010/i, /remote code execution/i, /\brce\b/i,
      /default (password|credentials)/i, /unauthenticated/i, /vpn/i, /rdp/i, /proxyshell/i
    ];
    const ransomwareVector = ransomwareKeywords.some((r) => r.test(nameDesc))
      ? "Ransomware Threat"
      : "Standard Risk";

    const exploitKeywords = [
      /metasploit/i, /proof[- ]of[- ]concept/i, /\bpoc\b/i, /public exploit/i,
      /nuclei/i, /exploit-db/i, /weaponized/i, /in the wild/i
    ];
    const publicExploit = (
      exploitKeywords.some((r) => r.test(nameDesc)) ||
      isExploitable === "Exploitable"
    ) ? "Public Exploit (PoC/Metasploit)" : "No Public Exploit";

    enriched.push({
      ...f,
      lifecycle,
      slaStatus,
      isExploitable,
      exploitabilityScore,
      isEol,
      isZeroDay,
      unpatchedAge,
      owaspCategory,
      agingBucket,
      subnet,
      cisaKev,
      ransomwareVector,
      publicExploit,
      slaDeadline,
      slaDaysLeft,
      extractedVersion: extractVersion(f.name),
      riskContribution: findingRiskContribution({
        ...f,
        lifecycle,
        slaStatus,
        isExploitable,
        isEol,
        isZeroDay,
        unpatchedAge,
        cisaKev,
        ransomwareVector,
      }),
      occurrenceCount: 1,
      affectedUrls: f.url ? [f.url] : [],
      affectedPorts: f.port ? [f.port] : [],
      toolsDetected: [f.tool],
    });
  }

  // Synthesize "Fixed" findings
  // For each chronologically consecutive pair of batches:
  // if a vuln key is present in batch B_i but absent in batch B_{i+1}, then it is Fixed in B_{i+1}!
  for (let i = 0; i < sortedBatches.length - 1; i++) {
    const currentBatch = sortedBatches[i];
    const nextBatch = sortedBatches[i + 1];

    const currentFindings = findingsByScan.get(currentBatch.id) || [];
    const nextFindings = findingsByScan.get(nextBatch.id) || [];

    const nextKeys = new Set(
      nextFindings.map((f) => `${f.host}|${f.name}|${f.port ?? ""}|${f.protocol ?? ""}|${f.tool}`)
    );

    for (const f of currentFindings) {
      const key = `${f.host}|${f.name}|${f.port ?? ""}|${f.protocol ?? ""}|${f.tool}`;
      if (!nextKeys.has(key)) {
        // This vulnerability is fixed in the next batch!
        const placeholderId = `fixed-${currentBatch.id}-${nextBatch.id}-${f.id}`;
        enriched.push({
          ...f,
          id: placeholderId,
          scanId: nextBatch.id,
          scanLabel: nextBatch.label,
          scanDate: nextBatch.date,
          lifecycle: "Fixed",
          slaStatus: "Met",
          isExploitable: "Not Exploitable",
          exploitabilityScore: 0,
          isEol: "Supported",
          isZeroDay: "Known",
          unpatchedAge: "Unpatched < 6 Months",
          owaspCategory: getOwaspCategory(f),
          agingBucket: "Remediated",
          subnet: getSubnet(f.host),
        });
      }
    }
  }

  return enriched;
}

function getOwaspCategory(f: Finding): string {
  const text = `${f.name} ${f.description ?? ""} ${f.solution ?? ""}`;
  for (const rule of OWASP_RULES) {
    if (rule.patterns.some((re) => re.test(text))) return rule.category;
  }
  return "A05:2021-Security Misconfiguration";
}

/**
 * Extracts a product + version string from a finding name when one is
 * recognizable (e.g. "Apache 2.4.41" or "OpenSSL 1.1.1n"). Returns
 * undefined when no version is present.
 */
const VERSION_PATTERN =
  /\b((?:apache|nginx|iis|tomcat|jboss|php|openssl|open ?ssh|java|python|node(?:js)?|mysql|mariadb|postgres(?:ql)?|redis|mongodb|wordpress|drupal|joomla|magento|ruby|perl|bash|exim|proftpd|vsftpd|openssh)\s+(?:server\s+)?v?\d+(?:\.\d+){0,3})\b/i;

function extractVersion(name: string): string | undefined {
  const m = name.match(VERSION_PATTERN);
  return m ? m[1] : undefined;
}

function getSubnet(host: string): string {
  const ipRegex = /^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/;
  const match = host.match(ipRegex);
  if (match) {
    return `${match[1]}.x /24`;
  }
  if (host.includes(".") && !host.match(/^\d/)) {
    return "External Assets";
  }
  return "Localhost / Internal";
}

export function deduplicateFindings(findings: Finding[]): Finding[] {
  const map = new Map<string, Finding>();

  for (const f of findings) {
    const normName = f.name.trim().toLowerCase().replace(/https?:\/\/[^\s]+/g, "");
    const key = `${f.host}|${normName}`;

    if (!map.has(key)) {
      map.set(key, {
        ...f,
        occurrenceCount: 1,
        affectedUrls: f.url ? [f.url] : [],
        affectedPorts: f.port ? [f.port] : [],
        toolsDetected: [f.tool],
      });
    } else {
      const existing = map.get(key)!;
      existing.occurrenceCount = (existing.occurrenceCount ?? 1) + 1;
      if (f.url && !existing.affectedUrls?.includes(f.url)) {
        existing.affectedUrls = [...(existing.affectedUrls ?? []), f.url];
      }
      if (f.port && !existing.affectedPorts?.includes(f.port)) {
        existing.affectedPorts = [...(existing.affectedPorts ?? []), f.port];
      }
      if (f.tool && !existing.toolsDetected?.includes(f.tool)) {
        existing.toolsDetected = [...(existing.toolsDetected ?? []), f.tool];
      }
      if ((f.cvss ?? 0) > (existing.cvss ?? 0)) {
        existing.cvss = f.cvss;
      }
    }
  }

  return Array.from(map.values());
}

