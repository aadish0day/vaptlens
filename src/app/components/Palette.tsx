import { digestMd } from "@/app/automation/utils";
import { hostLabel, uniq } from "@/app/lib/common";
import { saveFile } from "@/app/lib/export";
import { localDay } from "@/lib/engine";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as V from "@/ui";

/* ---------- Command palette ---------- */
export function Palette(p) {
  var ctx = p.ctx,
    q = useState(""),
    sel = useState(0),
    inp = useRef(null);
  useEffect(function () {
    if (inp.current) inp.current.focus();
  }, []);
  var items = useMemo(
    function () {
      return p.views
        .map(function (v, i) {
          return {
            k: "v" + v[0],
            label: "Go to " + v[1],
            hint: String(i === 9 ? 0 : i + 1),
            run: function () {
              ctx.go(v[0]);
            },
          };
        })
        .concat([
          {
            k: "a-up",
            label: "Upload scans",
            hint: "action",
            run: p.actions.upload,
          },
          {
            k: "a-data",
            label: "Open Data & workspaces",
            hint: "action",
            run: p.actions.data,
          },
          {
            k: "a-ask",
            label: "Ask Claude about your exposure",
            hint: "action",
            run: p.actions.ask,
          },
          {
            k: "a-rules",
            label: "Run automation rules",
            hint: "action",
            run: function () {
              ctx.runRules();
            },
          },
          {
            k: "a-dig",
            label: "Copy weekly digest (Markdown)",
            hint: "action",
            run: function () {
              var t = digestMd(ctx);
              try {
                navigator.clipboard.writeText(t).then(
                  function () {
                    ctx.toast({
                      title: "Digest copied",
                    });
                  },
                  function () {
                    saveFile(ctx, "vaptlens-digest-" + localDay() + ".md", t);
                  },
                );
              } catch (e) {
                saveFile(ctx, "vaptlens-digest-" + localDay() + ".md", t);
              }
            },
          },
          {
            k: "a-out",
            label: "Sign out",
            hint: "action",
            run: p.actions.signout,
          },
        ])
        .concat(
          uniq(
            ctx.active.map(function (x) {
              return x.host;
            }),
          ).map(function (hh) {
            return {
              k: "h" + hh,
              label: hh,
              hint: "host",
              run: function () {
                ctx.openHost(hh);
              },
            };
          }),
        )
        .concat(
          ctx.active
            .slice()
            .sort(function (a, b) {
              return b.risk - a.risk;
            })
            .slice(0, 300)
            .map(function (f) {
              return {
                k: "f" + f.id,
                label: f.name + " · " + hostLabel(f),
                hint: "finding · risk " + f.risk,
                run: function () {
                  ctx.openFinding(f.key);
                },
              };
            }),
        )
        /* read-only roles never see actions that change data */ .filter(
          function (it) {
            return !(ctx.readOnly && (it.k === "a-up" || it.k === "a-rules"));
          },
        );
    },
    [ctx.active, ctx.readOnly],
  );
  var qq = q[0].trim().toLowerCase(),
    list = (
      qq
        ? items.filter(function (x) {
            return (x.label + " " + x.hint).toLowerCase().indexOf(qq) >= 0;
          })
        : items.slice(0, 12)
    ).slice(0, 12);
  function go(it) {
    p.onClose();
    setTimeout(it.run, 30);
  }
  return (
    <V.Modal title="Command palette" width="620px" onClose={p.onClose}>
      <div className="pal">
        <input
          ref={inp}
          data-esc-closes="true"
          className="wb-select pal-in"
          placeholder="Jump to a view, host, finding or action…"
          value={q[0]}
          aria-label="Search commands"
          onChange={function (e) {
            q[1](e.target.value);
            sel[1](0);
          }}
          onKeyDown={function (e) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              sel[1](Math.min(list.length - 1, sel[0] + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              sel[1](Math.max(0, sel[0] - 1));
            } else if (e.key === "Enter" && list[sel[0]]) {
              e.preventDefault();
              go(list[sel[0]]);
            }
          }}
        />
        <ul className="pal-list" role="listbox">
          {list.map(function (it, i) {
            return (
              <li
                key={it.k}
                role="option"
                aria-selected={i === sel[0]}
                className={i === sel[0] ? "is-on" : ""}
                onMouseEnter={function () {
                  sel[1](i);
                }}
                onClick={function () {
                  go(it);
                }}
              >
                <span>{it.label}</span>
                <kbd>{it.hint}</kbd>
              </li>
            );
          })}
          {list.length ? null : <li className="pal-none">No matches.</li>}
        </ul>
      </div>
    </V.Modal>
  );
}

/* ---------- Claude assistant (viewer-paid, opt-in, hosts masked by default) ---------- */
