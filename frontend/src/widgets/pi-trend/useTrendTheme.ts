import { useTheme } from "@/app/providers";

/**
 * SVG colours for the trend. They follow the jjm tokens in tailwind.config.js
 * (canvas, border, surface; the light stroke and ink), since SVG attributes
 * cannot take Tailwind classes.
 */
export interface TrendTheme {
  grid: string;
  axis: string;
  label: string;
  text: string;
  cursor: string;
  cursorBand: string;
  box: string;
  boxBorder: string;
  zoomFill: string;
  /** Outline behind legend text so it stays legible where a trace passes under it. */
  halo: string;
}

const DARK: TrendTheme = {
  grid: "#1C2D54", // jjm-surface
  axis: "#293E66", // jjm-border
  label: "#94A3B8",
  text: "#FFFFFF",
  cursor: "#E2E8F0",
  cursorBand: "rgba(255,255,255,0.08)",
  box: "#0E1526", // jjm-canvas
  boxBorder: "#94A3B8",
  zoomFill: "rgba(36,210,255,0.08)",
  halo: "#0E1526", // jjm-canvas
};

const LIGHT: TrendTheme = {
  grid: "#E2E8EF", // jjm-light-stroke
  axis: "#94A3B8",
  label: "#465469", // jjm-light-ink
  text: "#0F172A",
  cursor: "#334155",
  cursorBand: "rgba(15,23,42,0.06)",
  box: "#FFFFFF",
  boxBorder: "#94A3B8",
  zoomFill: "rgba(30,107,138,0.10)",
  halo: "#FFFFFF",
};

export function useTrendTheme(): TrendTheme {
  const { theme } = useTheme();
  return theme === "dark" ? DARK : LIGHT;
}
