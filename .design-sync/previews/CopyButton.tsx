import React from 'react';
import { CopyButton } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const Variants = () => (
  <div style={APP}>
  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
    <CopyButton text="CVE-2021-41773" label="Copy CVE" />
    <CopyButton text="10.100.1.10" iconOnly label="Copy host" />
  </div>
  </div>
);
