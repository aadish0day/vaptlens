import React from 'react';
import { StatusIndicator } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const Statuses = () => (
  <div style={APP}>
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
    <StatusIndicator status="ok" />
    <StatusIndicator status="warn" />
    <StatusIndicator status="danger" />
    <StatusIndicator status="running">Scan in progress</StatusIndicator>
    <StatusIndicator status="pending" />
    <StatusIndicator status="info" />
    <StatusIndicator status="off">Sync off</StatusIndicator>
  </div>
  </div>
);
