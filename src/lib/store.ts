/* ---------- VAPTLens storage client ----------
   The server (server/server.mjs) is the source of truth: every store, evidence list and audit entry lives in its
   database, behind a per-user session cookie and role checks. This module keeps an in-memory copy of the current
   workspace, saves each store with an optimistic version (a stale write gets 409 instead of overwriting someone
   else's change), retries while the server is unreachable, and reports every outcome through P.on(). Nothing is
   kept in localStorage except UI conveniences (current workspace, theme, last username, cached public KEV feed). */

/* the stores the app loads and saves; the server accepts only these */
export var STORE_NAMES = [
  "scans",
  "remediation",
  "engagement",
  "assets",
  "library",
  "report",
  "campaigns",
  "rules",
  "goals",
  "vex",
  "aliases",
  "prefs",
  "policy",
];

export var AUDIT_CAP = 2000;

/* ---------- HTTP ---------- */
export type ApiError = Error & { status: number; code?: string; data?: any };

export function api(path: string, opts: { method?: string; body?: any; timeout?: number } = {}): Promise<any> {
  var ctl = new AbortController();
  var timer = setTimeout(function () {
    ctl.abort();
  }, opts.timeout || 20000);
  return fetch(path, {
    method: opts.method || "GET",
    headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
    signal: ctl.signal,
  }).then(
    function (res) {
      clearTimeout(timer);
      return res
        .json()
        .catch(function () {
          return null;
        })
        .then(function (data) {
          if (res.ok) return data;
          var err = new Error((data && data.error) || "Request failed (" + res.status + ")") as ApiError;
          err.status = res.status;
          if (data) {
            err.code = data.code;
            err.data = data;
          }
          if (res.status === 401) emit({ type: "auth", message: (data && data.code === "idle" && data.error) || "" });
          throw err;
        });
    },
    function (e) {
      clearTimeout(timer);
      var err = new Error(
        e && e.name === "AbortError" ? "The server took too long to answer." : "Can't reach the VAPTLens server.",
      ) as ApiError;
      err.status = 0;
      throw err;
    },
  );
}

const enc = encodeURIComponent;

/* ---------- events: save status, conflicts, refusals, lost session ---------- */
export type StoreEvent =
  | { type: "status"; state: "saved" | "saving" | "offline" }
  | { type: "conflict"; store: string; by?: string }
  | { type: "refused"; store: string; message: string }
  | { type: "auth"; message: string };
var listeners: ((e: StoreEvent) => void)[] = [];
function emit(e: StoreEvent) {
  listeners.slice().forEach(function (fn) {
    try {
      fn(e);
    } catch (x) {}
  });
}

/* ---------- workspace cache ---------- */
type Entry = { data: any; version: number; json: string };
var cache: Record<string, Entry> = {};
var evCache: Record<string, Entry> = {};
var cacheWs = "";

function entryOf(data: any, version: number): Entry {
  return { data: data, version: version, json: JSON.stringify(data === undefined ? null : data) };
}

/* ---------- persistence API the app uses ---------- */
export var P: any = {
  _chain: {} as Record<string, Promise<any>>,
  _pending: {} as Record<string, any>,
  _blocked: {} as Record<string, string>,
  _retry: null as any,
  _delay: 2000,
  readOnly: false,
  isAdmin: false,

  on: function (fn: (e: StoreEvent) => void) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (x) {
        return x !== fn;
      });
    };
  },

  /* resolves once every queued save has been attempted */
  idle: function () {
    return Promise.all(
      Object.keys(P._chain).map(function (n) {
        return P._chain[n];
      }),
    );
  },

  hasUnsaved: function () {
    return Object.keys(P._pending).length > 0;
  },

  /* load the whole workspace; rejects (never falls back to "empty") if the server can't answer */
  loadAll: function () {
    var ws = WS.current();
    return Promise.all([
      api("/api/stores/" + enc(ws)),
      api("/api/audit/" + enc(ws) + "?limit=" + AUDIT_CAP),
    ]).then(function (r) {
      var remote = r[0] || {},
        out: Record<string, any> = {};
      cache = {};
      evCache = {};
      cacheWs = ws;
      P._blocked = {};
      STORE_NAMES.forEach(function (n) {
        var x = remote[n];
        cache[n] = entryOf(x ? x.data : null, x ? x.version : 0);
        out[n] = cache[n].data;
      });
      out.audit = r[1].entries;
      out.auditTotal = r[1].total;
      return out;
    });
  },

  load: function (name: string) {
    return Promise.resolve(cache[name] ? cache[name].data : null);
  },

  /* save the latest value of a store. Identical values are skipped, so re-saving what was just loaded is free. */
  save: function (name: string, obj: any) {
    if (STORE_NAMES.indexOf(name) < 0) return Promise.resolve(false);
    /* read-only roles only keep their own view settings; the server would refuse anything else anyway */
    if (P.readOnly && name !== "prefs") return Promise.resolve(false);
    /* policy is administrators-only on the server; others never try */
    if (name === "policy" && !P.isAdmin) return Promise.resolve(false);
    if (cacheWs !== WS.current()) return Promise.resolve(false);
    P._pending[name] = obj === undefined ? null : obj;
    return P._enqueue(name);
  },

  /* read-modify-write on the latest value (including one still waiting to be saved) */
  update: function (name: string, fn: (cur: any) => any) {
    var cur = name in P._pending ? P._pending[name] : cache[name] ? cache[name].data : null;
    return P.save(name, fn(cur));
  },

  _enqueue: function (name: string) {
    var prev = P._chain[name] || Promise.resolve();
    var run = prev.then(function () {
      return P._flush(name);
    });
    P._chain[name] = run.catch(function () {});
    return run;
  },

  _flush: function (name: string): Promise<boolean> {
    if (!(name in P._pending)) return Promise.resolve(true);
    if (P._blocked[name]) return Promise.resolve(false);
    var obj = P._pending[name],
      cur = cache[name] || entryOf(null, 0),
      json = JSON.stringify(obj);
    if (json === cur.json) {
      delete P._pending[name];
      return Promise.resolve(true);
    }
    var ws = cacheWs;
    emit({ type: "status", state: "saving" });
    return api("/api/stores/" + enc(ws) + "/" + enc(name), {
      method: "PUT",
      body: { data: obj, version: cur.version },
      timeout: 60000,
    }).then(
      function (r) {
        if (ws !== cacheWs) return false;
        cache[name] = { data: obj, version: r.version, json: json };
        if (P._pending[name] === obj) delete P._pending[name];
        P._delay = 2000;
        if (!P.hasUnsaved()) emit({ type: "status", state: "saved" });
        return true;
      },
      function (e: ApiError) {
        if (e.status === 409) {
          /* someone else saved first: keep their version, stop writing this store until the user reloads */
          P._blocked[name] = "conflict";
          delete P._pending[name];
          emit({ type: "conflict", store: name, by: e.data && e.data.by });
          return false;
        }
        if (e.status === 403 || e.status === 404 || e.status === 400 || e.status === 413) {
          /* the server said no (role, separation of duties, size…): what's on screen no longer matches what's
             stored, so stop writing this store until the user reloads instead of re-sending it with every edit */
          P._blocked[name] = "refused";
          delete P._pending[name];
          emit({ type: "refused", store: name, message: e.message });
          return false;
        }
        if (e.status === 401) return false;
        /* network or server trouble: keep the value and retry with backoff */
        emit({ type: "status", state: "offline" });
        P._scheduleRetry();
        return false;
      },
    );
  },

  _scheduleRetry: function () {
    if (P._retry) return;
    P._retry = setTimeout(function () {
      P._retry = null;
      P._delay = Math.min(P._delay * 2, 60000);
      Object.keys(P._pending).forEach(function (n) {
        P._enqueue(n);
      });
    }, P._delay);
  },

  /* evidence images per finding key */
  evidence: function (key: string): Promise<any[]> {
    if (evCache[key]) return Promise.resolve(evCache[key].data);
    var ws = WS.current();
    return api("/api/evidence/" + enc(ws) + "/" + enc(key)).then(function (r) {
      evCache[key] = entryOf(r.data || [], r.version || 0);
      return evCache[key].data;
    });
  },

  /* rejects on failure (conflict included) so the caller can tell the user; never writes over a list it didn't load */
  setEvidence: function (key: string, list: any[]): Promise<boolean> {
    var ws = WS.current(),
      cur = evCache[key];
    if (!cur) return Promise.reject(new Error("Evidence wasn't loaded; reopen the finding and try again."));
    return api("/api/evidence/" + enc(ws) + "/" + enc(key), {
      method: "PUT",
      body: { data: list || [], version: cur.version },
      timeout: 60000,
    }).then(
      function (r) {
        evCache[key] = entryOf(list || [], r.version);
        return true;
      },
      function (e: ApiError) {
        if (e.status === 409) {
          evCache[key] = entryOf(e.data.data || [], e.data.version);
          throw new Error("Someone else changed this evidence. It has been reloaded; add yours again.");
        }
        throw e;
      },
    );
  },

  evidenceKeys: function (): Promise<string[]> {
    return api("/api/evidence/" + enc(WS.current()));
  },
};

/* ---------- named workspaces (one per client/engagement) ---------- */
export var WS = {
  current: function () {
    try {
      return localStorage.getItem("vaptlens.ws.current") || "Default";
    } catch (e) {
      return "Default";
    }
  },
  setCurrent: function (name: string) {
    try {
      localStorage.setItem("vaptlens.ws.current", name);
    } catch (e) {}
  },
  list: function (): Promise<{ name: string; createdAt: string; createdBy: string }[]> {
    return api("/api/workspaces");
  },
  create: function (name: string) {
    return api("/api/workspaces", { method: "POST", body: { name: name } });
  },
  /* wait for pending saves of the current workspace, then load the other one */
  switchTo: function (name: string) {
    return P.idle().then(function () {
      if (P.hasUnsaved()) throw new Error("Some changes haven't reached the server yet. Try again once it's back.");
      WS.setCurrent(name);
      return P.loadAll();
    });
  },
  remove: function (name: string) {
    return api("/api/workspaces/" + enc(name), { method: "DELETE" });
  },
};

/* ---------- audit log: appended and hash-chained by the server, stamped with the signed-in user ---------- */
export var AUDIT = {
  append: function (action: string, detail: string, ref?: any) {
    var body: any = { action: action, detail: detail };
    if (ref) body.ref = ref;
    return api("/api/audit/" + enc(WS.current()), { method: "POST", body: body });
  },
  verify: function (ws?: string): Promise<{ ok: boolean; n?: number; at?: number; reason?: string }> {
    return api("/api/audit/" + enc(ws || WS.current()) + "/verify");
  },
  list: function (ws?: string, limit?: number) {
    return api("/api/audit/" + enc(ws || WS.current()) + "?limit=" + (limit || AUDIT_CAP));
  },
};

/* ---------- full backup / restore of the current workspace (administrators; includes every evidence image) ---------- */
export function exportWorkspace(): Promise<string> {
  return P.idle().then(function () {
    return api("/api/workspaces/" + enc(WS.current()) + "/export", { timeout: 120000 }).then(function (j) {
      return JSON.stringify(j);
    });
  });
}

export function importWorkspace(text: string) {
  var j;
  try {
    j = JSON.parse(text);
  } catch (e) {
    throw new Error("This isn't a VAPTLens backup file.");
  }
  if (!j || j.app !== "VAPTLens") throw new Error("This isn't a VAPTLens backup file.");
  if (j.format !== 2)
    throw new Error("This backup is from the old browser-only version and can't be restored on the server.");
  return api("/api/workspaces/" + enc(WS.current()) + "/import", { method: "POST", body: j, timeout: 120000 });
}

/* ---------- small key/value cache in this browser for public data only (e.g. the KEV feed) ---------- */
export var IDB = {
  get: function (k: string) {
    try {
      var raw = localStorage.getItem("vaptlens.kv." + k);
      return Promise.resolve(raw ? JSON.parse(raw) : undefined);
    } catch (e) {
      return Promise.resolve(undefined);
    }
  },
  set: function (k: string, v: any) {
    try {
      localStorage.setItem("vaptlens.kv." + k, JSON.stringify(v));
      return Promise.resolve(true);
    } catch (e) {
      return Promise.resolve(false);
    }
  },
};

/* read a File as text, un-gzipping .gz with the browser's DecompressionStream */
export function readFileText(f: File): Promise<string> {
  if (/\.gz$/i.test(f.name) && (window as any).DecompressionStream)
    return new Response(f.stream().pipeThrough(new (window as any).DecompressionStream("gzip"))).text();
  return new Promise(function (res, rej) {
    var r = new FileReader();
    r.onload = function () {
      res(r.result as string);
    };
    r.onerror = function () {
      rej(new Error("the file couldn't be read"));
    };
    r.readAsText(f);
  });
}

/* downscale an image file to ≤ 1600px JPEG data URL */
export function imageToDataUrl(file: File): Promise<string> {
  return new Promise(function (res, rej) {
    var fr = new FileReader();
    fr.onerror = function () {
      rej(new Error("couldn't read the image"));
    };
    fr.onload = function () {
      var img = new Image();
      img.onerror = function () {
        rej(new Error("that file isn't an image"));
      };
      img.onload = function () {
        var s = Math.min(1, 1600 / Math.max(img.width, img.height)),
          c = document.createElement("canvas");
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = fr.result as string;
    };
    fr.readAsDataURL(file);
  });
}
