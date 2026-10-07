import {
  IDB,
  LS_NAMES,
  P,
  VAULT,
  VAULT_META,
  b64,
  isDataKey,
  unb64,
} from "@/lib/store";

/* ---------- VAPTLens local accounts ----------
   Users live only in this browser. Each password derives a key-encryption key (PBKDF2-SHA-256,
   310,000 rounds) that wraps one shared data key (AES-GCM 256). Signing in unwraps the data key,
   which decrypts the workspace; a wrong password simply can't unwrap it. */
export var USERS_KEY = "vaptlens.users.v1",
  SESSION_KEY = "vaptlens.session";

export var ROLE_NAMES = [
  "Administrator",
  "Remediation Lead",
  "Security Auditor",
];

export var ROLE_HELP = {
  Administrator: "Everything, including users, encryption and data deletion",
  "Remediation Lead":
    "Triage, assign, raise tickets, upload scans; requests risk exceptions (an administrator approves)",
  "Security Auditor": "Read-only; can export reports",
};

export var LOCK_AFTER = 5,
  LOCK_MINUTES = 5;

export function passwordIssues(pw, username) {
  var out = [];
  if (pw.length < 12) out.push("at least 12 characters");
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) out.push("upper and lower case");
  if (!/\d/.test(pw) && !/[^A-Za-z0-9]/.test(pw))
    out.push("a number or symbol");
  if (username && pw.toLowerCase().indexOf(String(username).toLowerCase()) >= 0)
    out.push("not containing the username");
  if (/^(password|passw0rd|letmein|qwerty|12345)/i.test(pw))
    out.push("not a common password");
  return out;
}

export function passwordScore(pw) {
  var s = 0;
  if (pw.length >= 12) s++;
  if (pw.length >= 16) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

export var AUTH = {
  user: null,
  store: function () {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || "null");
    } catch (e) {
      return null;
    }
  },
  write: function (st) {
    localStorage.setItem(USERS_KEY, JSON.stringify(st));
  },
  hasUsers: function () {
    var s = AUTH.store();
    return !!(s && s.users && s.users.length);
  },
  kek: function (pw, salt) {
    return crypto.subtle
      .importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, [
        "deriveKey",
      ])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt: salt,
            iterations: 310000,
            hash: "SHA-256",
          },
          base,
          {
            name: "AES-GCM",
            length: 256,
          },
          false,
          ["wrapKey", "unwrapKey"],
        );
      });
  },
  wrapFor: function (pw, dek) {
    var salt = crypto.getRandomValues(new Uint8Array(16)),
      iv = crypto.getRandomValues(new Uint8Array(12));
    return AUTH.kek(pw, salt)
      .then(function (k) {
        return crypto.subtle.wrapKey("raw", dek, k, {
          name: "AES-GCM",
          iv: iv,
        });
      })
      .then(function (w) {
        return {
          salt: b64(salt),
          iv: b64(iv),
          wrapped: b64(w),
        };
      });
  },
  unwrap: function (u, pw) {
    return AUTH.kek(pw, unb64(u.salt)).then(function (k) {
      return crypto.subtle.unwrapKey(
        "raw",
        unb64(u.wrapped),
        k,
        {
          name: "AES-GCM",
          iv: unb64(u.iv),
        },
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"],
      );
    });
  },
  newId: function () {
    return (
      "u-" +
      Array.prototype.map
        .call(crypto.getRandomValues(new Uint8Array(6)), function (b) {
          return b.toString(16).padStart(2, "0");
        })
        .join("")
    );
  },
  publicUser: function (u) {
    return {
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
    };
  },
  /* first run: create the admin and encrypt whatever is already stored */
  setup: function (o) {
    return crypto.subtle
      .generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"],
      )
      .then(function (dek) {
        return AUTH.wrapFor(o.password, dek).then(function (w) {
          VAULT.key = dek;
          return encryptPlainStores().then(function () {
            var u = Object.assign(
              {
                id: AUTH.newId(),
                username: o.username.trim().toLowerCase(),
                name: o.name.trim() || o.username,
                role: "Administrator",
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                failed: 0,
                disabled: false,
                mustChange: false,
              },
              w,
            );
            AUTH.write({
              v: 1,
              users: [u],
              idleMinutes: 15,
            });
            localStorage.removeItem(VAULT_META);
            AUTH.user = AUTH.publicUser(u);
            return AUTH.startSession(u, dek);
          });
        });
      });
  },
  login: function (username, pw) {
    var st = AUTH.store(),
      name = String(username || "")
        .trim()
        .toLowerCase();
    var u =
      st &&
      st.users.find(function (x) {
        return x.username === name;
      });
    /* unknown user: spend the same PBKDF2 work so timing doesn't reveal which usernames exist */
    if (!u)
      return AUTH.kek(
        pw || "x",
        crypto.getRandomValues(new Uint8Array(16)),
      ).then(function () {
        throw {
          code: "bad",
          message: "Wrong username or password.",
        };
      });
    if (u.needsReset || !u.wrapped)
      return AUTH.kek(
        pw || "x",
        crypto.getRandomValues(new Uint8Array(16)),
      ).then(function () {
        throw {
          code: "reset",
          message:
            "The data key was rotated. Ask an administrator to set you a new temporary password.",
        };
      });
    if (u.disabled)
      return Promise.reject({
        code: "disabled",
        message: "This account is disabled. Ask an administrator.",
      });
    if (u.lockedUntil && u.lockedUntil > Date.now())
      return Promise.reject({
        code: "locked",
        message:
          "Too many failed attempts. Try again in " +
          Math.ceil((u.lockedUntil - Date.now()) / 60000) +
          " min.",
      });
    return AUTH.unwrap(u, pw).then(
      function (dek) {
        var s2 = AUTH.store(),
          me =
            s2 &&
            s2.users.find(function (x) {
              return x.id === u.id;
            });
        /* the account list can be unreadable (quota, blocked storage): sign in anyway, just skip the stats write */
        var hadFails = me ? me.failed || 0 : 0;
        if (me) {
          me.failed = 0;
          me.lockedUntil = null;
          me.prevLogin = me.lastLogin;
          me.lastLogin = new Date().toISOString();
          AUTH.write(s2);
        }
        VAULT.key = dek;
        AUTH.user = AUTH.publicUser(me || u);
        return AUTH.startSession(me || u, dek).then(function () {
          return {
            user: AUTH.user,
            mustChange: !!(me && me.mustChange),
            hadFails: hadFails,
            prevLogin: me ? me.prevLogin : null,
          };
        });
      },
      function () {
        var s2 = AUTH.store(),
          me =
            s2 &&
            s2.users.find(function (x) {
              return x.id === u.id;
            });
        /* the account list can be unreadable (quota, blocked storage): still report the bad password
           instead of crashing, and skip the failed-attempt bookkeeping we can't write */
        if (me) {
          if (me.lockedUntil && Date.now() > me.lockedUntil) {
            me.failed = 0;
          }
          me.failed = (me.failed || 0) + 1;
          me.lastFailedAt = new Date().toISOString();
          if (me.failed >= LOCK_AFTER)
            me.lockedUntil = Date.now() + LOCK_MINUTES * 60000;
          AUTH.write(s2);
        }
        throw {
          code: "bad",
          message:
            me && me.failed >= LOCK_AFTER
              ? "Too many failed attempts. Locked for " +
                LOCK_MINUTES +
                " minutes."
              : "Wrong username or password.",
        };
      },
    );
  },
  /* keep the data key for this tab only, so a reload doesn't sign you out; closing the tab or idling does.
     The tab's copy is wrapped by a NON-extractable key held in memory storage, so the raw data key is never
     written anywhere readable: script can use the wrapping key but can't export it. */
  startSession: function (u, dek) {
    var sid = "sess:" + AUTH.newId(),
      iv = crypto.getRandomValues(new Uint8Array(12));
    AUTH.sweepSessions();
    return crypto.subtle
      .generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        false,
        ["wrapKey", "unwrapKey"],
      )
      .then(function (tk) {
        return IDB.set(sid, {
          k: tk,
          at: Date.now(),
        }).then(function () {
          return crypto.subtle.wrapKey("raw", dek, tk, {
            name: "AES-GCM",
            iv: iv,
          });
        });
      })
      .then(function (w) {
        try {
          sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
              uid: u.id,
              sid: sid,
              iv: b64(iv),
              w: b64(w),
              seen: Date.now(),
            }),
          );
        } catch (e) {}
      });
  },
  /* drop tab keys older than a day (closed tabs never get to clean up) */
  sweepSessions: function () {
    return IDB.all()
      .then(function (all) {
        var cut = Date.now() - 864e5;
        return Promise.all(
          Object.keys(all)
            .filter(function (k) {
              return k.indexOf("sess:") === 0 && (!all[k] || all[k].at < cut);
            })
            .map(function (k) {
              return IDB.del(k);
            }),
        );
      })
      .catch(function () {});
  },
  resume: function () {
    var s = null;
    try {
      s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch (e) {}
    var st = AUTH.store();
    if (!s || !st) return Promise.resolve(null);
    var idle = (st.idleMinutes || 15) * 60000,
      u = st.users.find(function (x) {
        return x.id === s.uid && !x.disabled && !x.needsReset;
      });
    if (!u || Date.now() - s.seen > idle || !s.sid) {
      AUTH.clearSession();
      return Promise.resolve(null);
    }
    return IDB.get(s.sid)
      .then(function (rec) {
        if (!rec || !rec.k) throw new Error("no tab key");
        return crypto.subtle.unwrapKey(
          "raw",
          unb64(s.w),
          rec.k,
          {
            name: "AES-GCM",
            iv: unb64(s.iv),
          },
          {
            name: "AES-GCM",
            length: 256,
          },
          true,
          ["encrypt", "decrypt"],
        );
      })
      .then(
        function (dek) {
          VAULT.key = dek;
          AUTH.user = AUTH.publicUser(u);
          AUTH.touch();
          return {
            user: AUTH.user,
            mustChange: !!u.mustChange,
          };
        },
        function () {
          AUTH.clearSession();
          return null;
        },
      );
  },
  touch: function () {
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (s) {
        s.seen = Date.now();
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      }
    } catch (e) {}
  },
  clearSession: function () {
    try {
      var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (s && s.sid) IDB.del(s.sid);
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  },
  logout: function () {
    AUTH.clearSession();
    VAULT.key = null;
    AUTH.user = null;
  },
  /* admin + self-service (need the data key in memory) */
  addUser: function (o) {
    var st = AUTH.store(),
      name = o.username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(name))
      return Promise.reject(
        new Error(
          "Usernames are 3–32 characters: letters, numbers, dot, dash, underscore.",
        ),
      );
    if (
      st.users.some(function (x) {
        return x.username === name;
      })
    )
      return Promise.reject(new Error("That username is taken."));
    return AUTH.wrapFor(o.password, VAULT.key).then(function (w) {
      var u = Object.assign(
        {
          id: AUTH.newId(),
          username: name,
          name: o.name.trim() || name,
          role: o.role,
          createdAt: new Date().toISOString(),
          createdBy: AUTH.user && AUTH.user.username,
          failed: 0,
          disabled: false,
          mustChange: o.mustChange !== false,
        },
        w,
      );
      var s2 = AUTH.store();
      s2.users.push(u);
      AUTH.write(s2);
      return AUTH.publicUser(u);
    });
  },
  setPassword: function (id, pw, mustChange) {
    return AUTH.wrapFor(pw, VAULT.key).then(function (w) {
      var s2 = AUTH.store(),
        u = s2.users.find(function (x) {
          return x.id === id;
        });
      Object.assign(u, w, {
        needsReset: false,
        mustChange: !!mustChange,
        failed: 0,
        lockedUntil: null,
        pwChangedAt: new Date().toISOString(),
      });
      AUTH.write(s2);
    });
  },
  verify: function (id, pw) {
    var u = AUTH.store().users.find(function (x) {
      return x.id === id;
    });
    return AUTH.unwrap(u, pw).then(
      function () {
        return true;
      },
      function () {
        return false;
      },
    );
  },
  update: function (id, patch) {
    var s2 = AUTH.store(),
      u = s2.users.find(function (x) {
        return x.id === id;
      });
    var next = Object.assign({}, u, patch);
    var admins = s2.users.filter(function (x) {
      return (
        (x.id === id ? next : x).role === "Administrator" &&
        !(x.id === id ? next : x).disabled
      );
    });
    if (!admins.length)
      throw new Error("Keep at least one active administrator.");
    Object.assign(u, patch);
    AUTH.write(s2);
    return AUTH.publicUser(u);
  },
  remove: function (id) {
    var s2 = AUTH.store(),
      rest = s2.users.filter(function (x) {
        return x.id !== id;
      });
    if (
      !rest.some(function (x) {
        return x.role === "Administrator" && !x.disabled;
      })
    )
      throw new Error("Keep at least one active administrator.");
    s2.users = rest;
    AUTH.write(s2);
  },
  /* Rotate the data key: new AES key, every store re-encrypted, the caller's wrap renewed.
     Every other account loses its wrap (it could only open the old key) and needs a new temporary password.
     Run after removing a user so a copied old wrap + old password no longer opens current data. */
  rotateKey: function (myPw) {
    var meU = AUTH.user;
    if (!meU) return Promise.reject(new Error("Sign in first."));
    if (meU.role !== "Administrator")
      return Promise.reject(
        new Error("Unauthorized: only Administrators can rotate keys"),
      );
    var oldK = VAULT.key,
      newK = null;
    return AUTH.verify(meU.id, myPw).then(function (ok) {
      if (!ok) throw new Error("Your password is wrong.");
      var pending = P.idle();
      var job = pending
        .then(function () {
          return crypto.subtle.generateKey(
            {
              name: "AES-GCM",
              length: 256,
            },
            true,
            ["encrypt", "decrypt"],
          );
        })
        .then(function (k) {
          newK = k;
          function re(box) {
            return VAULT.dec(box, oldK).then(function (v) {
              return VAULT.enc(v, newK);
            });
          }
          /* 1) localStorage stores */
          var lsJobs = Object.keys(LS_NAMES).map(function (n) {
            var raw = localStorage.getItem(LS_NAMES[n] + ".enc");
            if (!raw) return null;
            return re(JSON.parse(raw)).then(function (b2) {
              return [LS_NAMES[n] + ".enc", JSON.stringify(b2)];
            });
          });
          return Promise.all(lsJobs)
            .then(function (lsOut) {
              /* 2) Stores & saved workspaces (whose snapshots nest boxes under the old key) */
              return IDB.all()
                .then(function (all) {
                  var jobs = Object.keys(all).map(function (k2) {
                    var v = all[k2];
                    if (isDataKey(k2) && v && v.ct)
                      return re(v).then(function (b2) {
                        return [k2, b2];
                      });
                    if (
                      k2.indexOf("ws:") === 0 &&
                      k2 !== "ws:index" &&
                      typeof v === "string" &&
                      v.indexOf('"encWs"') >= 0
                    )
                      return VAULT.dec(JSON.parse(v).encWs, oldK)
                        .then(function (snap) {
                          return rotateSnapshot(snap, oldK, newK);
                        })
                        .then(function (snap2) {
                          return VAULT.enc(snap2, newK);
                        })
                        .then(function (b2) {
                          return [
                            k2,
                            JSON.stringify({
                              encWs: b2,
                            }),
                          ];
                        });
                    return null;
                  });
                  return Promise.all(jobs);
                })
                .then(function (idbOut) {
                  /* everything decrypted fine: now commit */
                  lsOut.filter(Boolean).forEach(function (x) {
                    localStorage.setItem(x[0], x[1]);
                  });
                  return Promise.all(
                    idbOut.filter(Boolean).map(function (x) {
                      return IDB.set(x[0], x[1]);
                    }),
                  );
                });
            })
            .then(function () {
              return AUTH.wrapFor(myPw, newK);
            })
            .then(function (w) {
              var s2 = AUTH.store(),
                n = 0;
              s2.users.forEach(function (x) {
                if (x.id === meU.id) Object.assign(x, w);
                else {
                  delete x.wrapped;
                  delete x.salt;
                  delete x.iv;
                  x.needsReset = true;
                  n++;
                }
              });
              s2.keyRotatedAt = new Date().toISOString();
              AUTH.write(s2);
              VAULT.key = newK;
              return AUTH.startSession(
                s2.users.find(function (x) {
                  return x.id === meU.id;
                }),
                newK,
              ).then(function () {
                return n;
              });
            });
        });
      return P.hold(job);
    });
  },
  setIdle: function (m) {
    var s2 = AUTH.store();
    s2.idleMinutes = m;
    AUTH.write(s2);
  },
};

/* re-encrypt the boxes inside a saved-workspace snapshot (JSON text) from one key to another */

/* re-encrypt the boxes inside a saved-workspace snapshot (JSON text) from one key to another */
export function rotateSnapshot(text, oldK, newK) {
  var j = JSON.parse(text),
    ls = j.localStorage || {},
    idb = j.indexedDB || {};
  var jobs = Object.keys(ls)
    .filter(function (k) {
      return /\.enc$/.test(k);
    })
    .map(function (k) {
      return VAULT.dec(JSON.parse(ls[k]), oldK)
        .then(function (v) {
          return VAULT.enc(v, newK);
        })
        .then(function (b) {
          ls[k] = JSON.stringify(b);
        });
    })
    .concat(
      Object.keys(idb)
        .filter(function (k) {
          return isDataKey(k) && idb[k] && idb[k].ct;
        })
        .map(function (k) {
          return VAULT.dec(idb[k], oldK)
            .then(function (v) {
              return VAULT.enc(v, newK);
            })
            .then(function (b) {
              idb[k] = b;
            });
        }),
    );
  return Promise.all(jobs).then(function () {
    return JSON.stringify(j);
  });
}
/* encrypt every plaintext store with the current VAULT.key (first-run setup) */

/* encrypt every plaintext store with the current VAULT.key (first-run setup) */
export function encryptPlainStores() {
  var names = Object.keys(LS_NAMES);
  return Promise.all(
    names.map(function (n) {
      var raw = localStorage.getItem(LS_NAMES[n]);
      if (raw == null) return null;
      return VAULT.enc(JSON.parse(raw)).then(function (box) {
        localStorage.setItem(LS_NAMES[n] + ".enc", JSON.stringify(box));
        localStorage.removeItem(LS_NAMES[n]);
      });
    }),
  )
    .then(function () {
      return IDB.all();
    })
    .then(function (all) {
      return Promise.all(
        Object.keys(all)
          .filter(function (k) {
            return isDataKey(k) && all[k] && !all[k].ct;
          })
          .map(function (k) {
            return VAULT.enc(all[k]).then(function (box) {
              return IDB.set(k, box);
            });
          }),
      );
    })
    .then(function () {
      /* saved workspaces: re-save plaintext snapshots encrypted */
      return IDB.get("ws:index").then(function (idx) {
        return Promise.all(
          (idx || []).map(function (w) {
            return IDB.get("ws:" + w.name).then(function (j) {
              if (!j || typeof j !== "string" || j.indexOf('"encWs"') >= 0)
                return null;
              return VAULT.enc(j).then(function (box) {
                return IDB.set(
                  "ws:" + w.name,
                  JSON.stringify({
                    encWs: box,
                  }),
                );
              });
            });
          }),
        );
      });
    });
}
