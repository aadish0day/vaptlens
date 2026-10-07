---
category: Data display
---
# BreachList

The Top Critical Breach headline: the 10 highest-risk exploitable findings, ranked.

**Provide:** `items` (`[{title, host, risk, tags}]`, pre-sorted by the compound risk score).

- The rank is in a mono square, with #1 on `sev-critical-soft`. The risk score is right-aligned in `sev-critical`. Threat tags show why it ranks: KEV, Zero-day, Ransomware.
- It lives in the pinned breach-headline row (non-draggable `WidgetCard`) beside `ExposureBars`.
