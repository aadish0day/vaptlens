import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";
import { AnimatePresence, motion } from "motion/react";
import { HEIGHT, LEAVE, NONE, useReduced } from "@/ui/motion";

var ICON = {
  info: "info",
  success: "check-circle",
  warning: "alert-triangle",
  error: "x-circle",
};
/* ---------- Alert (ported from interior.dev collapsible-banner: smooth height collapse on dismiss) ---------- */
export function Alert(props) {
  var st = useState(false);
  var reduced = useReduced();
  var tone = props.tone || "info";
  return (
    <AnimatePresence>
      {!st[0] ? (
        <motion.div
          className="vl-alert-clip"
          initial={false}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0, transition: reduced ? NONE : LEAVE }}
          transition={reduced ? NONE : HEIGHT}
        >
          <div
            className={cx("vl-alert", "is-" + tone, props.className)}
            role={tone === "error" || tone === "warning" ? "alert" : "status"}
          >
            <Icon name={ICON[tone] || "info"} size={18} />
            <div className="vl-alert-main">
              {props.title ? (
                <div className="vl-alert-title">{props.title}</div>
              ) : null}
              {props.children ? (
                <div className="vl-alert-body">{props.children}</div>
              ) : null}
              {props.actions ? (
                <div className="vl-alert-actions">{props.actions}</div>
              ) : null}
            </div>
            {props.dismissible ? (
              <button
                type="button"
                className="vl-alert-x"
                aria-label="Dismiss"
                onClick={function () {
                  st[1](true);
                  if (props.onDismiss) props.onDismiss();
                }}
              >
                <Icon name="x" size={14} />
              </button>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
