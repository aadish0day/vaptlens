import React from 'react';
import { FunnelChart } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const STAGES = [{ label: 'Found', value: 212 }, { label: 'Triaged', value: 180 }, { label: 'Ticketed', value: 131 }, { label: 'Fixed', value: 94 }, { label: 'Verified', value: 71 }];

export const Remediation = () => <div style={APP}><div style={{ maxWidth: 520 }}><FunnelChart label="Remediation funnel" stages={STAGES} /></div></div>;

export const Selected = () => <div style={APP}><div style={{ maxWidth: 520 }}><FunnelChart label="Remediation funnel" stages={STAGES} selected="Fixed" onSelect={() => {}} /></div></div>;
