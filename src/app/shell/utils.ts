import { AUTH } from "@/lib/auth";
import { P } from "@/lib/store";

/* wait for queued saves (so nothing typed in the last moment is lost), end the server session, reload */
export function signOut(reason) {
  P.idle()
    .then(function () {
      return AUTH.logout();
    })
    .then(function () {
      try {
        if (reason) sessionStorage.setItem("vaptlens.signedOut", reason);
      } catch (e) {}
      location.reload();
    });
}

/* ================= Users (administrators) ================= */
