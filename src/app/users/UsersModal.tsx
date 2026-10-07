import { Field } from "@/app/auth/Field";
import { PwMeter } from "@/app/auth/PwMeter";
import { fmtTime } from "@/app/lib/common";
import { RotateKey } from "@/app/users/RotateKey";
import { genPassword } from "@/app/users/utils";
import { AUTH, ROLE_HELP, ROLE_NAMES, passwordIssues } from "@/lib/auth";
import React, { useState } from "react";
import * as V from "@/ui";

/* ================= Users (administrators) ================= */
export function UsersModal(p) {
  var ctx = p.ctx,
    rv = useState(0),
    st = AUTH.store() || {
      users: [],
    },
    ad = useState(null),
    rp = useState(null),
    err = useState(""),
    busy = useState(false),
    rot = useState(false),
    cu = useState(null);
  function refresh() {
    rv[1](rv[0] + 1);
  }
  function act(fn, msg, logA, logD) {
    err[1]("");
    try {
      var r = fn();
      Promise.resolve(r).then(
        function () {
          refresh();
          if (msg)
            ctx.toast({
              title: msg,
            });
          if (logA) ctx.log(logA, logD);
        },
        function (e) {
          err[1](e.message);
        },
      );
    } catch (e) {
      err[1](e.message);
    }
  }
  var form = ad[0];
  return (
    <V.Modal
      title="Users"
      subtitle="Accounts for this browser. Each sign-in unlocks the same encrypted workspace; the role decides what the person can change."
      width="860px"
      onClose={p.onClose}
      footer={
        form
          ? [
              <V.Button
                key="c"
                onClick={function () {
                  ad[1](null);
                }}
              >
                Cancel
              </V.Button>,
              <V.Button
                key="s"
                variant="primary"
                disabled={
                  busy[0] ||
                  !form.username ||
                  passwordIssues(form.password, form.username).length > 0
                }
                onClick={function () {
                  busy[1](true);
                  err[1]("");
                  AUTH.addUser(form).then(
                    function (u) {
                      busy[1](false);
                      ad[1](null);
                      refresh();
                      ctx.log("USER-ADD", u.username + " created as " + u.role);
                      ctx.toast({
                        title: "Account created",
                        message:
                          u.username +
                          " must change the temporary password at first sign-in.",
                      });
                    },
                    function (e) {
                      busy[1](false);
                      err[1](e.message);
                    },
                  );
                }}
              >
                {busy[0] ? "Creating…" : "Create account"}
              </V.Button>,
            ]
          : [
              <label key="i" className="idle-set">
                <span className="vl-label">Auto sign-out after</span>
                <select
                  className="wb-select"
                  value={String(st.idleMinutes || 15)}
                  onChange={function (e) {
                    AUTH.setIdle(+e.target.value);
                    refresh();
                    ctx.log(
                      "POLICY",
                      "Idle sign-out set to " + e.target.value + " min",
                    );
                  }}
                >
                  {[5, 15, 30, 60, 240].map(function (m) {
                    return (
                      <option key={m} value={m}>
                        {m + " min idle"}
                      </option>
                    );
                  })}
                </select>
              </label>,
              <V.Button
                key="n"
                variant="primary"
                icon="plus"
                onClick={function () {
                  ad[1]({
                    username: "",
                    name: "",
                    role: "Remediation Lead",
                    password: "",
                    mustChange: true,
                  });
                }}
              >
                Add user
              </V.Button>,
            ]
      }
    >
      {err[0] ? (
        <V.Banner tone="danger" title="Couldn't do that">
          {err[0]}
        </V.Banner>
      ) : null}
      {rot[0] && !form ? (
        <V.Banner tone="warn" title="Rotate the data key now?">
          The removed account's wrapped key may exist in an old backup or a
          copied browser profile. Rotating makes it useless.
          <RotateKey
            ctx={ctx}
            onDone={function () {
              rot[1](false);
              refresh();
            }}
          />
        </V.Banner>
      ) : null}
      {form ? (
        <div className="eng-grid">
          <Field
            label="Username"
            input={{
              value: form.username,
              autoCapitalize: "none",
              placeholder: "username",
              onChange: function (e) {
                ad[1](
                  Object.assign({}, form, {
                    username: e.target.value,
                  }),
                );
              },
            }}
          />
          <Field
            label="Display name"
            input={{
              value: form.name,
              placeholder: "Full name",
              onChange: function (e) {
                ad[1](
                  Object.assign({}, form, {
                    name: e.target.value,
                  }),
                );
              },
            }}
          />
          <label className="wb-field">
            <span className="vl-label">Role</span>
            <select
              className="wb-select"
              value={form.role}
              onChange={function (e) {
                ad[1](
                  Object.assign({}, form, {
                    role: e.target.value,
                  }),
                );
              }}
            >
              {ROLE_NAMES.map(function (r) {
                return (
                  <option key={r} value={r}>
                    {r}
                  </option>
                );
              })}
            </select>
            <span className="up-help">{ROLE_HELP[form.role]}</span>
          </label>
          <div className="wb-field">
            <Field
              label="Temporary password"
              input={{
                type: "text",
                value: form.password,
                autoComplete: "off",
                onChange: function (e) {
                  ad[1](
                    Object.assign({}, form, {
                      password: e.target.value,
                    }),
                  );
                },
              }}
            />
            <PwMeter value={form.password} username={form.username} />
            <button
              type="button"
              className="up-edit"
              onClick={function () {
                ad[1](
                  Object.assign({}, form, {
                    password: genPassword(),
                  }),
                );
              }}
            >
              Generate
            </button>
          </div>
          <p className="up-help eng-wide">
            Give the temporary password to the person directly. They must choose
            their own at first sign-in.
          </p>
        </div>
      ) : (
        <div className="scroll-x">
          <table className="ledger users">
            <thead>
              <tr>
                {["User", "Role", "Last sign-in", "Status", ""].map(
                  function (c, i) {
                    return <th key={i}>{c}</th>;
                  },
                )}
              </tr>
            </thead>
            <tbody>
              {st.users.map(function (u) {
                var self = ctx.me && ctx.me.id === u.id,
                  locked = u.lockedUntil && u.lockedUntil > Date.now();
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="up-main">
                        <span className="up-name">
                          {u.name + (self ? " (you)" : "")}
                        </span>
                        <span className="up-meta">{u.username}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        className="wb-select"
                        value={u.role}
                        aria-label={"Role for " + u.username}
                        onChange={function (e) {
                          var r2 = e.target.value;
                          act(
                            function () {
                              return AUTH.update(u.id, {
                                role: r2,
                              });
                            },
                            "Role changed",
                            "USER-ROLE",
                            u.username + " → " + r2,
                          );
                        }}
                      >
                        {ROLE_NAMES.map(function (r) {
                          return (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="vl-mono">
                      {u.lastLogin ? fmtTime(u.lastLogin) : "never"}
                    </td>
                    <td>
                      {u.needsReset ? (
                        <span className="vl-fg-status-warn">
                          Key rotated · set a new password
                        </span>
                      ) : u.disabled ? (
                        "Disabled"
                      ) : locked ? (
                        "Locked · " + (u.failed || 0) + " failed"
                      ) : u.mustChange ? (
                        "Must change password"
                      ) : u.failed ? (
                        u.failed + " failed attempt(s)"
                      ) : (
                        "Active"
                      )}
                    </td>
                    <td>
                      {rp[0] === u.id ? (
                        <form
                          className="sv-form"
                          onSubmit={function (e) {
                            e.preventDefault();
                            var pw2 = (e.target as any).elements.np.value;
                            if (passwordIssues(pw2, u.username).length) {
                              err[1](
                                "Temporary password needs " +
                                  passwordIssues(pw2, u.username).join(", ") +
                                  ".",
                              );
                              return;
                            }
                            act(
                              function () {
                                return AUTH.setPassword(u.id, pw2, true);
                              },
                              "Password reset",
                              "USER-RESET",
                              u.username +
                                " password reset by " +
                                ctx.me.username,
                            );
                            rp[1](null);
                          }}
                        >
                          <input
                            name="np"
                            className="wb-select"
                            defaultValue={genPassword()}
                            aria-label="New temporary password"
                          />
                          <V.Button size="sm" type="submit">
                            Set
                          </V.Button>
                          <button
                            type="button"
                            className="up-edit"
                            onClick={function () {
                              rp[1](null);
                            }}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <span className="row-wrap">
                          <button
                            type="button"
                            className="up-edit"
                            onClick={function () {
                              rp[1](u.id);
                            }}
                          >
                            Reset password
                          </button>
                          {self ? null : (
                            <button
                              type="button"
                              className="up-edit"
                              onClick={function () {
                                act(
                                  function () {
                                    return AUTH.update(u.id, {
                                      disabled: !u.disabled,
                                      lockedUntil: null,
                                      failed: 0,
                                    });
                                  },
                                  u.disabled
                                    ? "Account enabled"
                                    : "Account disabled",
                                  "USER-" + (u.disabled ? "ENABLE" : "DISABLE"),
                                  u.username,
                                );
                              }}
                            >
                              {u.disabled ? "Enable" : "Disable"}
                            </button>
                          )}
                          {locked ? (
                            <button
                              type="button"
                              className="up-edit"
                              onClick={function () {
                                act(
                                  function () {
                                    return AUTH.update(u.id, {
                                      lockedUntil: null,
                                      failed: 0,
                                    });
                                  },
                                  "Unlocked",
                                  "USER-UNLOCK",
                                  u.username,
                                );
                              }}
                            >
                              Unlock
                            </button>
                          ) : null}
                          {self ? null : (
                            <button
                              type="button"
                              aria-label={
                                (cu[0] === u.id
                                  ? "Confirm delete "
                                  : "Delete ") + u.username
                              }
                              title={
                                cu[0] === u.id
                                  ? "Click again to delete"
                                  : "Delete account"
                              }
                              className={
                                "vl-icon-btn" +
                                (cu[0] === u.id ? " is-danger" : "")
                              }
                              onClick={function () {
                                if (cu[0] !== u.id) {
                                  cu[1](u.id);
                                  setTimeout(function () {
                                    cu[1](null);
                                  }, 5000);
                                  return;
                                }
                                cu[1](null);
                                act(
                                  function () {
                                    return AUTH.remove(u.id);
                                  },
                                  "Account deleted",
                                  "USER-DELETE",
                                  u.username,
                                );
                                rot[1](true);
                              }}
                            >
                              <V.Icon name="x" size={14} />
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </V.Modal>
  );
}
/* new data key; every store re-encrypted; other accounts need a fresh temporary password */
