import React from "react";
import * as V from "@/ui";

export function AuthShell(p) {
  return (
    <div className="lock">
      <form
        className="lock-card"
        onSubmit={function (e) {
          e.preventDefault();
          p.onSubmit();
        }}
        noValidate={true}
      >
        <div className="lock-brand">
          <V.Logo size={26} />
        </div>
        <h1 className="lock-t">{p.title}</h1>
        {p.sub ? <p className="lock-s">{p.sub}</p> : null}
        {p.children}
        {p.err ? (
          <p className="lock-err" role="alert">
            {p.err}
          </p>
        ) : null}
        <V.Button
          variant="primary"
          type="submit"
          disabled={p.disabled}
          loading={!!p.busy}
          aria-label={p.busy ? p.busyLabel || "Working…" : undefined}
        >
          {p.cta}
        </V.Button>
        {p.foot || null}
      </form>
    </div>
  );
}
