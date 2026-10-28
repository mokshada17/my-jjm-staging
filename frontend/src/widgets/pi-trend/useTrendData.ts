import { useMemo } from "react";
import type { EsrRecord } from "@/entities/hierarchy";
import { esrAfPath, useEsrAttributesMany, usePlotSeries, type EsrPathFields, type TrendSample } from "@/entities/telemetry";
import { integrate, sumSamples, type TraceData, type TraceDef } from "./model";

/** Plot intervals: about one per two pixels of a full-width trend. */
export const PLOT_INTERVALS = 600;

/** One reservoir attribute to plot, by the reservoir's AF path. */
interface PlotPart {
  path: string;
  attribute: string;
}

const partKey = (p: PlotPart) => `${p.path}|${p.attribute}`;

/** The reservoir attributes a trace reads; `own` is the trend's reservoir. */
function partsOf(def: TraceDef, own: string): PlotPart[] {
  const { source } = def;
  switch (source.kind) {
    case "constant":
      return [];
    case "sum":
      return source.parts.map((p) => ({ path: esrAfPath(p.esr), attribute: p.attribute }));
    default:
      return [{ path: source.esr ? esrAfPath(source.esr) : own, attribute: source.attribute }];
  }
}

/**
 * Resolves trace definitions to plotted samples over one window: one attributes
 * lookup per reservoir the traces read, then one plot request per distinct
 * reservoir attribute - a pressure trend and its three limits cost a single plot
 * call, and a scheme total reuses the plots of the reservoir traces beside it.
 *
 * `esr` is the trend's own reservoir, for traces that name none (the ESR page).
 */
export function useTrendData(
  esr: EsrRecord | undefined,
  defs: TraceDef[],
  window: { start: number; end: number },
  enabled = true
): TraceData[] {
  const own = esr ? esrAfPath(esr) : "";

  // Every reservoir the traces read, the trend's own first.
  const elements = useMemo(() => {
    const byPath = new Map<string, EsrPathFields>();
    if (esr) byPath.set(own, esr);
    for (const def of defs) {
      const s = def.source;
      if ((s.kind === "attribute" || s.kind === "integral") && s.esr) byPath.set(esrAfPath(s.esr), s.esr);
      if (s.kind === "sum") for (const p of s.parts) byPath.set(esrAfPath(p.esr), p.esr);
    }
    return [...byPath.values()];
  }, [esr, own, defs]);
  const paths = elements.map(esrAfPath);
  const attrs = useEsrAttributesMany(elements, enabled);

  const parts = useMemo(() => {
    const unique = new Map<string, PlotPart>();
    for (const def of defs) for (const p of partsOf(def, own)) unique.set(partKey(p), p);
    return [...unique.values()];
  }, [defs, own]);
  const keys = parts.map(partKey);
  const attrsOf = (path: string) => attrs[paths.indexOf(path)];
  const webIds = parts.map((p) => attrsOf(p.path)?.data?.[p.attribute]?.WebId);
  const plots = usePlotSeries(webIds, window, PLOT_INTERVALS, enabled);

  /** One part's plot and state. */
  const read = (p: PlotPart) => {
    const i = keys.indexOf(partKey(p));
    const a = attrsOf(p.path);
    const plot = plots[i];
    const missing = Boolean(a?.isSuccess) && !webIds[i];
    return {
      raw: plot?.data?.samples ?? ([] as TrendSample[]),
      isLoading: Boolean(a?.isLoading) || (!missing && (plot?.isLoading ?? true) && !plot?.data),
      isError: Boolean(a?.isError) || missing || Boolean(plot?.isError),
      systemState: plot?.data?.systemState,
    };
  };

  return defs.map((def) => {
    const { source } = def;
    if (source.kind === "constant") {
      return {
        def,
        samples: [
          { time: window.start, value: source.value },
          { time: window.end, value: source.value },
        ],
        isLoading: false,
        isError: false,
      };
    }

    if (source.kind === "sum") {
      const reads = partsOf(def, own).map(read);
      const scale = (s: TrendSample) => ({ time: s.time, value: s.value === null ? null : s.value * source.factor });
      return {
        def,
        samples: sumSamples(reads.map((r) => r.raw)).map(scale),
        isLoading: reads.some((r) => r.isLoading),
        // A reservoir that cannot be read drops out of the total; only all of them failing is an error.
        isError: reads.length > 0 && reads.every((r) => r.isError),
        systemState: reads.every((r) => r.systemState) ? reads[0]?.systemState : undefined,
      };
    }

    const r = read(partsOf(def, own)[0]);
    const factor = source.factor ?? 1;
    const samples =
      source.kind === "integral"
        ? integrate(r.raw, factor)
        : r.raw.map((s) => ({ time: s.time, value: s.value === null ? null : s.value * factor }));
    return { def, samples, isLoading: r.isLoading, isError: r.isError, systemState: r.systemState };
  });
}
