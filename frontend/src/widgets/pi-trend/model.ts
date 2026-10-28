/**
 * The PI Vision trend model, kept free of React so the cursor, details-table and
 * zoom arithmetic can be tested on its own.
 */
import type { EsrPathFields, TrendSample } from "@/entities/telemetry";

/** "Multiple scales" gives every trace its own axis; "single" shares one. */
export type ScaleLayout = "single" | "multiple";
/** Autorange, Database (PI zero/span) or Custom (the Bottom/Top in the details table). */
export type ScaleMode = "auto" | "database" | "custom";
export type TraceStyle = "line" | "line-markers" | "markers";
/** What a rubber-band drag zooms. */
export type ZoomMode = "both" | "time" | "value";

export type Domain = [number, number];

/** One reservoir's attribute, as a summed trace names it. */
export interface TracePart {
  esr: EsrPathFields;
  attribute: string;
}

export type TraceSource =
  /**
   * A PI attribute, its values multiplied by `factor` (unit conversion). On the
   * trend's own reservoir unless `esr` names another - a scheme or village trend
   * draws one trace per reservoir.
   */
  | { kind: "attribute"; attribute: string; factor?: number; esr?: EsrPathFields }
  /** A fixed limit, e.g. `Pressure|Hi`. */
  | { kind: "constant"; value: number }
  /** Running total of a rate attribute over the window: Σ value·Δt(s)·factor. */
  | { kind: "integral"; attribute: string; factor: number; esr?: EsrPathFields }
  /** Several reservoirs' readings added together, times `factor` - a scheme or village total. */
  | { kind: "sum"; parts: TracePart[]; factor: number };

export interface TraceDef {
  id: string;
  /** PI Vision's trace name, "<element>|<attribute>[|<limit>]". */
  name: string;
  /** Short legend label, e.g. "Flow Rate". */
  label: string;
  description: string;
  units: string;
  color: string;
  source: TraceSource;
  /** Discrete readings are drawn as steps; continuous ones are interpolated. */
  step: boolean;
  /** PI point zero/span, used by the Database scale. */
  database: Domain;
  /** The scale of the symbol the trend opened from; enables the Custom scale. */
  custom?: Domain;
}

export interface TraceData {
  def: TraceDef;
  samples: TrendSample[];
  isLoading: boolean;
  isError: boolean;
  /** The PI system state when the point has no good data, e.g. "I/O Timeout". */
  systemState?: string;
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

/** Index of the last sample at or before `t`, or -1. */
function indexAtOrBefore(samples: TrendSample[], t: number): number {
  let lo = 0;
  let hi = samples.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].time <= t) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/**
 * The trace's value at `t`, as a cursor reads it: the held value for a stepped
 * trace, linear interpolation for a continuous one, null in a gap or outside
 * the data.
 */
export function valueAt(samples: TrendSample[], t: number, step: boolean): number | null {
  const i = indexAtOrBefore(samples, t);
  if (i === -1) return null;
  const a = samples[i];
  if (a.value === null) return null;
  if (step || a.time === t || i === samples.length - 1) return a.value;
  const b = samples[i + 1];
  if (b.value === null) return a.value;
  return a.value + ((b.value - a.value) * (t - a.time)) / (b.time - a.time);
}

/** The newest good value, which the legend and the table's Value column show. */
export function lastValue(samples: TrendSample[]): number | null {
  for (let i = samples.length - 1; i >= 0; i--) {
    const v = samples[i].value;
    if (v !== null) return v;
  }
  return null;
}

/**
 * The samples a window covers. A stepped trace also holds, from `start`, the
 * value it last recorded before the window: a daily total written at midnight is
 * still the reading at 15:00, so an 8-hour window shows it rather than nothing.
 */
function inWindow(samples: TrendSample[], start: number, end: number, step: boolean): TrendSample[] {
  const within = samples.filter((s) => s.time >= start && s.time <= end);
  if (!step || within[0]?.time === start) return within;
  const held = valueAt(samples, start, true);
  return held === null ? within : [{ time: start, value: held }, ...within];
}

export interface TraceStats {
  average: number | null;
  minimum: number | null;
  maximum: number | null;
}

/**
 * Time-weighted average, minimum and maximum over `[start, end]` - the details
 * table's Average / Minimum / Maximum. A stepped trace holds each value until
 * the next; a continuous one averages each segment's two ends. Gaps carry no
 * weight.
 */
export function traceStats(samples: TrendSample[], start: number, end: number, step: boolean): TraceStats {
  let weighted = 0;
  let weight = 0;
  let minimum: number | null = null;
  let maximum: number | null = null;
  const covered = inWindow(samples, start, end, step);
  for (const s of covered) {
    if (s.value === null) continue;
    minimum = minimum === null ? s.value : Math.min(minimum, s.value);
    maximum = maximum === null ? s.value : Math.max(maximum, s.value);
  }
  for (let i = 0; i < covered.length; i++) {
    const a = covered[i];
    const b = covered[i + 1];
    if (a.value === null) continue;
    const until = b ? b.time : step ? end : a.time;
    const dt = until - a.time;
    if (dt <= 0) continue;
    const bv = b?.value ?? null;
    weighted += (step || bv === null ? a.value : (a.value + bv) / 2) * dt;
    weight += dt;
  }
  const average = weight > 0 ? weighted / weight : minimum !== null && maximum !== null ? (minimum + maximum) / 2 : null;
  return { average, minimum, maximum };
}

/**
 * Stepped series added together: at every time any of them has a sample, each
 * contributes the value it holds then. A series in a gap there (bad data, a
 * system state) adds nothing - as the dashboard's own totals count it as zero -
 * so the sum is a gap only where every series is.
 */
export function sumSamples(series: TrendSample[][]): TrendSample[] {
  const times = [...new Set(series.flatMap((s) => s.map((p) => p.time)))].sort((a, b) => a - b);
  return times.map((time) => {
    let total = 0;
    let any = false;
    for (const s of series) {
      const v = valueAt(s, time, true);
      if (v !== null) {
        total += v;
        any = true;
      }
    }
    return { time, value: any ? total : null };
  });
}

/** Running total of a rate: Σ value·Δt(seconds)·factor, trapezoidal, restarting at 0. */
export function integrate(samples: TrendSample[], factor: number): TrendSample[] {
  let total = 0;
  return samples.map((s, i) => {
    const prev = samples[i - 1];
    if (prev && prev.value !== null && s.value !== null) {
      total += ((prev.value + s.value) / 2) * ((s.time - prev.time) / 1000) * factor;
    }
    return { time: s.time, value: s.value === null ? null : total };
  });
}

// ---------------------------------------------------------------------------
// Scales
// ---------------------------------------------------------------------------

/** Extent of the good values the window covers (see inWindow), or null when there are none. */
export function extent(samples: TrendSample[], start: number, end: number, step = false): Domain | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of inWindow(samples, start, end, step)) {
    if (s.value === null) continue;
    lo = Math.min(lo, s.value);
    hi = Math.max(hi, s.value);
  }
  return lo === Infinity ? null : [lo, hi];
}

/** Autorange: the data's extent with a margin, so a flat line is not drawn on the frame. */
export function autoDomain(samples: TrendSample[], start: number, end: number, step = false): Domain {
  const e = extent(samples, start, end, step);
  if (!e) return [0, 1];
  const [lo, hi] = e;
  if (hi === lo) {
    const pad = Math.abs(lo) * 0.1 || 1;
    return [lo - pad, hi + pad];
  }
  const pad = (hi - lo) * 0.05;
  return [lo - pad, hi + pad];
}

export interface DomainInput {
  traces: TraceData[];
  start: number;
  end: number;
  layout: ScaleLayout;
  mode: ScaleMode;
  /** Bottom/Top per trace id, from the details table or the source symbol. */
  custom: Record<string, Domain>;
  /** Value ranges a rubber-band zoom set, per trace id; these win over the mode. */
  zoom?: Record<string, Domain>;
}

/** Each trace's axis range. In a single scale every trace gets the union. */
export function resolveDomains({ traces, start, end, layout, mode, custom, zoom = {} }: DomainInput): Record<string, Domain> {
  const own: Record<string, Domain> = {};
  for (const t of traces) {
    const auto = autoDomain(t.samples, start, end, t.def.step);
    own[t.def.id] =
      mode === "database" ? t.def.database : mode === "custom" ? (custom[t.def.id] ?? auto) : auto;
  }
  let result = own;
  if (layout === "single" && traces.length > 1) {
    const ranges = Object.values(own);
    const union: Domain = [Math.min(...ranges.map((r) => r[0])), Math.max(...ranges.map((r) => r[1]))];
    result = Object.fromEntries(traces.map((t) => [t.def.id, union]));
  }
  return Object.fromEntries(traces.map((t) => [t.def.id, zoom[t.def.id] ?? result[t.def.id]]));
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** PI Vision's value text: up to three decimals, thousands grouped ("1,109,327", "70.161", "0.69"). */
export function formatTrendValue(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  const abs = Math.abs(v);
  const digits = abs >= 1000 ? 0 : abs >= 100 ? 2 : 3;
  return v.toLocaleString("en-US", { maximumFractionDigits: digits });
}

/** Cursor and time-bar stamp, e.g. "8/24/2026 10:01:29 PM". */
export function formatTrendTime(t: number): string {
  const d = new Date(t);
  return `${d.toLocaleDateString("en-US")} ${d.toLocaleTimeString("en-US")}`;
}
