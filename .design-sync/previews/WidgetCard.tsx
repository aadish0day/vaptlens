import React from 'react';
import { WidgetCard, Button, RiskMeter } from 'vaptlens';

const col = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-3)' };

export const Default = () => (
  <div style={{ maxWidth: 420 }}>
    <WidgetCard title="Top hosts by risk" actions={<Button variant="ghost" size="sm">View all</Button>}>
      <div style={col}>
        <RiskMeter host="10.100.1.10" score={184} max={200} criticals={3} />
        <RiskMeter host="10.100.2.12" score={121} max={200} criticals={1} />
        <RiskMeter host="app.internal.corp" score={58} max={200} />
      </div>
    </WidgetCard>
  </div>
);
