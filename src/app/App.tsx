import { myPrefsSeen, pausedDaysOf } from "@/app/appUtils";
import { Assistant } from "@/app/assistant/Assistant";
import { DEFAULT_RULES } from "@/app/automation/utils";
import { FindingDrawer } from "@/app/components/FindingDrawer";
import { Inbox } from "@/app/components/Inbox";
import { Palette } from "@/app/components/Palette";
import { ShortcutsHelp } from "@/app/components/ShortcutsHelp";
import { inboxItems } from "@/app/components/utils";
import { DataDrawer } from "@/app/data/DataDrawer";
import {
  RO_REASON,
  VIEWS,
  fmtTime,
  nowIso,
  store,
  uniq,
} from "@/app/lib/common";
import { libraryMatch } from "@/app/lib/export";
import { EMPTY_FILTERS } from "@/app/lib/filters";
import { vlLabel } from "@/app/lib/integrations";
import { ThemePicker } from "@/app/shell/ThemePicker";
import { signOut } from "@/app/shell/utils";
import { sampleNs } from "@/app/assistant/utils";
import { Upload } from "@/app/upload/Upload";
import { MyPasswordModal } from "@/app/users/MyPasswordModal";
import { UsersModal } from "@/app/users/UsersModal";
import { migrateScans } from "@/app/users/utils";
import { Assets } from "@/app/views/assets/Assets";
import { HostDrawer } from "@/app/views/assets/HostDrawer";
import { AttackPaths } from "@/app/views/attack/AttackPaths";
import { Dashboard } from "@/app/views/dashboard/Dashboard";
import { NoData } from "@/app/views/dashboard/NoData";
import { Governance } from "@/app/views/governance/Governance";
import { Metrics } from "@/app/views/metrics/Metrics";
import { Network } from "@/app/views/network/Network";
import { Priority } from "@/app/views/priority/Priority";
import { Remediation } from "@/app/views/remediation/Remediation";
import { Report } from "@/app/views/report/Report";
import { Retest } from "@/app/views/retest/Retest";
import { Sla } from "@/app/views/sla/Sla";
import { AUTH, ROLE_HELP } from "@/lib/auth";
import { DEFAULT_LAYOUT, DEFAULT_WIDGETS } from "@/lib/dash";
import { SLA_DAYS, owaspOf } from "@/lib/data";
import {
  AS_OF,
  SLA_DEFAULTS,
  aliasRows,
  applyRules,
  applyVex,
  assetOf,
  buildAttackGraph,
  canonHost,
  fingerprint,
  localDay,
  mergeVex,
  metricsOf,
  runEngine,
  setAS_OF,
  sourcesOf,
  threatIndex,
} from "@/lib/engine";
import { AUDIT, AUDIT_CAP, IDB, P, api } from "@/lib/store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import * as V from "@/ui";

export function App(props) {
  var boot = props.boot,
    me = props.me;
  var initRoute = (location.hash || "").replace("#", "");
  if (initRoute === "matrix") initRoute = "priority";
  var r = useState(
    VIEWS.some(function (v) {
      return v[0] === initRoute;
    })
      ? initRoute
      : "dashboard",
  );
  var route = r[0],
    setRoute = r[1];
  var saved0 = useMemo(function () {
    return migrateScans(boot);
  }, []);
  var d = useState(function () {
      return saved0 ? saved0.data : [];
    }),
    raw = d[0],
    setRaw = d[1];
  var b = useState(saved0 ? saved0.batches : []),
    batchesRaw = b[0],
    setBatches = b[1];
  var dm = useState(!!saved0),
    dataDirty = dm[0],
    setDataDirty = dm[1];
  /* scan ids only ever go up (an Undo after a newer import must never collide) */
  var batchIds = useRef({
    seq: Math.max(
      (saved0 && saved0.seq) || 0,
      (saved0 ? saved0.batches : []).reduce(function (m, x) {
        return Math.max(m, x.id);
      }, 0),
    ),
    used: {},
  });
  var batchesNow = useRef(batchesRaw);
  batchesNow.current = batchesRaw;
  /* per-user preferences (filters, saved views, dashboard layout): the server keeps one private copy per user */
  var legacyGone = useRef(false),
    prefsAll = useRef(boot.prefs || {}),
    myPrefs = useMemo(function () {
      var mp0 = (boot.prefs || {})[me.username];
      if (mp0) return mp0;
      /* first sign-in: start from any older settings left in this browser */
      return {
        filters: store("vaptlens.filters." + me.username),
        views: store("vaptlens.views.v1"),
        layout: store("vaptlens.layout.v1"),
      };
    }, []);
  var lay = useState(function () {
      var x = myPrefs.layout;
      return x && x.v === 2 && x.widgets
        ? x
        : {
            v: 2,
            widgets: DEFAULT_WIDGETS,
            layout: DEFAULT_LAYOUT,
          };
    }),
    dash = lay[0],
    setDash = lay[1];
  var role = me.role,
    isAdmin = role === "Administrator";
  var um = useState(false),
    usersOpen = um[0],
    mp = useState(false);
  var th = useState(function () {
      return store("vaptlens-theme") || "auto";
    }),
    theme = th[0],
    setTheme = th[1];
  var au = useState(function () {
      return boot.audit || [];
    }),
    audit = au[0],
    setAudit = au[1];
  var gv = useState(function () {
      return boot.remediation || {};
    }),
    gov = gv[0],
    setGov = gv[1];
  var as = useState(function () {
      return boot.assets || {};
    }),
    assets = as[0],
    setAssets = as[1];
  var assetsNow = useRef(assets);
  assetsNow.current = assets;
  var lb = useState(function () {
      return boot.library || [];
    }),
    library = lb[0],
    setLibrary = lb[1];
  var cp = useState(function () {
      return boot.campaigns || [];
    }),
    campaigns = cp[0],
    setCampaigns = cp[1];
  var rl = useState(function () {
      return boot.rules || DEFAULT_RULES;
    }),
    rules = rl[0],
    setRules = rl[1];
  var gl2 = useState(function () {
      return boot.goals || [];
    }),
    goals = gl2[0],
    setGoals = gl2[1];
  var asst = useState(null),
    assistant = asst[0],
    setAssistant = asst[1],
    pal = useState(false);
  var vx = useState(function () {
      return boot.vex || [];
    }),
    vexList = vx[0],
    setVexList = vx[1];
  /* governance policy: max exception length per severity, separation of duties, two-person approval, framework preset */
  var pl = useState(function () {
      return Object.assign(
        {
          maxDays: {
            critical: 30,
            high: 90,
            medium: 180,
            low: 365,
            info: 365,
          },
          sod: true,
          twoPerson: false,
          framework: null,
          currency: "USD",
          assetValue: {
            1: 5000000,
            2: 1000000,
            3: 150000,
          },
        },
        boot.policy || {},
      );
    }),
    policy = pl[0],
    setPolicy = pl[1];
  useEffect(
    function () {
      P.save("policy", policy);
    },
    [policy],
  );
  var al = useState(function () {
      return boot.aliases || {};
    }),
    aliases = al[0],
    setAliases = al[1];
  var aliasesNow = useRef(aliases);
  aliasesNow.current = aliases;
  var en = useState(function () {
      return boot.engagement || null;
    }),
    engagement = en[0],
    setEngagement = en[1];
  var rpt = useState(function () {
      if (boot.report) return boot.report;
      try {
        return JSON.parse(localStorage.getItem("vaptlens.report.v1") || "{}");
      } catch (e) {
        return {};
      }
    }),
    report = rpt[0],
    setReport = rpt[1];
  /* SLA windows are workspace policy (stored in the admin-only policy store, so everyone measures against the same
     numbers); older per-browser settings are picked up once */
  var sl = useState(function () {
      return Object.assign(
        {},
        SLA_DEFAULTS,
        (boot.policy && boot.policy.sla) || store("vaptlens.sla.v1") || {},
      );
    }),
    sla = sl[0],
    setSla = sl[1];
  var stt = useState(function () {
      return (
        (boot.policy && boot.policy.slaTier) ||
        store("vaptlens.slaTier.v1") || {
          1: {
            critical: 7,
            high: 15,
          },
        }
      );
    }),
    slaTier = stt[0],
    setSlaTier = stt[1];
  function slaFor(sev, tier) {
    var o = slaTier[tier] || {};
    return o[sev] || sla[sev];
  }
  var it = useState({}),
    intel: any = it[0],
    setIntel = it[1];
  var ts = useState([]),
    toasts = ts[0],
    setToasts = ts[1];
  var hd = useState(null),
    hostDrawer = hd[0],
    setHostDrawer = hd[1];
  var fo = useState(null),
    findingOpen = fo[0],
    setFindingOpen = fo[1],
    kh = useState(false),
    qu = useState("Active"),
    ib = useState(false),
    seen = useState(function () {
      var x = myPrefsSeen(boot, me);
      return typeof x === "string"
        ? {
            Mentions: x,
            Mine: x,
          }
        : x || {};
    });
  var hostRef = useRef(null);
  hostRef.current = hostDrawer;
  var up = useState(false),
    uploadOpen = up[0],
    setUploadOpen = up[1];
  var st = useState(false),
    settingsOpen = st[0],
    setSettingsOpen = st[1];
  var dop = useState<any>(false),
    dataOpen = dop[0],
    setDataOpen = dop[1];
  /* filters survive a reload (this browser, this user); they're a convenience, never shared */
  var fl = useState(function () {
      var x = myPrefs.filters;
      return x ? Object.assign({}, EMPTY_FILTERS, x) : EMPTY_FILTERS;
    }),
    filters = fl[0],
    setFilters = fl[1];
  var readOnly = role === "Security Auditor";
  P.readOnly = readOnly;
  P.isAdmin = role === "Administrator";
  var auditChain = useRef(Promise.resolve());
  useEffect(function () {
    IDB.get("intel").then(function (x) {
      if (x) setIntel(x);
    });
  }, []);
  useEffect(
    function () {
      if (theme === "auto") document.documentElement.removeAttribute("data-vt");
      else document.documentElement.setAttribute("data-vt", theme);
      store("vaptlens-theme", theme);
      /* browser chrome (mobile address bar, PWA title bar) follows the chosen theme's canvas */
      var canvas = getComputedStyle(document.documentElement).getPropertyValue("--canvas").trim();
      if (canvas)
        [].forEach.call(document.querySelectorAll('meta[name="theme-color"]'), function (m) {
          if (!m.hasAttribute("data-default")) m.setAttribute("data-default", m.getAttribute("content") || "");
          m.setAttribute("content", theme === "auto" ? m.getAttribute("data-default") : canvas);
        });
    },
    [theme],
  );
  useEffect(function () {
    var lg = boot.login || {};
    if (lg.hadFails)
      toast({
        title: lg.hadFails + " failed sign-in attempt(s) on your account",
        message:
          "Since your last sign-in" +
          (lg.prevLogin ? " (" + fmtTime(lg.prevLogin) + ")" : "") +
          ".",
        tone: "danger",
      });
    /* idle sign-out: the server ends idle sessions; activity pings it at most once a minute so reading
       without saving doesn't count as idle, and the screen locks here once the limit passes */
    var lastAct = Date.now(),
      lastPing = Date.now();
    function act() {
      var n = Date.now();
      lastAct = n;
      if (n - lastPing > 60000) {
        lastPing = n;
        api("/api/auth/state").catch(function () {});
      }
    }
    ["mousedown", "keydown", "touchstart", "scroll"].forEach(function (ev) {
      window.addEventListener(ev, act, {
        passive: true,
      });
    });
    var t = setInterval(function () {
      if (Date.now() - lastAct > AUTH.idleMinutes * 60000)
        signOut("Signed out after " + AUTH.idleMinutes + " minutes idle.");
    }, 30000);
    return function () {
      clearInterval(t);
      ["mousedown", "keydown", "touchstart", "scroll"].forEach(function (ev) {
        window.removeEventListener(ev, act);
      });
    };
  }, []);
  /* error toasts don't follow you to another view (they stay put until dismissed otherwise) */
  useEffect(
    function () {
      setToasts(function (x) {
        return x.some(function (y) {
          return y.tone === "danger";
        })
          ? x.filter(function (y) {
              return y.tone !== "danger";
            })
          : x;
      });
    },
    [route],
  );
  /* the assistant only exists inside claude.ai: show "Ask" only where it works */
  var ak = useState(false),
    askOk = ak[0];
  useEffect(function () {
    sampleNs().then(
      function (s) {
        ak[1](!!s);
      },
      function () {},
    );
  }, []);
  /* save status, conflicts and refusals from the storage layer */
  var svs = useState("saved"),
    saveState = svs[0];
  var cf = useState([]),
    conflicts = cf[0],
    rf = useState([]),
    refusals = rf[0];
  useEffect(function () {
    return P.on(function (e) {
      if (e.type === "status") svs[1](e.state);
      else if (e.type === "conflict")
        cf[1](function (x) {
          return x.indexOf(e.store) >= 0 ? x : x.concat([e.store]);
        });
      else if (e.type === "refused")
        rf[1](function (x) {
          return x.concat([{ store: e.store, message: e.message }]);
        });
    });
  }, []);
  var auditTotal = useRef(boot.auditTotal || (boot.audit || []).length);
  useEffect(
    function () {
      P.save("remediation", gov);
    },
    [gov],
  );
  useEffect(
    function () {
      P.save("assets", assets);
    },
    [assets],
  );
  useEffect(
    function () {
      P.save("library", library);
    },
    [library],
  );
  useEffect(
    function () {
      P.save("campaigns", campaigns);
    },
    [campaigns],
  );
  useEffect(
    function () {
      P.save("rules", rules);
    },
    [rules],
  );
  useEffect(
    function () {
      P.save("goals", goals);
    },
    [goals],
  );
  useEffect(
    function () {
      P.save("vex", vexList);
    },
    [vexList],
  );
  useEffect(
    function () {
      P.save("aliases", aliases);
    },
    [aliases],
  );
  useEffect(function () {
    function k(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        pal[1](function (x) {
          return !x;
        });
      }
    }
    window.addEventListener("keydown", k);
    return function () {
      window.removeEventListener("keydown", k);
    };
  }, []);
  useEffect(
    function () {
      if (engagement) P.save("engagement", engagement);
    },
    [engagement],
  );
  useEffect(
    function () {
      P.save("report", report);
    },
    [report],
  );
  useEffect(
    function () {
      setPolicy(function (p0) {
        if (
          JSON.stringify(p0.sla) === JSON.stringify(sla) &&
          JSON.stringify(p0.slaTier) === JSON.stringify(slaTier)
        )
          return p0;
        return Object.assign({}, p0, { sla: sla, slaTier: slaTier });
      });
    },
    [sla, slaTier],
  );
  useEffect(function () {
    if (boot.rekeyed)
      log(
        "MIGRATE",
        boot.rekeyed +
          " findings re-keyed to v2 fingerprints; governance carried over",
      );
  }, []);
  var vw = useState(function () {
      return myPrefs.views || [];
    }),
    views = vw[0],
    setViews = vw[1];
  var cols = useState(function () {
      return myPrefs.cols || ["risk", "slaLeft", "team"];
    }),
    sortP = useState(function () {
      return myPrefs.sort || null;
    });
  useEffect(
    function () {
      var mine0 = {
        filters: filters,
        views: views,
        layout: dash,
        inboxSeenAt: seen[0],
        cols: cols[0],
        sort: sortP[0],
      };
      /* merge into what's stored now (another tab may have saved another user's prefs);
         update() does the read inside the save chain so two tabs can't both merge from a stale copy */
      P.update("prefs", function (cur) {
        var all = Object.assign({}, cur || {});
        all[me.username] = mine0;
        prefsAll.current = all;
        return all;
      }).then(function (ok) {
          if (ok && !legacyGone.current) {
            legacyGone.current = true;
            try {
              localStorage.removeItem("vaptlens.filters." + me.username);
            } catch (e) {}
          }
        });
    },
    [filters, views, dash, seen[0], cols[0], sortP[0]],
  );
  useEffect(
    function () {
      if (!dataDirty) {
        P.save("scans", null);
        return;
      }
      var slim = raw.map(function (f) {
        return {
          id: f.id,
          key: f.key,
          batch: f.batch,
          name: f.name,
          host: f.host,
          port: f.port,
          sev: f.sev,
          cvss: f.cvss,
          vector: f.vector,
          cves: f.cves,
          cwe: f.cwe,
          pluginId: f.pluginId,
          tool: f.tool,
          owasp: f.owasp,
          url: f.url,
          desc: f.desc,
          sol: f.sol,
          eol: f.eol,
          zeroday: f.zeroday,
          lib: f.lib,
        };
      });
      P.save("scans", {
        v: 2,
        keyV: 2,
        seq: batchIds.current.seq,
        batches: batchesRaw,
        data: slim,
      });
    },
    [raw, batchesRaw, dataDirty],
  );
  /* ===== routing: every view, host and finding has its own history entry, so Back/Forward and deep links work =====
     #dashboard … #report · #host-<ip> · #f-<finding label> (only plain anchor characters, as artifact links allow) */
  var routeRef = useRef(route);
  routeRef.current = route;
  function closeModals() {
    setUploadOpen(false);
    pal[1](false);
    kh[1](false);
    setAssistant(null);
    um[1](false);
    mp[1](false);
    setSettingsOpen(false);
  }
  function applyHash(initial, st) {
    var x = location.hash.replace("#", "");
    if (x === "matrix") x = "priority";
    if (
      VIEWS.some(function (v) {
        return v[0] === x;
      })
    ) {
      setRoute(x);
      setHostDrawer(null);
      setFindingOpen(null);
      setDataOpen(false);
      closeModals();
      return;
    }
    if (x.indexOf("host-") === 0) {
      var hx = x.slice(5);
      try {
        hx = decodeURIComponent(hx);
      } catch (e) {}
      if (initial) setRoute("assets");
      setHostDrawer(hx);
      setFindingOpen(null);
      closeModals();
      return;
    }
    /* a finding drawer sits on top of the host drawer it was opened from, and only that one */
    if (x.indexOf("f-") === 0) {
      setFindingOpen({
        label: x.slice(2),
      });
      setHostDrawer(st && st.host ? st.host : null);
      closeModals();
      return;
    }
    /* Back to the entry URL (no hash): that page was the dashboard */
    if (!x && !initial) {
      setRoute("dashboard");
      setHostDrawer(null);
      setFindingOpen(null);
      return;
    }
    if (x)
      try {
        history.replaceState(null, "", "#" + routeRef.current);
      } catch (e) {}
  }
  function pushNav(hash, extra?) {
    if (location.hash === "#" + hash) return;
    try {
      history.pushState(
        Object.assign(
          {
            vl: 1,
          },
          extra || {},
        ),
        "",
        "#" + hash,
      );
    } catch (e) {
      location.hash = hash;
    }
  }
  /* close an overlay we opened: step back through history if we pushed it, otherwise just clean the URL */
  function popOverlay(prefix) {
    try {
      history.replaceState(null, "", "#" + routeRef.current);
    } catch (e) {
      location.hash = routeRef.current;
    }
  }
  useEffect(function () {
    applyHash(true, history.state);
    function onPop(e) {
      applyHash(false, (e && e.state) || history.state);
    }
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return function () {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, []);
  useEffect(function () {
    function onKey(e) {
      var tg = e.target && e.target.tagName;
      if (
        tg === "INPUT" ||
        tg === "TEXTAREA" ||
        tg === "SELECT" ||
        e.target.isContentEditable ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      /* nothing fires behind an open dialog, drawer or menu */
      if (
        document.querySelector(
          '[aria-modal="true"], .vl-menu, .vl-ms-menu, .settings-pop',
        )
      )
        return;
      if (e.key === "?") {
        e.preventDefault();
        kh[1](true);
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        focusSearch();
        return;
      }
      var n = parseInt(e.key, 10);
      if (n === 0) n = 10;
      if (n >= 1 && n <= VIEWS.length) {
        go(VIEWS[n - 1][0]);
      }
    }
    window.addEventListener("keydown", onKey);
    return function () {
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  useEffect(
    function () {
      if (!settingsOpen) return;
      function k(e) {
        if (e.key === "Escape") {
          setSettingsOpen(false);
          var b0: any = document.querySelector(".rail-role");
          if (b0) b0.focus();
        }
      }
      function down(e) {
        if (
          !e.target.closest(".settings-pop") &&
          !e.target.closest(".rail-role")
        )
          setSettingsOpen(false);
      }
      document.addEventListener("keydown", k);
      document.addEventListener("mousedown", down, true);
      return function () {
        document.removeEventListener("keydown", k);
        document.removeEventListener("mousedown", down, true);
      };
    },
    [settingsOpen],
  );
  /* the account popover lives in <body> (the blurred rail would trap a fixed child); anchor it to the trigger */
  function popPos() {
    var b0 = document.querySelector(".rail-role");
    if (!b0) return {};
    var r0 = b0.getBoundingClientRect();
    if (window.innerWidth <= 1023)
      return {
        top: Math.round(r0.bottom + 8) + "px",
        left: "16px",
        right: "16px",
      };
    return {
      left: Math.round(r0.left) + "px",
      bottom: Math.round(window.innerHeight - r0.top + 8) + "px",
    };
  }
  /* each view has its own tab title; keyboard focus moves to the new heading */
  var firstRoute = useRef(true);
  useEffect(
    function () {
      var v = VIEWS.find(function (x) {
        return x[0] === route;
      });
      document.title = (v ? v[1] + " · " : "") + "VAPTLens";
      if (firstRoute.current) {
        firstRoute.current = false;
        return;
      }
      setTimeout(function () {
        var hh: any = document.querySelector(".main .page-title");
        if (hh && !document.querySelector('[aria-modal="true"]'))
          hh.focus({
            preventScroll: true,
          });
      }, 60);
    },
    [route],
  );
  function go(id) {
    setRoute(id);
    setHostDrawer(null);
    setFindingOpen(null);
    setDataOpen(false);
    pushNav(id);
    window.scrollTo(0, 0);
  }
  function focusSearch() {
    function f0() {
      var el: any = document.querySelector(
        ".slicer input[type=search], .slicer .vl-input input, input[aria-label^='Search']",
      );
      if (el) {
        el.focus();
        el.select && el.select();
        return true;
      }
      return false;
    }
    if (!f0()) {
      go("dashboard");
      setTimeout(f0, 120);
    }
  }
  /* jump to the findings table (after a KPI or counter sets a filter) */
  function showFindings(q?) {
    qu[1](typeof q === "string" ? q : "Active");
    if (routeRef.current !== "dashboard") go("dashboard");
    else {
      if (findingOpen) {
        setFindingOpen(null);
        popOverlay("f-");
      }
      if (hostDrawer) {
        setHostDrawer(null);
        popOverlay("host-");
      }
    }
    setTimeout(function () {
      var el = document.getElementById("findings-top");
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        el.focus({
          preventScroll: true,
        });
      }
    }, 150);
  }
  function openFinding(key) {
    if (!key) {
      setFindingOpen(null);
      popOverlay("f-");
      return;
    }
    setFindingOpen({
      key: key,
    });
    pushNav("f-" + vlLabel(key), {
      host: hostRef.current,
    });
  }

  /* a finding marked remediated regresses when a scan imported AFTER the mark (or dated after it) still finds it */
  function isRegression(g0, fi) {
    if (!g0 || !g0.fixedAt || !fi) return false;
    var d = localDay(g0.fixedAt);
    if (fi.lastSeen > d) return true;
    if (fi.lastSeen === d) {
      var bb = batchesRaw.find(function (x) {
        return x.id === fi.lastBatch;
      });
      return !!(bb && bb.importedAt && bb.importedAt > g0.fixedAt);
    }
    return false;
  }
  /* governance state helpers (accepted risk expires; an acceptance without an end date counts as expired) */
  function stateOf(key) {
    var x = gov[key] || {};
    if (x.state === "fp") return "fp";
    if (x.state === "requested") return null;
    if (x.state === "accepted")
      return !x.until || x.until < AS_OF ? "expired" : "accepted";
    return null;
  }
  /* measure to today's local date. Set during render (not in an effect) so the engine never runs with a stale
     "today"; a timer re-renders after midnight so an open tab rolls over. Future-dated scans never move it. */
  var tdy = useState(localDay()),
    today0 = tdy[0];
  useEffect(function () {
    var t = setInterval(function () {
      if (localDay() !== tdy[0]) tdy[1](localDay());
    }, 60000);
    return function () {
      clearInterval(t);
    };
  }, [today0]);
  if (AS_OF !== today0) setAS_OF(today0);
  for (var sk in sla) SLA_DAYS[sk] = sla[sk];
  /* only the governance fields that change scoring re-run the engine (notes, tags and owners don't) */
  var govSig = Object.keys(gov)
    .map(function (k) {
      var x = gov[k];
      return x.state || x.validation || x.cvssVector || x.pauses
        ? k +
            ":" +
            (x.state || "") +
            ":" +
            (x.until || "") +
            ":" +
            (x.validation || "") +
            ":" +
            (x.cvssVector || "") +
            ":" +
            JSON.stringify(x.pauses || "")
        : "";
    })
    .filter(Boolean)
    .sort()
    .join("|");
  var eng = useMemo(
    function () {
      return runEngine(raw, batchesRaw, {
        intel: intel,
        assets: assets,
        sla: sla,
        slaFor: slaFor,
        exempt: function (f) {
          var s2 = stateOf(f.key);
          return s2 === "fp" || s2 === "accepted";
        },
        validation: function (f) {
          return (gov[f.key] || {}).validation || null;
        },
        vectorOf: function (f) {
          return (gov[f.key] || {}).cvssVector || null;
        },
        pausedDays: function (f) {
          return pausedDaysOf(gov[f.key], f.slaStart || f.firstSeen);
        },
      });
    },
    [raw, batchesRaw, intel, assets, sla, slaTier, govSig, today0],
  );
  var data = eng.data,
    batches = eng.order,
    latest = eng.latest;
  /* only the governance fields that move a finding in or out of the queue (not notes, tags or owners) */
  var activeSig = Object.keys(gov)
    .map(function (k) {
      var x = gov[k];
      return x.state || x.fixed
        ? k +
            ":" +
            (x.state || "") +
            ":" +
            (x.until || "") +
            ":" +
            (x.fixed ? 1 : 0) +
            ":" +
            (x.fixedAt || "")
        : "";
    })
    .filter(Boolean)
    .sort()
    .join("|");
  /* marked remediated by hand in the latest scan and not seen again: out of every "open" count */
  function isManFixed(x) {
    var g0 = gov[x.key];
    return !!(
      g0 &&
      g0.fixed &&
      x.batch === latest &&
      !isRegression(g0, eng.findings[x.key])
    );
  }
  var active = useMemo(
    function () {
      return data.filter(function (f) {
        if (f.batch !== latest) return false;
        var g0 = gov[f.key];
        f.regressed = !!(
          g0 &&
          g0.fixed &&
          isRegression(g0, eng.findings[f.key])
        );
        if (f.lifecycle === "Fixed") return false;
        var s2 = stateOf(f.key);
        if (s2 === "fp" || s2 === "accepted") return false;
        if (g0 && g0.fixed && !f.regressed) return false;
        return true;
      });
    },
    [data, latest, activeSig, eng],
  );
  var parked = useMemo(
    function () {
      return data.filter(function (f) {
        var s2 = stateOf(f.key);
        return (
          f.batch === latest &&
          f.lifecycle !== "Fixed" &&
          (s2 === "fp" || s2 === "accepted")
        );
      });
    },
    [data, latest, gov],
  );
  var fixedKeys = useMemo(
    function () {
      var seenLatest = {};
      active.forEach(function (f) {
        seenLatest[f.key] = 1;
      });
      parked.forEach(function (f) {
        seenLatest[f.key] = 1;
      });
      return uniq(
        data
          .filter(function (f) {
            return (
              (f.lifecycle === "Fixed" || (gov[f.key] && gov[f.key].fixed)) &&
              !seenLatest[f.key]
            );
          })
          .map(function (f) {
            return f.key;
          }),
      );
    },
    [data, active, parked, gov],
  );
  function openHost(ip) {
    if (!ip) {
      setHostDrawer(null);
      popOverlay("host-");
      return;
    }
    setFindingOpen(null);
    setHostDrawer(ip);
    pushNav("host-" + encodeURIComponent(ip));
  }
  /* combine per-scanner scope of an existing scan (legacy scans: every listed tool covered every host) with a new upload's */
  function mergeScopeBy(x, batch) {
    var out = {};
    if (x.scopeBy)
      Object.keys(x.scopeBy).forEach(function (k) {
        out[k] = x.scopeBy[k].slice();
      });
    else
      sourcesOf(x.tools).forEach(function (src) {
        out[src] = (x.scope || []).slice();
      });
    var add = batch.scopeBy || {};
    if (!batch.scopeBy)
      sourcesOf(batch.tool).forEach(function (src) {
        add[src] = batch.scope || [];
      });
    Object.keys(add).forEach(function (k) {
      out[k] = uniq((out[k] || []).concat(add[k]));
    });
    return out;
  }
  /* VEX: store the statements, then set/lift VEX suppressions on the given new rows + current findings */
  function runVex(list, newRows) {
    if (list !== vexList) setVexList(list);
    var patch = applyVex(list, data.concat(newRows || []), gov),
      ks = Object.keys(patch),
      set = 0,
      lifted = 0;
    if (ks.length)
      setGov(function (o) {
        var n = Object.assign({}, o);
        ks.forEach(function (k) {
          if (patch[k] === null) {
            var c = Object.assign({}, o[k]);
            delete c.state;
            delete c.reason;
            delete c.by;
            delete c.vexId;
            delete c.requestedState;
            delete c.requestedBy;
            c.vexLiftedAt = nowIso();
            n[k] = c;
          } else if (
            !isAdmin &&
            o[k] &&
            o[k].state === "fp" &&
            o[k].approvedBy
          ) {
            return;
          } else
            n[k] = Object.assign(
              {},
              o[k] || {},
              isAdmin
                ? patch[k]
                : Object.assign({}, patch[k], {
                    state: "requested",
                    requestedState: "fp",
                    requestedBy: me.username,
                  }),
              {
                at: nowIso(),
              },
            );
        });
        return n;
      });
    ks.forEach(function (k) {
      if (patch[k] === null) lifted++;
      else set++;
    });
    if (!isAdmin && set)
      toast({
        title: set + " VEX suppressions sent for approval",
        message:
          "An administrator approves false positives, including ones from VEX.",
        tone: "info",
      });
    return {
      set: set,
      lifted: lifted,
    };
  }
  /* add alias → canonical pairs and fold existing findings, governance and scopes onto the canonical host */
  function addAliases(pairs, why) {
    var n = Object.assign({}, aliases),
      added = [];
    pairs.forEach(function (pq) {
      var a = String(pq[0] || "")
          .toLowerCase()
          .trim(),
        c = String(pq[1] || "")
          .toLowerCase()
          .trim();
      if (!a || !c || a === c || n[a] === c) return;
      if (canonHost(c, n) === a) return; /* would loop */
      if (n[a] && why === "scan")
        return; /* an alias someone set by hand wins over a scanner's */
      n[a] = c;
      added.push(a + " → " + c);
    });
    if (!added.length) return null;
    setAliases(n);
    var r = aliasRows(raw, n),
      map = r.map,
      ks = Object.keys(map);
    if (
      r.rows.some(function (x, i) {
        return x !== raw[i];
      })
    ) {
      setRaw(r.rows);
      setDataDirty(true);
    }
    setBatches(function (bb) {
      return bb.map(function (b0) {
        if (!b0.scope && !b0.scopeBy) return b0;
        var sb = null;
        if (b0.scopeBy) {
          sb = {};
          Object.keys(b0.scopeBy).forEach(function (k) {
            sb[k] = uniq(
              b0.scopeBy[k].map(function (hh) {
                return canonHost(hh, n);
              }),
            );
          });
        }
        return Object.assign({}, b0, {
          scope: uniq(
            (b0.scope || []).map(function (hh) {
              return canonHost(hh, n);
            }),
          ),
          scopeBy: sb || undefined,
        });
      });
    });
    if (ks.length) {
      /* the canonical host's own decisions win; the alias's fill gaps; notes are kept from both; old keys are remembered for ticket labels */
      setGov(function (o) {
        var g2 = {};
        Object.keys(o).forEach(function (k) {
          if (!map[k]) g2[k] = o[k];
        });
        Object.keys(o).forEach(function (k) {
          var t = map[k];
          if (!t) return;
        var from = o[k],
          cur = g2[t] || {};
        var m2 = Object.assign({}, from, cur);
        /* the canonical host's own decision is authoritative: when it has a state, none of the
           alias's workflow fields fill gaps next to it (no half-copied approvals or requests) */
        if (cur.state != null)
          [
            "requestedState",
            "requestedBy",
            "approvedBy",
            "approvedAt",
            "rejectedBy",
            "rejectedAt",
            "rejectReason",
            "until",
            "reason",
            "by",
            "vexId",
            "vexOverride",
          ].forEach(function (fld) {
            if (cur[fld] === undefined) delete m2[fld];
          });
        m2.notes = (cur.notes || []).concat(from.notes || []);
          m2.oldKeys = uniq(
            (cur.oldKeys || []).concat(from.oldKeys || [], [k]),
          );
          if (!m2.notes.length) delete m2.notes;
          g2[t] = m2;
        });
        return g2;
      });
      /* move evidence screenshots with their findings */
      ks.forEach(function (k) {
        P.evidence(k).then(function (a0) {
          if (!a0 || !a0.length) return;
          return P.evidence(map[k])
            .then(function (b0) {
              return P.setEvidence(map[k], (b0 || []).concat(a0));
            })
            .then(function () {
              return P.setEvidence(k, []);
            });
        }).catch(function (e) {
          /* the copy runs before the clear, so a failure here never loses screenshots */
          toast({
            title: "Some evidence wasn't moved to the merged host",
            message: e.message,
            tone: "danger",
          });
        });
      });
      setCampaigns(function (cs) {
        return cs.map(function (c) {
          return Object.assign({}, c, {
            keys: uniq(
              (c.keys || []).map(function (k) {
                return map[k] || k;
              }),
            ),
          });
        });
      });
    }
    setAssets(function (A) {
      var B = Object.assign({}, A),
        ch = false;
      Object.keys(n).forEach(function (a) {
        if (B[a]) {
          var c = canonHost(a, n);
          B[c] = Object.assign({}, B[a], B[c] || {});
          delete B[a];
          ch = true;
        }
      });
      return ch ? B : A;
    });
    log(
      "ALIAS",
      (why === "scan" ? "Learned from scan: " : "Set by hand: ") +
        added.join(", ") +
        (ks.length ? " · " + ks.length + " findings merged" : ""),
    );
    return n;
  }
  function clearVex() {
    setVexList([]);
    setGov(function (o) {
      var n = {};
      Object.keys(o).forEach(function (k) {
        var x = o[k];
        if (x.by === "VEX" && x.state === "fp") {
          x = Object.assign({}, x);
          delete x.state;
          delete x.reason;
          delete x.by;
          delete x.vexId;
        }
        n[k] = x;
      });
      return n;
    });
    log("VEX", "Stored VEX statements cleared; VEX suppressions lifted");
  }
  /* any change to the report after approval sends it back to review */
  function setReportGuarded(n, cosmetic) {
    setReport(n);
    if (!cosmetic && engagement && engagement.status === "Approved") {
      setEngagement(
        Object.assign({}, engagement, {
          status: "In review",
          approvedAt: "",
        }),
      );
      log(
        "REPORT",
        "Report edited after approval by " +
          me.username +
          " — status back to In review",
      );
      toast({
        title: "Report edited — approval withdrawn",
        message:
          "It's back to In review until an administrator approves it again.",
        tone: "info",
      });
    }
  }
  function removeAlias(a) {
    var n = Object.assign({}, aliases);
    delete n[a];
    setAliases(n);
    log(
      "ALIAS",
      "Removed " + a + " (already-merged findings stay on the canonical host)",
    );
  }
  function clearAll() {
    if (!isAdmin) return;
    setToasts([]);
    log("DATA", "All scan data cleared (" + batchesRaw.length + " scans)");
    setRaw([]);
    setBatches([]);
    setDataDirty(true);
    setFilters(EMPTY_FILTERS);
    toast({
      title: "All scan data cleared",
      message: "Upload scans to continue.",
    });
  }
  function deleteBatch(id) {
    if (!isAdmin) {
      toast({
        title: "Only administrators can delete scans",
        tone: "danger",
      });
      return;
    }
    var bb = batchesRaw.find(function (x) {
      return x.id === id;
    });
    log("DATA", "Deleted scan " + (bb ? bb.label + " (" + bb.date + ")" : id));
    setRaw(function (dd) {
      return dd.filter(function (f) {
        return f.batch !== id;
      });
    });
    setBatches(function (x) {
      return x.filter(function (y) {
        return y.id !== id;
      });
    });
    setDataDirty(true);
    var keepRows = raw.filter(function (f) {
        return f.batch === id;
      }),
      keepB = bb;
    var tid = toast({
      title: "Deleted scan " + (bb ? bb.label : id),
      message: keepRows.length + " finding rows removed.",
      action: {
        label: "Undo",
        onClick: function () {
          /* never reuse an id: if a newer import took it, the restored scan gets a fresh one; hosts follow any aliases learned since */
          var nid = batchesNow.current.some(function (x) {
            return x.id === id;
          })
            ? ++batchIds.current.seq
            : id;
          var rows2 = aliasRows(
            keepRows.map(function (f) {
              return nid === id
                ? f
                : Object.assign({}, f, {
                    batch: nid,
                    id: f.id + "r" + nid,
                  });
            }),
            aliasesNow.current,
          ).rows;
          setRaw(function (dd) {
            return dd.concat(rows2);
          });
          setBatches(function (x) {
            return x.concat([
              Object.assign({}, keepB, {
                id: nid,
              }),
            ]);
          });
          setDataDirty(true);
          log("UNDO", "Restored scan " + (keepB ? keepB.label : id));
          dropToast(tid);
        },
      },
    });
  }
  function updateBatch(id, patch) {
    if (!isAdmin) return;
    setBatches(function (x) {
      return x.map(function (y) {
        return y.id === id ? Object.assign({}, y, patch) : y;
      });
    });
    setDataDirty(true);
  }

  /* governance per finding key */
  function g(f) {
    var x = gov[f.key] || {};
    return {
      team: x.team || f.team,
      raci: x.raci || "R",
      ticket: x.ticket || null,
      assigned: x.assigned != null ? x.assigned : f.lifecycle === "Open",
      status: x.status || (f.lifecycle === "Open" ? "In Progress" : "To Do"),
      state: stateOf(f.key),
      requested: x.state === "requested",
      until: x.until,
      reason: x.reason,
      by: x.by,
      notes: x.notes || [],
      tags: x.tags || [],
      validation: x.validation || null,
      fixed: !!x.fixed,
      cvssVector: x.cvssVector || null,
    };
  }
  function patchGov(key, patch) {
    setGov(function (o) {
      var n = Object.assign({}, o);
      n[key] = Object.assign({}, o[key] || {}, patch);
      return n;
    });
  }
  /* audit refs stay small: one key, or the first 50 of a bulk change (the count goes in the detail) */
  function refOf(keys) {
    return keys.length === 1 ? keys[0] : keys.slice(0, 50);
  }
  /* ref = the finding key an entry is about (hashed into the chain); it powers each finding's activity timeline */
  function log(action, detail, ref?) {
    /* the server appends the entry, stamps who/when/role and chains its hash; the log can't be edited from here */
    auditChain.current = auditChain.current.then(function () {
      return AUDIT.append(action, detail, ref).then(
        function (e) {
          auditTotal.current++;
          setAudit(function (a) {
            return [e].concat(a).slice(0, AUDIT_CAP);
          });
        },
        function (err) {
          if (err && err.status === 401) return;
          toast({
            title: "Couldn't record this in the audit log",
            message: action + ": " + (err && err.message),
            tone: "danger",
          });
        },
      );
    });
  }
  /* toasts: the timer pauses while the pointer or focus is on them; an Undo gets 15 s and Ctrl/⌘+Z */
  var toastPaused = useRef(false),
    lastUndo = useRef(null);
  function toast(t) {
    var id = Math.random();
    if (t.action && /^undo$/i.test(t.action.label))
      lastUndo.current = {
        id: id,
        run: t.action.onClick,
      };
    setToasts(function (x) {
      return x
        .concat([
          Object.assign(
            {
              id: id,
            },
            t,
          ),
        ])
        .slice(-4);
    });
    if (t.tone !== "danger") {
      var expire = function () {
        if (toastPaused.current) {
          setTimeout(expire, 2000);
          return;
        }
        if (lastUndo.current && lastUndo.current.id === id) lastUndo.current = null;
        setToasts(function (x) {
          return x.filter(function (y) {
            return y.id !== id;
          });
        });
      };
      setTimeout(expire, t.action ? 15000 : 6000);
    }
    return id;
  }
  useEffect(function () {
    function onKey(e) {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== "z") return;
      var el = document.activeElement as HTMLElement;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
      var u = lastUndo.current;
      if (!u) return;
      e.preventDefault();
      lastUndo.current = null;
      u.run();
      dropToast(u.id);
    }
    window.addEventListener("keydown", onKey);
    return function () {
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  /* list deletes (campaigns, goals, rules, library): toast with Undo that puts the previous list back */
  function listUndo(setFn, item, title) {
    var id = toast({
      title: title,
      action: {
        label: "Undo",
        onClick: function () {
          setFn(function (cur) {
            return cur.some(function (x) {
              return x.id === item.id;
            })
              ? cur
              : cur.concat([item]);
          });
          log("UNDO", "Restored: " + title);
          dropToast(id);
        },
      },
    });
  }
  function dropToast(id) {
    setToasts(function (x) {
      return x.filter(function (y) {
        return y.id !== id;
      });
    });
  }
  /* change governance with an Undo in the toast: restores exactly what the keys had before */
  /* Undo restores only the fields this change touched, and only where they still hold the value it set
     (a note added or a rule run in between survives the Undo) */
  function govUndoable(keys, patchFn, t, logA, logD) {
    var patches = {},
      before = {};
    keys.forEach(function (k) {
      var cur = gov[k] || {};
      patches[k] = patchFn(k, cur);
      before[k] = {};
      Object.keys(patches[k]).forEach(function (fld) {
        before[k][fld] = cur[fld];
      });
    });
    setGov(function (o) {
      var n = Object.assign({}, o);
      keys.forEach(function (k) {
        n[k] = Object.assign({}, o[k] || {}, patches[k]);
      });
      return n;
    });
    if (logA) log(logA, logD, refOf(keys));
    var id = toast(
      Object.assign({}, t, {
        action: {
          label: "Undo",
          onClick: function () {
            revertFields(patches, before);
            log("UNDO", "Reverted: " + t.title, refOf(keys));
            dropToast(id);
          },
        },
      }),
    );
  }
  function revertFields(patches, before) {
    setGov(function (o) {
      var n = Object.assign({}, o);
      Object.keys(patches).forEach(function (k) {
        var cur = Object.assign({}, o[k] || {});
        Object.keys(patches[k]).forEach(function (fld) {
          if (JSON.stringify(cur[fld]) !== JSON.stringify(patches[k][fld]))
            return;
          if (before[k][fld] === undefined) delete cur[fld];
          else cur[fld] = before[k][fld];
        });
        n[k] = cur;
      });
      return n;
    });
  }
  /* approve or reject a pending exception / false-positive request (one path for the banner, the modal and bulk) */
  function decideRequest(keys0, ok, reason) {
    if (!isAdmin || readOnly) return;
    /* separation of duties: nobody approves their own request */
    function needs2(k) {
      var g1 = gov[k] || {},
        f1 = eng.findings[k] || {};
      return (
        policy.twoPerson &&
        (g1.requestedState || "accepted") === "accepted" &&
        (f1.sev === "critical" || f1.kev)
      );
    }
    var keys = keys0.filter(function (k) {
      return !(
        ok &&
        (gov[k] || {}).requestedBy === me.username &&
        (policy.sod !== false || needs2(k))
      );
    });
    if (keys.length < keys0.length)
      toast({
        title: keys0.length - keys.length + " request(s) are yours",
        message:
          policy.sod !== false
            ? "Another administrator has to approve them (separation of duties)."
            : "Critical and KEV acceptances need a second administrator (two-person rule).",
        tone: "info",
      });
    if (!keys.length) return;
    govUndoable(
      keys,
      function (k, g0) {
        if (ok)
          return {
            state: g0.requestedState || "accepted",
            requestedState: null,
            approvedBy: me.username,
            approvedAt: nowIso(),
            rejectedBy: null,
            rejectedAt: null,
            rejectReason: null,
          };
        var p0: any = {
          state: null,
          requestedState: null,
          until: null,
          rejectedBy: me.username,
          rejectedAt: nowIso(),
          rejectReason: reason || "",
        };
        if (g0.by === "VEX") {
          p0.by = me.username;
          p0.vexOverride = g0.vexId || "any";
          p0.vexId = null;
        }
        return p0;
      },
      {
        title:
          keys.length + (ok ? " request(s) approved" : " request(s) rejected"),
      },
      ok ? "ACCEPT-APPROVE" : "ACCEPT-REJECT",
      keys.length + " finding(s)" + (reason ? " — " + reason : ""),
    );
  }
  var ticketSeq = useRef(
    Object.keys(gov).reduce(function (m, k) {
      var t = gov[k] && gov[k].ticket;
      var n = t ? parseInt(String(t).replace(/\D/g, ""), 10) : 0;
      return Math.max(m, n || 0);
    }, 140),
  );
  function nextTicket() {
    ticketSeq.current += 1;
    return "SEC-" + String(ticketSeq.current).padStart(4, "0");
  }
  function saveIntel(patch) {
    var n = Object.assign({}, intel, patch);
    setIntel(n);
    return IDB.set("intel", n);
  }
  var metrics = useMemo(
    function () {
      return metricsOf(eng, gov, sla, {
        slaFor: slaFor,
        assets: assets,
        isRegression: isRegression,
      });
    },
    [eng, gov, sla, slaTier, assets, batchesRaw],
  );
  /* regressions clear the manual "remediated" mark so the card leaves Resolved */
  useEffect(
    function () {
      var reg = Object.keys(gov).filter(function (k) {
        return gov[k] && gov[k].fixed && isRegression(gov[k], eng.findings[k]);
      });
      if (!reg.length) return;
      setGov(function (o) {
        var n = Object.assign({}, o);
        reg.forEach(function (k) {
          n[k] = Object.assign({}, o[k], {
            fixed: false,
            status: "To Do",
            regressedAt: nowIso(),
            regressions: (o[k].regressions || 0) + 1,
          });
        });
        return n;
      });
      reg.forEach(function (k) {
        log(
          "REGRESSION",
          (eng.findings[k] || {}).name +
            " still present after being marked remediated",
          k,
        );
      });
      toast({
        title: reg.length + " regression" + (reg.length > 1 ? "s" : ""),
        message:
          "Marked remediated but a later scan still finds it. Moved back to To Do.",
        tone: "danger",
      });
    },
    [eng],
  );
  var attack = useMemo(
    function () {
      return buildAttackGraph(active, assets);
    },
    [active, assets],
  );
  function runRules(list, quiet) {
    if (readOnly) {
      if (!quiet)
        toast({
          title: RO_REASON,
          tone: "info",
        });
      return;
    }
    var res = applyRules(list || rules, active, gov, {
      buOf: function (hh) {
        return assetOf(hh, assets).bu;
      },
      campaignHas: function (cid, k) {
        var c = campaigns.find(function (x) {
          return x.id === cid;
        });
        return !c || c.keys.indexOf(k) >= 0;
      },
    });
    var keys = Object.keys(res.patches);
    if (!keys.length) {
      if (!quiet)
        toast({
          title: "Rules ran",
          message: "Nothing needed changing.",
        });
      return res;
    }
    setGov(function (o) {
      var n = Object.assign({}, o);
      keys.forEach(function (k) {
        var p = Object.assign({}, res.patches[k]);
        if (p.ticket === "__new__") {
          if (o[k] && o[k].ticket) delete p.ticket;
          else p.ticket = nextTicket();
        }
        if (p.campaign) {
          var cid = p.campaign;
          delete p.campaign;
          setCampaigns(function (cs) {
            return cs.map(function (c) {
              return c.id === cid && c.keys.indexOf(k) < 0
                ? Object.assign({}, c, {
                    keys: c.keys.concat([k]),
                  })
                : c;
            });
          });
        }
        n[k] = Object.assign({}, o[k] || {}, p);
      });
      return n;
    });
    log(
      "RULES",
      res.hits
        .filter(function (x) {
          return x.n;
        })
        .map(function (x) {
          return x.rule + " → " + x.n;
        })
        .join("; "),
      refOf(Object.keys(res.patches)),
    );
    if (!quiet)
      toast({
        title: "Automation rules applied",
        message: keys.length + " findings updated",
      });
    return res;
  }
  var rulesPending = useRef(false);
  useEffect(
    function () {
      if (rulesPending.current) {
        rulesPending.current = false;
        runRules(null, false);
      }
    },
    [active],
  );
  var ctx: any = {
    route: route,
    data: data,
    raw: raw,
    batches: batches,
    latest: latest,
    active: active,
    parked: parked,
    fixedKeys: fixedKeys,
    filters: filters,
    setFilters: setFilters,
    eng: eng,
    metrics: metrics,
    role: role,
    readOnly: readOnly,
    me: me,
    isAdmin: isAdmin,
    auditTotal: auditTotal.current,
    g: g,
    patchGov: patchGov,
    log: log,
    toast: toast,
    nextTicket: nextTicket,
    audit: audit,
    openHost: openHost,
    go: go,
    dash: dash,
    setDash: setDash,
    setGov: setGov,
    gov: gov,
    assets: assets,
    setAssets: setAssets,
    sla: sla,
    setSla: setSla,
    library: library,
    setLibrary: setLibrary,
    slaTier: slaTier,
    setSlaTier: setSlaTier,
    slaFor: slaFor,
    isRegression: isRegression,
    campaigns: campaigns,
    setCampaigns: setCampaigns,
    goals: goals,
    setGoals: setGoals,
    rules: rules,
    setRules: setRules,
    runRules: runRules,
    attack: attack,
    openAssistant: function (o) {
      setAssistant(o || {});
    },
    engagement: engagement,
    setEngagement: setEngagement,
    report: report,
    setReport: setReportGuarded,
    intel: intel,
    saveIntel: saveIntel,
    clearAll: clearAll,
    deleteBatch: deleteBatch,
    updateBatch: updateBatch,
    /* optional files: dropped on an empty view, handed straight to the upload dialog */
    openUpload: function (files) {
      setUploadOpen(files && files.length ? Array.prototype.slice.call(files) : true);
    },
    openFinding: openFinding,
    showFindings: showFindings,
    queue: qu[0],
    setQueue: qu[1],
    cols: cols[0],
    setCols: cols[1],
    sortPref: sortP[0],
    setSortPref: sortP[1],
    inboxSeen: seen[0],
    openInbox: function () {
      ib[1](true);
    },
    views: views,
    setViews: setViews,
    govUndoable: govUndoable,
    dropToast: dropToast,
    listUndo: listUndo,
    decideRequest: decideRequest,
    revertFields: revertFields,
    openData: function (tab) {
      setDataOpen(tab || true);
    },
    openUsers: function () {
      um[1](true);
    },
    stateOf: stateOf,
    isManFixed: isManFixed,
    vexList: vexList,
    setVexList: setVexList,
    runVex: runVex,
    clearVex: clearVex,
    aliases: aliases,
    addAliases: addAliases,
    removeAlias: removeAlias,
    policy: policy,
    setPolicy: setPolicy,
  };
  /* inbox items recomputed only when what they depend on changes */
  var inbox = useMemo(
    function () {
      return inboxItems(ctx);
    },
    [data, latest, gov, active, seen[0], me.username, isAdmin],
  );
  ctx.inbox = inbox;
  var View = {
    dashboard: Dashboard,
    assets: Assets,
    sla: Sla,
    metrics: Metrics,
    attack: AttackPaths,
    priority: Priority,
    remediation: Remediation,
    network: Network,
    retest: Retest,
    report: Report,
    governance: Governance,
  }[route];
  var threat = threatIndex(active);
  var breachedN = active.filter(function (x) {
    return x.breached;
  }).length;
  var critN = active.filter(function (x) {
    return x.sev === "critical";
  }).length;
  var ICON = {
    dashboard: "template",
    assets: "server",
    sla: "clock",
    metrics: "gauge",
    attack: "route",
    priority: "trend-up",
    remediation: "ticket",
    network: "router",
    retest: "shield-check",
    report: "file",
    governance: "briefcase",
  };
  var viewIdx = VIEWS.findIndex(function (v) {
    return v[0] === route;
  });
  ctx.viewNo = viewIdx + 1;
  return (
    <div className="console">
      {/* a button, not href="#main": the hash is the route */}
      <button
        type="button"
        className="skip-link"
        onClick={function () {
          var m = document.getElementById("main");
          if (m) m.focus();
        }}
      >
        Skip to main content
      </button>
      <aside className="rail">
        <a
          href="#dashboard"
          className="rail-brand"
          onClick={function (e) {
            e.preventDefault();
            go("dashboard");
          }}
        >
          <V.Logo size={22} />
        </a>
        <nav className="rail-nav" aria-label="Views">
          {VIEWS.map(function (v, i) {
            var on = v[0] === route;
            return (
              <a
                key={v[0]}
                href={"#" + v[0]}
                className={"rail-item" + (on ? " is-on" : "")}
                aria-current={on ? "page" : undefined}
                onClick={function (e) {
                  e.preventDefault();
                  go(v[0]);
                }}
              >
                <V.Icon name={ICON[v[0]]} size={16} />
                <span className="rail-label">{v[1]}</span>
                {i < 10 ? (
                  <kbd className="rail-key">{i === 9 ? 0 : i + 1}</kbd>
                ) : null}
              </a>
            );
          })}
        </nav>
        <div className="rail-foot">
          <div className="settings-wrap">
            <button
              type="button"
              className="rail-role"
              aria-expanded={settingsOpen}
              onClick={function () {
                setSettingsOpen(!settingsOpen);
              }}
            >
              <V.Icon name="user" size={14} />
              <span className="rail-role-t">
                <span className="rail-role-k">{role.toUpperCase()}</span>
                {me.name}
              </span>
              <V.Icon name="chevron-up" size={14} />
            </button>
            {settingsOpen
              ? ReactDOM.createPortal(
                  <div
                    className="settings-pop settings-portal"
                    role="dialog"
                    aria-label="Account and appearance"
                    style={popPos()}
                  >
                    <div className="me-card">
                      <span className="me-av" aria-hidden="true">
                        {(me.name || me.username)
                          .split(/\s+/)
                          .map(function (w) {
                            return w[0];
                          })
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <div className="up-main">
                        <span className="up-name">{me.name}</span>
                        <span className="up-meta">
                          {me.username + " · " + role}
                        </span>
                      </div>
                      <span className="me-help up-help">{ROLE_HELP[role]}</span>
                    </div>
                    <div className="stack-tight">
                      {isAdmin ? (
                        <V.Button
                          size="sm"
                          icon="user"
                          onClick={function () {
                            setSettingsOpen(false);
                            um[1](true);
                          }}
                        >
                          Manage users
                        </V.Button>
                      ) : null}
                      <V.Button
                        size="sm"
                        icon="key"
                        onClick={function () {
                          setSettingsOpen(false);
                          mp[1](true);
                        }}
                      >
                        Change password
                      </V.Button>
                      <V.Button
                        size="sm"
                        variant="ghost"
                        icon="lock"
                        onClick={function () {
                          log("LOGOUT", me.username + " signed out");
                          setTimeout(function () {
                            signOut("Signed out.");
                          }, 150);
                        }}
                      >
                        Sign out
                      </V.Button>
                    </div>
                    <ThemePicker
                      value={theme}
                      onChange={function (x) {
                        setTheme(x);
                      }}
                    />
                    <V.Button
                      size="sm"
                      variant="ghost"
                      onClick={function () {
                        setSettingsOpen(false);
                      }}
                    >
                      Close
                    </V.Button>
                  </div>,
                  document.body,
                )
              : null}
          </div>
        </div>
      </aside>
      <div className="work">
        <header className="status" aria-label="Workspace status">
          <span
            className={"st-local is-" + saveState}
            role="status"
            title={
              "Signed in as " +
              me.username +
              " (" +
              role +
              "). Data is kept on the VAPTLens server."
            }
          >
            <span className="led" />
            {saveState === "offline"
              ? "SERVER UNREACHABLE · RETRYING"
              : saveState === "saving"
                ? "SAVING…"
                : "SAVED"}
          </span>
          <button
            type="button"
            className="st-item st-btn"
            title="Open the scan list"
            onClick={function () {
              setDataOpen("Scans");
            }}
          >
            <span className="st-k">SCANS</span>
            <b>{batches.length}</b>
          </button>
          <button
            type="button"
            className="st-item st-btn"
            title="Show all active findings"
            onClick={function () {
              setFilters(EMPTY_FILTERS);
              showFindings();
            }}
          >
            <span className="st-k">ACTIVE</span>
            <b>{active.length}</b>
          </button>
          <button
            type="button"
            className="st-item st-btn"
            title="Show critical findings"
            onClick={function () {
              setFilters(
                Object.assign({}, EMPTY_FILTERS, {
                  cross: {
                    severity: "Critical",
                  },
                }),
              );
              showFindings();
            }}
          >
            <span className="st-k">CRITICAL</span>
            <b className="st-crit">{critN}</b>
          </button>
          <button
            type="button"
            className="st-item st-btn"
            title="Show findings past their SLA"
            onClick={function () {
              setFilters(
                Object.assign({}, EMPTY_FILTERS, {
                  cross: {
                    slaStatus: "Breached",
                  },
                }),
              );
              showFindings();
            }}
          >
            <span className="st-k">SLA BREACHED</span>
            <b className="st-crit">{breachedN}</b>
          </button>
          <span
            className="st-item st-ti"
            title="Threat index = 1 − Π(1 − 0.35 × risk/100) over the top 10 active risks"
          >
            <span className="st-k">THREAT INDEX</span>
            <b>{threat}</b>
            <span className="ti-bar" aria-hidden="true">
              <span
                style={{
                  width: threat + "%",
                }}
              />
            </span>
          </span>
          <span
            className="st-item st-date"
            title="Ages and SLAs are measured to today"
          >
            <span className="st-k">AS OF</span>
            <b>{AS_OF}</b>
          </span>
          <span
            className="st-item st-intel"
            title="Threat-intel feeds loaded in this browser"
          >
            <span className="st-k">INTEL</span>
            <b>
              {(intel.kevCount ? "KEV" : "KEV·b") +
                " " +
                (intel.epssCount ? "EPSS" : "—")}
            </b>
          </span>
          {(function () {
            var n0 = inbox.badge;
            return (
              <button
                type="button"
                className={"st-k-btn st-inbox" + (n0 ? " has-new" : "")}
                title="Inbox: approvals, mentions, your requests, SLA due soon"
                aria-label={"Inbox" + (n0 ? ", " + n0 + " new" : "")}
                onClick={function () {
                  ib[1](true);
                }}
              >
                <V.Icon name="message" size={13} />
                {n0 ? <b className="inbox-n">{n0}</b> : null}
              </button>
            );
          })()}
          <button
            type="button"
            className="st-k-btn"
            title="Command palette (Ctrl/⌘ K)"
            onClick={function () {
              pal[1](true);
            }}
          >
            <V.Icon name="search" size={13} />
            <kbd>⌘K</kbd>
          </button>
          <button
            type="button"
            className="st-k-btn"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
            onClick={function () {
              kh[1](true);
            }}
          >
            <b className="st-q" aria-hidden="true">
              ?
            </b>
          </button>
          {askOk ? (
            <V.Button
              variant="secondary"
              size="sm"
              icon="sparkles"
              className="st-ai"
              aria-label="Ask Claude"
              title="Ask Claude"
              onClick={function () {
                setAssistant({});
              }}
            >
              <span className="btn-t">Ask</span>
            </V.Button>
          ) : null}
          <V.Button
            variant="secondary"
            size="sm"
            icon="database"
            className="st-data"
            aria-label="Data"
            title={"Data & workspaces"}
            onClick={function () {
              setDataOpen(true);
            }}
          >
            <span className="btn-t">Data</span>
          </V.Button>
          <V.Button
            variant="primary"
            size="sm"
            icon="upload"
            restricted={readOnly}
            restrictedReason={RO_REASON}
            onClick={function () {
              setUploadOpen(true);
            }}
          >
            Upload scan
          </V.Button>
        </header>
        <main className="main" id="main" tabIndex={-1}>
          {refusals.length ? (
            <V.Banner
              tone="danger"
              title="That change wasn't saved"
              action={
                <V.Button
                  size="sm"
                  variant="primary"
                  onClick={function () {
                    location.reload();
                  }}
                >
                  Reload
                </V.Button>
              }
            >
              {refusals
                .map(function (r) {
                  return r.message;
                })
                .join(" ") +
                " Reload to see what's saved; nothing else in " +
                refusals
                  .map(function (r) {
                    return r.store;
                  })
                  .join(", ") +
                " is saved until you do."}
            </V.Banner>
          ) : null}
          {conflicts.length ? (
            <V.Banner
              tone="danger"
              title="Someone else changed this workspace"
              action={
                <V.Button
                  size="sm"
                  variant="primary"
                  onClick={function () {
                    location.reload();
                  }}
                >
                  Reload
                </V.Button>
              }
            >
              {"Their changes to " +
                conflicts.join(", ") +
                " were saved first, so yours there weren't. Reload to see the latest, then redo your change."}
            </V.Banner>
          ) : null}
          {route === "dashboard" && batches.length ? (
            <button type="button" className="skip-link" onClick={showFindings}>
              Skip to findings
            </button>
          ) : null}
          {batches.length ? <View {...ctx} /> : <NoData {...ctx} />}
        </main>
      </div>
      {hostDrawer ? (
        <HostDrawer
          {...Object.assign(
            {
              key: hostDrawer,
              host: hostDrawer,
              onClose: function () {
                openHost(null);
              },
            },
            ctx,
            {
              assetsNow: assetsNow,
            },
          )}
        />
      ) : null}
      {findingOpen ? (
        <FindingDrawer
          ctx={ctx}
          open={findingOpen}
          onClose={function () {
            openFinding(null);
          }}
        />
      ) : null}
      {kh[0] ? (
        <ShortcutsHelp
          onClose={function () {
            kh[1](false);
          }}
        />
      ) : null}
      {ib[0] ? (
        <Inbox
          ctx={ctx}
          items={inbox}
          onClose={function (viewed) {
            ib[1](false);
            var n0 = Object.assign({}, seen[0]),
              t0 = nowIso();
            (viewed || []).forEach(function (t) {
              n0[t] = t0;
            });
            seen[1](n0);
          }}
        />
      ) : null}
      {dataOpen ? (
        <DataDrawer
          {...Object.assign(
            {
              onClose: function () {
                setDataOpen(false);
              },
            },
            ctx,
            {
              tab: dataOpen,
            },
          )}
        />
      ) : null}
      {assistant ? (
        <Assistant
          ctx={ctx}
          init={assistant}
          onClose={function () {
            setAssistant(null);
          }}
        />
      ) : null}
      {pal[0] ? (
        <Palette
          ctx={ctx}
          views={VIEWS}
          onClose={function () {
            pal[1](false);
          }}
          actions={{
            upload: function () {
              if (readOnly) {
                toast({
                  title: "Security Auditors can't import",
                  tone: "info",
                });
                return;
              }
              setUploadOpen(true);
            },
            data: function () {
              setDataOpen(true);
            },
            ask: function () {
              setAssistant({});
            },
            signout: function () {
              signOut("Signed out.");
            },
          }}
        />
      ) : null}
      {usersOpen ? (
        <UsersModal
          ctx={ctx}
          onClose={function () {
            um[1](false);
          }}
        />
      ) : null}
      {mp[0] ? (
        <MyPasswordModal
          ctx={ctx}
          me={me}
          onClose={function () {
            mp[1](false);
          }}
        />
      ) : null}
      {uploadOpen ? (
        <Upload
          initialFiles={Array.isArray(uploadOpen) ? uploadOpen : null}
          latestLabel={batches.length ? batches[batches.length - 1].label : ""}
          hasBatches={batches.length > 0}
          library={library}
          onClose={function () {
            setUploadOpen(false);
          }}
          onImport={function (batch, rows, mode, vex, foundAliases) {
            if (readOnly) {
              toast({
                title: "Security Auditors can't import",
                tone: "danger",
              });
              return;
            }
            var merge = mode === "merge" && batches.length > 0;
            var latestB = batchesRaw.find(function (x) {
              return x.id === latest;
            });
            /* merging keeps the target scan's date; a file from another day becomes its own scan so ages and SLAs stay honest */
            if (merge && latestB && batch.date && batch.date !== latestB.date) {
              merge = false;
              toast({
                title: "Imported as a new scan",
                message:
                  "The file is dated " +
                  batch.date +
                  " but the latest scan is " +
                  latestB.date +
                  ", so it wasn't merged.",
                tone: "info",
              });
            }
            /* host aliases the scanners reported (FQDN/NetBIOS → IP): fold existing data, then this import */
            var amap = aliases;
            if (foundAliases && foundAliases.length)
              amap = addAliases(foundAliases, "scan") || aliases;
            rows = rows.map(function (x) {
              var c = canonHost(x.host, amap);
              return c === String(x.host || "").toLowerCase()
                ? x
                : Object.assign({}, x, {
                    host: c,
                  });
            });
            var sb0 = {};
            Object.keys(batch.scopeBy || {}).forEach(function (src) {
              sb0[src] = uniq(
                batch.scopeBy[src].map(function (hh) {
                  return canonHost(hh, amap);
                }),
              );
            });
            batch = Object.assign({}, batch, {
              scope: uniq(
                (batch.scope || []).map(function (hh) {
                  return canonHost(hh, amap);
                }),
              ),
              scopeBy: batch.scopeBy ? sb0 : undefined,
            });
            if (vex && vex.length && !rows.length) {
              var rv0 = runVex(mergeVex(vexList, vex, nowIso()), []);
              setUploadOpen(false);
              toast({
                title: "VEX applied",
                message:
                  rv0.set +
                  " findings marked not affected" +
                  (rv0.lifted ? ", " + rv0.lifted + " reopened" : "") +
                  " from " +
                  vex.length +
                  " statements. They're kept and applied to future scans too.",
              });
              log(
                "VEX",
                vex.length +
                  " statements stored · " +
                  rv0.set +
                  " not affected · " +
                  rv0.lifted +
                  " lifted",
              );
              return;
            }
            var id = merge ? latest : ++batchIds.current.seq;
            batchIds.current.used[id] = 1;
            var maxId = id;
            id = merge ? latest : id;
            var stamp = Date.now().toString(36);
            var rowsR = rows.map(function (x, i) {
              var lib = libraryMatch(library, x.name);
              var o = Object.assign({}, x, {
                id: "u" + stamp + "-" + i,
                key: fingerprint(x),
                batch: id,
                owasp: x.owasp || owaspOf(x.name + " " + x.desc),
              });
              if (lib) {
                o.lib = lib.id;
                if (lib.desc) o.desc = lib.desc;
                if (lib.sol) o.sol = lib.sol;
                if (lib.sev) o.sev = lib.sev;
              }
              return o;
            });
            if (merge)
              setBatches(function (bb) {
                return bb.map(function (x) {
                  return x.id === latest
                    ? Object.assign({}, x, {
                        importedAt: nowIso(),
                        tools: uniq(
                          x.tools.split(" + ").concat(batch.tool.split(" + ")),
                        ).join(" + "),
                        scope: uniq((x.scope || []).concat(batch.scope || [])),
                        scopeBy: mergeScopeBy(x, batch),
                        full: x.full || batch.full,
                      })
                    : x;
                });
              });
            else
              setBatches(function (bb) {
                return bb.concat([
                  {
                    id: id,
                    label: batch.label,
                    date: batch.date,
                    tools: batch.tool,
                    file: batch.file,
                    scope: batch.scope,
                    scopeBy: batch.scopeBy,
                    full: batch.full,
                    importedAt: nowIso(),
                    importedBy: me.username,
                  },
                ]);
              });
            setRaw(function (dd) {
              return dd.concat(rowsR);
            });
            setDataDirty(true);
            if (engagement && engagement.status === "Approved") {
              setEngagement(
                Object.assign({}, engagement, {
                  status: "In review",
                  approvedAt: "",
                }),
              );
              log(
                "REPORT",
                "New scan data after approval — report back to In review",
              );
            }
            /* stored VEX statements (plus any in this upload) apply to the new findings too */
            var vl =
              vex && vex.length ? mergeVex(vexList, vex, nowIso()) : vexList;
            if (vl.length) {
              var rv = runVex(vl, rowsR);
              if (vex && vex.length)
                log("VEX", vex.length + " statements stored");
              if (rv.set || rv.lifted)
                log(
                  "VEX",
                  rv.set +
                    " findings marked not affected · " +
                    rv.lifted +
                    " lifted",
                );
            }
            if (
              rules.some(function (r) {
                return r.enabled !== false && r.onImport !== false;
              })
            )
              rulesPending.current = true;
            setUploadOpen(false);
            log(
              "IMPORT",
              rows.length +
                " findings from " +
                batch.file +
                (merge ? " merged into latest scan" : " as " + batch.label),
            );
            toast({
              title: rows.length + " findings imported",
              message:
                batch.file +
                " · " +
                batch.tool +
                (merge
                  ? " · merged into the latest scan"
                  : " · scan dated " + batch.date),
            });
          }}
        />
      ) : null}
      {/* each toast is its own status/alert region; the container isn't, so nothing is announced twice */}
      <div
        className="toasts"
        onMouseEnter={function () {
          toastPaused.current = true;
        }}
        onMouseLeave={function () {
          toastPaused.current = false;
        }}
        onFocus={function () {
          toastPaused.current = true;
        }}
        onBlur={function () {
          toastPaused.current = false;
        }}
      >
        {toasts.map(function (t) {
          return (
            <V.Toast
              key={t.id}
              title={t.title}
              message={t.message}
              tone={t.tone}
              action={t.action}
              onClose={function () {
                setToasts(function (x) {
                  return x.filter(function (y) {
                    return y.id !== t.id;
                  });
                });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
