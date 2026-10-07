import React, { useState } from "react";
import { Icon } from "@/ui/Icon";
import { CopyButton } from "@/ui/CopyButton";

function Node(props) {
  var v = props.value, k = props.name, depth = props.depth;
  var isObj = v && typeof v === "object", isArr = Array.isArray(v);
  var st = useState(depth < (props.openDepth == null ? 1 : props.openDepth));
  var keyEl = k != null ? <span className="vl-json-k">{isArr && typeof k === "number" ? k : JSON.stringify(String(k))}: </span> : null;
  if (!isObj) {
    var cls = v === null ? "is-null" : typeof v === "string" ? "is-str" : typeof v === "number" ? "is-num" : "is-bool";
    var txt = typeof v === "string" ? JSON.stringify(v.length > 2000 ? v.slice(0, 2000) + "…" : v) : String(v);
    return <div className="vl-json-row">{keyEl}<span className={"vl-json-v " + cls}>{txt}</span></div>;
  }
  var keys = isArr ? v.map(function (_, i) { return i; }) : Object.keys(v);
  return (
    <div className="vl-json-node">
      <button type="button" className="vl-json-toggle" aria-expanded={st[0]} onClick={function () { st[1](!st[0]); }}>
        <Icon name={st[0] ? "chevron-down" : "chevron-right"} size={12} />{keyEl}
        <span className="vl-json-sum">{isArr ? "[" + keys.length + "]" : "{" + keys.length + "}"}</span>
      </button>
      {st[0] ? <div className="vl-json-kids">{keys.slice(0, 500).map(function (kk) { return <Node key={kk} name={kk} value={v[kk]} depth={depth + 1} openDepth={props.openDepth} />; })}{keys.length > 500 ? <div className="vl-json-row vl-json-more">… {keys.length - 500} more</div> : null}</div> : null}
    </div>
  );
}
/* ---------- JsonViewer (collapsible tree for evidence and raw scanner output) ---------- */
export function JsonViewer(props) {
  var data = props.data, parsed = data, bad = false;
  if (typeof data === "string") { try { parsed = JSON.parse(data); } catch (e) { bad = true; } }
  return (
    <div className="vl-json">
      <div className="vl-json-bar">
        <span>{props.title || "JSON"}</span>
        <CopyButton iconOnly text={function () { return typeof data === "string" ? data : JSON.stringify(data, null, 2); }} label="Copy JSON" />
      </div>
      <div className="vl-json-tree">{bad ? <pre className="vl-json-raw">{String(data)}</pre> : <Node value={parsed} depth={0} openDepth={props.openDepth} />}</div>
    </div>
  );
}
