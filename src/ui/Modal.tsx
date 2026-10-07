import React from "react";
import { Icon } from "@/ui/Icon";
import { useDialog } from "@/ui/core";

export function Modal(props) {
  if (props.open === false) return null;
  return <ModalInner {...props} />;
}

export function ModalInner(props) {
  var ref = useDialog(props.onClose);
  return (
    <div
      className="vl-overlay vl-overlay-center"
      onClick={function (e) {
        if (e.target === e.currentTarget && props.onClose) props.onClose();
      }}
    >
      <div
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
            onClick={props.onClose}
          >
            <Icon name="x" size={14} />
          </button>
        </header>
        <div className="vl-modal-body">{props.children}</div>
        {props.footer ? (
          <footer className="vl-modal-foot">{props.footer}</footer>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Drawer ---------- */
