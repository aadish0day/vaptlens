import { fmtTime } from "@/app/lib/common";
import { AUTH } from "@/lib/auth";
import React, { useState } from "react";
import * as V from "@/ui";

/* new data key; every store re-encrypted; other accounts need a fresh temporary password */
export function RotateKey(q) {
  var ctx = q.ctx,
    pw = useState(""),
    busy = useState(false),
    err = useState(""),
    st = AUTH.store() || {};
  function go(e) {
    e.preventDefault();
    busy[1](true);
    err[1]("");
    AUTH.rotateKey(pw[0]).then(
      function (n) {
        busy[1](false);
        pw[1]("");
        ctx.log(
          "KEY-ROTATE",
          "Data key rotated by " +
            ctx.me.username +
            " · " +
            n +
            " account(s) need a new temporary password",
        );
        ctx.toast({
          title: "Data key rotated",
          message: n
            ? n +
              " other account(s) can't sign in until you reset their password in Users."
            : "All data re-encrypted.",
        });
        if (q.onDone) q.onDone(n);
      },
      function (e2) {
        busy[1](false);
        err[1](e2.message || "Rotation failed; nothing was changed.");
      },
    );
  }
  return (
    <form className="rotate-key" onSubmit={go}>
      <div className="up-main">
        <span className="up-name">Rotate the data key</span>
        <span className="up-meta">
          {(st.keyRotatedAt
            ? "Last rotated " + fmtTime(st.keyRotatedAt) + ". "
            : "Never rotated. ") +
            "Do this after removing someone: their old password could still open a copy of the old key. Everyone else gets a new temporary password from you."}
        </span>
      </div>
      <div className="sv-form">
        <input
          type="password"
          className="wb-select"
          value={pw[0]}
          autoComplete="current-password"
          placeholder="Your password"
          aria-label="Your password"
          onChange={function (e) {
            pw[1](e.target.value);
          }}
        />
        <V.Button
          size="sm"
          variant="primary"
          type="submit"
          icon="refresh"
          disabled={!pw[0] || busy[0]}
        >
          {busy[0] ? "Re-encrypting…" : "Rotate key"}
        </V.Button>
      </div>
      {err[0] ? <p className="lock-err">{err[0]}</p> : null}
    </form>
  );
}
