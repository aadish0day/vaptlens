import React from 'react';
import { Wizard, TagInput, RadioGroup } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const NewEngagement = () => (
  <div style={APP}>
  <div style={{ maxWidth: 600 }}>
    <Wizard
      defaultStep={1}
      submitLabel="Create engagement"
      onCancel={() => {}}
      steps={[
        { title: 'Scope', content: <TagInput label="Targets" defaultValue={['10.100.1.0/24']} /> },
        { title: 'Test type', description: 'Choose how the engagement will be run.', content: <RadioGroup label="Type" showLabel={false} defaultValue="ext" options={[{ value: 'ext', label: 'External', description: 'Internet-facing hosts' }, { value: 'int', label: 'Internal', description: 'From inside the network' }]} /> },
        { title: 'Review', content: null },
      ]}
    />
  </div>
  </div>
);
