import { AuthShell } from "@/app/auth/AuthShell";
import { Field } from "@/app/auth/Field";
import { AUTH } from "@/lib/auth";
import { IDB } from "@/lib/store";
import React, { useState } from "react";

export function EraseScreen(p) {
  var t = useState("");
  return (
    <AuthShell
      title="Erase this workspace?"
      sub="This deletes the accounts, scans, governance, notes, evidence and saved workspaces in this browser. It can't be undone."
      cta="Erase everything"
      disabled={t[0] !== "ERASE"}
      onSubmit={function () {
        var keep = localStorage.getItem("vaptlens-theme");
        Object.keys(localStorage)
          .filter(function (k) {
            return k.indexOf("vaptlens") === 0;
          })
          .forEach(function (k) {
            localStorage.removeItem(k);
          });
        if (keep) localStorage.setItem("vaptlens-theme", keep);
        AUTH.clearSession();
        IDB.all()
          .then(function (all) {
            return Promise.all(
              Object.keys(all)
                .filter(function (k) {
                  return k !== "intel";
                })
                .map(function (k) {
                  return IDB.del(k);
                }),
            );
          })
          .then(function () {
            location.reload();
          });
      }}
      foot={
        <button type="button" className="lock-forgot" onClick={p.onCancel}>
          Cancel
        </button>
      }
    >
      <Field
        label="Type ERASE to confirm"
        input={{
          value: t[0],
          autoFocus: true,
          onChange: function (e) {
            t[1](e.target.value);
          },
        }}
      />
    </AuthShell>
  );
}
