import { SEV_LABEL, hostLabel } from "@/app/lib/common";
import { findingByKey } from "@/app/lib/export";
import { EMPTY_FILTERS } from "@/app/lib/filters";
import { vlLabel, vlLabel32 } from "@/app/lib/integrations";
import { Detail } from "@/app/views/findings/Detail";
import { lifeLabel } from "@/app/views/findings/utils";
import React from "react";
import * as V from "@/ui";

export function FindingDrawer(p) {
  var ctx = p.ctx,
    key = p.open.key;
  /* links made before a host merge (old key) or with the older 32-bit label still resolve */
  if (!key && p.open.label) {
    var L0 = p.open.label,
      ks0 = Object.keys(ctx.eng.findings);
    key =
      ks0.find(function (k) {
        return vlLabel(k) === L0;
      }) ||
      ks0.find(function (k) {
        return [k].concat((ctx.gov[k] || {}).oldKeys || []).some(function (k2) {
          return vlLabel(k2) === L0 || vlLabel32(k2) === L0;
        });
      });
  }
  var f = key ? findingByKey(ctx, key) : null;
  if (!f)
    return (
      <V.Drawer title="Finding not found" onClose={p.onClose}>
        <V.EmptyState
          title="This finding isn't in the current workspace."
          hint="The link may point to data that was deleted, or to another workspace."
        />
      </V.Drawer>
    );
  var hist = (ctx.eng.findings[f.key] || {}).history || [];
  return (
    <V.Drawer
      eyebrow={
        SEV_LABEL[f.sev] +
        " · " +
        f.tool +
        (f.lifecycle ? " · " + lifeLabel(f, ctx) : "")
      }
      title={f.name}
      onClose={p.onClose}
      meta={[
        <button
          key="h"
          type="button"
          className="up-edit vl-mono"
          onClick={function () {
            ctx.openHost(f.host);
          }}
        >
          {hostLabel(f)}
        </button>,
        hist.length ? (
          <span key="s" className="up-meta">
            {"seen in " +
              hist.filter(function (x) {
                return x[1] !== "Fixed" && x[1] !== "Not re-scanned";
              }).length +
              " of " +
              ctx.batches.length +
              " scans"}
          </span>
        ) : null,
      ]}
      footer={[
        <V.Button
          key="c"
          size="sm"
          icon="paperclip"
          onClick={function () {
            var u = location.href.split("#")[0] + "#f-" + vlLabel(f.key);
            var done = function () {
              ctx.toast({
                title: "Link copied",
                message:
                  "It opens this finding for anyone with access to this workspace.",
              });
            };
            try {
              navigator.clipboard.writeText(u).then(done, function () {
                ctx.toast({
                  title: "Copy this link",
                  message: u,
                  tone: "info",
                });
              });
            } catch (e) {
              ctx.toast({
                title: "Copy this link",
                message: u,
                tone: "info",
              });
            }
          }}
        >
          Copy link
        </V.Button>,
        <V.Button
          key="d"
          size="sm"
          variant="ghost"
          onClick={function () {
            ctx.setFilters(
              Object.assign({}, EMPTY_FILTERS, {
                q: f.name,
              }),
            );
            ctx.showFindings();
          }}
        >
          Show similar in table
        </V.Button>,
      ]}
    >
      <Detail
        row={{
          _f: f,
          id: f.id,
        }}
        ctx={ctx}
      />
    </V.Drawer>
  );
}
/* keyboard shortcuts overlay (?) */
