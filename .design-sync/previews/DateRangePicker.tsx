import React from 'react';
import { DateRangePicker } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const row = { display: 'flex', flexWrap: 'wrap' as const, gap: 'var(--space-3)', alignItems: 'center' };

export const Values = () => (
  <div style={APP}>
  <div style={row}>
    <DateRangePicker label="Scan date" defaultValue={{ type: 'relative', key: '90d' }} />
    <DateRangePicker label="Window" defaultValue={{ type: 'absolute', from: '2026-06-01', to: '2026-06-30' }} />
    <DateRangePicker label="Scan date" />
  </div>
  </div>
);
