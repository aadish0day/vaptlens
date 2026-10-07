import React from 'react';
import { CalendarHeatmap } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

// deterministic sample activity for 20 weeks ending 2026-07-01
const DATA: Record<string, number> = {};
const end = new Date('2026-07-01T00:00:00');
for (let i = 0; i < 140; i++) {
  const d = new Date(end.getTime() - i * 864e5);
  const v = (i * 7 + (i % 5) * 3) % 11;
  if (v > 3 && d.getDay() % 6 !== 0) DATA[d.toISOString().slice(0, 10)] = v - 3;
}

export const Fixes = () => (
  <div style={APP}>
  <div style={{ fontFamily: 'var(--font-sans)' }}>
    <CalendarHeatmap label="Fixes" unit="fixes" weeks={20} end="2026-07-01" data={DATA} />
  </div>
  </div>
);
