import React from 'react';
import { QueryBuilder } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const FIELDS = [
  { key: 'severity', label: 'Severity', type: 'enum', options: ['critical', 'high', 'medium', 'low'] },
  { key: 'cvss', label: 'CVSS', type: 'number' },
  { key: 'host', label: 'Host', type: 'text' },
  { key: 'kev', label: 'In CISA KEV', type: 'bool' },
];

export const Rules = () => (
  <div style={APP}>
  <div style={{ maxWidth: 640 }}>
    <QueryBuilder count={38} fields={FIELDS} onChange={() => {}} value={{ match: 'all', rules: [{ field: 'severity', op: 'in', value: ['critical', 'high'] }, { field: 'cvss', op: 'gte', value: '9' }, { field: 'host', op: 'starts', value: '10.100.' }] }} />
  </div>
  </div>
);

export const Empty = () => (
  <div style={APP}>
  <div style={{ maxWidth: 640 }}>
    <QueryBuilder fields={FIELDS} onChange={() => {}} value={{ match: 'any', rules: [] }} />
  </div>
  </div>
);
