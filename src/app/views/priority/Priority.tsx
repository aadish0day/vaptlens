import { PageHead } from "@/app/components/PageHead";
import { openRow } from "@/app/components/utils";
import { count, hostLabel } from "@/app/lib/common";
import { SSVC_TONE } from "@/app/views/findings/utils";
import React, { useState } from "react";
import * as V from "@/ui";

/* ================= 4. Prioritization ================= */
export function Priority(ctx) {
  var a = ctx.active.slice().sort(function (x, y) {
    return y.risk - x.risk;
  });
  var RT = 40,
    ET = 6;
  function quad(x) {
    var hi = x.risk >= RT,
      he = x.effort >= ET;
    return hi
      ? he
        ? "strategic"
        : "quickwins"
      : he
        ? "deferrable"
        : "mundane";
  }
  var q = useState("quickwins");
  var list = a.filter(function (x) {
    return quad(x) === q[0];
  });
  var names = {
    quickwins: "Quick Wins",
    strategic: "Strategic",
    mundane: "Mundane Fixes",
    deferrable: "Deferrable",
  };
  return (
    <div className="page">
      <PageHead
        title="Prioritization Matrix"
        sub={
          "Risk score (0–100, ≥ " +
          RT +
          " is high) against remediation effort (1–10, ≥ " +
          ET +
          " is high). SSVC decision shown on each row."
        }
      />
      <section className="grid-prio">
        <div className="matrix">
          <span className="axis-y">Risk ↑</span>
          <div className="matrix-grid">
            {["quickwins", "strategic", "mundane", "deferrable"].map(
              function (k) {
                return (
                  <V.QuadrantTile
                    key={k}
                    kind={k}
                    count={count(a, function (x) {
                      return quad(x) === k;
                    })}
                    selected={q[0] === k}
                    onClick={function () {
                      q[1](k);
                    }}
                  />
                );
              },
            )}
          </div>
          <span className="axis-x">Effort →</span>
        </div>
        <V.WidgetCard
          title={"Triage queue · " + names[q[0]] + " · " + list.length}
          draggable={false}
        >
          {list.length ? (
            <div className="triage">
              {list.map(function (x) {
                return (
                  <div
                    {...Object.assign(
                      {
                        key: x.id,
                      },
                      openRow(ctx, x.key, "triage-row"),
                    )}
                  >
                    <V.SeverityBadge severity={x.sev} />
                    <div className="triage-main">
                      <span className="triage-t">{x.name}</span>
                      <span className="triage-m">
                        {hostLabel(x) +
                          " · risk " +
                          x.risk +
                          (x.epss != null
                            ? " · EPSS " + (x.epss * 100).toFixed(0) + "%"
                            : "")}
                      </span>
                    </div>
                    <span className={"ssvc ssvc-" + SSVC_TONE[x.ssvc.decision]}>
                      {x.ssvc.decision}
                    </span>
                    <V.EffortMeter value={x.effort} />
                  </div>
                );
              })}
            </div>
          ) : (
            <V.EmptyState title="Nothing in this quadrant." />
          )}
        </V.WidgetCard>
      </section>
    </div>
  );
}

/* ================= 5. Remediation ================= */
