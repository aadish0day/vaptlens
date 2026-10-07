import { nowIso } from "@/app/lib/common";
import { P, imageToDataUrl } from "@/lib/store";
import React, { useEffect, useRef, useState } from "react";
import * as V from "@/ui";

export function Evidence(p) {
  var ev = useState(undefined),
    list = ev[0],
    inp = useRef(null),
    big = useState(null);
  useEffect(
    function () {
      var live = true;
      P.evidence(p.fkey).then(function (x) {
        /* undefined = still loading, null = vault locked, array = the evidence */
        if (live) ev[1](x === undefined ? null : x);
      });
      return function () {
        live = false;
      };
    },
    [p.fkey],
  );
  function add(files) {
    Promise.all(
      Array.prototype.slice
        .call(files || [])
        .slice(0, 6)
        .map(function (f) {
          return imageToDataUrl(f).then(function (u) {
            return {
              id:
                Date.now().toString(36) +
                Math.random().toString(36).slice(2, 5),
              name: f.name,
              url: u,
              at: nowIso(),
            };
          });
        }),
    )
      .then(function (add2) {
        var n = (list || []).concat(add2);
        ev[1](n);
        return P.setEvidence(p.fkey, n).then(function () {
          p.ctx.log(
            "EVIDENCE",
            add2.length + " screenshot(s) added to " + p.name,
          );
        });
      })
      .catch(function (e) {
        p.ctx.toast({
          title: "Couldn't add evidence",
          message: e.message,
          tone: "danger",
        });
      });
    if (inp.current) inp.current.value = "";
  }
  function del(id) {
    var gone = list.find(function (x) {
        return x.id === id;
      }),
      n = list.filter(function (x) {
        return x.id !== id;
      });
    ev[1](n);
    P.setEvidence(p.fkey, n);
    p.ctx.log("EVIDENCE", "Screenshot removed from " + p.name);
    var tid = p.ctx.toast({
      title: "Screenshot removed",
      action: {
        label: "Undo",
        onClick: function () {
          P.evidence(p.fkey).then(function (cur) {
            var back = (cur || []).some(function (x) {
              return x.id === id;
            })
              ? cur
              : (cur || []).concat([gone]);
            ev[1](back);
            return P.setEvidence(p.fkey, back);
          });
          p.ctx.log("UNDO", "Screenshot restored on " + p.name);
          p.ctx.dropToast(tid);
        },
      },
    });
  }
  if (list === undefined) return <span className="up-help">Loading evidence…</span>;
  if (list === null)
    return (
      <span className="up-help">
        Evidence is encrypted — sign in to view or add screenshots.
      </span>
    );
  return (
    <div className="ev">
      <div className="ev-grid">
        {list.map(function (x) {
          return (
            <figure key={x.id} className="ev-item">
              <button
                type="button"
                className="ev-img"
                onClick={function () {
                  big[1](x);
                }}
                aria-label={"Open " + x.name}
              >
                <img src={x.url} alt={x.name} />
              </button>
              <figcaption>
                <span>{x.name}</span>
                {p.readOnly ? null : (
                  <button
                    type="button"
                    className="up-pill-x"
                    aria-label={"Remove " + x.name}
                    onClick={function () {
                      del(x.id);
                    }}
                  >
                    ×
                  </button>
                )}
              </figcaption>
            </figure>
          );
        })}
        {p.readOnly ? null : (
          <button
            type="button"
            className="ev-add"
            onClick={function () {
              if (inp.current) inp.current.click();
            }}
          >
            <V.Icon name="paperclip" size={14} />
            Add screenshots
          </button>
        )}
      </div>
      <input
        ref={inp}
        type="file"
        accept="image/*"
        multiple={true}
        hidden={true}
        onChange={function (e) {
          add(e.target.files);
        }}
      />
      {big[0] ? (
        <V.Modal
          title={big[0].name}
          width="1000px"
          onClose={function () {
            big[1](null);
          }}
        >
          <img className="ev-big" src={big[0].url} alt={big[0].name} />
        </V.Modal>
      ) : null}
    </div>
  );
}
