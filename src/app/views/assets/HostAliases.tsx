import { count, uniq } from "@/app/lib/common";
import { canonHost } from "@/lib/engine";
import React, { useState } from "react";
import * as V from "@/ui";

/* other names the same machine goes by (FQDN, NetBIOS, old IP): their findings fold onto this host */
export function HostAliases(q) {
  var p = q.p,
    v = useState(""),
    cf = useState(null),
    mine = Object.keys(p.aliases || {}).filter(function (a) {
      return canonHost(a, p.aliases) === p.host;
    });
  /* merging hosts can't be undone: administrators only, after a preview of what moves */
  function add(e) {
    e.preventDefault();
    var a = v[0].trim().toLowerCase();
    if (!a) return;
    if (a === p.host) return;
    if (!cf[0] || cf[0].a !== a) {
      var rows0 = uniq(
        p.data
          .filter(function (x) {
            return x.host === a;
          })
          .map(function (x) {
            return x.key;
          }),
      );
      cf[1]({
        a: a,
        n: rows0.length,
        d: count(rows0, function (k) {
          return !!p.gov[k];
        }),
      });
      return;
    }
    cf[1](null);
    if (canonHost(p.host, p.aliases) === a) {
      p.toast({
        title: "That name already points here the other way",
        message: "Remove the alias on " + a + " first.",
        tone: "danger",
      });
      return;
    }
    p.addAliases([[a, p.host]], "manual");
    v[1]("");
  }
  return (
    <div className="wb-field">
      <span className="vl-label">Also known as</span>
      {mine.length ? (
        <div className="row-wrap">
          {mine.map(function (a) {
            return (
              <span key={a} className="alias-chip vl-mono">
                {a}
                {p.readOnly ? null : (
                  <button
                    type="button"
                    className="vl-icon-btn"
                    aria-label={"Remove alias " + a}
                    onClick={function () {
                      p.removeAlias(a);
                    }}
                  >
                    <V.Icon name="x" size={12} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ) : (
        <span className="up-help">
          No aliases. Nessus and Nmap hostnames are added automatically.
        </span>
      )}
      {!p.isAdmin ? (
        <span className="up-help">Administrators can add aliases.</span>
      ) : (
        <form className="sv-form" onSubmit={add}>
          <input
            className="wb-select"
            value={v[0]}
            placeholder="web01.corp.local"
            aria-label="Add an alias"
            onChange={function (e) {
              v[1](e.target.value);
              cf[1](null);
            }}
          />
          <V.Button
            size="sm"
            type="submit"
            variant={cf[0] ? "danger" : undefined}
            disabled={!v[0].trim()}
          >
            {cf[0] ? "Confirm merge" : "Add alias"}
          </V.Button>
          {cf[0] ? (
            <span className="up-help" role="status">
              {cf[0].n
                ? "Merges " +
                  cf[0].n +
                  " finding(s) and " +
                  cf[0].d +
                  " decision(s) from " +
                  cf[0].a +
                  " into " +
                  p.host +
                  ". This can't be undone."
                : "No findings on " +
                  cf[0].a +
                  " yet; future scans will fold into " +
                  p.host +
                  "."}
            </span>
          ) : null}
        </form>
      )}
    </div>
  );
}

/* ================= 3. SLA & RACI ================= */
/* SLA label for a severity: the base window, or a range when tier overrides apply to some findings */
