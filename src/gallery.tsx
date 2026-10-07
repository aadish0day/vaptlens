/* Dev-only component playground: npm run dev → http://localhost:5173/gallery.html */
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import * as V from "@/ui";
import "@/styles/fonts.css";
import "@/styles/tokens.css";
import "@/styles/ui.css";
import "@/styles/ui-extra.css";
import "@/styles/app.css";

var FIELDS = [
  { key: "sev", label: "Severity", type: "enum", options: ["critical", "high", "medium", "low"] },
  { key: "cvss", label: "CVSS", type: "number" },
  { key: "host", label: "Host", type: "text" },
  { key: "kev", label: "CISA KEV", type: "bool" },
];
var ROWS = [
  { sev: "critical", cvss: 9.8, host: "vpn.corp.com", kev: true },
  { sev: "high", cvss: 8.1, host: "10.100.1.10", kev: false },
  { sev: "medium", cvss: 5.3, host: "app.internal.corp", kev: false },
];

function Card(p) {
  return (
    <section className="g-card">
      <h2>{p.title}</h2>
      {p.children}
    </section>
  );
}

var TREE = [
  { id: "bu-fin", label: "Finance", icon: "folder", meta: "3 hosts", children: [
    { id: "h1", label: "10.100.1.10", icon: "cpu", meta: "7", children: [{ id: "h1-443", label: "443/tcp · https", meta: "5" }, { id: "h1-22", label: "22/tcp · ssh", meta: "2" }] },
    { id: "h2", label: "erp.corp.com", icon: "cpu", meta: "4" },
  ] },
  { id: "bu-it", label: "IT Ops", icon: "folder", meta: "2 hosts", children: [{ id: "h3", label: "vpn.corp.com", icon: "cpu", meta: "9" }] },
];
var VROWS = [];
for (var vi = 0; vi < 5000; vi++) VROWS.push({ id: vi, host: "10." + (vi % 250) + "." + ((vi * 7) % 250) + "." + (vi % 200 + 1), sev: ["critical", "high", "medium", "low"][vi % 4] });

function Gallery2() {
  var al = useState(true), view = useState("list"), cols = useState(["host", "cvss"]), qs = useState(""), num = useState(30), pw = useState("Tr1cky-Lens-2026");
  var cb = useState("Apache HTTP Server"), dp = useState("2026-11-05"), tsel = useState("h1-443"), owner = useState("Server Team"), sheet = useState(false), last = useState("—");
  var notes = useState([
    { id: 1, title: "SLA breached: Apache Path Traversal", body: "10.100.1.10 · 3 days overdue", at: "2026-10-06T09:00:00", tone: "danger" },
    { id: 2, title: "Risk acceptance awaiting your approval", body: "SQL Injection in /api/orders", at: "2026-10-06T08:10:00", tone: "warn" },
    { id: 3, title: "Nessus import finished", body: "212 findings · 4 new critical", at: "2026-10-05T17:02:00", tone: "ok", read: true },
  ]);
  var files = useState([
    { id: "a", name: "nessus-q4-external.csv", size: 482133, status: "done", detail: "212 findings" },
    { id: "b", name: "burp-app-scan.xml", size: 2290112, status: "uploading", progress: 62 },
    { id: "c", name: "zap-report.json", size: 90211, status: "error", error: "Not a ZAP JSON report" },
    { id: "d", name: "nmap-dmz.xml", size: 33100, status: "queued" },
  ]);
  function act(l) { return function () { last[1](l); }; }
  return (
    <>
      <h2 className="g-h">Set 2: actions, inputs, navigation, security widgets, states</h2>
      <p className="up-help">Last action: <b>{last[0]}</b></p>
      <div className="g-grid">
        <Card title="Alert">{al[0] ? <V.Alert tone="warning" title="3 findings breach SLA this week" dismissible onDismiss={function () { al[1](false); }} actions={<V.Button size="sm" onClick={act("Open SLA board")}>Open SLA board</V.Button>}>Apache 2.4.49 on 10.100.1.10 is 3 days past its due date.</V.Alert> : <V.Button size="sm" onClick={function () { al[1](true); }}>Show alert again</V.Button>}<V.Alert tone="info">Scans are parsed in your browser.</V.Alert><V.Alert tone="success" title="Re-test verified">CVE-2021-41773 no longer detected.</V.Alert><V.Alert tone="error" title="Import failed">The file isn't a Nessus CSV.</V.Alert></Card>
        <Card title="IconButton"><div className="row-wrap"><V.IconButton icon="refresh" label="Refresh" onClick={act("Refresh")} /><V.IconButton icon="bell" label="Notifications" badge={3} onClick={act("Notifications")} /><V.IconButton icon="star" label="Watch finding" pressed onClick={act("Watch")} /><V.IconButton icon="trash" label="Delete" variant="danger" onClick={act("Delete")} /><V.IconButton icon="settings" label="Settings" size="sm" /><V.IconButton icon="download-cloud" label="Download" size="lg" variant="solid" /></div></Card>
        <Card title="ButtonGroup / ToggleButtonGroup"><V.ButtonGroup label="Zoom"><V.Button size="sm" onClick={act("Zoom out")}>−</V.Button><V.Button size="sm" onClick={act("Reset zoom")}>100%</V.Button><V.Button size="sm" onClick={act("Zoom in")}>+</V.Button></V.ButtonGroup><V.ToggleButtonGroup label="View" value={view[0]} onChange={view[1]} options={[{ value: "list", label: "List", icon: "list" }, { value: "board", label: "Board", icon: "columns" }, { value: "map", label: "Map", icon: "layers" }]} /><V.ToggleButtonGroup label="Columns" multiple value={cols[0]} onChange={cols[1]} options={["host", "cvss", "epss", "owner"]} /></Card>
        <Card title="SplitButton"><V.SplitButton label="Export PDF" icon="download" onClick={act("Export PDF")} menuLabel="More export formats" items={[{ label: "CSV", hint: "Jira / ServiceNow", onSelect: act("Export CSV") }, { label: "Word (.docx)", onSelect: act("Export Word") }, { label: "JSON backup", icon: "archive", onSelect: act("Export JSON") }]} /></Card>
        <Card title="SearchInput"><V.SearchInput label="Search findings" placeholder="Host, CVE, title…" shortcut value={qs[0]} onChange={qs[1]} onSearch={function (v) { last[1]("Search: " + v); }} /></Card>
        <Card title="NumberInput"><V.NumberInput label="Critical SLA" unit="days" min={1} max={365} value={num[0]} onChange={num[1]} hint="↑/↓ to step, Shift for ×10" /></Card>
        <Card title="PasswordInput"><V.PasswordInput label="Vault password" showStrength value={pw[0]} onChange={function (e) { pw[1](e.target.value); }} autoComplete="new-password" /></Card>
        <Card title="Combobox"><V.Combobox label="Product" value={cb[0]} onChange={cb[1]} onSelect={function (v) { last[1]("Product: " + v); }} suggestions={["Apache HTTP Server", "Apache Tomcat", "OpenSSH", "OpenSSL", "nginx", "Microsoft IIS", "Fortinet FortiOS", "Ivanti Connect Secure"]} /></Card>
        <Card title="DatePicker"><V.DatePicker label="Exception expires" value={dp[0]} onChange={dp[1]} min="2026-10-06" today="2026-10-06" /></Card>
        <Card title="TreeView"><V.TreeView label="Asset hierarchy" nodes={TREE} defaultExpanded={["bu-fin", "h1"]} selected={tsel[0]} onSelect={function (n) { tsel[1](n.id); last[1]("Tree: " + n.label); }} /></Card>
        <Card title="ContextMenu"><V.ContextMenu items={[{ label: "Open finding", icon: "external-link", onSelect: act("Open finding") }, { label: "Copy CVE", icon: "copy", hint: "⌘C", onSelect: act("Copy CVE") }, { label: "Accept risk…", onSelect: act("Accept risk") }, { label: "Delete", icon: "trash", danger: true, onSelect: act("Delete") }]}><div className="g-ctx">Right-click here (or focus and press Shift+F10)</div></V.ContextMenu></Card>
        <Card title="NotificationCenter"><V.NotificationCenter items={notes[0]} onRead={function (id) { notes[1](notes[0].map(function (n) { return n.id === id ? Object.assign({}, n, { read: true }) : n; })); }} onMarkAll={function () { notes[1](notes[0].map(function (n) { return Object.assign({}, n, { read: true }); })); }} /></Card>
        <Card title="FileUploadList"><V.FileUploadList label="Scan uploads" files={files[0]} onRemove={function (id) { files[1](files[0].filter(function (f) { return f.id !== id; })); }} onRetry={function (id) { files[1](files[0].map(function (f) { return f.id === id ? Object.assign({}, f, { status: "uploading", progress: 10, error: null }) : f; })); }} /></Card>
        <Card title="InlineEdit"><V.InlineEdit label="Owner" required value={owner[0]} onSave={function (v) { return new Promise(function (res, rej) { setTimeout(function () { if (/fail/i.test(v)) rej(new Error("Server rejected the change")); else { owner[1](v); res(null); } }, 400); }); }} /><p className="up-help">Type "fail" to see the error path.</p></Card>
        <Card title="ResizablePanels"><V.ResizablePanels label="Resize finding list and details" defaultSize={40} left={<div className="g-pane">Findings list</div>} right={<div className="g-pane">Finding details</div>} /></Card>
        <Card title="BottomSheet"><V.Button onClick={function () { sheet[1](true); }}>Open filters sheet</V.Button><V.BottomSheet open={sheet[0]} title="Filters" onClose={function () { sheet[1](false); }} footer={<V.Button variant="primary" onClick={function () { sheet[1](false); last[1]("Filters applied"); }}>Apply</V.Button>}><p className="up-help">Phone-friendly panel; Esc or the backdrop closes it.</p></V.BottomSheet></Card>
        <Card title="VirtualList (5,000 rows)"><V.VirtualList label="Hosts" items={VROWS} height={220} rowHeight={32} getKey={function (r) { return r.id; }} renderItem={function (r) { return <div className="g-vrow"><span className="mono">{r.host}</span><V.SeverityBar compact counts={{ [r.sev]: 1 }} /></div>; }} /></Card>
        <Card title="CvssVector"><V.CvssVector vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" score={9.8} /><V.CvssVector compact vector="CVSS:3.1/AV:L/AC:H/PR:L/UI:R/S:U/C:L/I:N/A:N" score={2.5} /></Card>
        <Card title="EpssMeter"><div className="g-stack"><V.EpssMeter probability={0.974} percentile={0.999} /><V.EpssMeter probability={0.12} percentile={0.95} /><V.EpssMeter probability={0.0008} percentile={0.31} /><V.EpssMeter /></div></Card>
        <Card title="CveLink"><div className="row-wrap"><V.CveLink id="CVE-2024-3400" kev copy /><V.CveLink id="CVE-2021-41773" kev /><V.CveLink id="CVE-2023-48795" copy /></div></Card>
        <Card title="SeverityBar"><V.SeverityBar counts={{ critical: 7, high: 23, medium: 61, low: 40, info: 12 }} /><V.SeverityBar compact counts={{ critical: 1, high: 4, medium: 2 }} /></Card>
        <Card title="SlaCountdown"><div className="row-wrap"><V.SlaCountdown due="2026-10-03" today="2026-10-06" /><V.SlaCountdown due="2026-10-08" today="2026-10-06" /><V.SlaCountdown due="2026-11-20" today="2026-10-06" /><V.SlaCountdown due="2026-10-01" today="2026-10-06" paused /></div></Card>
        <Card title="BulletChart"><V.BulletChart label="MTTR, critical" value={12} target={15} lowerIsBetter max={30} format={function (v) { return v + " d"; }} /><V.BulletChart label="Re-test coverage" value={61} target={80} max={100} format={function (v) { return v + "%"; }} /></Card>
        <Card title="StateView"><V.StateView kind="no-results" size="sm" action={<V.Button size="sm" onClick={act("Clear filters")}>Clear filters</V.Button>} /></Card>
        <Card title="Divider, ExternalLink"><p className="up-help">Above the line</p><V.Divider /><V.Divider label="or import from" /><V.ExternalLink href="https://www.first.org/epss/">EPSS model (FIRST)</V.ExternalLink></Card>
        <Card title={"Illustrations (" + V.ILLUSTRATIONS.length + ")"}><div className="g-ills">{V.ILLUSTRATIONS.map(function (n) { return <figure key={n}><V.Illustration name={n} size={72} title={n} /><figcaption>{n}</figcaption></figure>; })}</div></Card>
        <Card title={"Extra icons (" + Object.keys(V.ICONS_EXTRA).length + ")"}><div className="g-icons">{Object.keys(V.ICONS_EXTRA).map(function (n) { return <span key={n} title={n}><V.Icon name={n} size={18} /><small>{n}</small></span>; })}</div></Card>
      </div>
    </>
  );
}

function Gallery() {
  var pg = useState(3), sel = useState("high"), rad = useState("internet"), tags = useState(["CVE-2024-3400", "CVE-2021-41773"]);
  var drp = useState({ type: "relative", key: "30d" }), q = useState({ match: "all", rules: [{ field: "cvss", op: "gte", value: "7" }] });
  var acc = useState(["a"]), sl = useState(70), wz = useState(0), ta = useState("Compensating WAF rule blocks /cgi-bin/ traversal.");
  var heat = {};
  for (var i = 0; i < 180; i++) { var d = new Date(Date.now() - i * 864e5); if ((i * 7) % 5 !== 0) heat[d.toISOString().slice(0, 10)] = (i * 13) % 9; }
  return (
    <main className="g-main">
      <h1>VAPTLens components</h1>
      <p className="up-help">Extended set. Each one is keyboard operable, themed by tokens and works at phone width.</p>
      <div className="g-grid">
        <Card title="Breadcrumbs"><V.Breadcrumbs items={[{ label: "Assets", onClick: function () {} }, { label: "10.100.1.10", onClick: function () {} }, { label: "Apache HTTP Server Path Traversal" }]} /></Card>
        <Card title="Pagination"><V.Pagination page={pg[0]} total={1234} pageSize={25} onChange={pg[1]} onPageSizeChange={function () {}} /></Card>
        <Card title="Select (filterable)"><V.Select label="Severity" filterable value={sel[0]} onChange={sel[1]} options={[{ value: "critical", label: "Critical", description: "CVSS 9.0–10" }, { value: "high", label: "High", description: "CVSS 7.0–8.9" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }, { value: "info", label: "Info", disabled: true }]} /></Card>
        <Card title="DateRangePicker"><V.DateRangePicker label="First seen" value={drp[0]} onChange={drp[1]} /></Card>
        <Card title="RadioGroup"><V.RadioGroup label="Exposure" inline value={rad[0]} onChange={rad[1]} options={[{ value: "internet", label: "Internet-facing" }, { value: "internal", label: "Internal" }, { value: "isolated", label: "Air-gapped", disabled: true }]} /></Card>
        <Card title="TagInput"><V.TagInput label="CVE watchlist" value={tags[0]} onChange={tags[1]} validate={function (t) { return /^CVE-\d{4}-\d{4,}$/i.test(t) || "Use the CVE-YYYY-NNNN format"; }} hint="Paste a comma-separated list" /></Card>
        <Card title="Textarea"><V.Textarea label="Risk acceptance reason" required value={ta[0]} maxLength={280} onChange={function (e) { ta[1](e.target.value); }} hint="Shown to approvers and in the exception register" /></Card>
        <Card title="Slider"><V.Slider label="Risk threshold for tickets" value={sl[0]} onChange={sl[1]} marks={[{ value: 0, label: "0" }, { value: 50, label: "50" }, { value: 100, label: "100" }]} /></Card>
        <Card title="QueryBuilder"><V.QueryBuilder fields={FIELDS} value={q[0]} onChange={q[1]} count={ROWS.filter(function (r) { return V.qbMatch(q[0], r); }).length} /><p className="up-help">{V.qbSummary(q[0], FIELDS)}</p></Card>
        <Card title="Gauge"><div className="row-wrap"><V.Gauge value={93} label="Threat index" caption="Threat index" /><V.Gauge value={38} label="Coverage gap" caption="Coverage gap" /></div></Card>
        <Card title="FunnelChart"><V.FunnelChart stages={[{ label: "Found", value: 212 }, { label: "Triaged", value: 180, color: "var(--chart-2)" }, { label: "Ticketed", value: 131, color: "var(--chart-3)" }, { label: "Fixed (claimed)", value: 88, color: "var(--chart-4)" }, { label: "Verified", value: 61, color: "var(--status-ok)" }]} onSelect={function () {}} /></Card>
        <Card title="CalendarHeatmap"><V.CalendarHeatmap data={heat} unit="actions" /></Card>
        <Card title="Progress, spinner, status"><V.ProgressBar label="Parsing nessus export" value={64} /><V.ProgressBar label="Uploading evidence" tone="ok" value={100} valueText="Done" /><V.ProgressBar label="Waiting for scanner" /><div className="row-wrap"><V.Spinner showLabel label="Loading intel feed" /><V.StatusIndicator status="ok">Sync healthy</V.StatusIndicator><V.StatusIndicator status="running">Scan running</V.StatusIndicator><V.StatusIndicator status="danger">Feed failing</V.StatusIndicator><V.CountBadge count={128} tone="danger" /></div></Card>
        <Card title="Avatar, Kbd, Copy"><div className="row-wrap"><V.AvatarGroup names={["Aadish Das", "Priya Rao", "Sam Lee", "Ivan Petrov", "Maya Chen", "Omar Haddad"]} /><V.Kbd keys={["mod", "K"]} /><V.Kbd>shift+?</V.Kbd><V.CopyButton text="CVE-2021-41773" label="Copy CVE" /></div></Card>
        <Card title="KeyValueList"><V.KeyValueList items={[{ label: "Host", value: "10.100.1.10:443", mono: true, copy: true }, { label: "CVE", value: "CVE-2021-41773", mono: true, copy: true }, { label: "First seen", value: "2026-05-02" }, { label: "Owner", value: "Server Team" }]} /></Card>
        <Card title="Accordion"><V.Accordion multiple open={acc[0]} onChange={acc[1]} sections={[{ id: "a", title: "Description", meta: "CWE-22", content: "Path traversal in Apache 2.4.49 lets an attacker map URLs to files outside the document root." }, { id: "b", title: "Solution", content: "Upgrade to Apache 2.4.51 or later." }, { id: "c", title: "References", meta: "3", content: "NVD · CISA KEV · vendor advisory" }]} /></Card>
        <Card title="Popover"><V.Popover trigger={<span className="up-edit">What is SSVC?</span>} title="SSVC decision">Stakeholder-Specific Vulnerability Categorization: Act, Attend, Track* or Track, based on exploitation, exposure and impact.</V.Popover></Card>
        <Card title="Wizard"><V.Wizard step={wz[0]} onStepChange={wz[1]} steps={[{ title: "Choose scanner", content: <p className="up-help">Nessus, Burp, ZAP…</p> }, { title: "Map columns", content: <p className="up-help">Host, severity, CVSS…</p> }, { title: "Review", optional: true, content: <p className="up-help">212 rows ready.</p> }]} onSubmit={function () { wz[1](0); }} submitLabel="Import" /></Card>
        <Card title="JsonViewer"><V.JsonViewer title="Nuclei result" data={{ "template-id": "CVE-2021-41773", host: "http://10.100.1.10", matched: true, info: { severity: "critical", tags: ["cve", "lfi", "apache"] }, "curl-command": "curl -X GET 'http://10.100.1.10/cgi-bin/.%2e/.%2e/etc/passwd'" }} /></Card>
        <Card title="DiffView"><V.DiffView beforeLabel="Scan Q1" afterLabel="Re-test Q2" before={"Server: Apache/2.4.49\nX-Powered-By: PHP/7.4\nHTTP/1.1 200 OK"} after={"Server: Apache/2.4.58\nHTTP/1.1 403 Forbidden"} /></Card>
        <Card title="TruncatedText"><V.TruncatedText lines={2}>{"An out-of-bounds write in the SSL-VPN daemon allows a remote unauthenticated attacker to execute arbitrary code or commands via specially crafted HTTP requests. Exploitation has been observed in the wild and the vulnerability is listed in the CISA Known Exploited Vulnerabilities catalog with a federal due date. Upgrade the appliance firmware immediately and review logs for indicators of compromise."}</V.TruncatedText></Card>
        <Card title="ActivityTimeline"><V.ActivityTimeline items={[{ id: 1, at: "2026-10-06T09:12:00", actor: "Priya Rao", text: "accepted risk on SQL Injection in /api/orders until 2026-11-05", tone: "warn" }, { id: 2, at: "2026-10-06T08:40:00", actor: "Sam Lee", text: "raised SEC-0142 for Apache Tomcat RCE", tone: "info" }, { id: 3, at: "2026-10-05T17:02:00", actor: "Aadish Das", text: "imported Nessus scan · 212 findings", tone: "ok" }]} /></Card>
      </div>
      <Gallery2 />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Gallery />);
