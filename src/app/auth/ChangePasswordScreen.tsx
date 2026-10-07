import { AuthShell } from "@/app/auth/AuthShell";
import { Field } from "@/app/auth/Field";
import { PwMeter } from "@/app/auth/PwMeter";
import { AUTH, passwordIssues } from "@/lib/auth";
import React, { useState } from "react";

export function ChangePasswordScreen(p) {
  var a = useState(""),
    b = useState(""),
    busy = useState(false),
    err = useState("");
  var issues = passwordIssues(a[0], p.user.username),
    ok = !issues.length && a[0] === b[0];
  return (
    <AuthShell
      title="Set a new password"
      sub="An administrator created or reset this account. Choose your own password before continuing."
      cta="Save password"
      busy={busy[0]}
      disabled={!ok}
      err={err[0]}
      onSubmit={function () {
        busy[1](true);
        AUTH.setPassword(p.user.id, a[0], false).then(p.onDone, function (e) {
          busy[1](false);
          err[1](e.message);
        });
      }}
    >
      <Field
        label="New password"
        input={{
          type: "password",
          value: a[0],
          autoComplete: "new-password",
          autoFocus: true,
          onChange: function (e) {
            a[1](e.target.value);
          },
        }}
      />
      <PwMeter value={a[0]} username={p.user.username} />
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
    </AuthShell>
  );
}
