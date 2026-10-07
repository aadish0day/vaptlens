import React from 'react';
import { Button } from 'vaptlens';

const row = { display: 'flex', flexWrap: 'wrap' as const, gap: 'var(--space-3)', alignItems: 'center' };

export const Variants = () => (
  <div style={row}>
    <Button variant="primary" icon="upload">Upload scan</Button>
    <Button>Export PDF</Button>
    <Button variant="ghost">Clear all</Button>
    <Button variant="danger">Remediate all</Button>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <Button variant="primary" size="sm">Small</Button>
    <Button variant="primary" size="md">Medium</Button>
    <Button variant="primary" size="lg">Load demo scan data</Button>
  </div>
);

export const Restricted = () => (
  <div style={row}>
    <Button restricted restrictedReason="Security Auditors have read-only access.">Raise ticket</Button>
    <Button variant="primary" icon="ticket">Raise ticket</Button>
  </div>
);
