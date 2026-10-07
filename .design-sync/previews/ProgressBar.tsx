import React from 'react';
import { ProgressBar } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const col = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-4)', maxWidth: 420 };

export const States = () => (
  <div style={APP}>
  <div style={col}>
    <ProgressBar label="Parsing scan-export.csv" value={142} max={212} valueText="142 / 212 rows" />
    <ProgressBar label="SLA compliance" value={82} tone="ok" description="Target 80%" />
    <ProgressBar label="Critical backlog" value={64} tone="danger" />
    <ProgressBar label="Encrypting workspace" />
  </div>
  </div>
);
