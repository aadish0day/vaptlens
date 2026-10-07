import { App } from "@/app/App";
import { ChangePasswordScreen } from "@/app/auth/ChangePasswordScreen";
import { EraseScreen } from "@/app/auth/EraseScreen";
import { LegacyUnlock } from "@/app/auth/LegacyUnlock";
import { LoginScreen } from "@/app/auth/LoginScreen";
import { SetupScreen } from "@/app/auth/SetupScreen";
import { AUTH } from "@/lib/auth";
import { P, VAULT } from "@/lib/store";
import React, { useEffect, useRef, useState } from "react";
import * as V from "@/ui";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

export function Root() {
  var ph = useState("check"),
    phase = ph[0],
    setPhase = ph[1];
  var bs = useState(null),
    boot = bs[0],
    setBoot = bs[1],
    me = useState(null),
    notice = useState(""),
    lastR = useRef(null);
  function enter(r) {
    me[1](r.user);
    lastR.current = r;
    if (r.mustChange) {
      setPhase("change");
      return;
    }
    P.loadAll().then(function (b) {
      (b as any).login = r;
      setBoot(b);
      setPhase("app");
    });
  }
  useEffect(function () {
    try {
      var why = sessionStorage.getItem("vaptlens.signedOut");
      if (why) {
        notice[1](why);
        sessionStorage.removeItem("vaptlens.signedOut");
      }
    } catch (e) {}
    if (AUTH.hasUsers())
      AUTH.resume().then(function (r) {
        if (r) enter(r);
        else setPhase("login");
      });
    else if (VAULT.meta()) setPhase("legacy");
    else setPhase("setup");
  }, []);
  if (phase === "app" && boot) {
    return (
      <ErrorBoundary>
        <App boot={boot} me={me[0]} />
      </ErrorBoundary>
    );
  }
  if (phase === "setup") return <SetupScreen onDone={enter} />;
  if (phase === "login")
    return (
      <LoginScreen
        notice={notice[0]}
        onDone={enter}
        onErase={function () {
          setPhase("erase");
        }}
      />
    );
  if (phase === "change")
    return (
      <ChangePasswordScreen
        user={me[0]}
        onDone={function () {
          enter(
            Object.assign({}, lastR.current, {
              mustChange: false,
              changedPw: true,
            }),
          );
        }}
      />
    );
  if (phase === "legacy")
    return (
      <LegacyUnlock
        onDone={function () {
          setPhase("setup");
        }}
      />
    );
  if (phase === "erase")
    return (
      <EraseScreen
        onCancel={function () {
          setPhase("login");
        }}
      />
    );
  return (
    <div className="boot">
      <V.Skeleton variant="rows" rows={3} />
    </div>
  );
}
