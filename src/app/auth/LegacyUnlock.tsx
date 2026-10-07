import { AuthShell } from "@/app/auth/AuthShell";
import { Field } from "@/app/auth/Field";
import { VAULT } from "@/lib/store";
import React, { useState } from "react";

export function LegacyUnlock(p) {
  var pw = useState(""),
    busy = useState(false),
    err = useState("");
  return (
    <AuthShell
      title="Unlock to upgrade"
      sub="This workspace uses the old passphrase encryption. Unlock it once, then create an administrator account; the data is re-encrypted under the account."
      cta="Unlock"
      busy={busy[0]}
      disabled={!pw[0]}
      err={err[0]}
      onSubmit={function () {
        busy[1](true);
        VAULT.unlock(pw[0])
          .then(function () {
            return VAULT.disable();
          })
          .then(p.onDone, function (e) {
            busy[1](false);
            err[1](e.message);
          });
      }}
    >
      <Field
        label="Passphrase"
        input={{
          type: "password",
          value: pw[0],
          autoFocus: true,
          onChange: function (e) {
            pw[1](e.target.value);
          },
        }}
      />
    </AuthShell>
  );
}
