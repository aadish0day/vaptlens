import { AuthShell } from "@/app/auth/AuthShell";
import { Field } from "@/app/auth/Field";
import { AUTH } from "@/lib/auth";
import React, { useState } from "react";

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
"Sign in with the account an administrator gave you."
      }
      cta="Sign in"
      busyLabel="Signing in…"
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
            Ask an administrator to reset it from Users; you'll get a temporary
            password and choose your own at sign-in. If the only administrator
            is locked out, whoever runs the server can reset it with{" "}
            <code>node server/server.mjs reset-password &lt;username&gt;</code>.
          </p>
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
