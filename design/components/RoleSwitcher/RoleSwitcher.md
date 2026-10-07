---
category: Governance
---
# RoleSwitcher

The simulated RBAC role picker in the header menu, plus the Administrator-only 2FA toggle.

**Provide:** `value` + `onChange` (or uncontrolled), optional `twoFactor`.

- Roles and their scope: Administrator (everything, including 2FA), Remediation Lead (remediate, assign, raise tickets), Security Auditor (read-only).
- Switching role immediately updates every `Button restricted`, `TeamPicker readOnly` and Kanban move control.
- For non-Administrators the 2FA control is `restricted`, with its reason shown.
