import React from 'react';
import { TagInput } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const Scope = () => (
  <div style={APP}>
  <div style={{ maxWidth: 440 }}>
    <TagInput label="Scope (CIDR or host)" defaultValue={['10.100.1.0/24', 'app.internal.corp', '10.100.2.12']} hint="Press Enter or comma to add." />
  </div>
  </div>
);

export const Empty = () => (
  <div style={APP}>
  <div style={{ maxWidth: 440 }}>
    <TagInput label="Exclusions" placeholder="e.g. 10.100.9.0/24" />
  </div>
  </div>
);
