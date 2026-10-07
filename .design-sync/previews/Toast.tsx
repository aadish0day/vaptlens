import React from 'react';
import { Toast } from 'vaptlens';

export const Tones = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
    <Toast title="PDF exported" message="vaptlens-executive-report-2026-07-01.pdf" onClose={() => {}} />
    <Toast tone="danger" title="Couldn't parse row 88" message="Unbalanced quote in the Description column." onClose={() => {}} />
  </div>
);
