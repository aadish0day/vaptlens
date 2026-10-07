import React from 'react';
import { Tabs } from 'vaptlens';

export const WithCounts = () => (
  <Tabs tabs={[{ label: 'Verified fixed', count: 4 }, { label: 'New risk', count: 9 }, { label: 'Persistent', count: 3 }]} />
);

export const Plain = () => (
  <Tabs tabs={[{ label: 'Findings' }, { label: 'Profile' }, { label: 'History' }]} defaultValue="Profile" />
);
