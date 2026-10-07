import React, { useEffect, useRef, useState } from "react";
import * as V from "@/ui";

/* search that filters 250 ms after typing stops (20k-row tables stay responsive) */
export function SearchBox(p) {
  var v = useState(p.value || ""),
    t = useRef(null);
  useEffect(
    function () {
      if ((p.value || "") !== v[0]) {
        clearTimeout(t.current);
        v[1](p.value || "");
      }
    },
    [p.value],
  );
  useEffect(function () {
    return function () {
      clearTimeout(t.current);
    };
  }, []);
  return (
    <V.Input
      id="search"
      type="search"
      aria-label="Search findings"
      placeholder="Search host, finding, CVE, CWE, #tag or ssvc:act"
      value={v[0]}
      onChange={function (e) {
        var x = e.target.value;
        v[1](x);
        clearTimeout(t.current);
        t.current = setTimeout(function () {
          p.onChange(x);
        }, 250);
      }}
      onKeyDown={function (e) {
        if (e.key === "Enter") {
          clearTimeout(t.current);
          p.onChange(e.target.value);
        }
      }}
    />
  );
}
/* one timeline per finding: scans that saw it, every governance action, notes, newest first */
