import React from 'react';
import { Input } from 'vaptlens';

export const States = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
    <Input placeholder="Search host, finding or CVE" />
    <Input defaultValue="CVE-2021-41773" />
  </div>
);
