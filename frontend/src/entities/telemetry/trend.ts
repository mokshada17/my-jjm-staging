/**
 * Trend history for one reservoir, read the way PI Vision reads it: resolve the
 * ESR element by its AF path (§4 endpoint 1), list its attributes (§4 endpoint
 * 3), then fetch plot values for the attributes a trend shows.
 *
 * None of this runs when an ESR page loads - only when a popup trend opens or
 * the Sensor Fusion page mounts - so it does not change a dashboard's request
 * count.
 */
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { piClient, type AfAttribute, type PiStreamValues } from "@/shared/api/piClient";
import type { EsrRecord } from "../hierarchy/aggregation";
import { afStateRoot, stateInfo } from "../hierarchy/states";

export type EsrPathFields = Pick<
  EsrRecord,
  "state" | "region" | "circle" | "division" | "subDivision" | "block" | "schemeId" | "schemeName" | "villageName" | "esrName"
>;

/**
 * The ESR element's AF path, rebuilt from the hierarchy every §5 row carries
 * (§2.4 is the reverse of this: it strips these prefixes off the path).
 */
export function esrAfPath(esr: EsrPathFields): string {
  return [
    // §2.2: the reservoir's own state root under the AF database.
    afStateRoot(stateInfo(esr.state).name),
    `Region-${esr.region}`,
    `Circle-${esr.circle}`,
    `Division-${esr.division}`,
    `Sub Division-${esr.subDivision}`,
    `Block-${esr.block}`,
    `Scheme-${esr.schemeId} - ${esr.schemeName}`,
    esr.villageName,
    esr.esrName,
  ].join("\\");
}

export const trendKeys = {
  all: ["trend"] as const,
  attributes: (path: string) => [...trendKeys.all, "attributes", path] as const,
  plot: (webId: string, start: number, end: number, intervals: number) =>
    [...trendKeys.all, "plot", webId, start, end, intervals] as const,
};

/** One reservoir's attribute lookup; shared so every caller hits the same cache entry. */
function attributesQuery(path: string, enabled: boolean) {
  return {
    queryKey: trendKeys.attributes(path),
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const element = await piClient.fetchElementByPath(path, { signal });
      const attributes = await piClient.fetchAttributes(element.WebId, { signal });
      return Object.fromEntries(attributes.map((a) => [a.Name, a])) as Record<string, AfAttribute>;
    },
    enabled,
    // The AF model changes when engineers edit it, not while a trend is open.
    staleTime: 30 * 60 * 1000,
  };
}

/** The reservoir's attributes keyed by name ("Chlorine", "Flow Rate", ...). */
export function useEsrAttributes(esr: EsrPathFields | undefined, enabled = true) {
  return useQuery(attributesQuery(esr ? esrAfPath(esr) : "", enabled && Boolean(esr)));
}

/**
 * The attributes of several reservoirs, in order - for a trend that spans a
 * scheme or a village. One element lookup per reservoir, cached like the above.
 */
export function useEsrAttributesMany(esrs: EsrPathFields[], enabled = true) {
  return useQueries({ queries: esrs.map((esr) => attributesQuery(esrAfPath(esr), enabled)) });
}

/** One plotted sample; `value` is null where PI reported bad data or a system state. */
export interface TrendSample {
  time: number;
  value: number | null;
}

export interface PlotSeries {
  samples: TrendSample[];
  units: string;
  /** Set when the point has no good data at all, e.g. "I/O Timeout". */
  systemState?: string;
}

/** PI values to samples: a system state or a bad value becomes a gap. */
export function toSamples(res: PiStreamValues): PlotSeries {
  const samples = res.Items.map((item) => ({
    time: Date.parse(item.Timestamp),
    value: item.Good && typeof item.Value === "number" ? item.Value : null,
  }));
  const states = res.Items.filter((i) => typeof i.Value === "object").map((i) =>
    typeof i.Value === "object" ? i.Value.Name : ""
  );
  return {
    samples,
    units: res.UnitsAbbreviation ?? "",
    systemState: samples.length > 0 && samples.every((s) => s.value === null) ? states[0] : undefined,
  };
}

/**
 * Plot values for several attributes over one window. Windows are whole seconds
 * so a live trend re-keys at most once per tick, and the previous plot stays on
 * screen while the next one loads instead of flashing empty.
 */
export function usePlotSeries(
  webIds: (string | undefined)[],
  window: { start: number; end: number },
  intervals: number,
  enabled = true
) {
  const start = Math.floor(window.start / 1000) * 1000;
  const end = Math.floor(window.end / 1000) * 1000;
  return useQueries({
    queries: webIds.map((webId, i) => ({
      // Until the attributes resolve every WebId is unknown; keep their keys apart.
      queryKey: trendKeys.plot(webId ?? `unresolved-${i}`, start, end, intervals),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        toSamples(
          await piClient.fetchPlotValues(
            webId!,
            {
              startTime: new Date(start).toISOString(),
              endTime: new Date(end).toISOString(),
              intervals,
            },
            { signal }
          )
        ),
      enabled: enabled && Boolean(webId) && end > start,
      placeholderData: keepPreviousData,
      staleTime: 60 * 1000,
    })),
  });
}
