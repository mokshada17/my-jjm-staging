/**
 * What each ESR chart opens as a popup trend - the traces PI Vision shows for
 * the symbol that was clicked: the sensor itself, plus its Hi / HiHi / Lo limit
 * traces for chlorine and pressure.
 */
import { METRES_PER_BAR } from "@/entities/hierarchy";
import { CHLORINE_LIMITS, PRESSURE_LIMITS_BAR } from "@/entities/telemetry";
import { MARKER_COLOR } from "@/widgets/telemetry-charts-panel/ThresholdLineChart";
import type { Domain, TraceDef, TraceStyle } from "./model";

export type EsrTrendKind = "chlorine" | "pressure" | "flow" | "totalizer" | "water";

/** The sensor trace; the cyan-light token reads on both the dark and light canvas. */
export const PRIMARY_TRACE = "#2FA4C1";
/**
 * Pressure Lo. The dashboard's marker cyan is indistinguishable from the sensor
 * trace once both are lines, so the popup draws Lo in neutral slate, as PI Vision
 * draws it in a muted colour.
 */
const LO_LIMIT = "#94A3B8";

/**
 * PI's default point zero/span. The seed models attributes, not PI points, so
 * every trace gets the default - which is what PI Vision's Database scale shows
 * for an unconfigured tag.
 */
export const PI_DEFAULT_SPAN: Domain = [0, 100];

export const LAKH_LITRES = 100_000;

export interface EsrTrendSet {
  title: string;
  /** What the trend is of, for screen readers; defaults to the reservoir's name. */
  subject?: string;
  traces: TraceDef[];
  /** Discrete readings are plotted with markers so the 4-per-hour packets can be counted. */
  style: TraceStyle;
}

function limit(esrName: string, attribute: string, level: string, value: number, units: string, color: string): TraceDef {
  return {
    id: `${attribute}|${level}`,
    name: `${esrName}|${attribute}|${level}`,
    label: `${attribute} ${level}`,
    description: `${level} limit`,
    units,
    color,
    source: { kind: "constant", value },
    step: true,
    database: PI_DEFAULT_SPAN,
  };
}

/** `flowMax` is the flow gauge's top, so the popup opens on the gauge's own scale. */
export function esrTrendSet(kind: EsrTrendKind, esrName: string, opts: { flowMax?: number } = {}): EsrTrendSet {
  switch (kind) {
    case "chlorine":
      return {
        title: "Chlorine",
        style: "line-markers",
        traces: [
          {
            id: "Chlorine",
            name: `${esrName}|Chlorine`,
            label: "Chlorine",
            description: "Residual Chlorine Sensor Reading",
            units: "mg/l",
            color: PRIMARY_TRACE,
            source: { kind: "attribute", attribute: "Chlorine" },
            step: true,
            database: PI_DEFAULT_SPAN,
          },
          limit(esrName, "Chlorine", "Hi", CHLORINE_LIMITS.hi, "mg/l", MARKER_COLOR.hi),
          limit(esrName, "Chlorine", "Lo", CHLORINE_LIMITS.lo, "mg/l", MARKER_COLOR.lo),
        ],
      };
    case "pressure":
      return {
        title: "Pressure",
        style: "line-markers",
        traces: [
          {
            id: "Pressure",
            name: `${esrName}|Pressure`,
            label: "Pressure",
            description: "Reservoir Outlet Pressure Reading",
            units: "bar",
            color: PRIMARY_TRACE,
            // §5.2 supplies metres of head; the dashboards read bar.
            source: { kind: "attribute", attribute: "Pressure", factor: 1 / METRES_PER_BAR },
            step: true,
            database: PI_DEFAULT_SPAN,
          },
          limit(esrName, "Pressure", "Hi", PRESSURE_LIMITS_BAR.hi, "bar", MARKER_COLOR.hi),
          limit(esrName, "Pressure", "HiHi", PRESSURE_LIMITS_BAR.hiHi, "bar", MARKER_COLOR.lo),
          limit(esrName, "Pressure", "Lo", PRESSURE_LIMITS_BAR.lo, "bar", LO_LIMIT),
        ],
      };
    case "flow":
      return {
        title: "Flow Rate",
        style: "line",
        traces: [
          {
            id: "Flow Rate",
            name: `${esrName}|Flow Rate`,
            label: "Flow Rate",
            description: "Instantaneous Flow Rate Reading",
            units: "m³/h",
            color: PRIMARY_TRACE,
            // L/s -> m³/h, the gauge's unit
            source: { kind: "attribute", attribute: "Flow Rate", factor: 3.6 },
            step: false,
            database: PI_DEFAULT_SPAN,
            custom: opts.flowMax ? [0, opts.flowMax] : undefined,
          },
        ],
      };
    case "totalizer":
      return {
        title: "Totalizer Flow",
        style: "line",
        traces: [
          {
            id: "Totalizer Flow",
            name: `${esrName}|Totalizer Flow`,
            label: "Totalizer Flow",
            description: "Running total of Flow Rate over the window",
            units: "m³",
            color: PRIMARY_TRACE,
            // L/s x s = L; /1000 = m³
            source: { kind: "integral", attribute: "Flow Rate", factor: 1 / 1000 },
            step: false,
            database: PI_DEFAULT_SPAN,
          },
        ],
      };
    case "water":
      return {
        title: "Water Consumption",
        style: "line-markers",
        traces: [
          {
            id: "Water Consumption",
            name: `${esrName}|CALC - WATER CONSUMPTION PER DAY`,
            label: "Water Consumption",
            description: "Calculated Daily Water Consumption",
            units: "LL",
            color: PRIMARY_TRACE,
            source: { kind: "attribute", attribute: "CALC - WATER CONSUMPTION PER DAY", factor: 1 / LAKH_LITRES },
            step: true,
            database: PI_DEFAULT_SPAN,
          },
        ],
      };
  }
}
