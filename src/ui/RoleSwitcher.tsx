import React, { useState } from "react";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Toggle } from "@/ui/Toggle";
import { Tooltip } from "@/ui/Tooltip";
import { cx } from "@/ui/core";

/* ---------- RoleSwitcher ---------- */
export var ROLES = {
  Administrator: "Full access · can toggle 2FA",
  "Remediation Lead": "Remediate, assign, raise tickets",
  "Security Auditor": "Read-only",
};

export function RoleSwitcher(props) {
  var st = useState(props.value || "Administrator");
  var val = props.value != null && props.onChange ? props.value : st[0];
  var tfa = useState(!!props.twoFactor);
  return (
    <div className="vl-role">
      <div className="vl-role-head">
        <Icon name="user" size={14} />
        <span className="vl-label">Acting as</span>
      </div>
      <div className="vl-role-opts" role="radiogroup" aria-label="Role">
        {Object.keys(ROLES).map(function (r) {
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={r === val}
              className={cx("vl-role-opt", r === val && "is-on")}
              onClick={function () {
                st[1](r);
                if (props.onChange) props.onChange(r);
              }}
            >
              <span className="vl-role-name">{r}</span>
              <span className="vl-role-desc">{ROLES[r]}</span>
            </button>
          );
        })}
      </div>
      <div className="vl-role-2fa">
        {val === "Administrator" ? (
          <Toggle
            label="Simulated 2FA"
            icon="key"
            checked={tfa[0]}
            onChange={tfa[1]}
          />
        ) : (
          <Tooltip content="Only Administrators can change 2FA.">
            <Button
              size="sm"
              restricted={true}
              restrictedReason="Only Administrators can change 2FA."
            >
              Simulated 2FA
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/* ---------- TeamPicker ---------- */
