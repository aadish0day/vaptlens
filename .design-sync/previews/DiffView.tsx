import React from 'react';
import { DiffView } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const Retest = () => (
  <div style={APP}>
  <div style={{ maxWidth: 560 }}>
    <DiffView
      beforeLabel="Initial scan"
      afterLabel="Re-test"
      before={'HTTP/1.1 200 OK\nServer: Apache/2.4.49\nX-Powered-By: PHP/7.2.24\nContent-Type: text/html'}
      after={'HTTP/1.1 200 OK\nServer: Apache/2.4.58\nContent-Type: text/html\nStrict-Transport-Security: max-age=31536000'}
    />
  </div>
  </div>
);
