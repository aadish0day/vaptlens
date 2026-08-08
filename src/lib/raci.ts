import type { Finding } from "./types";

export const RACI_TEAMS = [
  "Server Team",
  "DevOps / Cloud",
  "Database DBAs",
  "SecOps",
  "Application Dev",
] as const;

export const RACI_ROLES = ["Responsible", "Accountable", "Consulted", "Informed"] as const;

export type RaciTeam = (typeof RACI_TEAMS)[number];
export type RaciRole = (typeof RACI_ROLES)[number];

export type RaciCounts = Record<RaciRole, number>;

export function buildRaciMatrix(findings: Finding[]): Map<RaciTeam, RaciCounts> {
  const matrix = new Map<RaciTeam, RaciCounts>();
  for (const t of RACI_TEAMS) {
    matrix.set(t, { Responsible: 0, Accountable: 0, Consulted: 0, Informed: 0 });
  }

  for (const f of findings) {
    if (!f.assignedTeam) continue;
    const row = matrix.get(f.assignedTeam);
    if (!row) continue;
    const role: RaciRole =
      f.raciRole ?? (f.assignedTeam === "Server Team" ? "Responsible" : "Accountable");
    row[role] += 1;
  }
  return matrix;
}
