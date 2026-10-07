import React from 'react';
import { TierBadge } from 'vaptlens';

export const Tiers = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
    <TierBadge tier={1} />
    <TierBadge tier={2} />
    <TierBadge tier={3} />
    <TierBadge tier={1} short />
  </div>
);
