import React from 'react';
import { VulnTable } from 'vaptlens';

const ROWS = [
  { id: 1, severity: 'critical', name: 'Apache Tomcat RCE', host: '10.100.1.10:8080', cvss: 9.8, lifecycle: 'New', tool: 'Nessus', tags: ['zeroday'], cves: ['CVE-2026-9999'], description: 'Unauthenticated remote code execution in the Tomcat AJP connector.', team: 'Server Team', sla: { status: 'at-risk', days: 5 }, snippet: [{ label: 'Nginx', code: 'location /manager { deny all; }' }] },
  { id: 2, severity: 'high', name: 'Apache HTTP Server Path Traversal', host: '10.100.1.10:80', cvss: 7.5, lifecycle: 'Open', tool: 'Nessus', tags: ['kev'] },
  { id: 3, severity: 'medium', name: 'Missing HSTS Header', host: 'app.internal.corp', cvss: 5.3, lifecycle: 'Open', tool: 'Burp Suite', merged: 6 },
  { id: 4, severity: 'critical', name: 'MySQL Default Root Password', host: '10.100.2.12:3306', cvss: 9.8, lifecycle: 'Open', tool: 'Nessus', tags: ['ransomware'] },
  { id: 5, severity: 'low', name: 'HTTP Server Banner Disclosure', host: '10.100.1.25:80', cvss: 2.6, lifecycle: 'Fixed', tool: 'Nessus' },
];

export const Findings = () => <VulnTable rows={ROWS} />;

export const ExpandedRow = () => <VulnTable rows={ROWS.slice(0, 2)} defaultExpanded={1} />;
