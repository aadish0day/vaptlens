import type { AggregateOutput } from "../../lib/aggregate";
import type { FieldKey, Finding, WidgetConfig } from "../../lib/types";

export interface ChartProps {
  widget: WidgetConfig;
  data: AggregateOutput;
  filtered: Finding[];
  onSelect: (field: FieldKey, value: string) => void;
  activeCrossFilters: { field: FieldKey; value: string }[];
}
