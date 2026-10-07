/* Shared motion vocabulary (ported from interior.dev, MIT). JS can't read CSS custom
   properties for timing, so these mirror the tokens: EASE_OUT = --ease-out,
   EASE_IN = --ease-in, FAST/BASE/SLOW = --duration-fast/base/slow (seconds). */
import { useReducedMotion } from "motion/react";

export var EASE_OUT = [0.16, 1, 0.3, 1] as const;
export var EASE_IN = [0.4, 0, 1, 1] as const;
export var FAST = 0.12;
export var BASE = 0.18;
export var SLOW = 0.28;

/* surfaces (modal, drawer, popover) settle without bounce */
export var SURFACE = { type: "spring", stiffness: 420, damping: 36, mass: 0.9 } as const;
/* sliding indicators (tabs, segmented control) */
export var GLIDE = { type: "spring", stiffness: 520, damping: 40, mass: 0.6 } as const;
/* small confirmations (copy check, flash arrows) may overshoot a little */
export var POP = { type: "spring", stiffness: 640, damping: 22, mass: 0.7 } as const;
/* height reveal (accordion, show more, tree) */
export var HEIGHT = { type: "spring", stiffness: 380, damping: 40, mass: 0.8 } as const;
export var LEAVE = { duration: FAST, ease: EASE_IN } as const;
export var NONE = { duration: 0 } as const;

/* under prefers-reduced-motion the state still arrives, only the trip is skipped */
export function useReduced(): boolean {
  return !!useReducedMotion();
}
