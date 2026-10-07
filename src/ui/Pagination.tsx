import React from "react";
import { Icon } from "@/ui/Icon";
import { cx } from "@/ui/core";
import { motion } from "motion/react";
import { GLIDE, NONE, useReduced } from "@/ui/motion";

/* page numbers with ellipses: 1 … 4 5 [6] 7 8 … 20 */
export function pageList(page: number, pages: number, sib?: number) {
  var s = sib == null ? 1 : sib,
    out: any[] = [];
  if (pages <= 5 + s * 2) {
    for (var i = 1; i <= pages; i++) out.push(i);
    return out;
  }
  var lo = Math.max(2, page - s),
    hi = Math.min(pages - 1, page + s);
  if (page - s <= 3) {
    lo = 2;
    hi = 3 + s * 2;
  }
  if (page + s >= pages - 2) {
    hi = pages - 1;
    lo = pages - 2 - s * 2;
  }
  out.push(1);
  if (lo > 2) out.push("…");
  for (var j = lo; j <= hi; j++) out.push(j);
  if (hi < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

/* ---------- Pagination (ported from interior.dev pagination: sliding thumb, accessible readout) ---------- */
/* page is 1-based; total = item count; pageSize optional page-size picker */
export function Pagination(props) {
  var size = props.pageSize || 25,
    total = props.total || 0,
    pages = Math.max(1, Math.ceil(total / size)),
    page = Math.min(Math.max(1, props.page || 1), pages);
  var reduced = useReduced();
  var layoutId = React.useId();

  function go(p) {
    if (p >= 1 && p <= pages && p !== page && props.onChange) props.onChange(p);
  }
  var from = total ? (page - 1) * size + 1 : 0,
    to = Math.min(total, page * size);
  return (
    <nav className="vl-pager" aria-label={props.label || "Pagination"}>
      <span className="vl-pager-range">
        {from}–{to} of {total}
      </span>
      <div className="vl-pager-pages">
        <button
          type="button"
          className="vl-pager-btn"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={function () {
            go(page - 1);
          }}
        >
          <Icon name="chevron-left" size={14} />
        </button>
        {pageList(page, pages).map(function (p, i) {
          var on = p === page;
          return p === "…" ? (
            <span key={"e" + i} className="vl-pager-gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={cx("vl-pager-btn", on && "is-on")}
              aria-current={on ? "page" : undefined}
              aria-label={"Page " + p}
              onClick={function () {
                go(p);
              }}
            >
              {on ? (
                <motion.span
                  layoutId={layoutId}
                  className="vl-pager-thumb"
                  transition={reduced ? NONE : GLIDE}
                />
              ) : null}
              <span className="vl-pager-num">{p}</span>
            </button>
          );
        })}
        <button
          type="button"
          className="vl-pager-btn"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={function () {
            go(page + 1);
          }}
        >
          <Icon name="chevron-right" size={14} />
        </button>
      </div>
      {props.onPageSizeChange ? (
        <label className="vl-pager-size">
          <span>Rows</span>
          <select
            value={size}
            onChange={function (e) {
              props.onPageSizeChange(+e.target.value);
            }}
          >
            {(props.pageSizes || [10, 25, 50, 100]).map(function (n) {
              return (
                <option key={n} value={n}>
                  {n}
                </option>
              );
            })}
          </select>
        </label>
      ) : null}
    </nav>
  );
}
