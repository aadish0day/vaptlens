import React from 'react';
import { TruncatedText } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

const TEXT = 'The Apache Tomcat AJP connector on 10.100.1.10:8080 accepts unauthenticated requests from outside the DMZ. An attacker can read web application files and, where file upload is enabled, achieve remote code execution (Ghostcat). The service banner reports Tomcat 9.0.30. Upgrade to 9.0.31 or later, or disable the AJP connector and restrict port 8009 at the firewall.';

export const Clamped = () => (
  <div style={APP}>
  <div style={{ maxWidth: 420, fontFamily: 'var(--font-sans)', color: 'var(--ink)', fontSize: 13 }}>
    <TruncatedText lines={2} text={TEXT} />
  </div>
  </div>
);
