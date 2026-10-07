import React from 'react';
import { Modal, Button, MultiSelect } from 'vaptlens';

// The overlay is position:fixed; a transformed, sized frame keeps it inside the card.
const frame = { position: 'relative' as const, width: 680, height: 400, transform: 'translateZ(0)', overflow: 'hidden' };

export const MapColumns = () => (
  <div style={frame}>
  <Modal
    title="Map columns"
    subtitle="scan-export.csv · 14 columns · tool not recognised"
    onClose={() => {}}
    footer={[<Button key="c">Cancel</Button>, <Button key="s" variant="primary">Import 212 rows</Button>]}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {[['host', 'Target IP'], ['severity', 'Risk Level'], ['cvss', 'Score'], ['name', 'Vulnerability']].map(([f, p]) => (
        <div key={f} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>{f}</span>
          <MultiSelect placeholder={p} />
        </div>
      ))}
    </div>
  </Modal>
  </div>
);
