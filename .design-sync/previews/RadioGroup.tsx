import React from 'react';
import { RadioGroup } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const WithDescriptions = () => (
  <div style={APP}>
  <RadioGroup label="Report audience" defaultValue="exec" options={[{ value: 'exec', label: 'Executive', description: 'Summary, trends and SLA status' }, { value: 'tech', label: 'Technical', description: 'Every finding with evidence and fixes' }, { value: 'audit', label: 'Audit pack', description: 'Read-only export with the audit log', disabled: true }]} />
  </div>
);

export const Inline = () => (
  <div style={APP}>
  <RadioGroup label="Density" inline defaultValue="Comfortable" options={['Comfortable', 'Compact']} />
  </div>
);
