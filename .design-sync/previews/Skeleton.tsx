import React from 'react';
import { Skeleton } from 'vaptlens';

export const Loading = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 520 }}>
    <Skeleton width="40%" height="16px" />
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)', background: 'var(--surface-100)' }}>
      <Skeleton variant="rows" rows={3} />
    </div>
  </div>
);
