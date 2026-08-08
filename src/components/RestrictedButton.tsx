import * as React from "react";
import { Button, type ButtonProps } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "../lib/utils";

/**
 * Wraps any single interactive element with a tooltip that explains WHY the
 * action is locked. When `locked` is true the child is NOT given the native
 * `disabled` attribute (which suppresses pointer events and focus, hiding
 * tooltips) — instead callers should pass `aria-disabled` on the child so the
 * reason is discoverable on hover and keyboard focus.
 */
export function PermissionTooltip({
  locked,
  reason,
  children,
}: {
  locked: boolean;
  reason: string;
  children: React.ReactElement;
}) {
  if (!locked) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent sideOffset={4}>{reason}</TooltipContent>
    </Tooltip>
  );
}

export interface RestrictedButtonProps extends Omit<ButtonProps, "disabled"> {
  /** Whether the current role is permitted to perform the action. */
  allowed: boolean;
  /** Tooltip shown when the action is permission-locked. */
  reason: string;
  /** Data-level disable (e.g. nothing to act on) — no tooltip, truly disabled. */
  disabled?: boolean;
}

/**
 * A `Button` that stays focusable and tooltip-capable when permission-locked:
 * it uses `aria-disabled` + a guarded onClick (instead of the native
 * `disabled`, which would swallow pointer events and hide the tooltip).
 */
export function RestrictedButton({
  allowed,
  reason,
  disabled,
  title,
  onClick,
  className,
  ...props
}: RestrictedButtonProps) {
  const permissionLocked = !allowed;
  const trulyDisabled = disabled === true;

  const button = (
    <Button
      {...props}
      disabled={trulyDisabled}
      aria-disabled={permissionLocked || trulyDisabled ? true : undefined}
      title={permissionLocked ? undefined : title}
      onClick={(e) => {
        if (permissionLocked || trulyDisabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick?.(e);
      }}
      className={cn(
        className,
        (permissionLocked || trulyDisabled) && "opacity-50 cursor-not-allowed"
      )}
    />
  );

  if (permissionLocked) {
    return (
      <PermissionTooltip locked reason={reason}>
        {button}
      </PermissionTooltip>
    );
  }
  return button;
}
