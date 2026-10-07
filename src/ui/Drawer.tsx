import React from "react";
import { Icon } from "@/ui/Icon";
import { cx, useDialog } from "@/ui/core";

/* ---------- Drawer ---------- */
export function Drawer(props) {
  if (props.open === false) return null;
  return <DrawerInner {...props} />;
}

export function DrawerInner(props) {
  var ref = useDialog(props.onClose);
  return (
    <div
      className="vl-overlay"
      onClick={function (e) {
        if (e.target === e.currentTarget && props.onClose) props.onClose();
      }}
    >
      <aside
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
      </aside>
    </div>
  );
}

/* ---------- VulnTable ---------- */
