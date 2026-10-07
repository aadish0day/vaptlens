import React from "react";

export function Field(p) {
  return (
    <label className="wb-field">
      <span className="vl-label">{p.label}</span>
      <input
        {...Object.assign(
          {
            className: "wb-select",
          },
          p.input,
        )}
      />
    </label>
  );
}
