import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { cx } from "@/ui/core";
import { EASE_OUT, NONE, useReduced } from "@/ui/motion";

/* ---------- HoldToConfirm (ported from interior.dev, MIT) ----------
   Press and hold (pointer, Space or Enter) to commit an irreversible action. Releasing early,
   moving the pointer away, switching tabs or Esc drains the fill back and nothing happens. */
var FACE = { type: "spring", stiffness: 260, damping: 34, mass: 0.8 } as const;

export function useHoldToConfirm(o) {
  var duration = o.duration || 1600;
  var releaseRate = o.releaseRate || 2.5;
  var tolerance = 10;
  var ph = useState("idle");
  var phase = useRef("idle");
  var down = useRef(false);
  var elapsed = useRef(0);
  var last = useRef(0);
  var raf = useRef(0);
  var origin = useRef(null);
  var confirm = useRef(o.onConfirm);
  confirm.current = o.onConfirm;

  var move = useCallback(function (n) {
    phase.current = n;
    ph[1](n);
  }, []);
  var reset = useCallback(
    function () {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      down.current = false;
      elapsed.current = 0;
      origin.current = null;
      move("idle");
    },
    [move],
  );
  var begin = useCallback(
    function (point) {
      if (
        o.disabled ||
        phase.current === "committed" ||
        phase.current === "holding"
      )
        return;
      origin.current = point || null;
      down.current = true;
      move("holding");
      if (raf.current) return;
      last.current = performance.now();
      function loop(now) {
        var dt = Math.min(64, now - last.current);
        last.current = now;
        elapsed.current += down.current ? dt : -dt * releaseRate;
        if (elapsed.current >= duration) {
          raf.current = 0;
          down.current = false;
          move("committed");
          if (navigator.vibrate) navigator.vibrate(14);
          confirm.current();
          return;
        }
        if (elapsed.current <= 0) {
          raf.current = 0;
          elapsed.current = 0;
          move("idle");
          return;
        }
        raf.current = requestAnimationFrame(loop);
      }
      raf.current = requestAnimationFrame(loop);
    },
    [o.disabled, duration, releaseRate, move],
  );
  var release = useCallback(
    function () {
      if (phase.current !== "holding") return;
      down.current = false;
      origin.current = null;
      move("releasing");
    },
    [move],
  );

  useEffect(
    function () {
      function vis() {
        if (document.hidden) release();
      }
      window.addEventListener("blur", release);
      document.addEventListener("visibilitychange", vis);
      return function () {
        window.removeEventListener("blur", release);
        document.removeEventListener("visibilitychange", vis);
        cancelAnimationFrame(raf.current);
        raf.current = 0;
      };
    },
    [release],
  );

  var bind = {
    onPointerDown: function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.currentTarget.setPointerCapture)
        e.currentTarget.setPointerCapture(e.pointerId);
      begin({ x: e.clientX, y: e.clientY });
    },
    onPointerMove: function (e) {
      var f = origin.current;
      if (phase.current !== "holding" || !f) return;
      if (Math.hypot(e.clientX - f.x, e.clientY - f.y) > tolerance) release();
    },
    onPointerUp: release,
    onPointerCancel: release,
    onPointerLeave: release,
    onKeyDown: function (e) {
      if (e.key === "Escape") {
        if (phase.current === "holding" || phase.current === "releasing") {
          e.preventDefault();
          e.stopPropagation();
          reset();
        }
        return;
      }
      if (e.repeat) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        begin(null);
      }
    },
    onKeyUp: function (e) {
      if (e.key === " " || e.key === "Enter") release();
    },
    onBlur: release,
    onClick: function (e) {
      e.preventDefault();
    },
    onContextMenu: function (e) {
      e.preventDefault();
    },
  };
  return {
    bind: bind,
    phase: ph[0],
    reset: reset,
    duration: duration,
    releaseRate: releaseRate,
  };
}

function Faces(props) {
  return (
    <span className="vl-hold-faces">
      <motion.span
        initial={false}
        animate={{ opacity: props.committed ? 0 : 1 }}
        transition={FACE}
      >
        {props.children}
      </motion.span>
      <motion.span
        initial={false}
        animate={{ opacity: props.committed ? 1 : 0 }}
        transition={FACE}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 6.4 4.7 8.6 9.5 3.5" />
        </svg>
        {props.confirmLabel}
      </motion.span>
    </span>
  );
}

export function HoldToConfirm(props) {
  var h = useHoldToConfirm(props);
  var reduced = useReduced();
  var hintId = useId();
  var committed = h.phase === "committed";
  var swept = useMotionValue(0);
  var clipPath = useTransform(swept, function (v) {
    return "inset(0 " + (1 - v) * 100 + "% 0 0)";
  });
  var resetAfter = props.resetAfter == null ? 1600 : props.resetAfter;

  useEffect(
    function () {
      if (!committed || resetAfter <= 0) return;
      var t = setTimeout(h.reset, resetAfter);
      return function () {
        clearTimeout(t);
      };
    },
    [committed, resetAfter, h.reset],
  );

  useEffect(
    function () {
      if (reduced) {
        swept.set(h.phase === "holding" || committed ? 1 : 0);
        return;
      }
      var from = swept.get();
      var c = committed
        ? animate(swept, 1, { duration: 0.12, ease: "linear" })
        : h.phase === "holding"
          ? animate(swept, 1, {
              duration: (h.duration * (1 - from)) / 1000,
              ease: "linear",
            })
          : animate(swept, 0, {
              duration: (h.duration * from) / h.releaseRate / 1000,
              ease: EASE_OUT,
            });
      return function () {
        c.stop();
      };
    },
    [h.phase, reduced],
  );

  var label = props.confirmLabel || "Done";
  var seconds = Math.round(h.duration / 100) / 10;
  return (
    <button
      type="button"
      aria-disabled={props.disabled || committed ? "true" : undefined}
      aria-describedby={hintId}
      {...h.bind}
      className={cx(
        "vl-btn vl-btn-" + (props.variant || "danger"),
        "vl-btn-" + (props.size || "sm"),
        "vl-hold",
        props.className,
      )}
    >
      <Faces committed={committed} confirmLabel={label}>
        {props.children}
      </Faces>
      <motion.span
        aria-hidden="true"
        className="vl-hold-fill"
        style={{ clipPath: clipPath }}
        transition={NONE}
      >
        <Faces committed={committed} confirmLabel={label}>
          {props.children}
        </Faces>
      </motion.span>
      <span id={hintId} className="vl-sr">
        {"Press and hold for " +
          seconds +
          " seconds to confirm. Releasing early cancels."}
      </span>
      <span role="status" aria-live="polite" className="vl-sr">
        {committed ? label : ""}
      </span>
    </button>
  );
}
