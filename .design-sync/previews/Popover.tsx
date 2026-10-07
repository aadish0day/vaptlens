import React from 'react';
import { Popover, Checkbox, Button } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

// open is controlled here so the static preview shows the panel
export const Open = () => (
  <div style={APP}>
  <div style={{ paddingBottom: 180 }}>
    <Popover open onOpenChange={() => {}} trigger="Columns" triggerClassName="vl-btn vl-btn-secondary vl-btn-sm" title="Visible columns">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <Checkbox checked onChange={() => {}} label="CVSS" />
        <Checkbox checked onChange={() => {}} label="Owner" />
        <Checkbox checked={false} onChange={() => {}} label="First seen" />
        <Button size="sm" variant="primary">Apply</Button>
      </div>
    </Popover>
  </div>
  </div>
);
