import React from 'react';
import { CountBadge } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const item = { display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink)' };

export const Tones = () => (
  <div style={APP}>
  <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
    <span style={item}>Open <CountBadge count={7} /></span>
    <span style={item}>Breached <CountBadge count={12} tone="danger" label="breached" /></span>
    <span style={item}>New <CountBadge count={3} tone="signal" /></span>
    <span style={item}>Findings <CountBadge count={1284} /></span>
    <span style={item}>Zero <CountBadge count={0} showZero /></span>
  </div>
  </div>
);
