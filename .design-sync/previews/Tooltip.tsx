import React from 'react';
import { Tooltip, Button } from 'vaptlens';

// Tooltips open on hover/focus; autoFocus shows the open state in a static preview.
export const Top = () => (
  <div style={{ paddingTop: 48, paddingLeft: 48 }}>
    <Tooltip content="CVSS 9.8 · NVD base score">
      <Button size="sm" autoFocus>9.8</Button>
    </Tooltip>
  </div>
);

export const Bottom = () => (
  <div style={{ paddingBottom: 48, paddingLeft: 48 }}>
    <Tooltip content="Opens NVD in a new tab" side="bottom">
      <Button variant="ghost" size="sm" autoFocus>CVE-2021-41773</Button>
    </Tooltip>
  </div>
);
