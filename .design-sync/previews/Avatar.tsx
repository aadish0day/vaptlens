import React from 'react';
import { Avatar } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const People = () => (
  <div style={APP}>
  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
    <Avatar name="Priya Raman" />
    <Avatar name="Tom Okafor" status="ok" />
    <Avatar name="Lena Vogt" status="warn" />
    <Avatar name="Sam Ito" size={40} />
  </div>
  </div>
);
