import React from 'react';
import { Accordion } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const p = { margin: 0, color: 'var(--ink-muted)', fontFamily: 'var(--font-sans)', fontSize: 13 };

export const FindingSections = () => (
  <div style={APP}>
  <div style={{ maxWidth: 520 }}>
    <Accordion
      defaultOpen={['ev']}
      sections={[
        { id: 'ev', title: 'Evidence', meta: '3 files', content: <p style={p}>HTTP response from 10.100.1.10:8080 shows Tomcat 9.0.30 with the AJP connector reachable.</p> },
        { id: 'fix', title: 'Remediation', content: <p style={p}>Upgrade to 9.0.31+ or disable the AJP connector.</p> },
        { id: 'hist', title: 'History', meta: '6 events', content: <p style={p}>First seen 2026-02-14.</p> },
      ]}
    />
  </div>
  </div>
);
