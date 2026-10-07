import { nowIso } from "@/app/lib/common";
import { ENG_DEFAULT } from "@/app/views/report/utils";
import { imageToDataUrl } from "@/lib/store";
import React, { useRef, useState } from "react";
import * as V from "@/ui";

export function EngagementModal(p) {
  var ctx = p.ctx,
    e0 = Object.assign({}, ENG_DEFAULT, ctx.engagement || {}),
    es = useState(e0),
    e = es[0],
    lg = useRef(null);
  function set(k, v) {
    var n = Object.assign({}, e);
    n[k] = v;
    es[1](n);
  }
  function field(k, label, type, ph?) {
    return (
      <label className="wb-field">
        <span className="vl-label">{label}</span>
        <input
          className="wb-select"
          type={type || "text"}
          placeholder={ph || ""}
          value={e[k] || ""}
          onChange={function (ev) {
            set(k, ev.target.value);
          }}
        />
      </label>
    );
  }
  return (
    <V.Modal
      title="Engagement details"
      subtitle="Printed on the report cover and in every export. Stored in this browser (encrypted when the vault is on)."
      width="760px"
      onClose={p.onClose}
      footer={[
        <V.Button key="c" onClick={p.onClose}>
          Cancel
        </V.Button>,
        <V.Button
          key="s"
          variant="primary"
          disabled={ctx.readOnly}
          onClick={function () {
            var prev = (ctx.engagement || {}).status;
            if (
              e.status === "Approved" &&
              prev !== "Approved" &&
              !ctx.isAdmin
            ) {
              ctx.toast({
                title: "Only an administrator can approve the report",
                message: "Saved as In review.",
                tone: "info",
              });
              e.status = "In review";
            }
            if (
              prev === "Approved" &&
              e.status === "Approved" &&
              !ctx.isAdmin &&
              JSON.stringify(
                Object.assign({}, e, {
                  status: 0,
                  approvedAt: 0,
                  approvedBy: 0,
                }),
              ) !==
                JSON.stringify(
                  Object.assign({}, ctx.engagement || {}, {
                    status: 0,
                    approvedAt: 0,
                    approvedBy: 0,
                  }),
                )
            ) {
              e.status = "In review";
              e.approvedBy = "";
              ctx.toast({
                title: "Report moved back to In review",
                message:
                  "It changed after approval, so an administrator has to approve it again.",
                tone: "info",
              });
            }
            if (e.status === "Approved" && prev !== "Approved") {
              e.approvedAt = nowIso();
              e.approvedBy = ctx.me.username;
            }
            if (e.status !== "Approved") e.approvedAt = "";
            ctx.setEngagement(e);
            ctx.log(
              "ENGAGEMENT",
              (e.client || "Engagement") +
                " saved · " +
                e.status +
                (e.reviewer ? " · reviewer " + e.reviewer : ""),
            );
            p.onClose();
          }}
        >
          Save
        </V.Button>,
      ]}
    >
      <div className="eng-grid">
        {field("client", "Client", "text", "Client name")}
        {field(
          "project",
          "Engagement",
          "text",
          "External & web application VAPT",
        )}
        {field("testers", "Testers", "text", "Tester names")}
        {field("classification", "Classification", "text", "Confidential")}
        {field("start", "Start date", "date")}
        {field("end", "End date", "date")}
        <label className="wb-field eng-wide">
          <span className="vl-label">Scope</span>
          <textarea
            className="sum-edit"
            rows={3}
            placeholder="In-scope ranges, URLs, exclusions, test windows…"
            value={e.scopeText}
            onChange={function (ev) {
              set("scopeText", ev.target.value);
            }}
          />
        </label>
        <label className="wb-field eng-wide">
          <span className="vl-label">Methodology</span>
          <textarea
            className="sum-edit"
            rows={3}
            placeholder="e.g. OWASP WSTG v4.2, PTES, NIST SP 800-115; authenticated and unauthenticated testing…"
            value={e.methodology}
            onChange={function (ev) {
              set("methodology", ev.target.value);
            }}
          />
        </label>
        {field("reviewer", "Reviewer (QA sign-off)", "text", "Lead consultant")}
        <label className="wb-field">
          <span className="vl-label">Report status</span>
          <select
            className="wb-select"
            value={e.status}
            onChange={function (ev) {
              set("status", ev.target.value);
            }}
          >
            {["Draft", "In review", "Approved"].map(function (o) {
              return (
                <option
                  key={o}
                  value={o}
                  disabled={
                    o === "Approved" &&
                    !ctx.isAdmin &&
                    (ctx.engagement || {}).status !== "Approved"
                  }
                >
                  {o +
                    (o === "Approved" && !ctx.isAdmin
                      ? " (administrator)"
                      : "")}
                </option>
              );
            })}
          </select>
        </label>
        <div className="wb-field eng-wide">
          <span className="vl-label">Client logo (optional)</span>
          <div className="row-wrap">
            {e.logo ? (
              <img className="eng-logo" src={e.logo} alt="Client logo" />
            ) : null}
            <V.Button
              size="sm"
              icon="upload"
              onClick={function () {
                lg.current.click();
              }}
            >
              {e.logo ? "Replace" : "Upload logo"}
            </V.Button>
            {e.logo ? (
              <V.Button
                size="sm"
                variant="ghost"
                onClick={function () {
                  set("logo", "");
                }}
              >
                Remove
              </V.Button>
            ) : null}
            <input
              ref={lg}
              type="file"
              accept="image/*"
              hidden={true}
              onChange={function (ev) {
                var f = ev.target.files[0];
                if (f)
                  imageToDataUrl(f).then(function (u) {
                    set("logo", u);
                  });
              }}
            />
          </div>
        </div>
      </div>
    </V.Modal>
  );
}
