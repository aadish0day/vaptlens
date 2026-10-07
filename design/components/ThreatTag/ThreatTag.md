---
category: Status
---
# ThreatTag

Outlined micro-tags for threat-intel attributes on findings and hosts.

**Provide:** `kind` (`kev` | `zeroday` | `ransomware` | `exploitable` | `eol` | `breached`), optional `label` override.

- Each tag carries an icon plus its word: flame = CISA KEV, zap = Zero-day, skull = Ransomware, shield = Exploitable, clock = EOL / SLA Breached.
- Place after the finding title or in the host leaderboard's telemetry row; at most four per row, in the order KEV, Zero-day, Ransomware, Exploitable, EOL, Breached.
- Outlined, so they stay quieter than the filled `SeverityBadge` beside them.
