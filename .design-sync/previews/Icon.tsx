import React from 'react';
import { Icon } from 'vaptlens';

const NAMES = ['shield', 'shield-check', 'flame', 'skull', 'zap', 'clock', 'lock', 'unlock', 'ticket', 'server', 'database', 'globe', 'router', 'monitor', 'key', 'search', 'filter', 'upload', 'download', 'file', 'user', 'flag', 'target', 'trend-up', 'trend-down', 'check', 'x'];

export const Catalog = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 72px)', gap: 'var(--space-3)', color: 'var(--ink)' }}>
    {NAMES.map((n) => (
      <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
        <Icon name={n} size={20} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)' }}>{n}</span>
      </div>
    ))}
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', color: 'var(--ink)' }}>
    <Icon name="shield" size={14} />
    <Icon name="shield" size={16} />
    <Icon name="shield" size={20} />
    <Icon name="shield" size={24} />
    <Icon name="shield" size={32} strokeWidth={1.5} />
  </div>
);
