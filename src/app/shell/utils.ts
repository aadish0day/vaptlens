import { AUTH } from "@/lib/auth";

export function signOut(reason) {
  AUTH.logout();
  try {
    if (reason) sessionStorage.setItem("vaptlens.signedOut", reason);
  } catch (e) {}
  location.reload();
}

/* ================= Users (administrators) ================= */
