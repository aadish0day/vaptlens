import React from 'react';
import { Textarea } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const col = { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-4)', maxWidth: 440 };

export const States = () => (
  <div style={APP}>
  <div style={col}>
    <Textarea label="Risk acceptance reason" required maxLength={200} hint="Shown to auditors in the evidence pack." value="Compensating control: WAF rule 9412 blocks the AJP connector from outside the DMZ." onChange={() => {}} rows={3} />
    <Textarea label="Retest notes" error="Add at least one sentence before closing the finding." value="" onChange={() => {}} rows={2} />
  </div>
  </div>
);
