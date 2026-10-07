import React from 'react';
import { SeverityBadge } from 'vaptlens';

const row = { display: 'flex', flexWrap: 'wrap' as const, gap: 'var(--space-2)', alignItems: 'center' };
const SEVS = ['critical', 'high', 'medium', 'low', 'info'];

export const Levels = () => (
  <div style={row}>{SEVS.map((s) => <SeverityBadge key={s} severity={s} />)}</div>
);

export const WithCounts = () => (
  <div style={row}>
    {[['critical', 4], ['high', 9], ['medium', 14], ['low', 6], ['info', 11]].map(([s, n]) => (
      <SeverityBadge key={s} severity={s} count={n} />
    ))}
  </div>
);

