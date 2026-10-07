import { Field } from "@/app/auth/Field";
import { PwMeter } from "@/app/auth/PwMeter";
import { fmtTime } from "@/app/lib/common";
import { genPassword } from "@/app/users/utils";
import { AUTH, ROLE_HELP, ROLE_NAMES, passwordIssues } from "@/lib/auth";
import React, { useEffect, useState } from "react";
import * as V from "@/ui";

/* ================= Users (administrators) ================= */
export function UsersModal(p) {
  var ctx = p.ctx,
    ul = useState(null),
    users = ul[0] || [],
    ad = useState(null),
    temp = useState(null),
    err = useState(""),
    busy = useState(false),
    idle = useState(AUTH.idleMinutes),
    cu = useState(null);
  /* the list always comes from the server; every change re-reads it (changes are audited server-side) */
  function refresh() {
    return AUTH.users().then(ul[1], function (e) {
      err[1](e.message);
    });
  }
  useEffect(function () {
    refresh();
  }, []);
  function act(fn, msg) {
    err[1]("");
    return fn().then(
      function (r) {
        refresh();
        AUTH.loadDirectory();
        if (msg) ctx.toast({ title: msg });
        return r;
      },
      function (e) {
        err[1](e.message);
      },
    );
  }
  var form = ad[0];
  return (
    <V.Modal
      title="Users"
      subtitle="Accounts on this server. The role decides what each person can change; the server enforces it on every request."
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
                      AUTH.loadDirectory();
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
                  value={String(idle[0])}
                  onChange={function (e) {
                    var m = +e.target.value;
                    act(function () {
                      return AUTH.setIdle(m);
                    }, "Auto sign-out set to " + m + " min").then(function () {
                      idle[1](AUTH.idleMinutes);
                    });
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
      {temp[0] ? (
        <V.Banner
          tone="warn"
          title={"Temporary password for " + temp[0].username}
          onClose={function () {
            temp[1](null);
          }}
        >
          <code className="vl-mono">{temp[0].password}</code> — give it to the
          person directly. It's shown only once; they choose their own at sign-in,
          and their open sessions were ended.
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
              {ul[0] === null ? (
                <tr>
                  <td colSpan={5}>Loading…</td>
                </tr>
              ) : null}
              {users.map(function (u) {
                var self = ctx.me && ctx.me.id === u.id,
                  locked = u.locked;
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
                          act(function () {
                            return AUTH.updateUser(u.id, {
                              role: r2,
                            });
                          }, "Role changed — " + u.username + " must sign in again");
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
                      {u.disabled
                        ? "Disabled"
                        : locked
                          ? "Locked after failed sign-ins"
                          : u.mustChange
                            ? "Must change password"
                            : "Active"}
                    </td>
                    <td>
                        <span className="row-wrap">
                          <button
                            type="button"
                            className="up-edit"
                            onClick={function () {
                              act(function () {
                                return AUTH.updateUser(u.id, {
                                  resetPassword: true,
                                });
                              }, "Password reset").then(function (r) {
                                if (r && r.tempPassword)
                                  temp[1]({
                                    username: u.username,
                                    password: r.tempPassword,
                                  });
                              });
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
                                    return AUTH.updateUser(u.id, {
                                      disabled: !u.disabled,
                                    });
                                  },
                                  u.disabled
                                    ? "Account enabled"
                                    : "Account disabled and signed out",
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
                                act(function () {
                                  return AUTH.updateUser(u.id, {
                                    unlock: true,
                                  });
                                }, "Unlocked");
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
                                act(function () {
                                  return AUTH.removeUser(u.id);
                                }, "Account deleted");
                              }}
                            >
                              <V.Icon name="x" size={14} />
                            </button>
                          )}
                        </span>
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
