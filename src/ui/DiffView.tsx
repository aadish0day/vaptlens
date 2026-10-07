import React from "react";
import { cx } from "@/ui/core";

/* line diff via longest common subsequence (fine for evidence-sized text) */
export function lineDiff(a: string, b: string) {
  var A = String(a || "").split("\n"), B = String(b || "").split("\n");
  if (A.length * B.length > 4e6) return (A.map(function (l): any { return { t: "del", a: l }; }) as any[]).concat(B.map(function (l) { return { t: "add", b: l }; }));
  var n = A.length, m = B.length, L = [];
  for (var i = 0; i <= n; i++) { L.push(new Int32Array(m + 1)); }
  for (i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  var out: any[] = [], x = 0, y = 0;
  while (x < n && y < m) {
    if (A[x] === B[y]) { out.push({ t: "same", a: A[x], b: B[y], ai: x + 1, bi: y + 1 }); x++; y++; }
    else if (L[x + 1][y] >= L[x][y + 1]) { out.push({ t: "del", a: A[x], ai: x + 1 }); x++; }
    else { out.push({ t: "add", b: B[y], bi: y + 1 }); y++; }
  }
  while (x < n) { out.push({ t: "del", a: A[x], ai: x + 1 }); x++; }
  while (y < m) { out.push({ t: "add", b: B[y], bi: y + 1 }); y++; }
  return out;
}
/* ---------- DiffView (unified line diff: before vs after, e.g. re-test evidence) ---------- */
export function DiffView(props) {
  var rows = lineDiff(props.before, props.after);
  var add = rows.filter(function (r) { return r.t === "add"; }).length, del = rows.filter(function (r) { return r.t === "del"; }).length;
  return (
    <div className="vl-ldiff">
      <div className="vl-ldiff-bar">
        <span>{props.beforeLabel || "Before"} → {props.afterLabel || "After"}</span>
        <span className="vl-ldiff-stat"><span className="is-add">+{add}</span> <span className="is-del">−{del}</span></span>
      </div>
      <div className="vl-ldiff-scroll">
      <table className="vl-ldiff-table">
        <tbody>
          {rows.map(function (r, i) {
            return (
              <tr key={i} className={cx("vl-ldiff-row", "is-" + r.t)}>
                <td className="vl-ldiff-n">{r.ai || ""}</td>
                <td className="vl-ldiff-n">{r.bi || ""}</td>
                <td className="vl-ldiff-sign" aria-label={r.t === "add" ? "added" : r.t === "del" ? "removed" : undefined}>{r.t === "add" ? "+" : r.t === "del" ? "−" : " "}</td>
                <td className="vl-ldiff-code"><code>{r.t === "add" ? r.b : r.a}</code></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
