/**
 * What the Scheme and Village charts open as a popup trend. Those charts total
 * several reservoirs, so their trends are built from each reservoir's own
 * `CALC - WATER CONSUMPTION PER DAY` - the attribute the ESR page's water trend
 * reads - rather than from a figure PI does not hold:
 *  - Water Consumption: the total, plus one trace per reservoir;
 *  - LPCD: the total over the scope's population, against the 55 L benchmark.
 */
import { LPCD_BENCHMARK, type EsrRecord } from "@/entities/hierarchy";
import { LAKH_LITRES, PI_DEFAULT_SPAN, PRIMARY_TRACE, type EsrTrendSet } from "./esrTraces";
import type { TraceDef } from "./model";

export type AreaTrendKind = "water" | "lpcd";

const WATER = "CALC - WATER CONSUMPTION PER DAY";

/**
 * Reservoir traces beside the cyan total: the dashboard's amber, green, purple,
 * red and slate, so each reads on both themes and none is mistaken for the total.
 */
const PART_COLORS = ["#F59E0B", "#10B981", "#8C47E6", "#EF4444", "#94A3B8"];

/** The page's "achieving" green, for the LPCD benchmark line. */
const BENCHMARK_COLOR = "#0FB880";

const waterParts = (rows: EsrRecord[]) => rows.map((esr) => ({ esr, attribute: WATER }));

/**
 * @param rows the scope's reservoirs (a scheme's or a village's)
 * @param population the scope's population, which LPCD divides by
 * @param subject what the trend is of, e.g. "Scheme 631010" or "Alesur"
 */
export function areaTrendSet(
  kind: AreaTrendKind,
  rows: EsrRecord[],
  population: number,
  subject: string
): EsrTrendSet {
  if (kind === "lpcd") {
    return {
      title: "Liter Per Capita Day (LPCD)",
      subject,
      style: "line-markers",
      traces: [
        {
          id: "LPCD",
          name: `${subject}|LPCD`,
          label: "LPCD",
          description: "Daily water consumption per person",
          units: "L",
          color: PRIMARY_TRACE,
          source: { kind: "sum", parts: waterParts(rows), factor: population > 0 ? 1 / population : 0 },
          step: true,
          database: PI_DEFAULT_SPAN,
        },
        {
          id: "LPCD|Benchmark",
          name: `${subject}|LPCD|Benchmark`,
          label: "LPCD Benchmark",
          description: `${LPCD_BENCHMARK} litres per person per day`,
          units: "L",
          color: BENCHMARK_COLOR,
          source: { kind: "constant", value: LPCD_BENCHMARK },
          step: true,
          database: PI_DEFAULT_SPAN,
        },
      ],
    };
  }

  // A village with one reservoir: that reservoir is the total, so draw it once.
  const villages = new Set(rows.map((r) => r.villageName)).size;
  const reservoirTrace = (esr: EsrRecord, i: number): TraceDef => ({
    id: `Water Consumption|${esr.key}`,
    name: `${esr.esrName}|${WATER}`,
    label: rows.length === 1 ? "Water Consumption" : villages > 1 ? `${esr.villageName} ${esr.esrName}` : esr.esrName,
    description: "Calculated Daily Water Consumption",
    units: "LL",
    color: rows.length === 1 ? PRIMARY_TRACE : PART_COLORS[i % PART_COLORS.length],
    source: { kind: "attribute", attribute: WATER, factor: 1 / LAKH_LITRES, esr },
    step: true,
    database: PI_DEFAULT_SPAN,
  });

  return {
    title: "Water Consumption",
    subject,
    style: "line-markers",
    traces:
      rows.length === 1
        ? [reservoirTrace(rows[0], 0)]
        : [
            {
              id: "Water Consumption|Total",
              name: `${subject}|Total Water Consumption`,
              label: "Total",
              description: `Water Consumption of all ${rows.length} reservoirs`,
              units: "LL",
              color: PRIMARY_TRACE,
              source: { kind: "sum", parts: waterParts(rows), factor: 1 / LAKH_LITRES },
              step: true,
              database: PI_DEFAULT_SPAN,
            },
            ...rows.map(reservoirTrace),
          ],
  };
}
