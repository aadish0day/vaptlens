import React from 'react';
import { Breadcrumbs } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const FindingPath = () => (
  <div style={APP}>
  <Breadcrumbs items={[{ label: 'Workspaces', onClick: () => {} }, { label: 'Q3 external test', onClick: () => {} }, { label: 'Findings', onClick: () => {} }, { label: 'Apache Tomcat RCE' }]} />
  </div>
);
