import React from 'react';
import { Kbd } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const item = { display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-muted)' };

export const Shortcuts = () => (
  <div style={APP}>
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
    <span style={item}>Search <Kbd keys={['Ctrl', 'K']} /></span>
    <span style={item}>Next finding <Kbd keys={['J']} /></span>
    <span style={item}>Export <Kbd>Shift+E</Kbd></span>
  </div>
  </div>
);
