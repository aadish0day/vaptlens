import * as React from "react";
import { CopyButton } from "@/ui/CopyButton";
import { Button } from "@/ui/Button";

type JsonKind =
  | "object"
  | "array"
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "null"
  | "undefined"
  | "date"
  | "function"
  | "symbol";

const cn = (...args: (string | boolean | undefined | null)[]) =>
  args.filter(Boolean).join(" ");

const ChevronRight = ({ className }: { className?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ChevronsUpDown = ({ className }: { className?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </svg>
);

const ChevronsDownUp = ({ className }: { className?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="m7 20 5-5 5 5" />
    <path d="m7 4 5 5 5-5" />
  </svg>
);

const kindOf = (value: unknown): JsonKind => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  const type = typeof value;
  if (type === "object") return "object";
  if (type === "string") return "string";
  if (type === "number") return "number";
  if (type === "bigint") return "bigint";
  if (type === "boolean") return "boolean";
  if (type === "function") return "function";
  if (type === "symbol") return "symbol";

  return "undefined";
};

const isExpandable = (kind: JsonKind) => {
  return kind === "object" || kind === "array";
};

const entriesOf = (value: unknown, kind: JsonKind): [string, unknown][] => {
  if (kind === "array") {
    return (value as unknown[]).map((v, i) => [String(i), v]);
  }
  if (kind === "object" && value !== null) {
    return Object.entries(value as Record<string, unknown>);
  }

  return [];
};

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const childPath = (path: string, key: string, parentKind: JsonKind) => {
  if (parentKind === "array") return `${path}[${key}]`;
  return IDENTIFIER.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`;
};

const CIRCULAR = "[Circular]";

const collectPaths = (
  value: unknown,
  path = "$",
  ancestors = new WeakSet<object>(),
): string[] => {
  const kind = kindOf(value);
  if (!isExpandable(kind)) return [];
  const node = value as object;
  if (ancestors.has(node)) return [];
  ancestors.add(node);
  const out = [path];
  for (const [key, child] of entriesOf(value, kind)) {
    out.push(...collectPaths(child, childPath(path, key, kind), ancestors));
  }
  ancestors.delete(node);

  return out;
};

const stringify = (value: unknown, indent: number) => {
  const ancestors: unknown[] = [];

  return JSON.stringify(
    value,
    function replacer(this: unknown, _key: string, v: unknown) {
      if (typeof v === "bigint") return v.toString();
      if (typeof v !== "object" || v === null) return v;
      while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this)
        ancestors.pop();
      if (ancestors.includes(v)) return CIRCULAR;
      ancestors.push(v);

      return v;
    },
    indent,
  );
};

type FocusUpdate = string | ((current: string) => string);

interface FocusStore {
  get: () => string;
  set: (next: FocusUpdate) => void;
  subscribe: (listener: () => void) => () => void;
}

const createFocusStore = (initial: string): FocusStore => {
  let current = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => current,
    set: (next) => {
      const resolved = typeof next === "function" ? next(current) : next;
      if (resolved === current) return;
      current = resolved;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
  };
};

interface JsonViewerCtx {
  value: unknown;
  maxStringLength: number;
  isExpanded: (path: string, depth: number) => boolean;
  toggle: (path: string, depth: number) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setFocusedPath: (next: FocusUpdate) => void;
  treeRef: React.RefObject<HTMLDivElement | null>;
}

const JsonViewerContext = React.createContext<JsonViewerCtx | null>(null);

const JsonViewerFocusContext = React.createContext<FocusStore | null>(null);

const useIsFocusedPath = (path: string) => {
  const store = React.useContext(JsonViewerFocusContext);
  const subscribe = React.useCallback(
    (listener: () => void) => store?.subscribe(listener) ?? (() => {}),
    [store],
  );

  return React.useSyncExternalStore(
    subscribe,
    () => (store ? store.get() === path : path === "$"),
    () => path === "$",
  );
};

interface Ancestry {
  value: object;
  parent: Ancestry | null;
}

const JsonViewerAncestryContext = React.createContext<Ancestry | null>(null);

const isCircular = (ancestry: Ancestry | null, value: unknown) => {
  for (let link = ancestry; link; link = link.parent) {
    if (link.value === value) return true;
  }

  return false;
};

const useJsonViewer = () => {
  const ctx = React.useContext(JsonViewerContext);
  if (!ctx) {
    throw new Error(
      "JsonViewer compound parts must be used inside <JsonViewer>",
    );
  }

  return ctx;
};

interface JsonViewerNodeCtx {
  expandable: boolean;
  expanded: boolean;
}

const JsonViewerNodeContext = React.createContext<JsonViewerNodeCtx | null>(
  null,
);

const useJsonViewerNode = () => {
  const ctx = React.useContext(JsonViewerNodeContext);
  if (!ctx) {
    throw new Error(
      "JsonViewer node parts must be used inside <JsonViewerNode>",
    );
  }

  return ctx;
};

export interface JsonViewerProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  value?: unknown;
  /** Backward-compatible alias for value */
  data?: unknown;
  title?: string;
  /**
   * `true` expands everything, `false` collapses the root, a number expands
   * nodes shallower than that depth (`1` opens only the root).
   */
  defaultExpanded?: number | boolean;
  /** Backward-compatible alias for defaultExpanded */
  openDepth?: number;
  /** Controlled set of expanded paths, e.g. `["$", "$.user", "$.items[0]"]`. */
  expanded?: string[];
  onExpandedChange?: (paths: string[]) => void;
  /** Strings longer than this are truncated with an inline expand control. */
  maxStringLength?: number;
  children?: React.ReactNode;
}

interface UncontrolledState {
  depth: number;
  overrides: Record<string, boolean>;
}

const JsonViewer = ({
  value: valueProp,
  data: dataProp,
  title,
  defaultExpanded: defaultExpandedProp,
  openDepth,
  expanded: expandedProp,
  onExpandedChange,
  maxStringLength = 80,
  className,
  children,
  ...props
}: JsonViewerProps) => {
  const rawValue = valueProp !== undefined ? valueProp : dataProp;
  const value = React.useMemo(() => {
    if (typeof rawValue === "string") {
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue;
      }
    }
    return rawValue;
  }, [rawValue]);

  const effectiveExpanded =
    defaultExpandedProp !== undefined
      ? defaultExpandedProp
      : openDepth !== undefined
        ? openDepth
        : 2;

  const [internal, setInternal] = React.useState<UncontrolledState>(() => ({
    depth:
      effectiveExpanded === true
        ? Infinity
        : effectiveExpanded === false
          ? 0
          : effectiveExpanded,
    overrides: {},
  }));
  const [focusStore] = React.useState(() => createFocusStore("$"));
  const setFocusedPath = focusStore.set;
  const treeRef = React.useRef<HTMLDivElement | null>(null);

  const controlled = expandedProp !== undefined;
  const expandedSet = React.useMemo(
    () => (expandedProp ? new Set(expandedProp) : null),
    [expandedProp],
  );

  const isExpanded = React.useCallback(
    (path: string, depth: number) => {
      if (expandedSet) return expandedSet.has(path);
      const override = internal.overrides[path];

      return override ?? depth < internal.depth;
    },
    [expandedSet, internal],
  );

  const toggle = React.useCallback(
    (path: string, depth: number) => {
      const next = !isExpanded(path, depth);
      if (!next) {
        setFocusedPath((current) =>
          current !== path &&
          (current.startsWith(`${path}.`) || current.startsWith(`${path}[`))
            ? path
            : current,
        );
      }
      if (controlled) {
        const set = new Set(expandedSet);
        if (next) set.add(path);
        else set.delete(path);
        onExpandedChange?.(Array.from(set));

        return;
      }
      setInternal((s) => ({
        ...s,
        overrides: { ...s.overrides, [path]: next },
      }));
    },
    [controlled, expandedSet, isExpanded, onExpandedChange, setFocusedPath],
  );

  const expandAll = React.useCallback(() => {
    if (controlled) {
      onExpandedChange?.(collectPaths(value));

      return;
    }
    setInternal({ depth: Infinity, overrides: {} });
  }, [controlled, onExpandedChange, value]);

  const collapseAll = React.useCallback(() => {
    setFocusedPath("$");
    if (controlled) {
      onExpandedChange?.([]);

      return;
    }
    setInternal({ depth: 0, overrides: {} });
  }, [controlled, onExpandedChange, setFocusedPath]);

  const ctx = React.useMemo<JsonViewerCtx>(
    () => ({
      value,
      maxStringLength,
      isExpanded,
      toggle,
      expandAll,
      collapseAll,
      setFocusedPath,
      treeRef,
    }),
    [
      value,
      maxStringLength,
      isExpanded,
      toggle,
      expandAll,
      collapseAll,
      setFocusedPath,
    ],
  );

  return (
    <JsonViewerContext.Provider value={ctx}>
      <JsonViewerFocusContext.Provider value={focusStore}>
        <div
          data-slot="json-viewer"
          className={cn("vl-json", className)}
          {...props}
        >
          {title ? (
            <div data-slot="json-viewer-header" className="vl-json-bar">
              <span>{title}</span>
              <div
                data-slot="json-viewer-actions"
                style={{ display: "flex", gap: "6px", alignItems: "center" }}
              >
                <JsonViewerExpandAll />
                <JsonViewerCollapseAll />
                <JsonViewerCopy />
              </div>
            </div>
          ) : null}
          {children ?? <JsonViewerTree />}
        </div>
      </JsonViewerFocusContext.Provider>
    </JsonViewerContext.Provider>
  );
};

const JsonViewerTree = ({
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children">) => {
  const { value, treeRef } = useJsonViewer();

  return (
    <div
      ref={treeRef}
      role="tree"
      data-slot="json-viewer-tree"
      className={cn("vl-json-tree", className)}
      {...props}
    >
      <JsonViewerNode value={value} path="$" depth={0} isLast />
    </div>
  );
};

export interface JsonViewerNodeProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  value: unknown;
  /** Key or array index. Omit for the root. */
  name?: string;
  path?: string;
  depth?: number;
  isLast?: boolean;
}

const JsonViewerNodeImpl = ({
  value,
  name,
  path = "$",
  depth = 0,
  isLast = true,
  className,
  ...props
}: JsonViewerNodeProps) => {
  const { isExpanded, toggle, setFocusedPath, treeRef } = useJsonViewer();
  const focused = useIsFocusedPath(path);
  const ancestry = React.useContext(JsonViewerAncestryContext);
  const kind = kindOf(value);
  const circular =
    (kind === "object" || kind === "array") && isCircular(ancestry, value);
  const expandable = !circular && (kind === "object" || kind === "array");
  const entries = expandable ? entriesOf(value, kind) : [];
  const expanded = expandable && isExpanded(path, depth);
  const open = kind === "array" ? "[" : "{";
  const close = kind === "array" ? "]" : "}";

  const nodeCtx = React.useMemo<JsonViewerNodeCtx>(
    () => ({ expandable, expanded }),
    [expandable, expanded],
  );
  const childAncestry = React.useMemo<Ancestry | null>(
    () =>
      expandable ? { value: value as object, parent: ancestry } : ancestry,
    [expandable, value, ancestry],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const row = e.currentTarget;
    const tree = treeRef.current;
    if (!tree) return;
    const rows = Array.from(
      tree.querySelectorAll<HTMLElement>('[data-slot="json-viewer-row"]'),
    );
    const index = rows.indexOf(row);
    const focusRow = (target: HTMLElement | undefined) => {
      if (!target) return;
      e.preventDefault();
      target.focus();
    };

    switch (e.key) {
      case "ArrowDown":
        focusRow(rows[index + 1]);
        break;
      case "ArrowUp":
        focusRow(rows[index - 1]);
        break;
      case "Home":
        focusRow(rows[0]);
        break;
      case "End":
        focusRow(rows[rows.length - 1]);
        break;
      case "ArrowRight":
        if (!expandable) break;
        e.preventDefault();
        if (expanded) focusRow(rows[index + 1]);
        else toggle(path, depth);
        break;
      case "ArrowLeft": {
        e.preventDefault();
        if (expandable && expanded) {
          toggle(path, depth);
          break;
        }
        const parent = row
          .closest('[data-slot="json-viewer-node"]')
          ?.parentElement?.closest<HTMLElement>(
            '[data-slot="json-viewer-node"]',
          );
        focusRow(
          parent?.querySelector<HTMLElement>('[data-slot="json-viewer-row"]') ??
            undefined,
        );
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        if (expandable) {
          toggle(path, depth);
          break;
        }
        row
          .querySelector<HTMLButtonElement>('[data-slot="json-viewer-more"]')
          ?.click();
        break;
      }
    }
  };

  return (
    <JsonViewerNodeContext.Provider value={nodeCtx}>
      <div
        data-slot="json-viewer-node"
        data-path={path}
        data-kind={kind}
        data-state={expandable ? (expanded ? "open" : "closed") : undefined}
        className={cn("vl-json-node", className)}
        {...props}
      >
        <div
          role="treeitem"
          data-slot="json-viewer-row"
          tabIndex={focused ? 0 : -1}
          aria-level={depth + 1}
          aria-expanded={expandable ? expanded : undefined}
          aria-selected={focused}
          onFocus={() => setFocusedPath(path)}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            if (!expandable) return;
            if ((e.target as HTMLElement).closest("button")) return;
            toggle(path, depth);
          }}
          className={cn("vl-json-row", expandable && "is-clickable")}
        >
          <JsonViewerToggle />
          {name !== undefined && (
            <>
              <JsonViewerKey>{name}</JsonViewerKey>
              <span className="vl-json-k">: </span>
            </>
          )}
          {expandable ? (
            expanded ? (
              <span className="vl-json-sum">{open}</span>
            ) : (
              <span className="vl-json-sum">
                {open}
                <span data-slot="json-viewer-count" className="vl-json-count">
                  {entries.length}
                </span>
                {close}
                {!isLast && ","}
              </span>
            )
          ) : circular ? (
            <>
              <span
                data-slot="json-viewer-value"
                data-kind="circular"
                className="vl-json-v is-circular"
              >
                {CIRCULAR}
              </span>
              {!isLast ? <span className="vl-json-k">,</span> : null}
            </>
          ) : (
            <>
              <JsonViewerValue value={value} />
              {!isLast ? <span className="vl-json-k">,</span> : null}
            </>
          )}
        </div>
        {expandable && expanded ? (
          <>
            <div
              role="group"
              data-slot="json-viewer-children"
              className="vl-json-kids"
            >
              <JsonViewerAncestryContext.Provider value={childAncestry}>
                {entries.map(([key, child], i) => (
                  <JsonViewerNode
                    key={key}
                    name={key}
                    value={child}
                    path={childPath(path, key, kind)}
                    depth={depth + 1}
                    isLast={i === entries.length - 1}
                  />
                ))}
              </JsonViewerAncestryContext.Provider>
            </div>
            <div data-slot="json-viewer-close" className="vl-json-row">
              <span className="vl-json-sum">{close}</span>
              {!isLast && ","}
            </div>
          </>
        ) : null}
      </div>
    </JsonViewerNodeContext.Provider>
  );
};

const JsonViewerNode = React.memo(JsonViewerNodeImpl);

const JsonViewerToggle = ({
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children">) => {
  const { expandable, expanded } = useJsonViewerNode();

  return (
    <span
      data-slot="json-viewer-toggle"
      data-state={expandable ? (expanded ? "open" : "closed") : undefined}
      aria-hidden
      className={cn("vl-json-toggle", !expandable && "is-hidden", className)}
      {...props}
    >
      <ChevronRight />
    </span>
  );
};

const JsonViewerKey = ({
  className,
  ...props
}: React.ComponentProps<"span">) => {
  return (
    <span
      data-slot="json-viewer-key"
      className={cn("vl-json-k", className)}
      {...props}
    />
  );
};

export interface JsonViewerValueProps extends Omit<
  React.ComponentProps<"span">,
  "children"
> {
  value: unknown;
}

const JsonViewerValue = ({
  value,
  className,
  ...props
}: JsonViewerValueProps) => {
  const { maxStringLength } = useJsonViewer();
  const [showAll, setShowAll] = React.useState(false);
  const kind = kindOf(value);

  let text: string;
  switch (kind) {
    case "string":
      text = value as string;
      break;
    case "date":
      text = Number.isNaN((value as Date).getTime())
        ? "Invalid Date"
        : (value as Date).toISOString();
      break;
    case "number":
      text = Object.is(value, -0) ? "-0" : String(value);
      break;
    case "bigint":
      text = `${String(value)}n`;
      break;
    case "boolean":
      text = String(value);
      break;
    case "null":
      text = "null";
      break;
    case "undefined":
      text = "undefined";
      break;
    case "function":
      text = `ƒ ${(value as { name?: string }).name || "anonymous"}()`;
      break;
    case "symbol":
      text = String(value);
      break;
    default:
      text = stringify(value, 0) ?? String(value);
  }

  const isText = kind === "string" || kind === "date";
  const truncated = isText && !showAll && text.length > maxStringLength;
  const shown = truncated ? text.slice(0, maxStringLength) : text;

  const kindClass = isText
    ? "is-str"
    : kind === "number" || kind === "bigint"
      ? "is-num"
      : kind === "boolean"
        ? "is-bool"
        : kind === "null" || kind === "undefined"
          ? "is-null"
          : "";

  return (
    <span
      data-slot="json-viewer-value"
      data-kind={kind}
      className={cn("vl-json-v", kindClass, className)}
      {...props}
    >
      {isText ? `"${shown}` : shown}
      {truncated && (
        <>
          <span className="vl-json-sum">…</span>
          <button
            type="button"
            data-slot="json-viewer-more"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setShowAll(true);
            }}
            className="vl-json-more"
          >
            +{text.length - maxStringLength}
          </button>
        </>
      )}
      {isText ? `"` : null}
    </span>
  );
};

export interface JsonViewerCopyProps {
  /** Defaults to the whole root value. */
  value?: unknown;
  indent?: number;
  className?: string;
}

const JsonViewerCopy = ({
  value,
  indent = 2,
  className,
  ...props
}: JsonViewerCopyProps) => {
  const root = useJsonViewer();
  const source = value === undefined ? root.value : value;
  const getText = React.useCallback(
    () => stringify(source, indent) ?? "",
    [source, indent],
  );

  return (
    <CopyButton
      data-slot="json-viewer-copy"
      size="sm"
      iconOnly
      text={getText}
      label="Copy JSON"
      className={className}
      {...props}
    />
  );
};

const JsonViewerExpandAll = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) => {
  const { expandAll } = useJsonViewer();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-slot="json-viewer-expand-all"
      onClick={expandAll}
      className={className}
      {...props}
    >
      <ChevronsUpDown />
      {children ?? "Expand all"}
    </Button>
  );
};

const JsonViewerCollapseAll = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) => {
  const { collapseAll } = useJsonViewer();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-slot="json-viewer-collapse-all"
      onClick={collapseAll}
      className={className}
      {...props}
    >
      <ChevronsDownUp />
      {children ?? "Collapse all"}
    </Button>
  );
};

export {
  JsonViewer,
  JsonViewerTree,
  JsonViewerNode,
  JsonViewerToggle,
  JsonViewerKey,
  JsonViewerValue,
  JsonViewerCopy,
  JsonViewerExpandAll,
  JsonViewerCollapseAll,
  useJsonViewer,
};
