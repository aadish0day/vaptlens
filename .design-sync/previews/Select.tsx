import React from 'react';
import { Select } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const TEAMS = [{ value: 'srv', label: 'Server Team', description: '14 open findings' }, { value: 'app', label: 'Application Dev', description: '9 open findings' }, { value: 'dba', label: 'Database DBAs' }];
const row = { display: 'flex', flexWrap: 'wrap' as const, gap: 'var(--space-3)', alignItems: 'center' };

export const States = () => (
  <div style={APP}>
  <div style={row}>
    <Select label="Owner" options={TEAMS} defaultValue="srv" />
    <Select label="Owner" placeholder="Unassigned" options={TEAMS} />
    <Select label="Owner" options={TEAMS} defaultValue="app" invalid />
    <Select label="Owner" options={TEAMS} defaultValue="dba" disabled />
  </div>
  </div>
);
