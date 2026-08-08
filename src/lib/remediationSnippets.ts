export interface RemediationSnippet {
  vulnerabilityPattern: RegExp;
  category: string;
  title: string;
  description: string;
  snippets: {
    technology: string;
    language: string;
    code: string;
  }[];
}

export const REMEDIATION_SNIPPETS: RemediationSnippet[] = [
  {
    vulnerabilityPattern: /(hsts|strict-transport-security|header)/i,
    category: "HTTP Security Headers",
    title: "Enable HSTS & Security Headers",
    description: "Enforce HTTP Strict Transport Security (HSTS) and secure response headers to mitigate man-in-the-middle and downgrade attacks.",
    snippets: [
      {
        technology: "Nginx",
        language: "nginx",
        code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\nadd_header X-Frame-Options "SAMEORIGIN" always;\nadd_header X-Content-Type-Options "nosniff" always;\nadd_header Referrer-Policy "strict-origin-when-cross-origin" always;\nadd_header Content-Security-Policy "default-src 'self';" always;`,
      },
      {
        technology: "Apache",
        language: "apache",
        code: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"\nHeader always set X-Frame-Options "SAMEORIGIN"\nHeader always set X-Content-Type-Options "nosniff"\nHeader always set Referrer-Policy "strict-origin-when-cross-origin"`,
      },
      {
        technology: "IIS / web.config",
        language: "xml",
        code: `<system.webServer>\n  <httpProtocol>\n    <customHeaders>\n      <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />\n      <add name="X-Frame-Options" value="SAMEORIGIN" />\n      <add name="X-Content-Type-Options" value="nosniff" />\n    </customHeaders>\n  </httpProtocol>\n</system.webServer>`,
      },
    ],
  },
  {
    vulnerabilityPattern: /(ssl|tls|cipher|beast|sweet32|poodle)/i,
    category: "Cryptographic Configuration",
    title: "Disable Legacy TLS & Weak Ciphers",
    description: "Disable deprecated protocols (TLS 1.0, TLS 1.1, SSLv3) and weak cipher suites (CBC, 3DES, RC4). Enforce TLS 1.2+ with forward secrecy.",
    snippets: [
      {
        technology: "Nginx",
        language: "nginx",
        code: `ssl_protocols TLSv1.2 TLSv1.3;\nssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;\nssl_prefer_server_ciphers on;\nssl_session_cache shared:SSL:10m;`,
      },
      {
        technology: "Windows Registry (PowerShell)",
        language: "powershell",
        code: `# Disable TLS 1.0 & 1.1\nNew-Item 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server' -Force\nNew-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server' -Name 'Enabled' -Value 0 -PropertyType DWORD -Force\nNew-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server' -Name 'DisabledByDefault' -Value 1 -PropertyType DWORD -Force`,
      },
    ],
  },
  {
    vulnerabilityPattern: /(smb|smbv1|eternalblue|netbios)/i,
    category: "Network Protocol Hardening",
    title: "Disable Legacy SMBv1 Protocol",
    description: "SMBv1 is vulnerable to critical RCE exploits like EternalBlue (MS17-010) used by ransomware. Disable it immediately.",
    snippets: [
      {
        technology: "Windows PowerShell",
        language: "powershell",
        code: `# Disable SMBv1 on Windows Server\nDisable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart\nSet-SmbServerConfiguration -EnableSMB1Protocol $false -Force`,
      },
      {
        technology: "Linux / Samba (smb.conf)",
        language: "ini",
        code: `[global]\n   min protocol = SMB2\n   smb ports = 445`,
      },
    ],
  },
  {
    vulnerabilityPattern: /(cors|access-control-allow-origin)/i,
    category: "Web Application API Security",
    title: "Restrict Wildcard CORS Headers",
    description: "Do not use 'Access-Control-Allow-Origin: *' with credentials. Validate Origin against an explicit whitelist of authorized domains.",
    snippets: [
      {
        technology: "Express.js / Node.js",
        language: "javascript",
        code: `const cors = require('cors');\nconst allowedOrigins = ['https://app.company.com', 'https://admin.company.com'];\n\napp.use(cors({\n  origin: (origin, callback) => {\n    if (!origin || allowedOrigins.includes(origin)) callback(null, true);\n    else callback(new Error('Blocked by CORS policy'));\n  },\n  credentials: true\n}));`,
      },
      {
        technology: "Nginx",
        language: "nginx",
        code: `if ($http_origin ~* (https://app\\.company\\.com|https://admin\\.company\\.com)) {\n    add_header 'Access-Control-Allow-Origin' "$http_origin" always;\n    add_header 'Access-Control-Allow-Credentials' 'true' always;\n}`,
      },
    ],
  },
  {
    vulnerabilityPattern: /(cookie|httponly|samesite|secure attribute)/i,
    category: "Session Management Security",
    title: "Enforce Secure Cookie Flags",
    description: "Append HttpOnly, Secure, and SameSite=Strict/Lax flags to all session cookies to prevent theft via XSS or CSRF.",
    snippets: [
      {
        technology: "Express.js / Node.js",
        language: "javascript",
        code: `app.use(session({\n  name: '__Host-session',\n  secret: process.env.SESSION_SECRET,\n  cookie: {\n    httpOnly: true,\n    secure: true,\n    sameSite: 'strict',\n    maxAge: 3600000 // 1 hour\n  }\n}));`,
      },
      {
        technology: "Nginx Proxy",
        language: "nginx",
        code: `proxy_cookie_flags ~ secure httponly samesite=strict;`,
      },
    ],
  },
  {
    vulnerabilityPattern: /(ssh|sshd|kexalgorithms|mac algorithm)/i,
    category: "OS & Server Hardening",
    title: "Harden OpenSSH Daemon Configuration",
    description: "Disable root SSH login, password authentication, and obsolete key exchange (Kex) algorithms in /etc/ssh/sshd_config.",
    snippets: [
      {
        technology: "Linux /etc/ssh/sshd_config",
        language: "bash",
        code: `PermitRootLogin no\nPasswordAuthentication no\nPubkeyAuthentication yes\nKexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512\nCiphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com\nMACs hmac-sha2-512-etm@openssh.com`,
      },
    ],
  },
  {
    vulnerabilityPattern: /(redis|elasticsearch|mongodb|memcached)/i,
    category: "Database & Cache Hardening",
    title: "Secure Unauthenticated Database Ports",
    description: "Bind databases to localhost (127.0.0.1) or internal interfaces only and enforce strong password authentication.",
    snippets: [
      {
        technology: "Redis (/etc/redis/redis.conf)",
        language: "ini",
        code: `bind 127.0.0.1 ::1\nprotected-mode yes\nrequirepass YourStrongRandomPasswordHere!`,
      },
      {
        technology: "MongoDB (/etc/mongod.conf)",
        language: "yaml",
        code: `net:\n  port: 27017\n  bindIp: 127.0.0.1\nsecurity:\n  authorization: "enabled"`,
      },
    ],
  },
  {
    vulnerabilityPattern: /(sql|sqli|injection)/i,
    category: "Application Code Security",
    title: "Use Parameterized SQL Queries",
    description: "Replace concatenated dynamic SQL strings with prepared statements or parameterized ORM queries to eliminate SQL injection.",
    snippets: [
      {
        technology: "Node.js (pg / mysql)",
        language: "javascript",
        code: `// Safe Parameterized Query\nconst query = 'SELECT * FROM users WHERE id = $1 AND status = $2';\nconst result = await db.query(query, [userId, activeStatus]);`,
      },
      {
        technology: "Python (Psycopg2 / SQLAlchemy)",
        language: "python",
        code: `# Safe Parameterized Query\ncursor.execute("SELECT * FROM users WHERE username = %s AND email = %s", (username, email))`,
      },
    ],
  },
  {
    vulnerabilityPattern: /(xss|cross-site scripting|html injection)/i,
    category: "Application Code Security",
    title: "Context-Aware HTML Output Escaping",
    description: "Encode dynamic user input before rendering in DOM contexts or enforce strict Content-Security-Policy (CSP) headers.",
    snippets: [
      {
        technology: "JavaScript (DOM Sanitization)",
        language: "javascript",
        code: `// Use textContent instead of innerHTML\nelement.textContent = userInput;\n\n// Or sanitize via DOMPurify\nconst cleanHtml = DOMPurify.sanitize(userInput);`,
      },
    ],
  },
];

export function findRemediationSnippet(findingName: string, description?: string): RemediationSnippet | null {
  const targetText = `${findingName} ${description ?? ""}`;
  return REMEDIATION_SNIPPETS.find((s) => s.vulnerabilityPattern.test(targetText)) ?? null;
}
