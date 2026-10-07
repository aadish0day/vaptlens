import { RejectButton } from "@/app/components/RejectButton";
import { hostLabel } from "@/app/lib/common";
import React from "react";
import * as V from "@/ui";

/* ---------- exception approvals (admins) ---------- */
export function ApprovalsModal(p) {
  var ctx = p.ctx,
    reqs = ctx.data.filter(function (f) {
      var g0 = ctx.gov[f.key];
      return (
        f.batch === ctx.latest &&
        f.lifecycle !== "Fixed" &&
        g0 &&
        g0.state === "requested"
      );
    });
  function decide(f, ok, why?) {
    ctx.decideRequest([f.key], ok, why);
  }
  return (
    <V.Modal
      title={"Risk acceptance requests · " + reqs.length}
      footer={
        reqs.length > 1
          ? [
              <V.Button
                key="a"
                variant="primary"
                onClick={function () {
                  ctx.decideRequest(
                    reqs.map(function (f) {
                      return f.key;
                    }),
                    true,
                  );
                }}
              >
                {"Approve all " + reqs.length}
              </V.Button>,
            ]
          : null
      }
      subtitle="Findings stay in the active queue and keep their SLA until an administrator approves the exception."
      width="820px"
      onClose={p.onClose}
    >
      {reqs.length ? (
        <div className="up-list">
          {reqs.map(function (f) {
            var g0 = ctx.gov[f.key];
            return (
              <div key={f.id} className="up-row">
                <div className="up-main">
                  <span className="up-name">
                    {f.name + " · " + hostLabel(f)}
                  </span>
                  <span className="up-meta">
                    {(g0.by || "?") +
                      (g0.requestedState === "fp"
                        ? " says false positive: "
                        : " asks to accept until " + (g0.until || "—") + ": ") +
                      (g0.reason || "")}
                  </span>
                </div>
                <V.SeverityBadge severity={f.sev} />
                <span className="row-wrap">
                  <RejectButton
                    onReject={function (why) {
                      decide(f, false, why);
                    }}
                  />
                  <V.Button
                    size="sm"
                    variant="primary"
                    onClick={function () {
                      decide(f, true);
                    }}
                  >
                    Approve
                  </V.Button>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <V.EmptyState title="No pending requests." />
      )}
    </V.Modal>
  );
}

/* ---------- digest ---------- */
