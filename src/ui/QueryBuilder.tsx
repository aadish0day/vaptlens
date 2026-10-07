import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";

/* fields: [{ key, label, type: "text"|"number"|"enum"|"bool"|"date", options? }] */
export var QB_OPS = {
  text: [["contains", "contains"], ["not_contains", "doesn't contain"], ["eq", "is"], ["neq", "is not"], ["starts", "starts with"], ["regex", "matches regex"]],
  number: [["gte", "≥"], ["lte", "≤"], ["eq", "="], ["neq", "≠"], ["between", "between"]],
  enum: [["in", "is any of"], ["not_in", "is none of"]],
  bool: [["is_true", "is true"], ["is_false", "is false"]],
  date: [["after", "after"], ["before", "before"], ["within", "within last (days)"]],
};
function num(x) { var n = parseFloat(x); return isNaN(n) ? null : n; }
/* evaluate one rule against a record; get(rec, key) lets callers map keys to derived values */
export function qbTest(rule, rec, get?, today?: string) {
  var v = get ? get(rec, rule.field) : rec[rule.field], a = rule.value, s = String(v == null ? "" : v).toLowerCase();
  switch (rule.op) {
    case "contains": return s.indexOf(String(a || "").toLowerCase()) >= 0;
    case "not_contains": return s.indexOf(String(a || "").toLowerCase()) < 0;
    case "eq": return typeof v === "number" ? v === num(a) : s === String(a || "").toLowerCase();
    case "neq": return typeof v === "number" ? v !== num(a) : s !== String(a || "").toLowerCase();
    case "starts": return s.indexOf(String(a || "").toLowerCase()) === 0;
    case "regex": try { return new RegExp(a, "i").test(String(v == null ? "" : v)); } catch (e) { return false; }
    case "gte": return v != null && +v >= num(a);
    case "lte": return v != null && +v <= num(a);
    case "between": return v != null && +v >= num((a || [])[0]) && +v <= num((a || [])[1]);
    case "in": return (a || []).indexOf(v) >= 0;
    case "not_in": return (a || []).indexOf(v) < 0;
    case "is_true": return !!v;
    case "is_false": return !v;
    case "after": return !!v && String(v).slice(0, 10) > a;
    case "before": return !!v && String(v).slice(0, 10) < a;
    case "within": { if (!v) return false; var end = today ? new Date(today) : new Date(); return (end.getTime() - new Date(String(v).slice(0, 10)).getTime()) / 864e5 <= num(a); }
  }
  return true;
}
/* a rule only counts once it has a value (an empty "is any of" or blank text would match nothing) */
export function qbComplete(r) {
  if (!r || !r.field || !r.op) return false;
  if (r.op === "is_true" || r.op === "is_false") return true;
  if (r.op === "between") return Array.isArray(r.value) && r.value[0] !== "" && r.value[1] !== "" && r.value[0] != null && r.value[1] != null;
  if (Array.isArray(r.value)) return r.value.length > 0;
  return r.value != null && String(r.value).trim() !== "";
}
/* query = { match: "all"|"any", rules: [...] } */
export function qbMatch(query, rec, get?, today?: string) {
  var rules = (query && query.rules || []).filter(qbComplete);
  if (!rules.length) return true;
  return query.match === "any" ? rules.some(function (r) { return qbTest(r, rec, get, today); }) : rules.every(function (r) { return qbTest(r, rec, get, today); });
}
export function qbSummary(query, fields) {
  var rules = (query && query.rules || []).filter(qbComplete);
  return rules.map(function (r) {
    var f = fields.find(function (x) { return x.key === r.field; }) || { label: r.field, type: "text" };
    var op = (QB_OPS[f.type] || []).find(function (o) { return o[0] === r.op; });
    var val = Array.isArray(r.value) ? r.value.join(r.op === "between" ? "–" : ", ") : r.value;
    return f.label + " " + (op ? op[1] : r.op) + (val != null && val !== "" ? " " + val : "");
  }).join(query.match === "any" ? " OR " : " AND ");
}

/* ---------- QueryBuilder (field · operator · value rows, ALL / ANY) ---------- */
export function QueryBuilder(props) {
  var fields = props.fields || [], q = props.value || { match: "all", rules: [] };
  function set(n) { if (props.onChange) props.onChange(n); }
  function upd(i, patch) { set(Object.assign({}, q, { rules: q.rules.map(function (r, k) { return k === i ? Object.assign({}, r, patch) : r; }) })); }
  function add() { var f = fields[0]; set(Object.assign({}, q, { rules: q.rules.concat([{ field: f.key, op: QB_OPS[f.type][0][0], value: f.type === "enum" ? [] : "" }]) })); }
  return (
    <div className="vl-qb">
      <div className="vl-qb-head">
        <span>Match</span>
        <select aria-label="Match all or any rule" value={q.match} onChange={function (e) { set(Object.assign({}, q, { match: e.target.value })); }}>
          <option value="all">all rules (AND)</option>
          <option value="any">any rule (OR)</option>
        </select>
        {props.count != null ? <span className="vl-qb-count">{props.count} match{props.count === 1 ? "" : "es"}</span> : null}
      </div>
      {q.rules.length === 0 ? <p className="vl-qb-empty">No rules yet. Everything matches.</p> : null}
      {q.rules.map(function (r, i) {
        var f = fields.find(function (x) { return x.key === r.field; }) || fields[0];
        var ops = QB_OPS[f.type] || QB_OPS.text;
        return (
          <div key={i} className="vl-qb-row">
            <select aria-label={"Rule " + (i + 1) + " field"} value={r.field} onChange={function (e) { var nf = fields.find(function (x) { return x.key === e.target.value; }); upd(i, { field: nf.key, op: QB_OPS[nf.type][0][0], value: nf.type === "enum" ? [] : "" }); }}>
              {fields.map(function (x) { return <option key={x.key} value={x.key}>{x.label}</option>; })}
            </select>
            <select aria-label={"Rule " + (i + 1) + " operator"} value={r.op} onChange={function (e) { upd(i, { op: e.target.value, value: e.target.value === "between" ? ["", ""] : f.type === "enum" ? r.value : "" }); }}>
              {ops.map(function (o) { return <option key={o[0]} value={o[0]}>{o[1]}</option>; })}
            </select>
            <span className="vl-qb-val">
              {f.type === "bool" ? null : f.type === "enum" ? (
                <span className="vl-qb-enum" role="group" aria-label={"Rule " + (i + 1) + " values"}>
                  {(f.options || []).map(function (o) {
                    var ov = typeof o === "string" ? o : o.value, on = (r.value || []).indexOf(ov) >= 0;
                    return <button key={ov} type="button" aria-pressed={on} className={cx("vl-qb-chip", on && "is-on")} onClick={function () { upd(i, { value: on ? r.value.filter(function (x) { return x !== ov; }) : (r.value || []).concat([ov]) }); }}>{typeof o === "string" ? o : o.label}</button>;
                  })}
                </span>
              ) : r.op === "between" ? (
                <span className="vl-qb-between">
                  <input type="number" aria-label="From" value={(r.value || [])[0] || ""} onChange={function (e) { upd(i, { value: [e.target.value, (r.value || [])[1] || ""] }); }} />
                  <span>and</span>
                  <input type="number" aria-label="To" value={(r.value || [])[1] || ""} onChange={function (e) { upd(i, { value: [(r.value || [])[0] || "", e.target.value] }); }} />
                </span>
              ) : (
                <input aria-label={"Rule " + (i + 1) + " value"} type={f.type === "number" || r.op === "within" ? "number" : f.type === "date" ? "date" : "text"} value={r.value || ""} placeholder={r.op === "regex" ? "e.g. ^CVE-2024" : ""} onChange={function (e) { upd(i, { value: e.target.value }); }} />
              )}
            </span>
            <button type="button" className="vl-icon-btn" aria-label={"Remove rule " + (i + 1)} onClick={function () { set(Object.assign({}, q, { rules: q.rules.filter(function (_, k) { return k !== i; }) })); }}>
              <Icon name="x" size={14} />
            </button>
          </div>
        );
      })}
      <div className="vl-qb-foot">
        <button type="button" className="vl-btn vl-btn-secondary vl-btn-sm" onClick={add} disabled={!fields.length}><Icon name="plus" size={14} /><span>Add rule</span></button>
        {q.rules.length ? <button type="button" className="vl-btn vl-btn-ghost vl-btn-sm" onClick={function () { set({ match: q.match, rules: [] }); }}>Clear all</button> : null}
      </div>
    </div>
  );
}
