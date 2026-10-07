import React from 'react';
import { RadarChart } from 'vaptlens';

export const QuarterOverQuarter = () => (
  <div style={{ maxWidth: 460 }}>
    <RadarChart
      axes={['Exploitable', 'KEV', 'Zero-day', 'Ransomware', 'EOL', 'SLA breach']}
      series={[
        { label: 'Q1 2026', values: [4, 3, 0, 5, 3, 2], color: 'var(--chart-6)', dashed: true },
        { label: 'Q2 2026', values: [8, 6, 2, 6, 4, 7] },
      ]}
    />
  </div>
);
