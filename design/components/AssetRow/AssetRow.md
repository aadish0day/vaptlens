---
category: Data display
---
# AssetRow

One host in the Asset Inventory list: device type, OS, EOL, tier, owner team, open severity counts and risk score.

**Provide:** `host`, `device` (Database | API Gateway | Domain Controller | Web Server | Server | Workstation), `os`, `eol`, `tier`, `owner`, `counts` (`{critical, high, medium}`), `score`, `onClick` (opens the host `Drawer`, deep-linked `?host=<ip>`).

- Only Critical, High and Medium counts are shown here. Below `bp-md` the row keeps the icon, host and score.
- Sort by score descending by default.
