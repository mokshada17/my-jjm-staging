import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { curveLinear, curveStepAfter, line, scaleLinear, scaleTime, timeFormat } from "d3";
import { formatDuration } from "@/shared/lib/timeRange";
import { useUiScale } from "@/shared/hooks/useUiScale";
import { useTrendTheme } from "./useTrendTheme";
import {
  formatTrendTime,
  formatTrendValue,
  lastValue,
  valueAt,
  type Domain,
  type ScaleLayout,
  type TraceData,
  type TraceStyle,
  type ZoomMode,
} from "./model";
import type { TrendSample } from "@/entities/telemetry";

export interface TrendZoom {
  start: number;
  end: number;
  /** Per-trace value ranges, or null when the zoom only changed the time range. */
  domains: Record<string, Domain> | null;
}

interface PiTrendProps {
  traces: TraceData[];
  start: number;
  end: number;
  /** Data stops at now; a stepped trace's last value is held up to here. */
  now: number;
  domains: Record<string, Domain>;
  layout: ScaleLayout;
  style: TraceStyle;
  zoomMode?: ZoomMode;
  /** Cursor timestamps. Pass the same array to several trends to synchronise them. */
  cursors: number[];
  onCursorsChange?: (cursors: number[]) => void;
  onZoom?: (zoom: TrendZoom) => void;
  /** Trace name and live value, top right, as PI Vision prints them. */
  showLegend?: boolean;
  /** Start, duration and end under the time axis (the Sensor Fusion panels). */
  showFooter?: boolean;
  /** Rotated units beside the value axis, e.g. "mg/l". */
  yLabel?: string;
  ariaLabel: string;
}

const AXIS_WIDTH = 46;
const DRAG_THRESHOLD = 4;
/** A cursor dragged this far past either edge is removed, as in PI Vision. */
const REMOVE_MARGIN = 12;

/** Tracks an element's size. jsdom has no ResizeObserver, so tests get a fixed frame. */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size.width || 800, size.height || 320] as const;
}

type Drag =
  | { kind: "zoom"; x0: number; y0: number; x1: number; y1: number }
  | { kind: "cursor"; index: number; x: number };

/** Splits samples at gaps (null values) so a bad-data stretch is drawn blank. */
function segments(samples: TrendSample[]): TrendSample[][] {
  const out: TrendSample[][] = [];
  let current: TrendSample[] = [];
  for (const s of samples) {
    if (s.value === null) {
      if (current.length) out.push(current);
      current = [];
    } else current.push(s);
  }
  if (current.length) out.push(current);
  return out;
}

/**
 * A PI Vision trend: traces over a time axis, with
 *  - click to drop a cursor (a timestamp box plus each trace's value), drag a
 *    cursor to move it and drag it off the plot to remove it;
 *  - drag a rectangle to zoom time and/or value (see `zoomMode`);
 *  - one shared axis, or one per trace ("multiple scales");
 *  - line, line-with-markers or markers-only traces, stepped for discrete readings.
 */
export function PiTrend({
  traces,
  start,
  end,
  now,
  domains,
  layout,
  style,
  zoomMode = "both",
  cursors,
  onCursorsChange,
  onZoom,
  showLegend = true,
  showFooter = false,
  yLabel,
  ariaLabel,
}: PiTrendProps) {
  const theme = useTrendTheme();
  const clipId = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [wrapRef, screenWidth, screenHeight] = useSize<HTMLDivElement>();
  // The plot is laid out in design px and the viewBox scales it to the screen, so
  // fonts, margins and markers grow with the large-screen root size (1 up to
  // 1920px). Pointer positions are divided by the same factor.
  const k = useUiScale();
  const width = screenWidth / k;
  const height = screenHeight / k;
  const [drag, setDrag] = useState<Drag | null>(null);

  const axes = layout === "multiple" ? Math.max(1, traces.length) : 1;
  const left = axes * AXIS_WIDTH + (yLabel ? 14 : 0);
  const top = 30;
  const bottom = 20 + (showFooter ? 16 : 0);
  const x0 = left;
  const x1 = Math.max(x0 + 40, width - 14);
  const y0 = top;
  const y1 = Math.max(y0 + 40, height - bottom);

  const x = useMemo(() => scaleTime().domain([start, end]).range([x0, x1]), [start, end, x0, x1]);
  const ys = useMemo(
    () =>
      Object.fromEntries(
        traces.map((t) => [t.def.id, scaleLinear().domain(domains[t.def.id] ?? [0, 1]).range([y1, y0])])
      ),
    [traces, domains, y0, y1]
  );

  const span = end - start;
  const timeTicks = x.ticks(Math.max(2, Math.floor((x1 - x0) / 80)));
  // Hours within two days; beyond that the date at midnight and the hour between,
  // so 12-hourly ticks over a week do not print each date twice.
  const hourFormat = timeFormat("%H:%M");
  const dateFormat = timeFormat("%-m/%-d/%Y");
  const tickFormat = (t: Date) =>
    span > 2 * 24 * 3600 * 1000 && t.getHours() === 0 && t.getMinutes() === 0 ? dateFormat(t) : hourFormat(t);
  const first = traces[0];
  const gridTicks = first ? ys[first.def.id].ticks(Math.max(2, Math.floor((y1 - y0) / 40))) : [];

  // -- pointer handling ------------------------------------------------------

  const local = (e: ReactPointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { px: (e.clientX - r.left) / k, py: (e.clientY - r.top) / k };
  };
  const clampX = (px: number) => Math.min(x1, Math.max(x0, px));
  const clampY = (py: number) => Math.min(y1, Math.max(y0, py));

  const onPlotDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    const { px, py } = local(e);
    svgRef.current?.setPointerCapture?.(e.pointerId);
    setDrag({ kind: "zoom", x0: px, y0: py, x1: px, y1: py });
  };

  const onCursorDown = (index: number) => (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    svgRef.current?.setPointerCapture?.(e.pointerId);
    setDrag({ kind: "cursor", index, x: local(e).px });
  };

  const onMove = (e: ReactPointerEvent) => {
    if (!drag) return;
    const { px, py } = local(e);
    setDrag(drag.kind === "zoom" ? { ...drag, x1: clampX(px), y1: clampY(py) } : { ...drag, x: px });
  };

  const onUp = (e: ReactPointerEvent) => {
    if (!drag) return;
    svgRef.current?.releasePointerCapture?.(e.pointerId);
    setDrag(null);

    if (drag.kind === "cursor") {
      const next = [...cursors];
      if (drag.x < x0 - REMOVE_MARGIN || drag.x > x1 + REMOVE_MARGIN) next.splice(drag.index, 1);
      else next[drag.index] = x.invert(clampX(drag.x)).getTime();
      onCursorsChange?.(next);
      return;
    }

    const dx = Math.abs(drag.x1 - drag.x0);
    const dy = Math.abs(drag.y1 - drag.y0);
    const zoomTime = zoomMode !== "value" && dx > DRAG_THRESHOLD;
    const zoomValue = zoomMode !== "time" && dy > DRAG_THRESHOLD;
    if (onZoom && (zoomTime || zoomValue)) {
      const [ax, bx] = [Math.min(drag.x0, drag.x1), Math.max(drag.x0, drag.x1)];
      const [ay, by] = [Math.min(drag.y0, drag.y1), Math.max(drag.y0, drag.y1)];
      onZoom({
        start: zoomTime ? x.invert(ax).getTime() : start,
        end: zoomTime ? x.invert(bx).getTime() : end,
        domains: zoomValue
          ? Object.fromEntries(traces.map((t) => [t.def.id, [ys[t.def.id].invert(by), ys[t.def.id].invert(ay)] as Domain]))
          : null,
      });
      return;
    }
    if (drag.x0 >= x0 && drag.x0 <= x1) onCursorsChange?.([...cursors, x.invert(drag.x0).getTime()]);
  };

  // -- traces ----------------------------------------------------------------

  const drawn = traces.map((t) => {
    const y = ys[t.def.id];
    const visible = t.samples.filter((s) => s.time <= end);
    // Hold a stepped trace's last value to the right edge (or now), as PI does.
    const lastTime = visible.length ? visible[visible.length - 1].time : 0;
    const holdUntil = Math.min(end, now);
    const held =
      t.def.step && visible.length && visible[visible.length - 1].value !== null && lastTime < holdUntil
        ? [...visible, { time: holdUntil, value: visible[visible.length - 1].value }]
        : visible;
    const path = line<TrendSample>()
      .x((s) => x(s.time))
      .y((s) => y(s.value as number))
      .curve(t.def.step ? curveStepAfter : curveLinear);
    const markers = style !== "line" && t.def.source.kind !== "constant";
    const lines = style !== "markers" || t.def.source.kind === "constant";
    return { t, y, path, segs: segments(held), visible, markers, lines };
  });

  const loading = traces.some((t) => t.isLoading && t.samples.length === 0);
  const noData =
    !loading && traces.filter((t) => t.def.source.kind !== "constant").every((t) => lastValue(t.samples) === null);

  const zoomRect =
    drag?.kind === "zoom"
      ? {
          x: zoomMode === "value" ? x0 : Math.min(drag.x0, drag.x1),
          y: zoomMode === "time" ? y0 : Math.min(drag.y0, drag.y1),
          w: zoomMode === "value" ? x1 - x0 : Math.abs(drag.x1 - drag.x0),
          h: zoomMode === "time" ? y1 - y0 : Math.abs(drag.y1 - drag.y0),
        }
      : null;

  const cursorX = (i: number, t: number) =>
    drag?.kind === "cursor" && drag.index === i ? drag.x : x(t);

  return (
    <div ref={wrapRef} className="relative w-full h-full min-h-0 select-none">
      <svg
        ref={svgRef}
        width={screenWidth}
        height={screenHeight}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="absolute inset-0 touch-none"
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => setDrag(null)}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
          </clipPath>
        </defs>

        {/* grid */}
        <g stroke={theme.grid} strokeWidth={1}>
          {timeTicks.map((t) => (
            <line key={`gx${+t}`} x1={x(t)} x2={x(t)} y1={y0} y2={y1} />
          ))}
          {gridTicks.map((v) => (
            <line key={`gy${v}`} x1={x0} x2={x1} y1={ys[first!.def.id](v)} y2={ys[first!.def.id](v)} />
          ))}
        </g>

        {/* value axes: one shared, or one per trace in its colour */}
        {(layout === "multiple" ? traces : traces.slice(0, 1)).map((t, i) => {
          const y = ys[t.def.id];
          const ax = x0 - i * AXIS_WIDTH;
          const color = layout === "multiple" ? t.def.color : theme.label;
          return (
            <g key={`axis-${t.def.id}`} fontSize={9} fill={color}>
              <line x1={ax} x2={ax} y1={y0} y2={y1} stroke={layout === "multiple" ? color : theme.axis} />
              {y.ticks(Math.max(2, Math.floor((y1 - y0) / 40))).map((v) => (
                <g key={v}>
                  <line x1={ax - 4} x2={ax} y1={y(v)} y2={y(v)} stroke={layout === "multiple" ? color : theme.axis} />
                  <text x={ax - 6} y={y(v)} textAnchor="end" dominantBaseline="middle">
                    {formatTrendValue(v)}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
        {yLabel && (
          <text
            x={10}
            y={(y0 + y1) / 2}
            transform={`rotate(-90 10 ${(y0 + y1) / 2})`}
            textAnchor="middle"
            fontSize={9}
            fill={theme.label}
          >
            {yLabel}
          </text>
        )}

        {/* time axis */}
        <g fontSize={9} fill={theme.label}>
          <line x1={x0} x2={x1} y1={y1} y2={y1} stroke={theme.axis} />
          {timeTicks.map((t) => (
            <text key={`tx${+t}`} x={x(t)} y={y1 + 13} textAnchor="middle">
              {tickFormat(t)}
            </text>
          ))}
        </g>
        {showFooter && (
          <g fontSize={8} fill={theme.label}>
            <text x={x0} y={height - 4}>{formatTrendTime(start)}</text>
            <text x={(x0 + x1) / 2} y={height - 4} textAnchor="middle">{formatDuration(end - start)}</text>
            <text x={x1} y={height - 4} textAnchor="end">{formatTrendTime(end)}</text>
          </g>
        )}

        {/* traces */}
        <g clipPath={`url(#${clipId})`}>
          {drawn.map(({ t, y, path, segs, visible, markers, lines }) => (
            <g key={t.def.id} data-trace={t.def.id}>
              {lines &&
                segs.map((seg, i) => (
                  <path
                    key={i}
                    d={path(seg) ?? undefined}
                    fill="none"
                    stroke={t.def.color}
                    strokeWidth={t.def.source.kind === "constant" ? 1.5 : 1.4}
                  />
                ))}
              {markers &&
                visible.map((s) =>
                  s.value === null || s.time < start ? null : (
                    <circle key={s.time} cx={x(s.time)} cy={y(s.value)} r={2.4} fill={t.def.color} />
                  )
                )}
            </g>
          ))}
        </g>

        {(loading || noData) && (
          <text x={(x0 + x1) / 2} y={(y0 + y1) / 2} textAnchor="middle" fontSize={11} fill={theme.label}>
            {loading ? "Loading…" : traces.find((t) => t.systemState)?.systemState ?? "No data"}
          </text>
        )}

        {/* plot surface: click for a cursor, drag to zoom */}
        <rect
          x={x0}
          y={y0}
          width={x1 - x0}
          height={y1 - y0}
          fill="transparent"
          className="cursor-crosshair"
          onPointerDown={onPlotDown}
          data-testid="trend-plot"
        />

        {zoomRect && (
          <rect
            x={zoomRect.x}
            y={zoomRect.y}
            width={zoomRect.w}
            height={zoomRect.h}
            fill={theme.zoomFill}
            stroke={theme.cursor}
            strokeWidth={1}
            pointerEvents="none"
          />
        )}

        {/* cursors */}
        {cursors.map((t, i) => {
          const cx = cursorX(i, t);
          if (drag?.kind !== "cursor" && (t < start || t > end)) return null;
          const removing = cx < x0 - REMOVE_MARGIN || cx > x1 + REMOVE_MARGIN;
          const at = drag?.kind === "cursor" && drag.index === i ? x.invert(clampX(cx)).getTime() : t;
          const values = traces.map((tr) => ({ tr, v: valueAt(tr.samples, at, tr.def.step) }));
          const flip = cx > x1 - 90;
          const boxH = 4 + values.length * 11;
          return (
            <g key={i} opacity={removing ? 0.35 : 1} data-testid="trend-cursor">
              <rect x={cx - 5} y={y0} width={10} height={y1 - y0} fill={theme.cursorBand} />
              <line x1={cx} x2={cx} y1={y0} y2={y1} stroke={theme.cursor} strokeWidth={1} />
              <g fontSize={9}>
                <rect x={cx - 56} y={y0 - 26} width={112} height={13} fill={theme.box} stroke={theme.boxBorder} />
                <text x={cx} y={y0 - 16} textAnchor="middle" fill={theme.text}>
                  {formatTrendTime(at)}
                </text>
                <rect
                  x={flip ? cx - 66 : cx + 6}
                  y={y0 - 11}
                  width={60}
                  height={boxH}
                  fill={theme.box}
                  stroke={theme.boxBorder}
                />
                {values.map(({ tr, v }, k) => (
                  <text key={tr.def.id} x={flip ? cx - 62 : cx + 10} y={y0 - 2 + k * 11} fill={tr.def.color}>
                    ● {formatTrendValue(v)}
                  </text>
                ))}
              </g>
              {/* the handle that drags (and removes) the cursor */}
              <rect
                x={cx - 6}
                y={y0}
                width={12}
                height={y1 - y0}
                fill="transparent"
                className="cursor-ew-resize"
                onPointerDown={onCursorDown(i)}
                aria-label={`Cursor at ${formatTrendTime(at)}`}
              />
            </g>
          );
        })}

        {/* legend: trace name over its latest value, top right */}
        {showLegend && (
          <g
            fontSize={9}
            textAnchor="end"
            pointerEvents="none"
            stroke={theme.halo}
            strokeWidth={3}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {traces.map((t, i) => {
              const v = lastValue(t.samples);
              return (
                <g key={t.def.id} fill={t.def.color}>
                  <text x={x1 - 6} y={y0 + 10 + i * 22}>{t.def.label}</text>
                  <text x={x1 - 6} y={y0 + 20 + i * 22}>
                    {v === null ? (t.systemState ?? "No data") : `${formatTrendValue(v)} ${t.def.units}`}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
