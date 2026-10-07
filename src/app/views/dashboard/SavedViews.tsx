import { EMPTY_FILTERS } from "@/app/lib/filters";
import React, { useState } from "react";
import * as V from "@/ui";

export function SavedViews(p) {
  var views = p.views || [],
    nm = useState(null),
    lv = useState(null);
  function persist(v) {
    p.setViews(v);
  }
  if (nm[0] != null)
    return (
      <form
        className="sv-form"
        onSubmit={function (e) {
          e.preventDefault();
          var n = nm[0].trim();
          if (!n) return;
          persist(
            views
              .filter(function (x) {
                return x.name !== n;
              })
              .concat([
                {
                  name: n,
                  filters: p.filters,
                },
              ]),
          );
          nm[1](null);
          lv[1](n);
          p.toast({
            title: "View saved",
            message: n,
          });
        }}
      >
        <input
          className="wb-select"
          autoFocus={true}
          placeholder="Name this view"
          value={nm[0]}
          onChange={function (e) {
            nm[1](e.target.value);
          }}
          onKeyDown={function (e) {
            if (e.key === "Escape") nm[1](null);
          }}
        />
        <V.Button size="sm" variant="primary" type="submit">
          Save
        </V.Button>
      </form>
    );
  /* which saved view (if any) matches the filters on screen */
  function canon(f0) {
    var o = Object.assign({}, EMPTY_FILTERS, f0);
    return JSON.stringify(
      Object.keys(o)
        .sort()
        .map(function (k) {
          var v = o[k];
          if (Array.isArray(v)) v = v.slice().sort();
          else if (v && typeof v === "object")
            v = Object.keys(v)
              .sort()
              .filter(function (k2) {
                return v[k2] != null && v[k2] !== "";
              })
              .map(function (k2) {
                return [k2, v[k2]];
              });
          return [k, v];
        }),
    );
  }
  var cur = views.find(function (v) {
    return canon(v.filters) === canon(p.filters);
  });
  var edited =
    !cur &&
    lv[0] &&
    views.find(function (v) {
      return v.name === lv[0];
    });
  var items = views.map(function (v) {
    return {
      label: (cur && cur.name === v.name ? "✓ " : "") + v.name,
      onSelect: function () {
        lv[1](v.name);
        p.setFilters(Object.assign({}, EMPTY_FILTERS, v.filters));
        p.toast({
          title: "View: " + v.name,
        });
      },
    };
  });
  if (edited)
    items.unshift(
      {
        label: "Update “" + edited.name + "” with these filters",
        icon: "refresh",
        onSelect: function () {
          persist(
            views.map(function (x) {
              return x.name === edited.name
                ? {
                    name: x.name,
                    filters: p.filters,
                  }
                : x;
            }),
          );
          p.toast({
            title: "View updated",
            message: edited.name,
          });
        },
      },
      "-",
    );
  if (views.length) items.push("-");
  items.push({
    label: cur ? "Update “" + cur.name + "”" : "Save current view…",
    icon: "plus",
    onSelect: function () {
      if (cur) {
        persist(
          views.map(function (x) {
            return x.name === cur.name
              ? {
                  name: x.name,
                  filters: p.filters,
                }
              : x;
          }),
        );
        p.toast({
          title: "View updated",
          message: cur.name,
        });
      } else nm[1]("");
    },
  });
  if (cur)
    items.push({
      label: "Delete “" + cur.name + "”",
      danger: true,
      onSelect: function () {
        var gone = cur;
        persist(
          views.filter(function (x) {
            return x.name !== gone.name;
          }),
        );
        p.toast({
          title: "View " + gone.name + " deleted",
          action: {
            label: "Undo",
            onClick: function () {
              p.setViews(function (vv) {
                return vv.some(function (x) {
                  return x.name === gone.name;
                })
                  ? vv
                  : vv.concat([gone]);
              });
            },
          },
        });
      },
    });
  if (views.length > 1)
    items.push({
      label: "Delete all saved views",
      danger: true,
      onSelect: function () {
        var prev = views;
        persist([]);
        p.toast({
          title: "All saved views deleted",
          action: {
            label: "Undo",
            onClick: function () {
              persist(prev);
            },
          },
        });
      },
    });
  return (
    <V.DropdownMenu
      label={
        cur
          ? "View: " + cur.name
          : "Views" + (views.length ? " · " + views.length : "")
      }
      icon="filter"
      items={items}
    />
  );
}
