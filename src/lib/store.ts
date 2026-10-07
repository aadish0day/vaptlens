/* ---------- VAPTLens storage client ----------
   Stores, evidence and workspaces live on the same-origin server API (/api/stores, /api/evidence,
   /api/workspaces → server/server.mjs, which uses PostgreSQL when DATABASE_URL/POSTGRES_HOST is set,
   else SQLite), with an in-memory cache and a localStorage fallback when a request fails.
   Payloads are AES-GCM encrypted only while the vault is unlocked (VAULT.key); otherwise they are
   sent and stored as plaintext.
*/

export var LS_NAMES: Record<string, string> = {
  scans: "vaptlens.scans.v2",
  remediation: "vaptlens.remediation.v1",
  audit: "vaptlens.audit.v1",
  engagement: "vaptlens.engagement.v1",
  assets: "vaptlens.assets.v1",
  library: "vaptlens.library.v1",
  report: "vaptlens.report.v1",
  campaigns: "vaptlens.campaigns.v1",
  rules: "vaptlens.rules.v1",
  auditHead: "vaptlens.auditHead.v1",
  goals: "vaptlens.goals.v1",
  vex: "vaptlens.vex.v1",
  aliases: "vaptlens.aliases.v1",
  prefs: "vaptlens.prefs.v1",
  policy: "vaptlens.policy.v1",
};

/* Kept for backwards compatibility with callers */
export var IDB_STORES: Record<string, number> = {
  scans: 1,
  audit: 1,
  remediation: 1,
};

export var AUDIT_CAP = 2000;

/* Keys holding workspace data that is encrypted at rest */
export function isDataKey(k: string) {
  return k.indexOf("ev:") === 0 || k.indexOf("st:") === 0;
}

/* Keys never exported or restored (per-tab session keys, saved workspaces) */
export function isLocalOnlyKey(k: string) {
  return k.indexOf("ws:") === 0 || k.indexOf("sess:") === 0;
}

export var VAULT_META = "vaptlens.vault.v1";

export function b64(buf: ArrayBuffer | Uint8Array) {
  var s = "",
    a = new Uint8Array(buf);
  for (var i = 0; i < a.length; i += 0x8000)
    s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000) as any);
  return btoa(s);
}

export function unb64(s: string) {
  var bin = atob(s),
    a = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}

export function sha256Hex(str: string) {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(str))
    .then(function (h) {
      return Array.prototype.map
        .call(new Uint8Array(h), function (b: number) {
          return b.toString(16).padStart(2, "0");
        })
        .join("");
    });
}

/* In-memory store cache & synchronous fallback cache replacing Browser IndexedDB */
var memStores: Record<string, Record<string, any>> = {};
var memEvidence: Record<string, Record<string, any[]>> = {};
var memKv: Record<string, any> = {};

function apiToken(): string {
  try {
    return localStorage.getItem("vl-sync-token") || "";
  } catch (e) {
    return "";
  }
}

/* Standalone build (VITE_STANDALONE=1, e.g. the hosted single-file demo): there is no /api server,
   so every request fails fast and the store uses its localStorage fallback. */
var STANDALONE = (import.meta as any).env && (import.meta as any).env.VITE_STANDALONE === "1";

function apiFetch(url: string, opts: RequestInit = {}): Promise<any> {
  if (STANDALONE) return Promise.reject(Object.assign(new Error("standalone: no server"), { status: 0 }));
  var tok = apiToken();
  var headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (tok) {
    headers["Authorization"] = "Bearer " + tok;
  }
  var cleanUrl = url.startsWith("/") ? url : "/" + url;
  return fetch(cleanUrl, {
    ...opts,
    headers: { ...headers, ...(opts.headers as any) },
    cache: "no-store",
  }).then(function (res) {
    if (!res.ok) {
      if (res.status === 404 && (!opts.method || opts.method === "GET")) {
        return null;
      }
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (err) {
          throw Object.assign(new Error(err.error || "HTTP " + res.status), {
            status: res.status,
          });
        });
    }
    return res.json().catch(function () {
      return null;
    });
  });
}

/* Per-tab session keys ("sess:*") hold a NON-extractable CryptoKey. JSON/localStorage can't store
   a CryptoKey (it serialises to {}), so those records alone go to the browser's IndexedDB, which
   keeps the key usable but never readable. They never leave this browser. */
var SESS_DB = "vaptlens-sessions",
  sessDbP: Promise<IDBDatabase | null> | null = null;
function sessDb(): Promise<IDBDatabase | null> {
  if (sessDbP) return sessDbP;
  sessDbP = new Promise(function (res) {
    try {
      var rq = indexedDB.open(SESS_DB, 1);
      rq.onupgradeneeded = function () {
        rq.result.createObjectStore("kv");
      };
      rq.onsuccess = function () {
        res(rq.result);
      };
      rq.onerror = function () {
        res(null);
      };
    } catch (e) {
      res(null);
    }
  });
  return sessDbP;
}
function sessOp(mode: IDBTransactionMode, fn: (st: IDBObjectStore) => IDBRequest | void): Promise<any> {
  return sessDb().then(function (db) {
    if (!db) return undefined;
    return new Promise(function (res) {
      try {
        var tx = db.transaction("kv", mode),
          rq = fn(tx.objectStore("kv"));
        tx.oncomplete = function () {
          res(rq ? (rq as IDBRequest).result : true);
        };
        tx.onerror = tx.onabort = function () {
          res(undefined);
        };
      } catch (e) {
        res(undefined);
      }
    });
  });
}
function isSessKey(k: string) {
  return typeof k === "string" && k.indexOf("sess:") === 0;
}

/* In-memory key/value cache replacing browser IndexedDB (intel feed, active sessions, etc.) */
export var IDB = {
  get: function (k: string) {
    if (isSessKey(k))
      return k in memKv
        ? Promise.resolve(memKv[k])
        : sessOp("readonly", function (st) {
            return st.get(k);
          });
    if (k in memKv) return Promise.resolve(memKv[k]);
    try {
      var raw = localStorage.getItem("vaptlens.kv." + k);
      if (raw) {
        var v = JSON.parse(raw);
        memKv[k] = v;
        return Promise.resolve(v);
      }
    } catch (e) {}
    return Promise.resolve(undefined);
  },
  set: function (k: string, v: any) {
    memKv[k] = v;
    if (isSessKey(k))
      return sessOp("readwrite", function (st) {
        st.put(v, k);
      }).then(function () {
        return true;
      });
    try {
      localStorage.setItem("vaptlens.kv." + k, JSON.stringify(v));
    } catch (e) {}
    return Promise.resolve(true);
  },
  del: function (k: string) {
    delete memKv[k];
    if (isSessKey(k))
      return sessOp("readwrite", function (st) {
        st.delete(k);
      }).then(function () {
        return true;
      });
    try {
      localStorage.removeItem("vaptlens.kv." + k);
    } catch (e) {}
    return Promise.resolve(true);
  },
  all: function () {
    var out: Record<string, any> = Object.assign({}, memKv);
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var lk = localStorage.key(i);
        if (lk && lk.startsWith("vaptlens.kv.")) {
          var kn = lk.slice("vaptlens.kv.".length);
          if (!(kn in out)) {
            out[kn] = JSON.parse(localStorage.getItem(lk) || "null");
          }
        }
      }
    } catch (e) {}
    var ws = WS.current();
    var ev = memEvidence[ws];
    if (ev) {
      Object.keys(ev).forEach(function (ek) {
        out["ev:" + ek] = ev[ek];
      });
    }
    /* session records live in the browser's IndexedDB (see sessDb); list them so expiry sweeps see them */
    return sessDb().then(function (db) {
      if (!db) return out;
      return new Promise(function (res) {
        try {
          var st = db.transaction("kv", "readonly").objectStore("kv"),
            kr = st.getAllKeys(),
            vr = st.getAll();
          vr.onsuccess = function () {
            (kr.result || []).forEach(function (k: any, i: number) {
              if (!(k in out)) out[k] = vr.result[i];
            });
            res(out);
          };
          vr.onerror = function () {
            res(out);
          };
        } catch (e) {
          res(out);
        }
      });
    });
  },

  allSync: function () {
    return Object.assign({}, memKv);
  },
};

/* ===== vault: AES-GCM 256 with a PBKDF2-SHA-256 key (310,000 iterations) held only in memory ===== */
export var VAULT: any = {
  key: null,
  meta: function () {
    try {
      return JSON.parse(localStorage.getItem(VAULT_META) || "null");
    } catch (e) {
      return null;
    }
  },
  derive: function (pass: string, salt: Uint8Array) {
    return crypto.subtle
      .importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, [
        "deriveKey",
      ])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt: salt as any,
            iterations: 310000,
            hash: "SHA-256",
          },
          base,
          {
            name: "AES-GCM",
            length: 256,
          },
          false,
          ["encrypt", "decrypt"],
        );
      });
  },
  enc: function (obj: any, key?: any) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle
      .encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key || VAULT.key,
        new TextEncoder().encode(JSON.stringify(obj)),
      )
      .then(function (ct) {
        return {
          iv: b64(iv),
          ct: b64(ct),
        };
      });
  },
  dec: function (box: any, key?: any) {
    return crypto.subtle
      .decrypt(
        {
          name: "AES-GCM",
          iv: unb64(box.iv) as any,
        },
        key || VAULT.key,
        unb64(box.ct) as any,
      )
      .then(function (pt) {
        return JSON.parse(new TextDecoder().decode(pt));
      });
  },
  unlock: function (pass: string) {
    var m = VAULT.meta();
    if (!m) return Promise.reject(new Error("No vault."));
    return VAULT.derive(pass, unb64(m.salt)).then(function (k: any) {
      return VAULT.dec(m.check, k).then(
        function (x: any) {
          if (x !== "vaptlens-ok") throw new Error("bad");
          VAULT.key = k;
          return k;
        },
        function () {
          throw new Error("Wrong passphrase.");
        },
      );
    });
  },
  /* move every sensitive value into encrypted form */
  enable: function (pass: string) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    return VAULT.derive(pass, salt).then(function (k: any) {
      return VAULT.enc("vaptlens-ok", k).then(function (check: any) {
        VAULT.key = k;
        var names = Object.keys(LS_NAMES);
        return Promise.all(
          names.map(function (n) {
            var raw = localStorage.getItem(LS_NAMES[n]);
            if (raw == null) return null;
            return VAULT.enc(JSON.parse(raw)).then(function (box: any) {
              localStorage.setItem(LS_NAMES[n] + ".enc", JSON.stringify(box));
              localStorage.removeItem(LS_NAMES[n]);
            });
          }),
        )
          .then(function () {
            return IDB.all();
          })
          .then(function (all: any) {
            return Promise.all(
              Object.keys(all)
                .filter(function (k2) {
                  return isDataKey(k2) && all[k2] && !all[k2].ct;
                })
                .map(function (k2) {
                  return VAULT.enc(all[k2]).then(function (box: any) {
                    return IDB.set(k2, box);
                  });
                }),
            );
          })
          .then(function () {
            localStorage.setItem(
              VAULT_META,
              JSON.stringify({
                v: 1,
                salt: b64(salt),
                check: check,
                at: new Date().toISOString(),
              }),
            );
          });
      });
    });
  },
  disable: function () {
    var names = Object.keys(LS_NAMES);
    return Promise.all(
      names.map(function (n) {
        var raw = localStorage.getItem(LS_NAMES[n] + ".enc");
        if (raw == null) return null;
        return VAULT.dec(JSON.parse(raw)).then(function (obj: any) {
          localStorage.setItem(LS_NAMES[n], JSON.stringify(obj));
          localStorage.removeItem(LS_NAMES[n] + ".enc");
        });
      }),
    )
      .then(function () {
        return IDB.all();
      })
      .then(function (all: any) {
        return Promise.all(
          Object.keys(all)
            .filter(function (k2) {
              return isDataKey(k2) && all[k2] && all[k2].ct;
            })
            .map(function (k2) {
              return VAULT.dec(all[k2]).then(function (v: any) {
                return IDB.set(k2, v);
              });
            }),
        );
      })
      .then(function () {
        localStorage.removeItem(VAULT_META);
        VAULT.key = null;
      });
  },
  erase: function () {
    Object.keys(LS_NAMES).forEach(function (n) {
      localStorage.removeItem(LS_NAMES[n] + ".enc");
    });
    localStorage.removeItem(VAULT_META);
    var ws = WS.current();
    delete memStores[ws];
    delete memEvidence[ws];
    return IDB.all().then(function (all: any) {
      return Promise.all(
        Object.keys(all)
          .filter(isDataKey)
          .map(function (k) {
            return IDB.del(k);
          }),
      );
    });
  },
};

/* ===== persistence API the app uses ===== */
export var P: any = {
  failed: {},
  _seq: {},
  _chain: {},
  _gate: null,
  frozen: false,
  /* hold every save until promise settles (key rotation re-encrypts underneath) */
  hold: function (promise: any) {
    var g = Promise.resolve(promise).catch(function () {});
    P._gate = g;
    g.then(function () {
      if (P._gate === g) P._gate = null;
    });
    return promise;
  },
  idle: function () {
    var names = Object.keys(P._chain);
    return Promise.all(
      names.map(function (n) {
        return P._chain[n];
      }),
    );
  },
  load: function (name: string) {
    var ws = WS.current();
    if (!memStores[ws]) memStores[ws] = {};
    if (memStores[ws][name] !== undefined) {
      return Promise.resolve(memStores[ws][name]);
    }
    var url =
      "/api/stores/" + encodeURIComponent(ws) + "/" + encodeURIComponent(name);
    return apiFetch(url, { method: "GET" })
      .then(function (res) {
        var val = null;
        if (res != null) {
          if (typeof res === "object" && "data" in res) {
            val = res.data;
          } else if (
            typeof res === "object" &&
            "value" in res &&
            Object.keys(res).length <= 3 &&
            ("name" in res || "updated_at" in res)
          ) {
            val = res.value;
          } else {
            val = res;
          }
        }
        if (val !== null && val !== undefined) {
          if (val && typeof val === "object" && val.ct) {
            if (!VAULT.key) return null;
            return VAULT.dec(val)
              .then(function (dec: any) {
                memStores[ws][name] = dec;
                return dec;
              })
              .catch(function () {
                P.failed[name] = true;
                return null;
              });
          }
          memStores[ws][name] = val;
          return val;
        }
        return P._loadLs(name);
      })
      .catch(function () {
        return P._loadLs(name);
      });
  },
  _loadLs: function (name: string) {
    var ws = WS.current();
    var ls = LS_NAMES[name] || name;
    if (VAULT.key) {
      var raw: string | null = null,
        plain: string | null = null;
      try {
        raw = localStorage.getItem(ls + ".enc");
        plain = localStorage.getItem(ls);
      } catch (e) {}
      if (raw)
        return VAULT.dec(JSON.parse(raw))
          .then(function (dec: any) {
            memStores[ws][name] = dec;
            return dec;
          })
          .catch(function () {
            P.failed[name] = true;
            return null;
          });
      if (plain) {
        try {
          var parsed = JSON.parse(plain);
          memStores[ws][name] = parsed;
          return Promise.resolve(parsed);
        } catch (e) {}
      }
      return Promise.resolve(null);
    }
    try {
      var x = localStorage.getItem(ls);
      if (x) {
        var obj = JSON.parse(x);
        memStores[ws][name] = obj;
        return Promise.resolve(obj);
      }
    } catch (e) {}
    return Promise.resolve(null);
  },
  save: function (name: string, obj: any) {
    var ws = WS.current();
    if (!memStores[ws]) memStores[ws] = {};
    memStores[ws][name] = obj;

    /* never overwrite a store that failed to decrypt on load; nothing writes once a workspace switch has imported */
    if (P.failed[name]) return Promise.resolve(false);
    if (P.frozen) return Promise.resolve(true);

    /* serialise saves per store: the newest call always wins, even if an older encryption finishes later */
    var seq = (P._seq[name] = (P._seq[name] || 0) + 1);
    var prevP = P._chain[name] || Promise.resolve();
    var gate = P._gate;
    var run = prevP
      .then(function () {
        return gate;
      })
      .then(function () {
        if (seq !== P._seq[name]) return true;
        return P._saveRemote(ws, name, obj);
      });
    P._chain[name] = run.catch(function () {});
    return run;
  },
  _saveRemote: function (ws: string, name: string, obj: any) {
    var url =
      "/api/stores/" + encodeURIComponent(ws) + "/" + encodeURIComponent(name);
    var ls = LS_NAMES[name] || name;
    if (obj == null) {
      try {
        localStorage.removeItem(ls);
        localStorage.removeItem(ls + ".enc");
      } catch (e) {}
      return apiFetch(url, { method: "DELETE" })
        .then(function () {
          return true;
        })
        .catch(function () {
          return true;
        });
    }

    var prepP = VAULT.key ? VAULT.enc(obj) : Promise.resolve(obj);
    return prepP
      .then(function (payload: any) {
        try {
          if (VAULT.key) {
            localStorage.setItem(ls + ".enc", JSON.stringify(payload));
            localStorage.removeItem(ls);
          } else {
            localStorage.setItem(ls, JSON.stringify(payload));
            localStorage.removeItem(ls + ".enc");
          }
        } catch (e) {}

        return apiFetch(url, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
          .then(function () {
            return true;
          })
          .catch(function (e) {
            console.warn(
              "Backend save failed for " + name + ", stored locally:",
              e,
            );
            return true;
          });
      })
      .catch(function () {
        return false;
      });
  },
  /* read-modify-write inside the per-store save chain */
  update: function (name: string, fn: (cur: any) => any) {
    if (P.failed[name]) return Promise.resolve(false);
    if (P.frozen) return Promise.resolve(true);
    var prevP = P._chain[name] || Promise.resolve();
    var gate = P._gate;
    var run = prevP
      .then(function () {
        return gate;
      })
      .then(function () {
        return P.load(name).then(function (cur: any) {
          var next = fn(cur);
          return P.save(name, next);
        });
      });
    P._chain[name] = run.catch(function () {});
    return run;
  },
  loadAll: function () {
    var ws = WS.current();
    if (!memStores[ws]) memStores[ws] = {};
    var names = Object.keys(LS_NAMES);
    return apiFetch("/api/stores/" + encodeURIComponent(ws), { method: "GET" })
      .then(function (remote) {
        if (remote && typeof remote === "object") {
          Object.keys(remote).forEach(function (n) {
            var val = remote[n];
            if (val != null && typeof val === "object" && "data" in val) {
              val = val.data;
            } else if (
              val != null &&
              typeof val === "object" &&
              "value" in val &&
              Object.keys(val).length <= 3 &&
              ("name" in val || "updated_at" in val)
            ) {
              val = val.value;
            }
            if (val && typeof val === "object" && val.ct) {
              if (VAULT.key) {
                VAULT.dec(val)
                  .then(function (dec: any) {
                    memStores[ws][n] = dec;
                  })
                  .catch(function () {});
              }
            } else {
              memStores[ws][n] = val;
            }
          });
        }
        var out: Record<string, any> = {};
        return Promise.all(
          names.map(function (n) {
            return P.load(n).then(function (v: any) {
              out[n] = v;
            });
          }),
        ).then(function () {
          return out;
        });
      })
      .catch(function (e) {
        console.warn(
          "Failed to load stores from API, using fallback stores:",
          e,
        );
        var out: Record<string, any> = {};
        return Promise.all(
          names.map(function (n) {
            return P.load(n).then(function (v: any) {
              out[n] = v;
            });
          }),
        ).then(function () {
          return out;
        });
      });
  },
  /* evidence images per finding key */
  evidence: function (key: string) {
    var ws = WS.current();
    if (!memEvidence[ws]) memEvidence[ws] = {};
    if (memEvidence[ws][key] !== undefined) {
      return Promise.resolve(memEvidence[ws][key]);
    }
    var url =
      "/api/evidence/" + encodeURIComponent(ws) + "/" + encodeURIComponent(key);
    return apiFetch(url, { method: "GET" })
      .then(function (res) {
        var raw = null;
        if (Array.isArray(res)) raw = res;
        else if (res && Array.isArray(res.data)) raw = res.data;
        else if (res && res.data) raw = res.data;
        if (!raw) {
          memEvidence[ws][key] = [];
          return [];
        }
        if (raw.ct) {
          if (!VAULT.key) return null;
          return VAULT.dec(raw).then(function (dec: any) {
            memEvidence[ws][key] = dec || [];
            return memEvidence[ws][key];
          });
        }
        memEvidence[ws][key] = raw;
        return raw;
      })
      .catch(function () {
        return memEvidence[ws][key] || [];
      });
  },
  setEvidence: function (key: string, list: any[]) {
    var ws = WS.current();
    if (!memEvidence[ws]) memEvidence[ws] = {};
    memEvidence[ws][key] = list;

    var url =
      "/api/evidence/" + encodeURIComponent(ws) + "/" + encodeURIComponent(key);
    if (!list || !list.length) {
      delete memEvidence[ws][key];
      return apiFetch(url, { method: "DELETE" })
        .then(function () {
          return true;
        })
        .catch(function () {
          return true;
        });
    }

    var prepP = VAULT.key ? VAULT.enc(list) : Promise.resolve(list);
    return prepP.then(function (payload: any) {
      return apiFetch(url, {
        method: "PUT",
        body: JSON.stringify({ data: payload }),
      })
        .then(function () {
          return true;
        })
        .catch(function (e) {
          console.warn("Evidence save failed:", e);
          return true;
        });
    });
  },
};

/* ===== named workspaces (one per client/engagement), stored in SQLite ===== */
export var WS = {
  current: function () {
    try {
      return localStorage.getItem("vaptlens.ws.current") || "Default";
    } catch (e) {
      return "Default";
    }
  },
  list: function () {
    return apiFetch("/api/workspaces", { method: "GET" })
      .then(function (arr) {
        if (Array.isArray(arr) && arr.length > 0) {
          return arr.map(function (x) {
            return {
              name: typeof x === "string" ? x : x.name,
              savedAt:
                (typeof x === "object" && (x.savedAt || x.updated_at)) ||
                new Date().toISOString(),
            };
          });
        }
        return [
          {
            name: WS.current(),
            savedAt: new Date().toISOString(),
          },
        ];
      })
      .catch(function () {
        return [
          {
            name: WS.current(),
            savedAt: new Date().toISOString(),
          },
        ];
      });
  },
  saveCurrent: function () {
    var name = WS.current();
    return P.idle().then(function () {
      return apiFetch("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: name }),
      }).catch(function () {});
    });
  },
  switchTo: function (name: string) {
    return WS.saveCurrent().then(function () {
      localStorage.setItem("vaptlens.ws.current", name);
      if (!memStores[name]) memStores[name] = {};
      return P.loadAll();
    });
  },
  remove: function (name: string) {
    var cur = WS.current();
    delete memStores[name];
    delete memEvidence[name];
    return apiFetch("/api/workspaces/" + encodeURIComponent(name), {
      method: "DELETE",
    })
      .then(function () {
        if (cur === name) {
          return WS.switchTo("Default");
        }
        return WS.list();
      })
      .catch(function () {
        return WS.list();
      });
  },
};

/* ===== workspace backup / restore without IndexedDB ===== */
export function exportWorkspace(forWs?: boolean) {
  var ws = WS.current();
  var ls: Record<string, string | null> = {};
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.indexOf("vaptlens") === 0) ls[k] = localStorage.getItem(k);
  }
  delete ls["vaptlens.ws.current"];
  if (forWs) delete ls["vaptlens.users.v1"];

  return P.loadAll().then(function (stores: Record<string, any>) {
    var keep: Record<string, any> = {};
    Object.keys(IDB_STORES).forEach(function (k) {
      if (stores[k]) keep["st:" + k] = stores[k];
    });
    var evMap = memEvidence[ws] || {};
    Object.keys(evMap).forEach(function (ek) {
      keep["ev:" + ek] = evMap[ek];
    });
    return IDB.all().then(function (idb: any) {
      Object.keys(idb).forEach(function (k) {
        if (!isLocalOnlyKey(k) && !(forWs && k === "intel")) {
          keep[k] = idb[k];
        }
      });
      return JSON.stringify({
        app: "VAPTLens",
        format: 1,
        workspace: ws,
        exportedAt: new Date().toISOString(),
        encrypted: !!VAULT.meta(),
        localStorage: ls,
        indexedDB: keep,
        stores: stores,
      });
    });
  });
}

export function importWorkspace(text: string, forWs?: boolean) {
  var j = JSON.parse(text);
  if (j.app !== "VAPTLens" || (!j.localStorage && !j.stores))
    throw new Error("This isn't a VAPTLens backup file.");
  var cur = localStorage.getItem("vaptlens.ws.current");
  var rm: string[] = [];
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (
      k &&
      k.indexOf("vaptlens") === 0 &&
      k !== "vaptlens-theme" &&
      !(forWs && k === "vaptlens.users.v1")
    )
      rm.push(k);
  }
  rm.forEach(function (k) {
    localStorage.removeItem(k);
  });
  if (j.localStorage) {
    Object.keys(j.localStorage).forEach(function (k) {
      if (forWs && k === "vaptlens.users.v1") return;
      localStorage.setItem(k, j.localStorage[k]);
    });
  }
  if (cur) localStorage.setItem("vaptlens.ws.current", cur);

  var saves: Promise<any>[] = [];

  if (j.stores) {
    Object.keys(j.stores).forEach(function (name) {
      saves.push(P.save(name, j.stores[name]));
    });
  }

  if (j.indexedDB) {
    Object.keys(j.indexedDB).forEach(function (k) {
      if (isLocalOnlyKey(k)) return;
      if (forWs && k === "intel") return;
      if (k.startsWith("st:")) {
        var sName = k.slice(3);
        saves.push(P.save(sName, j.indexedDB[k]));
      } else if (k.startsWith("ev:")) {
        var eKey = k.slice(3);
        saves.push(P.setEvidence(eKey, j.indexedDB[k]));
      } else {
        saves.push(IDB.set(k, j.indexedDB[k]));
      }
    });
  }

  return Promise.all(saves);
}

/* ===== tamper-evident audit log (each entry hashes the one before) ===== */
export function auditEntryHash(e: any) {
  var base = e.user
    ? [e.action, e.detail, e.role, e.at, e.prev || "", e.user]
    : [e.action, e.detail, e.role, e.at, e.prev || ""];
  if (e.ref) base.push(e.ref);
  return sha256Hex(JSON.stringify(base));
}

export function verifyAudit(list: any[], head: any) {
  /* list is newest-first; walk oldest → newest. Once entries are hashed, every newer one must be too.
     The separately stored head pins the newest hash, the oldest kept hash and the running total (catches truncation). */
  var arr = list.slice().reverse(),
    i = 0,
    hashed = false;
  function step(): Promise<{ ok: boolean; n?: number; at?: number; reason?: string }> {
    if (i >= arr.length) {
      if (
        head &&
        head.hash &&
        list[0] &&
        list[0].hash !== head.hash &&
        head.at > (list[0].at || "")
      )
        return Promise.resolve({
          ok: false,
          at: 1,
          reason: "newest entries missing",
        });
      if (
        head &&
        head.oldest &&
        arr[0] &&
        arr[0].hash &&
        arr[0].hash !== head.oldest &&
        arr.length < AUDIT_CAP
      )
        return Promise.resolve({
          ok: false,
          at: arr.length,
          reason: "oldest entries removed",
        });
      if (head && head.total && list.length < Math.min(AUDIT_CAP, head.total))
        return Promise.resolve({
          ok: false,
          at: arr.length,
          reason: head.total - list.length + " entries missing",
        });
      return Promise.resolve({
        ok: true,
        n: arr.length,
      });
    }
    var e = arr[i];
    if (!e.hash) {
      if (hashed)
        return Promise.resolve({
          ok: false,
          at: arr.length - i,
          reason: "entry without a hash",
        });
      i++;
      return step();
    }
    if (hashed && e.prev !== arr[i - 1].hash)
      return Promise.resolve({
        ok: false,
        at: arr.length - i,
        reason: "link broken",
      });
    hashed = true;
    return auditEntryHash(e).then(function (hsh) {
      if (hsh !== e.hash)
        return {
          ok: false,
          at: arr.length - i,
          reason: "entry changed",
        };
      i++;
      return step();
    });
  }
  return step();
}

/* read a File as text, un-gzipping .gz with the browser's DecompressionStream */
export function readFileText(f: File): Promise<string> {
  if (/\.gz$/i.test(f.name) && (window as any).DecompressionStream)
    return new Response(
      f.stream().pipeThrough(new (window as any).DecompressionStream("gzip")),
    ).text();
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
