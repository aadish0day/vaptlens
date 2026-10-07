import React from 'react';
import { Sparkline } from 'vaptlens';

const item = { display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 13 };

export const Tones = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', alignItems: 'center' }}>
    <span style={item}><Sparkline values={[42, 38, 40, 31, 27, 22]} tone="ok" />22 open</span>
    <span style={item}><Sparkline values={[2, 3, 3, 5, 8, 12]} tone="danger" />12 critical</span>
    <span style={item}><Sparkline values={[10, 12, 9, 14, 13, 15]} />15 hosts</span>
  </div>
);

export const Large = () => (
  <Sparkline values={[6, 9, 7, 13, 11, 18, 16, 22]} width={240} height={48} label="Active findings, last 8 scans" />
);
