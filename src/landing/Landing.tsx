import React, { useEffect, useRef } from "react";
import { BOARD, KERN, PLATES, WORD } from "@/landing/data";
import { startScene } from "@/landing/scene";

/* the app lives at /app/; the landing page is the site root */
var APP = "app/";

function BoardRow(p: { f: (typeof BOARD)[number] }) {
  var f = p.f,
    byCvss = f[5],
    byRisk = f[6];
  return (
    <div
      className={
        "lx-row" +
        (byRisk < byCvss - 1 ? " up" : byRisk > byCvss + 1 ? " down" : "")
      }
    >
      <span className="n"></span>
      <span className="nm">
        <i title={f[0] + " " + f[1]}>{f[0]}</i>
        {f[4].map(function (t) {
          return (
            <span key={t} className={"lx-tag" + (t === "RANSOM" ? " r" : "")}>
              {t}
            </span>
          );
        })}
      </span>
      <span className="cv">{f[2].toFixed(1)}</span>
      <span className="lx-risk">
        <s style={{ ["--w" as any]: f[3] + "%" }}></s>
        <b>{f[3]}</b>
      </span>
      <span
        className={
          "mv " + (byCvss === byRisk ? "z" : byCvss > byRisk ? "u" : "d")
        }
      >
        {byCvss === byRisk
          ? "="
          : (byCvss > byRisk ? "▲" : "▼") + Math.abs(byCvss - byRisk)}
      </span>
    </div>
  );
}

export function Landing() {
  var root = useRef<HTMLDivElement>(null);
  /* the scroll-scrubbed scene (WebGL, reveals, board, nav) runs against the rendered markup */
  useEffect(function () {
    return startScene(root.current!);
  }, []);
  return (
    <div ref={root}>
      <header className="lx-top">
        <a
          className="lx-brand"
          href="#cover"
          data-go="0"
          aria-label="VAPTLens, back to top"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="#f2ede4" strokeWidth="1.6" />
            <circle
              cx="12"
              cy="12"
              r="4.2"
              stroke="#ffb020"
              strokeWidth="1.6"
            />
            <path
              d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"
              stroke="#f2ede4"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          VAPTLENS
        </a>
        <div className="lx-top-r">
          <div className="lx-plate" aria-live="polite">
            <span id="plateNo">
              <b>01</b> / 06
            </span>
            <span className="nm" id="plateName">
              · Cover
            </span>
          </div>
          <nav className="lx-auth" aria-label="Account">
            <a className="lx-link" href={APP}>
              Sign in
            </a>
            <a className="lx-btn pri sm" href={APP}>
              Sign up
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section
          className="lx-spec"
          id="spec"
          aria-label="VAPTLens, in six plates"
        >
          <div className="lx-stage" id="stage">
            <div className="lx-glow" id="glow" aria-hidden="true"></div>
            <canvas
              className="lx-canvas"
              id="gl"
              aria-label="Liquid chrome that reshapes per section: a lens, the 17 sample findings, a ranking gate, a padlock, a container"
              role="img"
            ></canvas>
            <div className="lx-grain" aria-hidden="true"></div>
            <div className="lx-scrim" aria-hidden="true"></div>
            <div className="lx-rule t" aria-hidden="true"></div>
            <div className="lx-rule b" aria-hidden="true"></div>
            <div className="lx-bar" id="bar" aria-hidden="true"></div>
            <div className="lx-foot-meta" aria-hidden="true">
              <span>Type specimen · VAPT analytics workbench</span>
              <span id="footCoord">Plate 1.00</span>
            </div>

            {/* 0 cover */}
            <article className="lx-frame lx-cover" id="cover" data-frame="0">
              <div className="lx-cover-top" data-fx="fade" data-d="0">
                <div className="lx-kicker">Plate 01 — Cover</div>
                <dl className="lx-specs">
                  <div>
                    <dt>In</dt>
                    <dd>17 findings · 1 Nessus export</dd>
                  </div>
                  <div>
                    <dt>Out</dt>
                    <dd>1 fix order · SLA on each</dd>
                  </div>
                  <div>
                    <dt>Runs on</dt>
                    <dd>Your hardware</dd>
                  </div>
                </dl>
              </div>
              <div className="lx-cover-main">
                <h1
                  className="lx-word"
                  id="word"
                  aria-label="VAPTLens"
                  data-fx="clip"
                  data-d=".05"
                >
                  {WORD.split("").map(function (ch, i) {
                    return (
                      <span
                        key={i}
                        className={"l" + (i >= 4 ? " a" : "")}
                        aria-hidden="true"
                        style={
                          KERN[i] ? { marginRight: KERN[i] + "em" } : undefined
                        }
                      >
                        {ch}
                      </span>
                    );
                  })}
                </h1>
                <div className="lx-cover-row" data-fx="rise" data-d=".25">
                  <p className="lx-p">
                    Drop in a scanner export. Get findings in the order
                    attackers would use them, an SLA clock on each, and a record
                    an auditor can check.
                  </p>
                  <div className="lx-cta">
                    <button className="lx-btn pri" type="button" data-go="5">
                      Run it locally →
                    </button>
                    <button className="lx-btn" type="button" data-go="2">
                      See the ranking
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* 1 problem */}
            <article className="lx-frame c end" data-frame="1">
              <div className="lx-col" style={{ alignSelf: "end" }}>
                <div className="lx-kicker" data-fx="rise" data-d="0">
                  Plate 02 — The problem
                </div>
                <h2 className="lx-h" data-fx="rise" data-d=".1">
                  Your scanner sorts by CVSS.
                  <br />
                  <em>Attackers don't.</em>
                </h2>
                <p className="lx-p" data-fx="rise" data-d=".25">
                  In one sample Nessus export, an end-of-life server scored{" "}
                  <b>CVSS 10.0</b> ranks below an <b>8.1</b> SMB bug that
                  WannaCry used. Severity tells you how bad a bug could be. It
                  doesn't tell you what to fix first.
                </p>
              </div>
            </article>

            {/* 2 ranking */}
            <article className="lx-frame r" data-frame="2" id="rankFrame">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr)",
                  gap: "22px",
                  alignContent: "center",
                }}
              >
                <div className="lx-col">
                  <div className="lx-kicker" data-fx="rise" data-d="0">
                    Plate 03 — Ranking
                  </div>
                  <h2
                    className="lx-h"
                    data-fx="rise"
                    data-d=".08"
                    style={{ fontSize: "clamp(30px, min(4.6cqw, 7cqh), 64px)" }}
                  >
                    Same 17 findings.
                    <br />
                    <em>Fix order,</em> not panic order.
                  </h2>
                </div>
                <div
                  className="lx-board"
                  data-fx="rise"
                  data-d=".2"
                  aria-label="Top eight findings from the sample export, sorted by VAPTLens risk"
                >
                  <div className="lx-board-head">
                    <span>#</span>
                    <span className="lx-sortlab">
                      <span id="labA">Sorted by CVSS</span>
                      <span id="labB" style={{ opacity: 0 }}>
                        Sorted by VAPTLens risk
                      </span>
                    </span>
                    <span>CVSS</span>
                    <span>Risk</span>
                    <span className="dl">Move</span>
                  </div>
                  <div className="lx-rows" id="rows">
                    {BOARD.map(function (f) {
                      return <BoardRow key={f[0]} f={f} />;
                    })}
                  </div>
                  <p className="lx-board-note">
                    Sample: <b>test-data/nessus-sample.csv</b>. Risk blends
                    CVSS, EPSS, CISA KEV, ransomware use and asset exposure. The
                    chrome spiral is all 17 findings, largest risk at the top.
                  </p>
                </div>
              </div>
            </article>

            {/* 3 pipeline */}
            <article className="lx-frame lx-pipe-frame" data-frame="3">
              <div className="lx-col">
                <div className="lx-kicker" data-fx="rise" data-d="0">
                  Plate 04 — Pipeline
                </div>
                <h2 className="lx-h" data-fx="rise" data-d=".08">
                  Drop. Rank. <em>Prove.</em>
                </h2>
              </div>
              <div className="lx-steps" id="steps">
                <div className="lx-step" data-fx="rise" data-d=".2">
                  <span className="no">01</span>
                  <h3>Drop</h3>
                  <p>
                    Nessus, Qualys, OpenVAS, ZAP, Nuclei and more — 20 formats,
                    parsed in your browser. Only the findings are saved, to your
                    own server.
                  </p>
                  <code>scan.nessus → 17 findings</code>
                </div>
                <div className="lx-step" data-fx="rise" data-d=".32">
                  <span className="no">02</span>
                  <h3>Rank</h3>
                  <p>
                    A 0–100 risk score and an SSVC decision per finding.
                    Exploited-in-the-wild beats theoretical every time.
                  </p>
                  <code>Log4Shell · 96 · Act</code>
                </div>
                <div className="lx-step" data-fx="rise" data-d=".44">
                  <span className="no">03</span>
                  <h3>Prove</h3>
                  <p>
                    SLA clocks of 14 / 30 / 90 / 180 / 360 days, KEV due dates
                    that override them, and mapping to CIS v8.1, ISO 27001:2022,
                    NIST CSF 2.0 and PCI DSS 4.0.1.
                  </p>
                  <code>KEV due date &gt; internal SLA</code>
                </div>
              </div>
            </article>

            {/* 4 custody */}
            <article className="lx-frame r" data-frame="4">
              <div className="lx-col">
                <div className="lx-kicker" data-fx="rise" data-d="0">
                  Plate 05 — Custody
                </div>
                <h2 className="lx-h" data-fx="rise" data-d=".08">
                  Findings are <em>evidence.</em> Treat them like it.
                </h2>
                <dl className="lx-sheet" data-fx="rise" data-d=".22">
                  <dt>Where</dt>
                  <dd>
                    Your server, your database
                    <small>
                      PostgreSQL in Docker, never published to the network
                    </small>
                  </dd>
                  <dt>Sign-in</dt>
                  <dd>
                    scrypt-hashed passwords · lockout
                    <small>
                      HttpOnly, SameSite=Strict sessions with idle sign-out
                    </small>
                  </dd>
                  <dt>Network</dt>
                  <dd>
                    CSP connect-src 'self'
                    <small>No analytics, no CDNs, no third-party calls</small>
                  </dd>
                  <dt>Roles</dt>
                  <dd>
                    Administrator · Remediation Lead · Security Auditor
                    <small>Enforced by the server on every request</small>
                  </dd>
                  <dt>Risk accept</dt>
                  <dd>
                    Separation of duties · two-person rule
                    <small>Checked server-side; hash-chained audit trail</small>
                  </dd>
                </dl>
              </div>
            </article>

            {/* 5 install */}
            <article className="lx-frame c end" data-frame="5" id="install">
              <div className="lx-col" style={{ alignSelf: "end" }}>
                <div className="lx-kicker" data-fx="rise" data-d="0">
                  Plate 06 — Install
                </div>
                <h2 className="lx-h" data-fx="rise" data-d=".08">
                  One command. <em>Your box.</em>
                </h2>
                <div className="lx-code" data-fx="rise" data-d=".2">
                  <button className="lx-btn lx-copy" type="button" id="copy">
                    Copy
                  </button>
                  <pre id="cmd">
                    <span className="c"># in your VAPTLens checkout</span>
                    {"\n"}
                    <span className="p">$</span> cp .env.example .env{" "}
                    <span className="c"># set POSTGRES_PASSWORD</span>
                    {"\n"}
                    <span className="p">$</span> docker compose up --build
                    {"\n"}
                    <span className="c"># → http://127.0.0.1:8080</span>
                  </pre>
                </div>
                <p className="lx-fine" data-fx="fade" data-d=".35">
                  nginx + API server + PostgreSQL. Only the web port is
                  published, on localhost. Before others connect, put{" "}
                  <b>HTTPS</b> in front and set <b>ALLOWED_HOSTS</b>.
                </p>
                <div
                  className="lx-cta"
                  data-fx="rise"
                  data-d=".45"
                  style={{ justifyContent: "center" }}
                >
                  <a className="lx-btn pri" href={APP}>
                    Create your account
                  </a>
                  <a className="lx-btn" href={APP}>
                    Sign in
                  </a>
                </div>
              </div>
            </article>

            <nav className="lx-nav" id="nav" aria-label="Plates">
              {PLATES.map(function (n, i) {
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={"Plate " + (i + 1) + ": " + n}
                    data-go={i}
                  >
                    <span>{String(i + 1).padStart(2, "0") + " " + n}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </section>
        <footer className="lx-after">
          <span>
            <b>VAPTLens</b> — VAPT analytics workbench. Runs where your data
            already lives.
          </span>
          <span>
            Every number on this page comes from the bundled sample export.
          </span>
        </footer>
      </main>
    </div>
  );
}
