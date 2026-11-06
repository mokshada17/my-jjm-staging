export function getStatusColorClass(
  type: "good" | "warning" | "danger" | "neutral"
): string {
  switch (type) {
    case "good":
      return "text-[#24FF00]";
    case "warning":
      return "text-[#FFA800]";
    case "danger":
      return "text-[#FF3838]";
    case "neutral":
    default:
      return "text-jjm-cyan";
  }
}

/**
 * Fallbacks for the table cells when a row carries no matrix. Every caller now
 * passes figures rolled up from the PI ingestion tables, so these are only ever
 * reached when data is missing - they read zero rather than plausible numbers so
 * an empty state can never be mistaken for a real one.
 */
export const DEFAULT_COMM_STATUS_MATRIX = {
  chlorine: { h24: 0, h0To72: 0, h72Plus: 0 },
  pressure: { h24: 0, h0To72: 0, h72Plus: 0 },
  flow: { h24: 0, h0To72: 0, h72Plus: 0 },
};

export const DEFAULT_VILLAGE_KPIS = {
  lpcdAbove55: 0,
  lpcdBelow55: 0,
  chlorineIdeal: 0,
  chlorineLow: 0,
  chlorineHigh: 0,
  pressureHigh: 0,
  pressureModerate: 0,
  pressureLow: 0,
};
