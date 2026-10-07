import { App } from "@/app/App";
import { AuthShell } from "@/app/auth/AuthShell";
import { ChangePasswordScreen } from "@/app/auth/ChangePasswordScreen";
import { LoginScreen } from "@/app/auth/LoginScreen";
import { SetupScreen } from "@/app/auth/SetupScreen";
import { AUTH } from "@/lib/auth";
import { P, WS } from "@/lib/store";
import React, { useEffect, useRef, useState } from "react";
import * as V from "@/ui";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

/* phases: check → setup | login → (change) → loading → app; "down" when the server can't be reached */
export function Root() {
  var ph = useState("check"),
    phase = ph[0],
    setPhase = ph[1];
  var bs = useState(null),
    boot = bs[0],
    setBoot = bs[1],
    me = useState(null),
    notice = useState(""),
    err = useState(""),
    lastR = useRef(null);

  function load(r) {
    setPhase("loading");
    Promise.all([P.loadAll(), AUTH.loadDirectory()]).then(
      function (x) {
        var b = x[0];
        (b as any).login = r;
        setBoot(b);
        setPhase("app");
      },
      function (e) {
        /* the workspace remembered in this browser may have been deleted: fall back to the first one */
        if (e && e.status === 404)
          return WS.list().then(function (l) {
            if (l.length && l[0].name !== WS.current()) {
              WS.setCurrent(l[0].name);
              load(r);
            } else {
              err[1]("No workspace exists yet. Ask an administrator to create one.");
              setPhase("down");
            }
          });
        if (e && e.status === 401) return;
        err[1](e && e.message ? e.message : "Couldn't load the workspace.");
        setPhase("down");
      },
    );
  }
  function enter(r) {
    me[1](r.user);
    lastR.current = r;
    if (r.mustChange) setPhase("change");
    else load(r);
  }
  function check() {
    setPhase("check");
    AUTH.state().then(
      function (s) {
        if (s.setupNeeded) setPhase("setup");
        else if (s.user) enter({ user: s.user, mustChange: s.mustChange, resumed: true });
        else {
          if (s.signedOut) notice[1](s.signedOut);
          setPhase("login");
        }
      },
      function (e) {
        err[1](e.message);
        setPhase("down");
      },
    );
  }
  useEffect(function () {
    try {
      var why = sessionStorage.getItem("vaptlens.signedOut");
      if (why) {
        notice[1](why);
        sessionStorage.removeItem("vaptlens.signedOut");
      }
    } catch (e) {}
    check();
    /* any 401 from the API (idle timeout, account disabled, signed out elsewhere) returns to sign-in */
    return P.on(function (e) {
      if (e.type !== "auth") return;
      notice[1](e.message || "You were signed out. Sign in again to continue.");
      setBoot(null);
      setPhase("login");
    });
  }, []);

  if (phase === "app" && boot) {
    return (
      <ErrorBoundary>
        <App boot={boot} me={me[0]} />
      </ErrorBoundary>
    );
  }
  if (phase === "setup") return <SetupScreen onDone={enter} />;
  if (phase === "login") return <LoginScreen notice={notice[0]} onDone={enter} />;
  if (phase === "change")
    return (
      <ChangePasswordScreen
        user={me[0]}
        onDone={function () {
          load(Object.assign({}, lastR.current, { mustChange: false, changedPw: true }));
        }}
      />
    );
  if (phase === "down")
    return (
      <AuthShell title="Can't reach VAPTLens" sub={err[0] || "The server didn't answer."} cta="Try again" onSubmit={check}>
        <p className="lock-s">
          Your data is safe on the server; nothing is shown until it can be loaded, so nothing can be overwritten
          by mistake.
        </p>
      </AuthShell>
    );
  return (
    <div className="boot">
      <V.Skeleton variant="rows" rows={3} />
    </div>
  );
}
