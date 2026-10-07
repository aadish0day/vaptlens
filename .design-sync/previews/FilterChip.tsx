import React from 'react';
import { FilterChip, Button } from 'vaptlens';

export const ActiveFilters = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
    <FilterChip field="Severity" value="Critical" severity="critical" />
    <FilterChip field="Host" value="10.100.1.25" />
    <FilterChip field="Tool" value="Nessus" />
    <FilterChip value="CISA KEV" />
    <Button variant="ghost" size="sm">Clear all</Button>
  </div>
);
