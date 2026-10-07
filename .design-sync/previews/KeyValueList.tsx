import React from 'react';
import { KeyValueList } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const ITEMS = [
  { label: 'Host', value: '10.100.1.10:8080', mono: true, copy: true },
  { label: 'Owner', value: 'Server Team' },
  { label: 'CVE', value: 'CVE-2026-9999', mono: true, copy: true },
  { label: 'First seen', value: '2026-02-14' },
  { label: 'Scanner', value: 'Nessus' },
  { label: 'Ticket', value: 'SEC-412' },
];

export const TwoColumns = () => <div style={APP}><div style={{ maxWidth: 720 }}><KeyValueList columns={2} items={ITEMS} /></div></div>;

export const Single = () => <div style={APP}><div style={{ maxWidth: 360 }}><KeyValueList items={ITEMS.slice(0, 4)} /></div></div>;
