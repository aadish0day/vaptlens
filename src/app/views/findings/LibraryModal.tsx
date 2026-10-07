import { SEV_LABEL, count } from "@/app/lib/common";
import { SEV } from "@/lib/data";
import React, { useState } from "react";
import * as V from "@/ui";

export function LibraryModal(p) {
  var ctx = p.ctx,
    ed = useState(null),
    cur = ed[0];
  function save() {
    var e = Object.assign({}, cur);
    if (!e.match.trim()) return;
    e.id = e.id || "lib-" + Date.now().toString(36);
    ctx.setLibrary(
      ctx.library
        .filter(function (x) {
          return x.id !== e.id;
        })
        .concat([e]),
    );
    ctx.log("LIBRARY", 'Write-up saved for "' + e.match + '"');
    ed[1](null);
  }
  return (
    <V.Modal
      title="Finding library"
      subtitle="Reusable write-ups. When an imported finding's title contains the match text, its description, solution and (optionally) severity come from here."
      width="820px"
      onClose={p.onClose}
      footer={
        cur
          ? [
              <V.Button
                key="c"
                onClick={function () {
                  ed[1](null);
                }}
              >
                Cancel
              </V.Button>,
              <V.Button
                key="s"
                variant="primary"
                disabled={!cur.match.trim()}
                onClick={save}
              >
                Save write-up
              </V.Button>,
            ]
          : [
              <V.Button
                key="n"
                variant="primary"
                icon="plus"
                disabled={ctx.readOnly}
                onClick={function () {
                  ed[1]({
                    match: "",
                    title: "",
                    desc: "",
                    sol: "",
                    sev: "",
                  });
                }}
              >
                New write-up
              </V.Button>,
            ]
      }
    >
      {cur ? (
        <div className="stack">
          <label className="wb-field">
            <span className="vl-label">Match (title contains)</span>
            <input
              className="wb-select"
              value={cur.match}
              onChange={function (e) {
                ed[1](
                  Object.assign({}, cur, {
                    match: e.target.value,
                  }),
                );
              }}
            />
          </label>
          <label className="wb-field">
            <span className="vl-label">Severity override</span>
            <select
              className="wb-select"
              value={cur.sev || ""}
              onChange={function (e) {
                ed[1](
                  Object.assign({}, cur, {
                    sev: e.target.value || null,
                  }),
                );
              }}
            >
              {[["", "Keep scanner severity"]]
                .concat(
                  SEV.map(function (s) {
                    return [s, SEV_LABEL[s]];
                  }),
                )
                .map(function (o) {
                  return (
                    <option key={o[0]} value={o[0]}>
                      {o[1]}
                    </option>
                  );
                })}
            </select>
          </label>
          <label className="wb-field">
            <span className="vl-label">Description</span>
            <textarea
              className="sum-edit"
              rows={5}
              value={cur.desc}
              onChange={function (e) {
                ed[1](
                  Object.assign({}, cur, {
                    desc: e.target.value,
                  }),
                );
              }}
            />
          </label>
          <label className="wb-field">
            <span className="vl-label">Solution</span>
            <textarea
              className="sum-edit"
              rows={4}
              value={cur.sol}
              onChange={function (e) {
                ed[1](
                  Object.assign({}, cur, {
                    sol: e.target.value,
                  }),
                );
              }}
            />
          </label>
        </div>
      ) : ctx.library.length ? (
        <div className="up-list">
          {ctx.library.map(function (e) {
            var hits = count(ctx.active, function (x) {
              return x.name.toLowerCase().indexOf(e.match.toLowerCase()) >= 0;
            });
            return (
              <div key={e.id} className="up-row">
                <div className="up-main">
                  <span className="up-name">{e.match}</span>
                  <span className="up-meta">
                    {(e.sev ? SEV_LABEL[e.sev] + " · " : "") +
                      String(e.desc || "").slice(0, 90)}
                  </span>
                </div>
                <span className="up-count">{hits + " active"}</span>
                <span className="row-wrap">
                  <button
                    type="button"
                    className="up-edit"
                    disabled={ctx.readOnly}
                    onClick={function () {
                      ed[1](Object.assign({}, e));
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="vl-icon-btn"
                    disabled={ctx.readOnly}
                    aria-label={"Delete " + e.match}
                    onClick={function () {
                      var prev = ctx.library;
                      ctx.setLibrary(
                        ctx.library.filter(function (x) {
                          return x.id !== e.id;
                        }),
                      );
                      ctx.log("LIBRARY", 'Deleted write-up "' + e.match + '"');
                      ctx.listUndo(ctx.setLibrary, e, "Write-up deleted");
                    }}
                  >
                    <V.Icon name="x" size={14} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <V.EmptyState
          title="No write-ups yet."
          hint={
            'Open any finding and choose "Save write-up to library", or add one here.'
          }
        />
      )}
    </V.Modal>
  );
}

/* ================= 1. Dashboard ================= */
