import React from "react";

/* ---------- TierBadge ---------- */
export var TIERS = {
  1: "Tier 1 · Crown Jewel",
  2: "Tier 2 · Production",
  3: "Tier 3 · Dev/Staging",
};

export function TierBadge(props) {
  var t = props.tier || 3;
  return (
    <span className={"vl-tier vl-tier-" + t}>
      <span className="vl-tier-pips" aria-hidden="true">
        {[1, 2, 3].map(function (i) {
          return <i key={i} className={i <= 4 - t ? "is-on" : null} />;
        })}
      </span>
      {props.short ? "Tier " + t : TIERS[t]}
    </span>
  );
}

/* ---------- AssetRow ---------- */
