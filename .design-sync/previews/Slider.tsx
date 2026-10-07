import React from 'react';
import { Slider } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const Cvss = () => (
  <div style={APP}>
  <div style={{ maxWidth: 360 }}>
    <Slider label="Minimum CVSS" min={0} max={10} step={0.1} defaultValue={7} format={(v) => v.toFixed(1)} marks={[{ value: 4, label: 'Med' }, { value: 7, label: 'High' }, { value: 9, label: 'Crit' }]} />
  </div>
  </div>
);
