---
category: Charts
---
# TopologyMap

The radial subnet topology on the Network Map view: scanner core, /24 subnets on the first ring, hosts clustered around each subnet.

**Provide:** `subnets` (`[{name, hosts: [{ip, count, severity}]}]`), optional `selected` (ip), `onSelect(ip)`.

- Geometry from the spec: core at (320, 240), subnets on R₁ 125, hosts on R₂ 45. Host radius = min(12, 6 + log₂(count + 1) × 2).
- Host fill is its worst severity. The selected host gets a `chart-selected` ring and the rest dim.
- Core-to-subnet links pulse with a moving dash (static under reduced motion). Hosts are keyboard-focusable buttons with full labels.
- Opens the node intelligence sidebar (`Drawer`) on select.
