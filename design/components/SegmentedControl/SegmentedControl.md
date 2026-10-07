---
category: Filtering
---
# SegmentedControl

Single-choice pill group for date presets and small mode switches (Stacked / Grouped, Chart / Table).

**Provide:** `options` (default `7 days · 15 days · 30 days · 6 months · All`), `value` + `onChange` (or `defaultValue`), `label` (the accessible name of the group).

- Use at most five options; beyond that use `MultiSelect`.
- Note: the spec's "30 Weeks" preset reads as a typo for 30 days. This system uses "30 days", so confirm before coding.
