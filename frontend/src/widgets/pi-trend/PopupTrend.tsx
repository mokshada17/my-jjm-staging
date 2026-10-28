import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Redo2, Table2, Trash2, Undo2, X } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui";
import { useAppStore } from "@/app/store";
import type { EsrRecord } from "@/entities/hierarchy";
import { presetSpan, stepEnd, type TimePreset } from "@/shared/lib/timeRange";
import { cn } from "@/shared/utils";
import { PiTrend, type TrendZoom } from "./PiTrend";
import { TrendTimeBar } from "./TrendTimeBar";
import { useNow } from "./useNow";
import { useTrendData } from "./useTrendData";
import type { EsrTrendSet } from "./esrTraces";
import {
  formatTrendValue,
  lastValue,
  resolveDomains,
  traceStats,
  valueAt,
  type Domain,
  type ScaleLayout,
  type ScaleMode,
  type TraceStyle,
  type ZoomMode,
} from "./model";
import {
  AutorangeIcon,
  CustomScaleIcon,
  DatabaseScaleIcon,
  LineIcon,
  LineMarkersIcon,
  MarkersIcon,
  MultipleScalesIcon,
  SingleScaleIcon,
  ZoomIcon,
} from "./toolbarIcons";

/** What undo / redo step through: the time range and any value zoom. */
interface View {
  span: number;
  /** null while live. */
  end: number | null;
  zoom: Record<string, Domain>;
}

interface PopupTrendProps {
  esr: EsrRecord | undefined;
  set: EsrTrendSet;
  onClose: () => void;
}

const ZOOM_MODES: { mode: ZoomMode; label: string }[] = [
  { mode: "both", label: "Zoom time and value" },
  { mode: "time", label: "Zoom time only" },
  { mode: "value", label: "Zoom value only" },
];

/**
 * PI Vision's popup trend. Opens over the display on the clicked symbol's
 * traces, starting from the display's time range, and then keeps a time range
 * of its own:
 *  - toolbar: multiple/single scale, Autorange/Database/Custom range, line /
 *    line-with-markers / markers, zoom direction, undo/redo, details table, close;
 *  - plot: click for cursors, drag to zoom (see PiTrend);
 *  - details table: Value at the newest cursor, the window's Average, Minimum
 *    and Maximum, editable Bottom/Top, and removing a trace;
 *  - its own time bar: presets, stepping, Now and revert.
 */
export function PopupTrend({ esr, set, onClose }: PopupTrendProps) {
  const pageSpan = useAppStore((s) => s.windowMs);
  const pageEnd = useAppStore((s) => s.windowEndsAt);
  const initial = useMemo<View>(() => ({ span: pageSpan, end: pageEnd, zoom: {} }), [pageSpan, pageEnd]);

  const [view, setView] = useState<View>(initial);
  const [past, setPast] = useState<View[]>([]);
  const [future, setFuture] = useState<View[]>([]);
  const [defs, setDefs] = useState(set.traces);
  const [layout, setLayout] = useState<ScaleLayout>("single");
  const [custom, setCustom] = useState<Record<string, Domain>>(() =>
    Object.fromEntries(set.traces.filter((t) => t.custom).map((t) => [t.id, t.custom!]))
  );
  const [mode, setMode] = useState<ScaleMode>(() => (set.traces.some((t) => t.custom) ? "custom" : "auto"));
  const [style, setStyle] = useState<TraceStyle>(set.style);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("both");
  const [cursors, setCursors] = useState<number[]>([]);
  const [showTable, setShowTable] = useState(false);

  const live = view.end === null;
  const now = useNow(30_000, live);
  const end = view.end ?? now;
  const start = end - view.span;

  const traces = useTrendData(esr, defs, { start, end });
  const domains = resolveDomains({ traces, start, end, layout, mode, custom, zoom: view.zoom });
  const hasCustom = Object.keys(custom).length > 0;

  const apply = (next: View) => {
    setPast((p) => [...p, view]);
    setFuture([]);
    setView(next);
  };
  const undo = () => {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast(past.slice(0, -1));
    setFuture((f) => [view, ...f]);
    setView(prev);
  };
  const redo = () => {
    const [next, ...rest] = future;
    if (!next) return;
    setFuture(rest);
    setPast((p) => [...p, view]);
    setView(next);
  };

  const onZoom = (z: TrendZoom) =>
    apply({
      span: z.end - z.start,
      end: z.end >= Date.now() ? null : z.end,
      zoom: z.domains ?? view.zoom,
    });
  const onPreset = (preset: TimePreset) => apply({ ...view, span: presetSpan(preset, end) });
  const onStep = (direction: -1 | 1) => apply({ ...view, end: stepEnd(view.span, view.end, direction) });

  /** Editing Bottom/Top pins every trace's current range, so only this one moves. */
  const setRange = (id: string, which: 0 | 1, value: number) => {
    if (!Number.isFinite(value)) return;
    const pinned = Object.fromEntries(defs.map((d) => [d.id, custom[d.id] ?? domains[d.id]]));
    const next: Domain = [...pinned[id]] as Domain;
    next[which] = value;
    if (next[0] >= next[1]) return;
    setCustom({ ...pinned, [id]: next });
    setMode("custom");
    if (view.zoom[id]) {
      const zoom = { ...view.zoom };
      delete zoom[id];
      apply({ ...view, zoom });
    }
  };

  const cursorAt = cursors.length ? cursors[cursors.length - 1] : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        // the toolbar carries its own close button
        hideClose
        className={cn(
          "left-0 top-0 translate-x-0 translate-y-0 max-w-none w-screen h-[100dvh] p-0 gap-0 rounded-none sm:rounded-none border-0",
          "flex flex-col bg-white dark:bg-jjm-canvas text-slate-900 dark:text-white"
        )}
      >
        <DialogDescription className="sr-only">
          Trend of {set.title} for {set.subject ?? esr?.esrName ?? "the reservoir"}. Click the plot to add a cursor, drag to zoom.
        </DialogDescription>

        {/* toolbar */}
        <div className="h-11 shrink-0 px-2 flex items-center gap-3 bg-jjm-light-bg dark:bg-jjm-surface">
          <div className="flex items-center gap-3" role="toolbar" aria-label="Trend options">
            {defs.length > 1 && (
              <ToolGroup>
                <Tool label="Multiple scales" active={layout === "multiple"} onClick={() => setLayout("multiple")}>
                  <MultipleScalesIcon />
                </Tool>
                <Tool label="Single scale" active={layout === "single"} onClick={() => setLayout("single")}>
                  <SingleScaleIcon />
                </Tool>
              </ToolGroup>
            )}
            <ToolGroup>
              <Tool label="Autorange" active={mode === "auto"} onClick={() => setMode("auto")}>
                <AutorangeIcon />
              </Tool>
              <Tool label="Database scale" active={mode === "database"} onClick={() => setMode("database")}>
                <DatabaseScaleIcon />
              </Tool>
              <Tool label="Custom scale" active={mode === "custom"} disabled={!hasCustom} onClick={() => setMode("custom")}>
                <CustomScaleIcon />
              </Tool>
            </ToolGroup>
            <ToolGroup>
              <Tool label="Line" active={style === "line"} onClick={() => setStyle("line")}>
                <LineIcon />
              </Tool>
              <Tool label="Line with markers" active={style === "line-markers"} onClick={() => setStyle("line-markers")}>
                <LineMarkersIcon />
              </Tool>
              <Tool label="Markers only" active={style === "markers"} onClick={() => setStyle("markers")}>
                <MarkersIcon />
              </Tool>
            </ToolGroup>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Zoom direction"
                  title={ZOOM_MODES.find((z) => z.mode === zoomMode)!.label}
                  className="h-8 px-1.5 gap-0.5 rounded-[0.1875rem] border border-jjm-light-stroke dark:border-jjm-border text-current hover:bg-white/10"
                >
                  <ZoomIcon />
                  <span aria-hidden="true" className="text-[0.5625rem]">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {ZOOM_MODES.map((z) => (
                  <DropdownMenuItem key={z.mode} onSelect={() => setZoomMode(z.mode)} className="gap-2 text-xs">
                    <Check className={cn("w-3.5 h-3.5", zoomMode === z.mode ? "opacity-100" : "opacity-0")} />
                    {z.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DialogTitle className="flex-1 text-center text-sm font-medium text-jjm-blue-light dark:text-white">
            Popup Trend
          </DialogTitle>

          <div className="flex items-center gap-1">
            <Tool label="Undo zoom" onClick={undo} disabled={past.length === 0}>
              <Undo2 className="w-4 h-4" />
            </Tool>
            <Tool label="Redo zoom" onClick={redo} disabled={future.length === 0}>
              <Redo2 className="w-4 h-4" />
            </Tool>
            <Tool label={showTable ? "Hide details" : "Show details"} active={showTable} onClick={() => setShowTable((s) => !s)}>
              <Table2 className="w-4 h-4" />
            </Tool>
            <Tool label="Close" onClick={onClose}>
              <X className="w-4 h-4" />
            </Tool>
          </div>
        </div>

        {/* plot */}
        <div className="flex-1 min-h-0 px-1 pt-1">
          <PiTrend
            traces={traces}
            start={start}
            end={end}
            now={now}
            domains={domains}
            layout={layout}
            style={style}
            zoomMode={zoomMode}
            cursors={cursors}
            onCursorsChange={setCursors}
            onZoom={onZoom}
            showLegend={!showTable}
            ariaLabel={`${set.title} trend`}
          />
        </div>

        {/* details */}
        {showTable && (
          <div className="shrink-0 max-h-[38%] overflow-auto border-t border-jjm-light-stroke dark:border-jjm-border">
            <Table className="text-xs">
              <TableHeader className="sticky top-0 bg-jjm-light-surface dark:bg-jjm-surface">
                <TableRow className="hover:bg-transparent border-jjm-light-stroke dark:border-jjm-border">
                  {["Name", "Description", "Value", "Units", "Average", "Minimum", "Maximum", "Bottom", "Top", ""].map((h) => (
                    <TableHead key={h} className="h-7 px-2 text-xs font-medium text-jjm-light-ink dark:text-slate-300">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {traces.map((t) => {
                  const stats = traceStats(t.samples, start, end, t.def.step);
                  const value = cursorAt === null ? lastValue(t.samples) : valueAt(t.samples, cursorAt, t.def.step);
                  const domain = domains[t.def.id];
                  return (
                    <TableRow key={t.def.id} className="border-jjm-light-stroke dark:border-jjm-border hover:bg-transparent">
                      <TableCell className="px-2 py-1 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <svg width="22" height="8" aria-hidden="true">
                            <line x1="0" x2="22" y1="4" y2="4" stroke={t.def.color} strokeWidth="1.5" />
                            <circle cx="11" cy="4" r="2.5" fill={t.def.color} />
                          </svg>
                          {t.def.name}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-1">{t.def.description}</TableCell>
                      <TableCell className="px-2 py-1">
                        <Pill style={{ color: t.def.color }}>{value === null ? (t.systemState ?? "-") : formatTrendValue(value)}</Pill>
                      </TableCell>
                      <TableCell className="px-2 py-1">{t.def.units}</TableCell>
                      <TableCell className="px-2 py-1"><Pill>{formatTrendValue(stats.average)}</Pill></TableCell>
                      <TableCell className="px-2 py-1"><Pill>{formatTrendValue(stats.minimum)}</Pill></TableCell>
                      <TableCell className="px-2 py-1"><Pill>{formatTrendValue(stats.maximum)}</Pill></TableCell>
                      <TableCell className="px-2 py-1">
                        <RangeInput label={`${t.def.label} bottom`} value={domain[0]} onCommit={(v) => setRange(t.def.id, 0, v)} />
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <RangeInput label={`${t.def.label} top`} value={domain[1]} onCommit={(v) => setRange(t.def.id, 1, v)} />
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove ${t.def.name}`}
                          disabled={defs.length === 1}
                          onClick={() => setDefs((d) => d.filter((x) => x.id !== t.def.id))}
                          className="h-6 w-6 p-0 text-current"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <TrendTimeBar
          start={start}
          end={end}
          live={live}
          onPreset={onPreset}
          onStep={onStep}
          onNow={() => apply({ ...view, end: null })}
          onRevert={() => apply(initial)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ToolGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center rounded-[0.1875rem] border border-jjm-light-stroke dark:border-jjm-border">{children}</div>;
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 w-9 p-0 rounded-[0.125rem] text-jjm-light-ink dark:text-slate-200 hover:bg-white/60 dark:hover:bg-jjm-border disabled:opacity-35",
        active && "bg-white text-jjm-blue-light dark:bg-jjm-canvas dark:text-jjm-cyan"
      )}
    >
      {children}
    </Button>
  );
}

function Pill({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={style}
      className="inline-block min-w-[4rem] px-2 py-0.5 rounded-full border border-jjm-light-stroke dark:border-jjm-border text-center"
    >
      {children}
    </span>
  );
}

/** Bottom / Top cell: edits commit on Enter or blur, like PI Vision's grid. */
function RangeInput({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const shown = formatTrendValue(value).replace(/,/g, "");
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null) onCommit(Number(draft));
    setDraft(null);
  };
  return (
    <input
      aria-label={label}
      inputMode="decimal"
      value={draft ?? shown}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setDraft(null);
      }}
      className="w-16 h-6 px-1.5 rounded-[0.1875rem] border border-jjm-light-stroke dark:border-jjm-border bg-white dark:bg-jjm-canvas text-xs"
    />
  );
}
