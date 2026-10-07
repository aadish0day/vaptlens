import React from 'react';
import { Gauge } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const Bands = () => (
  <div style={APP}>
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', alignItems: 'flex-start', fontFamily: 'var(--font-sans)' }}>
    <Gauge value={28} label="Exposure score" caption="Down 4 this month" width={180} />
    <Gauge value={78} label="Exposure score" caption="Up 6 since last quarter" width={180} />
    <Gauge value={94} label="Exposure score" caption="3 KEV findings open" width={180} />
  </div>
  </div>
);
