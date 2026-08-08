import type { Finding, Severity } from "./types";

/** Baseline severity weight used in risk scoring. */
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  Critical: 10,
  High: 7,
  Medium: 5,
  Low: 3,
  Info: 1,
};

/**
 * Weighted risk contribution of a single active finding.
 * Multipliers stack across exploitability, threat intel (CISA KEV,
 * zero-day, ransomware), EOL status, SLA breach, and unpatched age.
 * Fixed findings contribute 0.
 */
export function findingRiskContribution(f: Finding): number {
  if (f.lifecycle === "Fixed") return 0;
  const base = SEVERITY_WEIGHT[f.severity] + (f.cvss ?? 0);
  let score = base;
  if (f.isExploitable === "Exploitable") score *= 1.6;
  if (f.cisaKev === "CISA KEV") score *= 1.5;
  if (f.isZeroDay === "Zero-day") score *= 1.4;
  if (f.ransomwareVector === "Ransomware Threat") score *= 1.3;
  if (f.isEol === "EOL/Obsolete") score *= 1.2;
  if (f.slaStatus === "Breached") score *= 1.25;
  if (f.unpatchedAge === "Unpatched > 6 Months") score *= 1.1;
  return Math.round(score * 100) / 100;
}
