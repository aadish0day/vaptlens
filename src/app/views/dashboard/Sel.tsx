import React from "react";

export function Sel(p) {
  return (
    <label className="wb-field">
      <span className="vl-label">{p.label}</span>
      <select
        className="wb-select"
        id={p.id}
        value={p.value == null ? "" : p.value}
        onChange={function (e) {
          p.onChange(e.target.value);
        }}
      >
        {p.options.map(function (o) {
          return (
            <option key={o[0]} value={o[0]}>
              {o[1]}
            </option>
          );
        })}
      </select>
    </label>
  );
}
