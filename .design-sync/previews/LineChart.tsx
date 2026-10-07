import React from 'react';
import { LineChart } from 'vaptlens';

const L = ['Nov 2025', 'Feb 2026', 'Jul 2026'];

export const ThreatTrends = () => (
  <div style={{ maxWidth: 480 }}>
    <LineChart
      labels={L}
      series={[
        { label: 'CISA KEV', values: [2, 3, 5], color: 'var(--threat-kev)' },
        { label: 'Zero-day', values: [0, 0, 1], color: 'var(--threat-zeroday)' },
        { label: 'Ransomware', values: [3, 3, 4], color: 'var(--threat-ransomware)', dashed: true },
        { label: 'Exploitable', values: [4, 6, 11], color: 'var(--chart-2)' },
      ]}
    />
  </div>
);

export const Area = () => (
  <div style={{ maxWidth: 480 }}>
    <LineChart id="active" area labels={L} series={[{ label: 'Active findings', values: [6, 13, 22] }]} />
  </div>
);
