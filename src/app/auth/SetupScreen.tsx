import { AuthShell } from "@/app/auth/AuthShell";
import { Field } from "@/app/auth/Field";
import { PwMeter } from "@/app/auth/PwMeter";
import { AUTH, passwordIssues } from "@/lib/auth";
import { SYNC } from "@/lib/sync";
import React, { useState } from "react";
import * as V from "@/ui";

export function SetupScreen(p) {
  var u = useState("admin"),
    n = useState(""),
    a = useState(""),
    b = useState(""),
    busy = useState(false),
    err = useState(""),
    tk = useState(""),
    jb = useState(false);
  /* a teammate's first visit: pull the team's workspace and accounts instead of creating a new administrator */
  function join() {
    SYNC.setToken(tk[0]);
    jb[1](true);
    err[1]("");
    SYNC.pull().then(
      function () {
        location.reload();
      },
      function (e) {
        jb[1](false);
        err[1](e.message);
      },
    );
  }
  var issues = passwordIssues(a[0], u[0]),
    ok =
      /^[a-z0-9._-]{3,32}$/.test(u[0].trim().toLowerCase()) &&
      !issues.length &&
      a[0] === b[0];
  return (
    <AuthShell
      title="Create the administrator"
      sub="VAPTLens now needs a sign-in. Accounts live only in this browser, and your password encrypts everything VAPTLens stores here. There is no reset link: if every administrator forgets their password, the data can't be recovered — add a second administrator and keep backups."
      cta={"Create account & encrypt"}
      busyLabel="Encrypting workspace…"
      busy={busy[0]}
      disabled={!ok || jb[0]}
      err={err[0]}
      foot={
        <details className="lock-help">
          <summary>Joining a team? Pull its workspace instead</summary>
          <p className="lock-s">
            Paste the team token from your administrator. The team's workspace
            and accounts replace this screen, then you sign in with the account
            they made for you.
          </p>
          <Field
            label="Team token"
            input={{
              type: "password",
              value: tk[0],
              autoComplete: "off",
              onChange: function (e) {
                tk[1](e.target.value);
              },
            }}
          />
          <V.Button size="sm" disabled={!tk[0].trim() || jb[0]} onClick={join}>
            {jb[0] ? "Pulling…" : "Pull team workspace"}
          </V.Button>
        </details>
      }
      onSubmit={function () {
        if (!ok) return;
        busy[1](true);
        AUTH.setup({
          username: u[0],
          name: n[0],
          password: a[0],
        }).then(
          function () {
            p.onDone({
              user: AUTH.user,
              first: true,
            });
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
