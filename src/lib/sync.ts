/* ---------- team sync: push/pull this workspace's encrypted snapshot to the same-origin sync server ---------- */
import { P, WS, exportWorkspace, importWorkspace } from "@/lib/store";

/* not "vaptlens"-prefixed on purpose: exportWorkspace copies those keys, and the token must never ride along in a snapshot or backup */
var TOKEN_KEY = "vl-sync-token",
  VER_KEY = "vl-sync-ver:";

export var SYNC = {
  token: function () {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (e) {
      return "";
    }
  },
  setToken: function (t) {
    if (t) localStorage.setItem(TOKEN_KEY, t.trim());
    else localStorage.removeItem(TOKEN_KEY);
  },
  /* the server version this browser last pushed or pulled, per workspace */
  version: function (ws?) {
    return parseInt(
      localStorage.getItem(VER_KEY + (ws || WS.current())) || "0",
      10,
    );
  },
  _req: function (method, body?) {
    return fetch("api/ws/" + encodeURIComponent(WS.current()), {
      method: method,
      headers: {
        Authorization: "Bearer " + SYNC.token(),
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    }).then(function (r) {
      return r
        .json()
        .catch(function () {
          return {};
        })
        .then(function (j) {
          if (r.ok) return j;
          var msg =
            r.status === 401
              ? "The team token was rejected."
              : r.status === 409
                ? "A teammate pushed a newer version. Pull it first, then redo your changes and push."
                : r.status === 404 && method === "GET"
                  ? 'Nothing has been pushed for workspace "' +
                    WS.current() +
                    '" yet.'
                  : r.status === 502 || r.status === 503
                    ? "The sync server isn't reachable."
                    : j.error || "Sync failed (" + r.status + ").";
          throw Object.assign(new Error(msg), {
            status: r.status,
          });
        });
    });
  },
  /* waits for pending saves so the snapshot has the latest writes */
  push: function () {
    var ws = WS.current();
    return P.idle()
      .then(function () {
        return exportWorkspace();
      })
      .then(function (blob) {
        return SYNC._req("PUT", {
          version: SYNC.version(ws),
          blob: blob,
        });
      })
      .then(function (r) {
        localStorage.setItem(VER_KEY + ws, String(r.version));
        return r;
      });
  },
  /* replaces this browser's workspace and accounts with the server copy; the caller reloads the page */
  pull: function () {
    var ws = WS.current();
    return SYNC._req("GET").then(function (r) {
      return P.hold(
        P.idle().then(function () {
          return importWorkspace(r.blob);
        }),
      ).then(function () {
        localStorage.setItem(VER_KEY + ws, String(r.version));
        P.frozen = true;
        sessionStorage.clear();
        return r;
      });
    });
  },
};
