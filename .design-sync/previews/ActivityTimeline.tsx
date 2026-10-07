import React from 'react';
import { ActivityTimeline } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const Finding = () => (
  <div style={APP}>
  <div style={{ maxWidth: 520 }}>
    <ActivityTimeline
      items={[
        { id: '1', at: '2026-07-02T10:12:00', actor: 'Tom Okafor', text: 'verified the fix', tone: 'ok', detail: 'Re-test shows Tomcat 9.0.31' },
        { id: '2', at: '2026-07-01T14:20:00', actor: 'Priya Raman', text: 'raised ticket SEC-412', tone: 'info' },
        { id: '3', at: '2026-07-01T09:05:00', actor: 'Lena Vogt', text: 'escalated: SLA at risk', tone: 'warn' },
      ]}
    />
  </div>
  </div>
);

export const Empty = () => <div style={APP}><ActivityTimeline items={[]} empty="No activity on this finding yet." /></div>;
