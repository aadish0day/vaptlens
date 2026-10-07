import React from 'react';
import { Spinner } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const Sizes = () => (
  <div style={APP}>
  <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center', color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
    <Spinner size={14} />
    <Spinner size={20} />
    <Spinner size={28} />
    <Spinner label="Decrypting workspace" showLabel />
  </div>
  </div>
);
