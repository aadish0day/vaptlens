import { AuthShell } from "@/app/auth/AuthShell";
import { Field } from "@/app/auth/Field";
import { PwMeter } from "@/app/auth/PwMeter";
import { AUTH, passwordIssues } from "@/lib/auth";
import React, { useState } from "react";
import * as V from "@/ui";

export function SetupScreen(p) {
  var u = useState("admin"),
    n = useState(""),
    a = useState(""),
    b = useState(""),
    busy = useState(false),
    err = useState("");
  var issues = passwordIssues(a[0], u[0]),
    ok =
      /^[a-z0-9._-]{3,32}$/.test(u[0].trim().toLowerCase()) &&
      !issues.length &&
      a[0] === b[0];
  return (
    <AuthShell
      title="Create the administrator"
      sub="This is a new VAPTLens server. Create the first administrator; you can add teammates from Users afterwards. Accounts and data live on this server, so you can sign in from any browser."
      cta="Create administrator"
      busyLabel="Creating account…"
      busy={busy[0]}
      disabled={!ok}
      err={err[0]}
      onSubmit={function () {
        if (!ok) return;
        busy[1](true);
        AUTH.setup({
          username: u[0],
          name: n[0],
          password: a[0],
        }).then(
          function (r) {
            p.onDone(r);
          },
          function (e) {
            busy[1](false);
            err[1](e.message || "Setup failed.");
          },
        );
      }}
    >
      <Field
        label="Username"
        input={{
          value: u[0],
          autoComplete: "username",
          autoCapitalize: "none",
          onChange: function (e) {
            u[1](e.target.value);
          },
        }}
      />
      <Field
        label="Display name"
        input={{
          value: n[0],
          placeholder: "Your name",
          autoComplete: "name",
          onChange: function (e) {
            n[1](e.target.value);
          },
        }}
      />
      <Field
        label="Password"
        input={{
          type: "password",
          value: a[0],
          autoComplete: "new-password",
          onChange: function (e) {
            a[1](e.target.value);
          },
        }}
      />
      <PwMeter value={a[0]} username={u[0]} />
      <Field
        label="Repeat password"
        input={{
          type: "password",
          value: b[0],
          autoComplete: "new-password",
          onChange: function (e) {
            b[1](e.target.value);
          },
        }}
      />
      {b[0] && a[0] !== b[0] ? (
        <p className="lock-err">The passwords don't match.</p>
      ) : null}
    </AuthShell>
  );
}
