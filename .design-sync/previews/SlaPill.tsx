import React from 'react';
import { SlaPill } from 'vaptlens';

export const Statuses = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
    <SlaPill status="met" />
    <SlaPill status="at-risk" days={5} />
    <SlaPill status="breached" days={206} />
  </div>
);
