import React from 'react';
import { ThreatTag } from 'vaptlens';

export const Kinds = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
    {['kev', 'zeroday', 'ransomware', 'exploitable', 'eol', 'breached'].map((k) => <ThreatTag key={k} kind={k} />)}
  </div>
);
