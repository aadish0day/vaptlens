import type { EnterpriseRole } from "./types";

/** Governance actions that can be role-gated in the UI. */
export type GovernanceAction =
  | "remediate" // mark findings fixed / remediate all
  | "assign" // assign a finding to a team + RACI role
  | "ticket" // raise a Jira/GitHub patch ticket
  | "toggle2fa"; // enable/disable simulated 2FA

const ROLE_ACTIONS: Record<EnterpriseRole, GovernanceAction[]> = {
  Administrator: ["remediate", "assign", "ticket", "toggle2fa"],
  "Remediation Lead": ["remediate", "assign", "ticket"],
  "Security Auditor": [], // read-only
};

export function canPerform(
  role: EnterpriseRole,
  action: GovernanceAction
): boolean {
  return ROLE_ACTIONS[role].includes(action);
}
