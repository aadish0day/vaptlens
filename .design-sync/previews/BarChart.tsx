import React from 'react';
import { BarChart } from 'vaptlens';

const DATA = [
  { label: 'Critical', value: 12, severity: 'critical' },
  { label: 'High', value: 31, severity: 'high' },
  { label: 'Medium', value: 58, severity: 'medium' },
  { label: 'Low', value: 22, severity: 'low' },
  { label: 'Info', value: 40, severity: 'info' },
];

export const BySeverity = () => (
  <div style={{ maxWidth: 480 }}><BarChart label="Findings by severity" data={DATA} /></div>
);

export const Selected = () => (
  <div style={{ maxWidth: 480 }}><BarChart label="Findings by severity" data={DATA} selected="High" /></div>
);
