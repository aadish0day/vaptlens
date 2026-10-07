import { PageHead } from "@/app/components/PageHead";
import { store } from "@/app/lib/common";
import { BoardSummary } from "@/app/views/governance/BoardSummary";
import { ExceptionRegister } from "@/app/views/governance/ExceptionRegister";
import { Frameworks } from "@/app/views/governance/Frameworks";
import { Policies } from "@/app/views/governance/Policies";
import { RiskMoney } from "@/app/views/governance/RiskMoney";
import { govFacts } from "@/app/views/governance/utils";
import { verifyAudit } from "@/lib/store";
import React, { useEffect, useMemo, useState } from "react";
import * as V from "@/ui";

export function Governance(ctx) {
  var tabs = [
    "Frameworks",
    "Exceptions",
    "Risk in money",
    "Board summary",
    "Policies",
  ];
  var tb = useState(function () {
    return store("vaptlens.govTab") || "Frameworks";
  });
  function setTab(t) {
    tb[1](t);
    store("vaptlens.govTab", t);
  }
  var F = useMemo(
    function () {
      return govFacts(ctx);
    },
    [
      ctx.active,
      ctx.metrics,
      ctx.gov,
      ctx.assets,
      ctx.batches,
      ctx.intel,
      ctx.vexList,
      ctx.policy,
    ],
  );
  var A = useState(null);
  useEffect(
    function () {
      verifyAudit(ctx.audit, ctx.auditHead).then(A[1]);
    },
    [ctx.audit, ctx.auditHead],
  );
  return (
    <div className="page">
      <PageHead
        title={"Risk & Compliance"}
        sub="Framework checks, exceptions, risk in money and the board view — all computed in this browser from your scans and decisions. Use them as audit evidence; they don't replace an assessor."
      />
      <V.Tabs
        tabs={tabs.map(function (t) {
          return {
            label: t,
          };
        })}
        value={tb[0]}
        onChange={setTab}
      />
      {tb[0] === "Frameworks" ? (
        <Frameworks ctx={ctx} F={F} A={A[0]} />
      ) : tb[0] === "Exceptions" ? (
        <ExceptionRegister ctx={ctx} />
      ) : tb[0] === "Risk in money" ? (
        <RiskMoney ctx={ctx} />
      ) : tb[0] === "Board summary" ? (
        <BoardSummary ctx={ctx} F={F} setTab={setTab} />
      ) : (
        <Policies ctx={ctx} />
      )}
    </div>
  );
}
