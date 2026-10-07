import { MONTHS } from "@/lib/dash";

export var EMPTY_FILTERS = {
  q: "",
  sev: [],
  tools: [],
  hosts: [],
  ports: [],
  since: "All",
  kev: false,
  kevOverdue: false,
  path: false,
  ransom: false,
  zeroday: false,
  eol: false,
  old: false,
  host: null,
  cross: {},
};

export var SINCE_DAYS = {
  "7 days": 7,
  "15 days": 15,
  "30 days": 30,
  "6 months": 183,
};

export function biCtx(ctx) {
  var batchLabel = {},
    batchDate = {};
  ctx.batches.forEach(function (b) {
    batchLabel[b.id] = b.label;
    batchDate[b.id] = b.date;
  });
  return {
    batchLabel: batchLabel,
    batchDate: batchDate,
    teamOf: function (f) {
      return ctx.g(f).team;
    },
    tagsOf: function (f) {
      return ctx.g(f).tags;
    },
    batchOrder: function (key) {
      return ctx.batches.map(function (b) {
        if (key === "scanMonth") {
          var p = b.date.split("-");
          return MONTHS[+p[1] - 1] + " " + p[0];
        }
        return b.label;
      });
    },
  };
}
