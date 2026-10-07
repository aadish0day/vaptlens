import React from "react";
import { Icon } from "@/ui/Icon";
import { useDialog } from "@/ui/core";
import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT, BASE, SURFACE, LEAVE, NONE, useReduced } from "@/ui/motion";

/* exit animates when the caller passes open={false}; a caller that unmounts the Modal skips it */
export function Modal(props) {
  return (
    <AnimatePresence>
      {props.open === false ? null : <ModalInner key="modal" {...props} />}
    </AnimatePresence>
  );
}

export function ModalInner(props) {
  /* onCloseGuard: a question to confirm before closing by backdrop, Esc or ×, when the dialog holds unsaved work */
  function close() {
    if (props.onCloseGuard && !window.confirm(props.onCloseGuard)) return;
    if (props.onClose) props.onClose();
  }
  var ref = useDialog(close);
  var reduced = useReduced();
  /* a press that starts inside the panel and is released on the scrim (text selection) doesn't close */
  var downOutside = React.useRef(false);
  return (
    <motion.div
      className="vl-overlay vl-overlay-center"
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
        if (e.target === e.currentTarget && downOutside.current) close();
        downOutside.current = false;
      }}
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.97, y: 12 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transition: reduced ? NONE : SURFACE,
        }}
        exit={
          reduced
            ? { opacity: 0, transition: NONE }
            : { opacity: 0, scale: 0.98, y: 6, transition: LEAVE }
        }
        ref={ref}
        tabIndex={-1}
        className="vl-modal"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        style={
          props.width
            ? {
                width: props.width,
              }
            : null
        }
      >
        <header className="vl-modal-head">
          <div>
            <h2 className="vl-modal-title">{props.title}</h2>
            {props.subtitle ? (
              <p className="vl-modal-sub">{props.subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="vl-icon-btn"
            aria-label="Close"
            onClick={close}
          >
            <Icon name="x" size={14} />
          </button>
        </header>
        <div className="vl-modal-body">{props.children}</div>
        {props.footer ? (
          <footer className="vl-modal-foot">{props.footer}</footer>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

/* ---------- Drawer ---------- */
