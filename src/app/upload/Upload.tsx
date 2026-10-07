import { uniq } from "@/app/lib/common";
import { presetMap } from "@/app/upload/utils";
import { detectTool, guessMapping } from "@/lib/data";
import { localDay, sourceOf } from "@/lib/engine";
import {
  FORMATS_HELP,
  SCAN_ACCEPT,
  isoDay,
  parseScanText,
  rowsFromTable,
} from "@/lib/parsers";
import { readFileText } from "@/lib/store";
import React, { useRef, useState } from "react";
import * as V from "@/ui";

export function Upload(p) {
  var fs = useState([]),
    files = fs[0],
    setFiles = fs[1],
    busy = useState(false),
    inp = useRef(null),
    md = useState("New scan batch");
  var dt = useState(null),
    full = useState(false);
  var ps = useState(function () {
      try {
        return JSON.parse(localStorage.getItem("vaptlens.mappings.v1") || "[]");
      } catch (e) {
        return [];
      }
    }),
    presets = ps[0];
  function savePresets(list) {
    ps[1](list);
    try {
      localStorage.setItem("vaptlens.mappings.v1", JSON.stringify(list));
    } catch (e) {}
  }
  function presetFits(pr, headers) {
    return Object.keys(pr.map).every(function (k) {
      return headers.indexOf(pr.map[k]) >= 0;
    });
  }
  function remap(fid, map, tool?) {
    setFiles(function (xs) {
      return xs.map(function (f) {
        if (f.id !== fid) return f;
        var t = tool || f.tool;
        return Object.assign({}, f, {
          map: map,
          tool: t,
          rows: rowsFromTable(f.headers, f.data, map, t),
        });
      });
    });
  }
  function setCol(f, k, col) {
    var m = Object.assign({}, f.map);
    if (col) m[k] = col;
    else delete m[k];
    remap(f.id, m);
  }
  function toggleOpen(fid) {
    setFiles(function (xs) {
      return xs.map(function (f) {
        return f.id === fid
          ? Object.assign({}, f, {
              open: !f.open,
            })
          : f;
      });
    });
  }
  function readFile(f) {
    return readFileText(f);
  }
  function handle(list) {
    var arr = Array.prototype.slice.call(list || []);
    if (!arr.length) return;
    busy[1](true);
    Promise.all(
      arr.map(function (f) {
        var id =
          f.name + "#" + f.size + "#" + Math.random().toString(36).slice(2, 7);
        if (
          !/\.(csv|tsv|txt|nessus|xml|json|jsonl|ndjson|sarif)(\.gz)?$/i.test(
            f.name,
          )
        )
          return Promise.resolve({
            id: id,
            name: f.name,
            size: f.size,
            error:
              "Unsupported file type. Use CSV, XML, .nessus, JSON, JSONL or SARIF.",
          });
        return readFile(f).then(
          function (text) {
            try {
              var r = parseScanText(f.name, text);
              if (r.csvLike) {
                var det = detectTool(r.headers),
                  dcol =
                    r.headers.find(function (hh) {
                      return (
                        /scan|observed|detected|last ?seen|found/i.test(hh) &&
                        /date|time|at$|seen/i.test(hh)
                      );
                    }) ||
                    r.headers.find(function (hh) {
                      return (
                        /date|time/i.test(hh) &&
                        !/publi|patch|modif|releas|disclos|creat|plugin|vuln|exploit|cve|due|expir/i.test(
                          hh,
                        )
                      );
                    }),
                  fdate = dcol
                    ? r.data
                        .map(function (x) {
                          return isoDay(x[dcol]);
                        })
                        .filter(Boolean)
                        .sort()
                        .pop()
                    : null,
                  saved =
                    !det &&
                    presets.find(function (pr) {
                      return presetFits(pr, r.headers);
                    });
                var map = det
                    ? presetMap(det.preset.map, r.headers)
                    : saved
                      ? Object.assign({}, saved.map)
                      : guessMapping(r.headers),
                  tool = det
                    ? det.preset.tool
                    : saved
                      ? saved.tool
                      : r.format === "Generic JSON"
                        ? "Custom JSON"
                        : "Custom CSV";
                var needMap = !map.name || !map.host;
                return {
                  id: id,
                  name: f.name,
                  size: f.size,
                  format:
                    r.format +
                    (det
                      ? " · " + det.preset.tool
                      : saved
                        ? " · preset " + saved.name
                        : "") +
                    (fdate ? " · scanned " + fdate : ""),
                  scanDate: fdate,
                  tool: tool,
                  det: det,
                  preset: saved ? saved.name : null,
                  headers: r.headers,
                  data: r.data,
                  map: map,
                  open: needMap || (!det && !saved),
                  rows: rowsFromTable(r.headers, r.data, map, tool),
                };
              }
              return {
                id: id,
                name: f.name,
                size: f.size,
                format:
                  r.format + (r.scanDate ? " · scanned " + r.scanDate : ""),
                tool: r.tool,
                rows: r.rows,
                vex: r.vex || [],
                aliases: r.aliases || [],
                scope: r.scope,
                scanDate: r.scanDate,
                det: {
                  matched: 1,
                  total: 1,
                },
              };
            } catch (e) {
              return {
                id: id,
                name: f.name,
                size: f.size,
                error: "Couldn't parse " + f.name + ": " + e.message + ".",
              };
            }
          },
          function (e) {
            return {
              id: id,
              name: f.name,
              size: f.size,
              error: "Couldn't read " + f.name + ": " + e.message + ".",
            };
          },
        );
      }),
    ).then(function (res) {
      setFiles(function (x) {
        return x.concat(res);
      });
      busy[1](false);
      if (inp.current) inp.current.value = "";
    });
  }
  var ok = files.filter(function (f) {
    return !f.error && f.rows && (f.rows.length || (f.vex && f.vex.length) || f.tool || f.clean);
  });
  var vexAll = [].concat.apply(
    [],
    ok.map(function (f) {
      return (f.vex || []).map(function (v) {
        return Object.assign(
          {
            source: f.name,
          },
          v,
        );
      });
    }),
  );
  var aliasAll = [].concat.apply(
    [],
    ok.map(function (f) {
      return f.aliases || [];
    }),
  );
  var total = ok.reduce(function (t, f) {
    return t + f.rows.length;
  }, 0);
  var today = localDay();
  var detected =
    ok
      .map(function (f) {
        return f.scanDate;
      })
      .filter(Boolean)
      .sort()
      .pop() || null;
  var scanDate = dt[0] || detected || today;
  var scopeHosts = uniq(
    [].concat.apply(
      [],
      ok.map(function (f) {
        return (f.scope || []).concat(
          f.rows.map(function (x) {
            return x.host;
          }),
        );
      }),
    ),
  );
  function missing(f) {
    if (!f.map) return [];
    var m = [];
    if (!f.map.name) m.push("name");
    if (!f.map.host) m.push("host");
    if (!f.map.severity && !f.map.cvss) m.push("severity or cvss");
    return m;
  }
  function importAll() {
    var rows = [];
    ok.forEach(function (f) {
      rows = rows.concat(f.rows);
    });
    /* which scanner covered which hosts, per file */
    var scopeBy: Record<string, any> = {};
    ok.forEach(function (f) {
      var src: any = sourceOf(f.tool);
      scopeBy[src] = uniq(
        (scopeBy[src] || []).concat(
          f.scope || [],
          f.rows.map(function (x) {
            return x.host;
          }),
        ),
      );
    });
    var tools = uniq(
      ok.map(function (f) {
        return f.tool;
      }),
    );
    p.onImport(
      {
        label: "Scan " + scanDate,
        date: scanDate,
        tool: tools.join(" + "),
        file: ok.length === 1 ? ok[0].name : ok.length + " files",
        scope: scopeHosts,
        scopeBy: scopeBy,
        full: full[0],
      },
      rows,
      md[0] === "New scan batch" ? "new" : "merge",
      vexAll,
      aliasAll,
    );
  }
  function kb(n) {
    return n > 1048576
      ? (n / 1048576).toFixed(1) + " MB"
      : Math.max(1, Math.round(n / 1024)) + " KB";
  }
  return (
    <V.Modal
      title="Upload scans"
      subtitle="Drop one or many exports at once. Everything is parsed in this tab; nothing is uploaded."
      onClose={p.onClose}
      width="760px"
      footer={
        files.length
          ? [
              <V.Button
                key="a"
                icon="upload"
                onClick={function () {
                  if (inp.current) inp.current.click();
                }}
              >
                Add files
              </V.Button>,
              <V.Button
                key="i"
                variant="primary"
                disabled={!total && !vexAll.length && ok.length === 0}
                onClick={importAll}
              >
                {total
                  ? "Import " +
                    total +
                    " findings from " +
                    ok.length +
                    (ok.length === 1 ? " file" : " files") +
                    (vexAll.length ? " + " + vexAll.length + " VEX" : "")
                  : vexAll.length
                    ? "Apply " + vexAll.length + " VEX statements"
                    : ok.length
                      ? "Import 0 findings from " + ok.length + (ok.length === 1 ? " file" : " files")
                      : "Nothing to import"}
              </V.Button>,
            ]
          : null
      }
    >
      <input
        ref={inp}
        id="scan-files"
        type="file"
        multiple={true}
        accept={SCAN_ACCEPT}
        hidden={true}
        onChange={function (e) {
          handle(e.target.files);
        }}
      />
      {files.length ? (
        <div className="stack">
          <div className="up-list">
            {files.map(function (f) {
              var miss = missing(f);
              return (
                <div
                  key={f.id}
                  className={"up-row" + (f.error ? " is-error" : "")}
                >
                  <div className="up-main">
                    <span className="up-name">{f.name}</span>
                    <span className="up-meta">
                      {kb(f.size) + (f.format ? " · " + f.format : "")}
                    </span>
                  </div>
                  {f.error ? (
                    <span className="up-err">{f.error}</span>
                  ) : (
                    <div className="row-wrap">
                      <V.ScannerBadge
                        tool={f.tool}
                        matched={f.det || f.preset ? undefined : 0}
                        total={f.det || f.preset ? undefined : 5}
                      />
                      <span className="up-count">
                        {f.rows.length +
                          " findings" +
                          (f.vex && f.vex.length
                            ? " · " + f.vex.length + " VEX"
                            : "")}
                      </span>
                      {f.map ? (
                        <button
                          type="button"
                          className="up-edit"
                          aria-expanded={!!f.open}
                          onClick={function () {
                            toggleOpen(f.id);
                          }}
                        >
                          {f.open ? "Hide mapping" : "Edit mapping"}
                        </button>
                      ) : null}
                    </div>
                  )}
                  <button
                    type="button"
                    className="vl-icon-btn"
                    aria-label={"Remove " + f.name}
                    onClick={function () {
                      setFiles(
                        files.filter(function (x) {
                          return x.id !== f.id;
                        }),
                      );
                    }}
                  >
                    <V.Icon name="x" size={14} />
                  </button>
                  {f.map && f.open ? (
                    <div className="up-map">
                      {f.det || f.preset ? null : (
                        <V.Banner
                          tone={miss.length ? "danger" : "warn"}
                          title={
                            miss.length
                              ? "Map required columns"
                              : "Columns matched by name"
                          }
                        >
                          {miss.length
                            ? "No column found for: " +
                              miss.join(", ") +
                              ". Pick them below or this file is skipped."
                            : "Scanner not recognised. Check the guessed columns, then save them as a preset for next time."}
                        </V.Banner>
                      )}
                      {presets.length ? (
                        <div className="up-presets">
                          <span className="vl-label">Presets</span>
                          {presets.map(function (pr) {
                            var fits = presetFits(pr, f.headers);
                            return (
                              <span
                                key={pr.name}
                                className={
                                  "up-pill" +
                                  (f.preset === pr.name ? " is-on" : "")
                                }
                              >
                                <button
                                  type="button"
                                  disabled={!fits}
                                  title={
                                    fits
                                      ? "Apply " + pr.name
                                      : "This file lacks some of the preset's columns"
                                  }
                                  onClick={function () {
                                    setFiles(function (xs) {
                                      return xs.map(function (x) {
                                        return x.id === f.id
                                          ? Object.assign({}, x, {
                                              preset: pr.name,
                                            })
                                          : x;
                                      });
                                    });
                                    remap(
                                      f.id,
                                      Object.assign({}, pr.map),
                                      pr.tool,
                                    );
                                  }}
                                >
                                  {pr.name}
                                </button>
                                <button
                                  type="button"
                                  className="up-pill-x"
                                  aria-label={"Delete preset " + pr.name}
                                  onClick={function () {
                                    savePresets(
                                      presets.filter(function (x) {
                                        return x.name !== pr.name;
                                      }),
                                    );
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      ) : null}
                      {[
                        "name",
                        "host",
                        "severity",
                        "cvss",
                        "cve",
                        "port",
                        "description",
                        "solution",
                        "url",
                      ].map(function (k) {
                        return (
                          <V.ColumnMapRow
                            key={k}
                            field={k}
                            required={k === "host" || k === "name"}
                            header={f.map[k]}
                            options={f.headers}
                            onChange={function (col) {
                              setCol(f, k, col);
                            }}
                            sample={
                              f.map[k]
                                ? String(
                                    (f.data[0] || {})[f.map[k]] == null
                                      ? ""
                                      : f.data[0][f.map[k]],
                                  ).slice(0, 60)
                                : ""
                            }
                          />
                        );
                      })}
                      <div className="up-save">
                        <label className="wb-field">
                          <span className="vl-label">Tool name</span>
                          <input
                            className="wb-select"
                            value={f.tool}
                            onChange={function (e) {
                              var v = e.target.value;
                              setFiles(function (xs) {
                                return xs.map(function (x) {
                                  return x.id === f.id
                                    ? Object.assign({}, x, {
                                        tool: v,
                                        rows: rowsFromTable(
                                          x.headers,
                                          x.data,
                                          x.map,
                                          v || "Custom",
                                        ),
                                      })
                                    : x;
                                });
                              });
                            }}
                          />
                        </label>
                        <V.Button
                          size="sm"
                          icon="check"
                          disabled={!!miss.length}
                          onClick={function () {
                            var nm = (f.tool || "Custom").trim() || "Custom";
                            savePresets(
                              presets
                                .filter(function (x) {
                                  return x.name !== nm;
                                })
                                .concat([
                                  {
                                    name: nm,
                                    tool: nm,
                                    map: f.map,
                                  },
                                ]),
                            );
                            setFiles(function (xs) {
                              return xs.map(function (x) {
                                return x.id === f.id
                                  ? Object.assign({}, x, {
                                      preset: nm,
                                    })
                                  : x;
                              });
                            });
                          }}
                        >
                          Save as preset
                        </V.Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {busy[0] ? <V.Skeleton variant="rows" rows={1} /> : null}
          {total ? (
            <div className="up-mode up-when">
              <label className="wb-field">
                <span className="vl-label">Scan date</span>
                <input
                  className="wb-select"
                  type="date"
                  value={scanDate}
                  max={today}
                  onChange={function (e) {
                    dt[1](e.target.value || null);
                  }}
                />
              </label>
              <span className="up-help">
                {(detected
                  ? "Read from the file: " + detected + ". "
                  : "No date in the files, so today is used. ") +
                  "Ages and SLAs count from this date."}
              </span>
              <V.Checkbox
                label={
                  "Full-scope scan (" +
                  scopeHosts.length +
                  (scopeHosts.length === 1 ? " host" : " hosts") +
                  " in these files). Tick only if it covered every host you track; then anything missing counts as fixed."
                }
                checked={full[0]}
                onChange={full[1]}
              />
            </div>
          ) : null}
          <div className="up-mode">
            <span className="vl-label">Import as</span>
            <V.SegmentedControl
              label="Import as"
              options={["New scan batch", "Merge into " + p.latestLabel]}
              value={
                md[0] === "New scan batch"
                  ? md[0]
                  : "Merge into " + p.latestLabel
              }
              onChange={md[1]}
            />
            <span className="up-help">
              {md[0] === "New scan batch"
                ? "Becomes the latest scan; findings it doesn't contain count as fixed in Re-Test."
                : "Adds these findings to the current scan without replacing it."}
            </span>
          </div>
          <p className="up-help">
            {"Supported: " +
              FORMATS_HELP +
              ", plus any CSV or JSON you map yourself."}
          </p>
        </div>
      ) : (
        <div className="stack">
          <V.FileDropzone
            state={busy[0] ? "parsing" : "idle"}
            fileName="files"
            progress={50}
            onBrowse={function () {
              if (inp.current) inp.current.click();
            }}
            onFiles={handle}
          />
          <p className="up-help">
            {"Supported: " +
              FORMATS_HELP +
              ", plus any CSV or JSON you map yourself."}
          </p>
        </div>
      )}
    </V.Modal>
  );
}

/* ===================== v12: exposure management features ===================== */
