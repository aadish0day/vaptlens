import React from 'react';
import { JsonViewer } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const ScannerOutput = () => (
  <div style={APP}>
  <div style={{ maxWidth: 520 }}>
    <JsonViewer title="plugin_output" openDepth={2} data={{ plugin_id: 57582, host: '10.100.1.10', port: 443, severity: 'high', kev: true, cves: ['CVE-2021-41773', 'CVE-2021-42013'], banner: { server: 'Apache/2.4.49', tls: 'TLSv1.2' } }} />
  </div>
  </div>
);
