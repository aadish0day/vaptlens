import React from 'react';
import { EmptyState, Button } from 'vaptlens';

const box = { border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', background: 'var(--surface-100)', minWidth: 280, maxWidth: 360 };

export const NoResults = () => (
  <div style={box}>
    <EmptyState title="No findings match the current filters." action={<Button variant="ghost" size="sm">Clear filters</Button>} />
  </div>
);

export const FirstRun = () => (
  <div style={box}>
    <EmptyState
      title="Load a scan to start."
      hint="CSV from Nessus, OpenVAS, Qualys, Burp, ZAP and 5 more. Nothing leaves this browser."
      action={<Button variant="primary" size="sm">Load demo scan data</Button>}
    />
  </div>
);
