import { AuthShell } from "@/app/auth/AuthShell";
import { Field } from "@/app/auth/Field";
import { AUTH } from "@/lib/auth";
import { WS } from "@/lib/store";
import React, { useState } from "react";
import * as V from "@/ui";

export function LoginScreen(p) {
  var u = useState(function () {
      try {
        return localStorage.getItem("vaptlens.lastUser") || "";
      } catch (e) {
        return "";
      }
    }),
    pw = useState(""),
    busy = useState(false),
    err = useState(p.notice || "");
  return (
    <AuthShell
      title="Sign in"
      sub={
        "Workspace: " +
        WS.current() +
        ". Your password unlocks the encrypted data in this browser and is never sent anywhere."
      }
      cta="Sign in"
      busyLabel="Unlocking…"
      busy={busy[0]}
      disabled={!u[0] || !pw[0]}
      err={err[0]}
      onSubmit={function () {
        busy[1](true);
        err[1]("");
        AUTH.login(u[0], pw[0]).then(
          function (r) {
            try {
              localStorage.setItem("vaptlens.lastUser", r.user.username);
            } catch (e) {}
            p.onDone(r);
          },
          function (e) {
            busy[1](false);
            pw[1]("");
            err[1](e.message || "Sign-in failed.");
          },
        );
      }}
      foot={
        <details className="lock-help">
          <summary>Forgot your password?</summary>
          <p className="lock-s">
            Ask an administrator to reset it from Users. If no administrator can
            sign in, the encrypted data can't be recovered; you can erase it and
            start again.
          </p>
          <V.Button
            size="sm"
            variant="danger"
            type="button"
            onClick={function () {
              if (p.onErase) p.onErase();
            }}
          >
            Erase this workspace…
          </V.Button>
        </details>
      }
    >
      <Field
        label="Username"
        input={{
          value: u[0],
          autoComplete: "username",
          autoCapitalize: "none",
          autoFocus: !u[0],
          onChange: function (e) {
            u[1](e.target.value);
          },
        }}
      />
      <Field
        label="Password"
        input={{
          type: "password",
          value: pw[0],
          autoComplete: "current-password",
          autoFocus: !!u[0],
          onChange: function (e) {
            pw[1](e.target.value);
          },
        }}
      />
    </AuthShell>
  );
}
