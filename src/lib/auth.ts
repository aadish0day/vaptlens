import { api } from "@/lib/store";

/* ---------- VAPTLens accounts ----------
   Accounts, passwords and sessions live on the server (server/server.mjs). The browser only holds an HttpOnly
   session cookie it can't read; roles are enforced by the API on every request. */

export var ROLE_NAMES = ["Administrator", "Remediation Lead", "Security Auditor"];

export var ROLE_HELP = {
  Administrator: "Everything, including users, policy and deleting workspaces",
  "Remediation Lead":
    "Triage, assign, raise tickets, upload scans; requests risk exceptions (an administrator approves)",
  "Security Auditor": "Read-only; can export reports",
};

/* same rules the server enforces (server/server.mjs passwordIssues) — shown live while typing */
export function passwordIssues(pw, username) {
  var out = [];
  if (pw.length < 12) out.push("at least 12 characters");
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) out.push("upper and lower case");
  if (!/\d/.test(pw) && !/[^A-Za-z0-9]/.test(pw)) out.push("a number or symbol");
  if (username && pw.toLowerCase().indexOf(String(username).toLowerCase()) >= 0)
    out.push("not containing the username");
  if (/^(password|passw0rd|letmein|qwerty|12345)/i.test(pw)) out.push("not a common password");
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

export type User = { id: string; username: string; name: string; role: string };
export type ManagedUser = User & {
  disabled: boolean;
  mustChange: boolean;
  locked: boolean;
  createdAt: string;
  createdBy?: string;
  lastLogin?: string;
  tempPassword?: string;
};

export var AUTH = {
  user: null as User | null,
  /* everyone who can be @mentioned or assigned (active accounts) */
  directory: [] as User[],
  idleMinutes: 15,

  /* { setupNeeded } | { user, mustChange, idleMinutes } | { signedOut } */
  state: function () {
    return api("/api/auth/state").then(function (r) {
      if (r.user) {
        AUTH.user = r.user;
        AUTH.idleMinutes = r.idleMinutes || 15;
      }
      return r;
    });
  },
  setup: function (o: { username: string; name: string; password: string }) {
    return api("/api/auth/setup", { method: "POST", body: o }).then(function (r) {
      AUTH.user = r.user;
      return r;
    });
  },
  login: function (username: string, password: string) {
    return api("/api/auth/login", { method: "POST", body: { username: username, password: password } }).then(
      function (r) {
        AUTH.user = r.user;
        return r;
      },
    );
  },
  logout: function () {
    AUTH.user = null;
    return api("/api/auth/logout", { method: "POST", body: {} }).catch(function () {});
  },
  changePassword: function (current: string, next: string) {
    return api("/api/auth/password", { method: "POST", body: { current: current, next: next } });
  },
  loadDirectory: function () {
    return api("/api/users/directory").then(function (list) {
      AUTH.directory = list || [];
      return AUTH.directory;
    });
  },

  /* administrators */
  users: function (): Promise<ManagedUser[]> {
    return api("/api/users");
  },
  addUser: function (o: { username: string; name: string; role: string; password: string; mustChange?: boolean }) {
    return api("/api/users", { method: "POST", body: o });
  },
  updateUser: function (
    id: string,
    patch: { name?: string; role?: string; disabled?: boolean; resetPassword?: boolean; unlock?: boolean },
  ): Promise<ManagedUser> {
    return api("/api/users/" + encodeURIComponent(id), { method: "PATCH", body: patch });
  },
  removeUser: function (id: string) {
    return api("/api/users/" + encodeURIComponent(id), { method: "DELETE" });
  },
  setIdle: function (m: number) {
    return api("/api/settings", { method: "PUT", body: { idleMinutes: m } }).then(function (r) {
      AUTH.idleMinutes = r.idleMinutes;
      return r;
    });
  },
};
