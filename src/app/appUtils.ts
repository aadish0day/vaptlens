import { days } from "@/lib/data";
import { AS_OF } from "@/lib/engine";

/* days the SLA clock was paused within the current open cycle (closed pauses + an open one up to today) */
export function pausedDaysOf(g0, cycleStart) {
  if (!g0 || !g0.pauses || !g0.pauses.length) return 0;
  return g0.pauses.reduce(function (t, p0) {
    var a = p0.from < cycleStart ? cycleStart : p0.from,
      b = p0.to || AS_OF;
    return b >= a ? t + Math.max(0, days(a, b)) : t;
  }, 0);
}

export function myPrefsSeen(boot, me) {
  var x = (boot.prefs || {})[me.username];
  return (x && x.inboxSeenAt) || {};
}
