import React from "react";

const h = React.createElement;

/* tiny safe Markdown: headings, bullets, numbered, bold, italics, code — no HTML passthrough */
export function Md(p) {
  function inline(s, k) {
    var parts = [],
      re = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g,
      last = 0,
      m,
      i = 0;
    while ((m = re.exec(s))) {
      if (m.index > last) parts.push(s.slice(last, m.index));
      var t = m[0];
      parts.push(
        t[0] === "*" ? (
          <b key={k + "b" + i++}>{t.slice(2, -2)}</b>
        ) : t[0] === "`" ? (
          <code key={k + "c" + i++}>{t.slice(1, -1)}</code>
        ) : (
          <i key={k + "i" + i++}>{t.slice(1, -1)}</i>
        ),
      );
      last = m.index + t.length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts;
  }
  var out = [],
    list = null,
    lk = 0;
  String(p.text || "")
    .split(/\n/)
    .forEach(function (ln, i) {
      var m;
      if ((m = /^\s*(?:[-*•]|\d+[.)])\s+(.*)/.exec(ln))) {
        if (!list) {
          list = [];
          out.push({
            list: list,
            ordered: /^\s*\d/.test(ln),
            k: lk++,
          });
        }
        list.push(inline(m[1], "l" + i));
        return;
      }
      list = null;
      if ((m = /^(#{1,4})\s+(.*)/.exec(ln)))
        out.push(
          <h4 key={"h" + i} className="md-h">
            {inline(m[2], "h" + i)}
          </h4>,
        );
      else if (ln.trim()) out.push(<p key={"p" + i}>{inline(ln, "p" + i)}</p>);
    });
  return (
    <div className="md">
      {out.map(function (o) {
        return o && o.list
          ? h(
              o.ordered ? "ol" : "ul",
              {
                key: "L" + o.k,
              },
              o.list.map(function (x, j) {
                return <li key={j}>{x}</li>;
              }),
            )
          : o;
      })}
    </div>
  );
}

/* ===================== v13: goals, SLA matrix, CMDB, ticket sync, evidence pack ===================== */
