import React from 'react';
import { KpiCard } from 'vaptlens';

const row = { display: 'flex', flexWrap: 'wrap' as const, gap: 'var(--space-3)', alignItems: 'stretch' };

export const Default = () => (
  <div style={row}>
    <KpiCard label="Active findings" value="1,284" sub="+36 since last scan" icon="shield" />
    <KpiCard label="Hosts scanned" value="212" sub="4 new this week" icon="server" />
  </div>
);

export const Tones = () => (
  <div style={row}>
    <KpiCard label="SLA breached" value="47" tone="critical" sub="12 critical" icon="clock" />
    <KpiCard label="SLA compliance" value="82%" tone="ok" sub="Target 80%" icon="shield-check" />
  </div>
);

export const ClickableActive = () => (
  <div style={row}>
    <KpiCard label="Critical" value="38" tone="critical" sub="Filter applied" onClick={() => {}} active />
    <KpiCard label="High" value="164" onClick={() => {}} sub="Click to filter" />
  </div>
);
