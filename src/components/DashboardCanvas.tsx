import { useLayoutEffect, useMemo, useRef, useState } from "react";
import GridLayout, { type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useDashboardStore } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import { Widget } from "./Widget";

export function DashboardCanvas() {
  const widgets = useDashboardStore((s) => s.widgets);
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const setLayout = useDashboardStore((s) => s.setLayout);

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const filtered = useMemo(() => applyFilters(findings, filters), [findings, filters]);

  const isMobile = width > 0 && width < 768;
  const cols = isMobile ? 1 : 12;

  const items = useMemo(() => {
    const ordered = [...widgets].sort(
      (a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x
    );
    return ordered.map((w, i) => ({
      w,
      layout: isMobile
        ? { i: w.id, x: 0, y: i * w.layout.h, w: 1, h: w.layout.h }
        : { i: w.id, ...w.layout },
    }));
  }, [widgets, isMobile]);

  const handleLayoutChange = (layout: Layout[]) => {
    setLayout(layout.map((l) => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })));
  };

  if (widgets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border p-10 text-center">
        <p className="font-mono text-sm text-muted">
          No widgets yet. Use <span className="text-accent">+ Add Widget</span> or a
          template from the gallery to build your canvas.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <GridLayout
        className="layout"
        layout={items.map((it) => it.layout)}
        cols={cols}
        width={width || 1200}
        rowHeight={36}
        margin={[12, 12]}
        draggableHandle=".widget-drag"
        onLayoutChange={handleLayoutChange}
        compactType="vertical"
        resizeHandles={["se"]}
      >
        {items.map(({ w }) => (
          <div key={w.id} className="h-full w-full">
            <Widget widget={w} filtered={filtered} />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
