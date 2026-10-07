import { store } from "@/app/lib/common";

/* ================= 1. Dashboard ================= */
export function openRemTab(ctx, t) {
  store("vaptlens.remTab", t);
  ctx.go("remediation");
  try {
    window.dispatchEvent(
      new CustomEvent("vl-remtab", {
        detail: t,
      }),
    );
  } catch (e) {}
}
/* an open campaign that already covers exactly these findings */

/* an open campaign that already covers exactly these findings */
export function sameCampaign(ctx, keys) {
  var sig = keys.slice().sort().join("|");
  return (ctx.campaigns || []).find(function (c) {
    return (
      (c.keys || []).slice().sort().join("|") === sig &&
      (c.keys || []).some(function (k) {
        var g0 = ctx.gov[k] || {};
        return !g0.fixed && g0.state !== "fp" && g0.state !== "accepted";
      })
    );
  });
}

export function dupCampaignToast(ctx, c) {
  ctx.toast({
    title: "Already in a campaign",
    message: c.name + (c.due ? " · due " + c.due : ""),
    tone: "info",
    action: {
      label: "Open campaigns",
      onClick: function () {
        openRemTab(ctx, "Campaigns");
      },
    },
  });
}
