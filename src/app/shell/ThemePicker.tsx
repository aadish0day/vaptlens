import { THEME_LIST } from "@/lib/themes";
import React from "react";

export function ThemePicker(p) {
  var groups = ["Dark", "Light", "Accessible"];
  function sw(t) {
    return (
      <span
        className="tp-sw"
        aria-hidden="true"
        style={{
          background: t.sw[0],
        }}
      >
        <i
          style={{
            background: t.sw[1],
          }}
        />
        <b
          style={{
            background: t.sw[2],
          }}
        />
        <em
          style={{
            background: t.sw[3],
          }}
        />
        <u
          style={{
            background: t.sw[4],
          }}
        />
      </span>
    );
  }
  return (
    <div className="tp" role="radiogroup" aria-label="Colour theme">
      <div className="tp-head">
        <span className="vl-label">Colour theme</span>
        <button
          type="button"
          role="radio"
          aria-checked={p.value === "auto"}
          className={"tp-auto" + (p.value === "auto" ? " is-on" : "")}
          onClick={function () {
            p.onChange("auto");
          }}
        >
          Match system
        </button>
      </div>
      {groups.map(function (g) {
        return (
          <div key={g} className="tp-group">
            <span className="tp-g">{g}</span>
            <div className="tp-grid">
              {THEME_LIST.filter(function (t) {
                return t.group === g;
              }).map(function (t) {
                var on = p.value === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    title={t.note || t.label}
                    className={"tp-opt" + (on ? " is-on" : "")}
                    onClick={function () {
                      p.onChange(t.id);
                    }}
                  >
                    {sw(t)}
                    <span className="tp-l">{t.label.replace(" safe", "")}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
