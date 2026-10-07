import React from "react";
import { createRoot } from "react-dom/client";
import { Root } from "@/app/shell/Root";
import { canvasToPdfBlob, captureCanvas } from "@/app/lib/export";
import { AUTH } from "@/lib/auth";
import { IDB, P, VAULT, WS } from "@/lib/store";
import { runSelfTests } from "@/lib/engine";
import "@/styles/fonts.css";
import "@/styles/tokens.css";
import "@/styles/ui.css";
import "@/styles/ui-extra.css";
import "@/styles/app.css";

/* apply the saved theme before first paint */
(function () {
  try {
    var t0 = JSON.parse(localStorage.getItem("vaptlens-theme") || "null");
    if (t0 && t0 !== "auto")
      document.documentElement.setAttribute("data-vt", t0);
  } catch (e) {}
})();

/* hooks used by the end-to-end tests */
window.__vlTest = {
  captureCanvas: captureCanvas,
  canvasToPdfBlob: canvasToPdfBlob,
};
window.__vl = {
  AUTH: AUTH,
  IDB: IDB,
  P: P,
  VAULT: VAULT,
  WS: WS,
  runSelfTests: runSelfTests,
};

createRoot(document.getElementById("root")!).render(<Root />);
