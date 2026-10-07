import React from 'react';
import { ScannerBadge } from 'vaptlens';

export const MatchStates = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
    <ScannerBadge tool="Tenable Nessus" matched={5} total={5} />
    <ScannerBadge tool="OWASP ZAP" matched={3} total={5} />
    <ScannerBadge matched={1} total={5} />
  </div>
);
