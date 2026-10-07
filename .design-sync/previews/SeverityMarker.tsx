import React from 'react';
import { SeverityMarker } from 'vaptlens';

export const Levels = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
    {['critical', 'high', 'medium', 'low', 'info'].map((s) => (
      <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
        <SeverityMarker severity={s} size={14} />
        {s}
      </span>
    ))}
  </div>
);
