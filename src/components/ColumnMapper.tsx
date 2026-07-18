import { useMemo, useState } from "react";
import { ArrowRight, Save } from "lucide-react";
import { useDashboardStore } from "../store/useDashboardStore";
import { guessMapping } from "../lib/presets";
import { parseCsv } from "../lib/parseCsv";
import type { ColumnMapping } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";

const TARGET_FIELDS: { key: keyof ColumnMapping; label: string; required?: boolean }[] = [
  { key: "host", label: "Host / IP", required: true },
  { key: "severity", label: "Severity" },
  { key: "cvss", label: "CVSS" },
  { key: "name", label: "Finding name" },
  { key: "url", label: "URL" },
  { key: "cve", label: "CVE / CWE" },
  { key: "port", label: "Port" },
  { key: "protocol", label: "Protocol" },
  { key: "description", label: "Description" },
  { key: "solution", label: "Solution" },
  { key: "pluginId", label: "Plugin / QID / OSVDB" },
  { key: "scanDate", label: "Scan date" },
];

export function ColumnMapper() {
  const pending = useDashboardStore((s) => s.pendingUpload);
  const clearPendingUpload = useDashboardStore((s) => s.clearPendingUpload);
  const addBatch = useDashboardStore((s) => s.addBatch);
  const mappings = useDashboardStore((s) => s.mappings);
  const saveMapping = useDashboardStore((s) => s.saveMapping);

  const initial = useMemo(
    () => (pending ? guessMapping(pending.headers) : {}),
    [pending]
  );

  const [mapping, setMapping] = useState<ColumnMapping>(initial);
  const [toolName, setToolName] = useState(pending?.suggestedTool ?? "Custom");
  const [presetName, setPresetName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!pending) return null;

  const setField = (key: keyof ColumnMapping, value: string) =>
    setMapping((m) => ({ ...m, [key]: value || undefined }));

  const applyPreset = (name: string) => {
    const preset = mappings.find((m) => m.name === name);
    if (preset) {
      const { name: _n, ...rest } = preset;
      void _n;
      setMapping(rest);
      setToolName(preset.tool ?? toolName);
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    saveMapping({ ...mapping, name: presetName.trim(), tool: toolName });
    setPresetName("");
  };

  const handleSubmit = () => {
    if (!mapping.host) {
      setError("A Host / IP column is required to continue.");
      return;
    }
    const result = parseCsv(pending.csvText, mapping, {
      id: pending.batch.id,
      label: pending.batch.label,
      date: pending.batch.date,
      tool: toolName || "Custom",
      findingCount: 0,
    });
    if (result.findings.length === 0) {
      setError("No rows mapped. Check that the severity (or CVSS) column is set.");
      return;
    }
    addBatch(result.findings, result.batch);
    clearPendingUpload();
  };

  return (
    <Card className="border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Map columns</CardTitle>
          <Badge variant="muted">unrecognized</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{pending.batch.label}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {mappings.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Presets
            </span>
            {mappings.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => applyPreset(m.name)}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {TARGET_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center gap-2">
              <Label className="w-36 shrink-0">
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </Label>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Select
                value={mapping[f.key] ?? "__none"}
                onValueChange={(v) => setField(f.key, v === "__none" ? "" : v)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="— none —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— none —</SelectItem>
                  {pending.headers.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Label htmlFor="tool" className="text-muted-foreground">
            Tool
          </Label>
          <Input
            id="tool"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            className="w-32"
          />
          <Input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="preset name"
            className="w-32"
          />
          <Button variant="outline" size="sm" onClick={handleSavePreset}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>

        {error && (
          <p className="text-[11px] font-medium text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={clearPendingUpload}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            Import scan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
