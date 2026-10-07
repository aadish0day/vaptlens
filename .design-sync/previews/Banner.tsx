import React from 'react';
import { Banner, Button } from 'vaptlens';

export const Tones = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 640 }}>
    <Banner tone="privacy" title="Everything runs in your browser" onClose={() => {}}>
      Scan files, hostnames and findings never leave this machine. Nothing is uploaded.
    </Banner>
    <Banner tone="warn" title="12 rows skipped" action={<Button size="sm" variant="ghost">View rows</Button>}>
      They had no host value after mapping.
    </Banner>
    <Banner tone="danger" title="Trend Over Time needs 2 dated scans">
      Load another scan batch with a scan date.
    </Banner>
  </div>
);
