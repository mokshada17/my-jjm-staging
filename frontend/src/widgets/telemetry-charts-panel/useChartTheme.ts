import { useTheme } from "@/app/providers";

/**
 * ECharts draws to a canvas and ignores the page's CSS font, so charts name the
 * app's typeface explicitly (see tailwind.config.js fontFamily.sans).
 */
export const CHART_FONT = '"Inter Variable", Inter, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * ECharts' own axis-label gap (its default is 8px). Set explicitly so it can be
 * multiplied by the large-screen scale with every other size; left to the default
 * it stays 8px on a 4K screen and pulls the axes, and their titles, out of place.
 */
export const LABEL_MARGIN = 8;

export interface ChartTheme {
  accent: string;
  /** The x and y axis lines; must read clearly against the card. */
  axis: string;
  /** Dashed split lines behind the plot; deliberately fainter than `axis`. */
  grid: string;
  label: string;
  good: string;
  warning: string;
  danger: string;
  tooltipBg: string;
  tooltipBorder: string;
  /** Figma bar-chart axes, ticks and labels: white on dark, black on light. */
  ink: string;
  /** Figma bar fill, the same in both themes. */
  bar: string;
  /** Flow gauge track. */
  track: string;
}

const DARK: ChartTheme = {
  accent: "#24D2FF",
  // #16274E was all but invisible on the #0E1526 card.
  axis: "#64748B",
  grid: "#293E66",
  label: "#94A3B8",
  good: "#00E63D",
  warning: "#FFAA00",
  danger: "#FF4D4D",
  tooltipBg: "#0E1B38",
  tooltipBorder: "#16274E",
  ink: "#FFFFFF",
  bar: "#1D6B89",
  track: "#1C2D54",
};

const LIGHT: ChartTheme = {
  accent: "#1292B2",
  axis: "#94A3B8",
  grid: "#E2E8F0",
  label: "#64748B",
  good: "#008000",
  warning: "#D97706",
  danger: "#DC2626",
  tooltipBg: "#FFFFFF",
  tooltipBorder: "#CBD5E1",
  ink: "#000000",
  bar: "#1D6B89",
  track: "#E2E8EF",
};

export function useChartTheme(): ChartTheme {
  const { theme } = useTheme();
  return theme === "dark" ? DARK : LIGHT;
}
