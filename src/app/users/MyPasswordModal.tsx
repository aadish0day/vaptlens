import { Field } from "@/app/auth/Field";
import { PwMeter } from "@/app/auth/PwMeter";
import { AUTH, passwordIssues } from "@/lib/auth";
import React, { useState } from "react";
import * as V from "@/ui";

export function MyPasswordModal(p) {
  var cur = useState(""),
    a = useState(""),
    b = useState(""),
    err = useState(""),
    busy = useState(false);
  var issues = passwordIssues(a[0], p.me.username),
    ok = cur[0] && !issues.length && a[0] === b[0];
  return (
    <V.Modal
      title="Change password"
      onClose={p.onClose}
      footer={[
        <V.Button key="c" onClick={p.onClose}>
          Cancel
        </V.Button>,
        <V.Button
          key="s"
          variant="primary"
          disabled={!ok || busy[0]}
          onClick={function () {
            busy[1](true);
            AUTH.verify(p.me.id, cur[0]).then(function (good) {
              if (!good) {
                busy[1](false);
                err[1]("The current password is wrong.");
                return;
              }
              return AUTH.setPassword(p.me.id, a[0], false).then(function () {
                p.ctx.log(
                  "PASSWORD",
                  p.me.username + " changed their password",
                );
                p.ctx.toast({
                  title: "Password changed",
                });
                p.onClose();
              });
            });
          }}
        >
          Save
        </V.Button>,
      ]}
    >
      <div className="stack">
        <Field
          label="Current password"
          input={{
            type: "password",
            value: cur[0],
            autoComplete: "current-password",
            onChange: function (e) {
              cur[1](e.target.value);
            },
          }}
        />
        <Field
          label="New password"
          input={{
            type: "password",
            value: a[0],
            autoComplete: "new-password",
            onChange: function (e) {
              a[1](e.target.value);
            },
          }}
        />
        <PwMeter value={a[0]} username={p.me.username} />
        <Field
          label="Repeat new password"
          input={{
            type: "password",
            value: b[0],
            autoComplete: "new-password",
            onChange: function (e) {
              b[1](e.target.value);
            },
          }}
        />
        {err[0] ? <p className="lock-err">{err[0]}</p> : null}
      </div>
    </V.Modal>
  );
}

/* ================= App ================= */
/* v2 fingerprints (rule ID first, web paths kept): re-key uploaded rows once and carry governance over */
