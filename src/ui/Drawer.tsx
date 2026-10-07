import React from "react";
import { Icon } from "@/ui/Icon";
import { cx, useDialog } from "@/ui/core";
import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT, BASE, SURFACE, LEAVE, NONE, useReduced } from "@/ui/motion";

/* ---------- Drawer ---------- */
export function Drawer(props) {
  return (
    <AnimatePresence>
      {props.open === false ? null : <DrawerInner key="drawer" {...props} />}
    </AnimatePresence>
  );
}

export function DrawerInner(props) {
  var ref = useDialog(props.onClose);
  var reduced = useReduced();
  var downOutside = React.useRef(false);
  return (
    <motion.div
      className="vl-overlay"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: reduced ? NONE : { duration: BASE, ease: EASE_OUT },
      }}
      exit={{ opacity: 0, transition: reduced ? NONE : LEAVE }}
      onPointerDown={function (e) {
        downOutside.current = e.target === e.currentTarget;
      }}
      onClick={function (e) {
        if (
          e.target === e.currentTarget &&
          downOutside.current &&
          props.onClose
        )
          props.onClose();
        downOutside.current = false;
      }}
    >
      <motion.aside
        initial={reduced ? false : { x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1, transition: reduced ? NONE : SURFACE }}
        exit={
          reduced
            ? { opacity: 0, transition: NONE }
            : { x: 24, opacity: 0, transition: LEAVE }
        }
        ref={ref}
        tabIndex={-1}
        className="vl-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
      >
        <header className="vl-drawer-head">
          <div className="vl-drawer-titles">
            {props.eyebrow ? (
              <span className="vl-label">{props.eyebrow}</span>
            ) : null}
            <h2 className={cx("vl-drawer-title", props.mono && "is-mono")}>
              {props.title}
            </h2>
            {props.meta ? (
              <div className="vl-drawer-meta">{props.meta}</div>
            ) : null}
          </div>
          <button
            type="button"
            className="vl-icon-btn"
            aria-label="Close"
            onClick={props.onClose}
          >
            <Icon name="x" size={14} />
          </button>
        </header>
        <div className="vl-drawer-body">{props.children}</div>
        {props.footer ? (
          <footer className="vl-drawer-foot">{props.footer}</footer>
        ) : null}
      </motion.aside>
    </motion.div>
  );
}

/* ---------- VulnTable ---------- */
