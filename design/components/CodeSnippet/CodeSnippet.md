---
category: Data display
---
# CodeSnippet

The remediation patch box in the finding drawer: config or code fixes, with one tab per platform.

**Provide:** `tabs` (`[{label, code}]`, label names the platform: "Nginx", "Apache", "IIS", "PowerShell"), optional `title` ("Remediation").

- Set in `code` style (IBM Plex Mono 12.5/20) on `surface-200`; scrolls horizontally, never wraps config lines.
- Show the platform most likely for the host first (Windows host → PowerShell / IIS).
- Snippets are copy-ready: no placeholders except clearly marked `<your-origin>`-style tokens.
