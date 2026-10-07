import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";
import { AnimatePresence, motion } from "motion/react";
import { BASE, EASE_OUT, NONE, useReduced } from "@/ui/motion";

/* ---------- Button (with RestrictedButton behaviour) ---------- */
/* loading (ported from interior.dev loading-button): the label keeps its box so the button never
   resizes, fades out under a spinner, and clicks are ignored until the work settles */
function BtnBody(props) {
  var reduced = useReduced();
  var t = reduced ? NONE : { duration: BASE, ease: EASE_OUT };
  return (
    <>
      <motion.span
        className="vl-btn-body"
        initial={false}
        animate={{ opacity: props.loading ? 0 : 1 }}
        transition={t}
      >
        {props.children}
      </motion.span>
      <AnimatePresence initial={false}>
        {props.loading ? (
          <motion.span
            key="spin"
            className="vl-btn-spin"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={t}
          >
            <svg width="14" height="14" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="3"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function Button(props) {
  var variant = props.variant || "secondary";
  var size = props.size || "md";
  var restricted = !!props.restricted;
  var hasLoading = "loading" in props;
  var loading = !!props.loading;
  var rest = {};
  for (var k in props)
    if (
      [
        "variant",
        "size",
        "restricted",
        "restrictedReason",
        "icon",
        "className",
        "children",
        "onClick",
        "loading",
      ].indexOf(k) < 0
    )
      rest[k] = props[k];
  var btn = (
    <button
      {...(Object.assign(
        {
          type: "button",
        },
        rest,
        {
          className: cx(
            "vl-btn",
            "vl-btn-" + variant,
            "vl-btn-" + size,
            restricted && "is-restricted",
            hasLoading && "has-loading",
            loading && "is-loading",
            props.className,
          ),
          "aria-disabled": restricted || loading ? "true" : undefined,
          "aria-busy": loading ? "true" : undefined,
          onClick: function (e) {
            if (restricted || loading) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            if (props.onClick) props.onClick(e);
          },
        },
      ) as any)}
    >
      {hasLoading ? (
        <BtnBody loading={loading}>
          {restricted ? (
            <Icon name="lock" size={14} />
          ) : props.icon ? (
            <Icon name={props.icon} size={14} />
          ) : null}
          {props.children}
        </BtnBody>
      ) : (
        <>
          {restricted ? (
            <Icon name="lock" size={14} />
          ) : props.icon ? (
            <Icon name={props.icon} size={14} />
          ) : null}
          {props.children}
        </>
      )}
    </button>
  );
  if (!restricted) return btn;
  return (
    <span className="vl-tip-wrap">
      {btn}
      <span className="vl-tip" role="tooltip">
        {props.restrictedReason || "Your role can't perform this action."}
      </span>
    </span>
  );
}

/* ---------- SeverityBadge ---------- */
