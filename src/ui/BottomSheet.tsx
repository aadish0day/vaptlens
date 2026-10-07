import React from "react";
import { Icon } from "@/ui/Icon";
import { useDialog } from "@/ui/core";

function SheetInner(props) {
  var ref = useDialog(props.onClose);
  return (
    <div
      className="vl-sheet-scrim"
      onMouseDown={function (e) {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div
        className="vl-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        tabIndex={-1}
        ref={ref}
      >
        <div className="vl-sheet-grab" aria-hidden="true" />
        <header className="vl-sheet-head">
          <h2>{props.title}</h2>
          <button
            type="button"
            className="vl-ibtn is-sm is-ghost"
            aria-label="Close"
            onClick={props.onClose}
          >
            <Icon name="x" size={16} />
          </button>
        </header>
        <div className="vl-sheet-body">{props.children}</div>
        {props.footer ? (
          <footer className="vl-sheet-foot">{props.footer}</footer>
        ) : null}
      </div>
    </div>
  );
}
/* ---------- BottomSheet (mobile-first dialog from the bottom edge; Esc, scrim click, focus trap) ---------- */
export function BottomSheet(props) {
  return props.open ? <SheetInner {...props} /> : null;
}
