import React from 'react';
import { DonutChart } from 'vaptlens';

export const BySeverity = () => (
  <DonutChart
    data={[
      { label: 'Critical', value: 12, severity: 'critical' },
      { label: 'High', value: 31, severity: 'high' },
      { label: 'Medium', value: 58, severity: 'medium' },
      { label: 'Low', value: 22, severity: 'low' },
      { label: 'Info', value: 40, severity: 'info' },
    ]}
  />
);

export const ByTool = () => (
  <DonutChart
    totalLabel="findings"
    data={[
      { label: 'Nessus', value: 96, color: 'var(--chart-1)' },
      { label: 'Burp Suite', value: 41, color: 'var(--chart-2)' },
      { label: 'OpenVAS', value: 18, color: 'var(--chart-3)' },
      { label: 'Other', value: 8, color: 'var(--chart-6)' },
    ]}
  />
);
