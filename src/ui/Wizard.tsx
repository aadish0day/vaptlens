import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* ---------- Wizard (multi-step flow: each step may validate() → true | "error message") ---------- */
export function Wizard(props) {
  var steps = props.steps || [];
  var st = useState(props.defaultStep || 0), err = useState(""), busy = useState(false);
  var i = props.step !== undefined ? props.step : st[0];
  var head = React.useRef(null);
  function go(n) {
    if (props.step === undefined) st[1](n);
    if (props.onStepChange) props.onStepChange(n);
    err[1]("");
    setTimeout(function () { if (head.current) head.current.focus(); }, 0);
  }
  function next() {
    var s = steps[i], r = s.validate ? s.validate() : true;
    if (r !== true) { err[1](typeof r === "string" ? r : "Complete this step first."); return; }
    if (i < steps.length - 1) return go(i + 1);
    if (props.onSubmit) {
      var p = props.onSubmit();
      if (p && p.then) { busy[1](true); p.then(function () { busy[1](false); }, function (e) { busy[1](false); err[1]((e && e.message) || "Something went wrong."); }); }
    }
  }
  var s = steps[i] || {};
  return (
    <div className="vl-wiz">
      <ol className="vl-wiz-steps">
        {steps.map(function (x, k) {
          var state = k < i ? "done" : k === i ? "current" : "todo";
          return (
            <li key={k} className={cx("vl-wiz-step", "is-" + state)} aria-current={k === i ? "step" : undefined}>
              <button type="button" disabled={k > i} onClick={function () { if (k < i) go(k); }}>
                <span className="vl-wiz-num">{k < i ? <Icon name="check" size={12} /> : k + 1}</span>
                <span className="vl-wiz-label">{x.title}{x.optional ? <small> optional</small> : null}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="vl-wiz-body">
        <h3 tabIndex={-1} ref={head} className="vl-wiz-title">{s.title}</h3>
        {s.description ? <p className="vl-wiz-desc">{s.description}</p> : null}
        {s.content}
        {err[0] ? <p className="vl-field-error" role="alert">{err[0]}</p> : null}
      </div>
      <div className="vl-wiz-foot">
        {props.onCancel ? <button type="button" className="vl-btn vl-btn-ghost vl-btn-md" onClick={props.onCancel}>Cancel</button> : <span />}
        <span className="vl-wiz-nav">
          <button type="button" className="vl-btn vl-btn-secondary vl-btn-md" disabled={i === 0 || busy[0]} onClick={function () { go(i - 1); }}>Back</button>
          <button type="button" className="vl-btn vl-btn-primary vl-btn-md" disabled={busy[0]} onClick={next}>{busy[0] ? "Working…" : i === steps.length - 1 ? props.submitLabel || "Finish" : "Next"}</button>
        </span>
      </div>
    </div>
  );
}
