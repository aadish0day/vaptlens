import { days } from "@/lib/data";
import { AS_OF } from "@/lib/engine";

/* days the SLA clock was paused within the current open cycle (closed pauses + an open one up to today) */
export function pausedDaysOf(g0, cycleStart) {
  if (!g0 || !g0.pauses || !g0.pauses.length) return 0;
  var intervals = [];
  for (var i = 0; i < g0.pauses.length; i++) {
    var p0 = g0.pauses[i];
    if (!p0 || !p0.from) continue;
    var a = p0.from < cycleStart ? cycleStart : p0.from;
    var b = p0.to && p0.to < AS_OF ? p0.to : AS_OF;
    if (b >= a) intervals.push({ from: a, to: b });
  }
  if (!intervals.length) return 0;
  intervals.sort(function (x, y) {
    return x.from < y.from ? -1 : x.from > y.from ? 1 : 0;
  });
  var merged = [intervals[0]];
  for (var j = 1; j < intervals.length; j++) {
    var cur = intervals[j];
    var prev = merged[merged.length - 1];
    if (cur.from <= prev.to) {
      if (cur.to > prev.to) prev.to = cur.to;
    } else {
      merged.push(cur);
    }
  }
  return merged.reduce(function (t, inv) {
    return t + Math.max(0, days(inv.from, inv.to));
  }, 0);
}

export function myPrefsSeen(boot, me) {
  var x = (boot.prefs || {})[me.username];
  return (x && x.inboxSeenAt) || {};
}
