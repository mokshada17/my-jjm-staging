import type { ReactNode } from "react";
import ReactEChartsCore from "echarts-for-react/esm/core";
import { echarts } from "./echartsSetup";
import { CHART_FONT, LABEL_MARGIN, useChartTheme } from "./useChartTheme";
import { useUiScale } from "@/shared/hooks/useUiScale";
import { rem } from "@/shared/lib/uiScale";

export interface TelemetryPoint {
  time: string;
  value: number;
}

export interface ChartMarker {
  /** Rendered verbatim in the legend, e.g. "Hi- 0.5 mg/l". */
  label: string;
  value: number;
  color: string;
}

/** Marker colours taken from Figma 2:11688 (ESR Dashboard). */
export const MARKER_COLOR = {
  actual: "#FFB300",
  bound: "#00D2FF", // Max / Min
  hi: "#F59E0B",
  lo: "#8C47E6", // Lo / HiHi
  axis: "#8FADD1",
} as const;

/**
 * The plot box and axis-label size a row of ESR charts shares, in design px. A
 * chart drawn beside these (ConsumptionBarChart's `row` layout) uses the same
 * values, so its x axis and top line up with theirs.
 */
export const ROW_GRID = { top: 8, bottom: 12 } as const;
export const ROW_AXIS_FONT = 7.5;

// Legend text is 8px at leading-tight: 10px lines, 2px apart (gap-y-0.5).
const LEGEND_LINE = 10;
const LEGEND_GAP = 2;

interface ChartFrameProps {
  /** The strip above the plot: the live reading and the thresholds. */
  legend?: ReactNode;
  /**
   * Height to reserve for the strip, in lines of legend text. Charts that share a
   * row pass the same number, so the strip is the same height in each however its
   * legend wraps - and the plots below start at the same y.
   */
  legendLines?: number;
  /** Axis caption under the plot, e.g. "Chlorine (mg/l)". */
  caption?: string;
  /**
   * Rotated value-axis title left of the plot, e.g. "Water Comption". Drawn here,
   * outside the canvas, so it never has to be fitted beside the tick labels.
   */
  yCaption?: string;
  /** Grow to fill a flex column, handing the height to the chart (see `grow` on the charts). */
  grow?: boolean;
  children: ReactNode;
}

/** Legend strip, chart, caption: the frame of an ESR chart (Figma 2:11688). */
export function ChartFrame({ legend, legendLines = 0, caption, yCaption, grow = false, children }: ChartFrameProps) {
  const reserve = legendLines > 0 ? rem(legendLines * LEGEND_LINE + (legendLines - 1) * LEGEND_GAP) : undefined;
  return (
    <div className={grow ? "w-full grow flex flex-col" : "w-full"}>
      {/* Legend strip — Figma lists the live reading and every threshold above the plot */}
      {(legend || reserve) && (
        <div
          className="shrink-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1 text-[0.5rem] leading-tight"
          style={{ minHeight: reserve }}
        >
          {legend}
        </div>
      )}

      {yCaption ? (
        <div className={grow ? "grow flex" : "flex items-center"}>
          <div className="shrink-0 self-center rotate-180 text-[0.625rem] leading-none text-black dark:text-white [writing-mode:vertical-rl]">
            {yCaption}
          </div>
          <div className={grow ? "min-w-0 flex-1 flex flex-col" : "min-w-0 flex-1"}>{children}</div>
        </div>
      ) : (
        children
      )}

      {caption && (
        <div className="shrink-0 text-[0.5rem] text-center mt-0.5" style={{ color: MARKER_COLOR.axis }}>
          {caption}
        </div>
      )}
    </div>
  );
}

interface ThresholdLineChartProps {
  data: TelemetryPoint[];
  /** Drawn as dashed markLines and listed in the legend strip. */
  markers?: ChartMarker[];
  /** Live reading, e.g. "Actual:- 2.4 bar". */
  actual?: string;
  /** Axis caption under the plot, e.g. "Chlorine (mg/l)". */
  axisName?: string;
  height?: number;
  unit?: string;
  /** See ChartFrame: reserve this many legend lines so a row of charts lines up. */
  legendLines?: number;
  /** Grow past `height` (then a minimum) to fill a flex column - the page filling the screen. */
  grow?: boolean;
}

export function ThresholdLineChart({
  data,
  markers = [],
  actual,
  axisName,
  height = 96,
  unit = "",
  legendLines,
  grow = false,
}: ThresholdLineChartProps) {
  const t = useChartTheme();
  // Canvas sizes scale with the large-screen root size (1 up to 1920px).
  const k = useUiScale();

  const option = {
    textStyle: { fontFamily: CHART_FONT },
    grid: { left: 4 * k, right: 8 * k, top: ROW_GRID.top * k, bottom: ROW_GRID.bottom * k, containLabel: true },
    tooltip: {
      trigger: "axis",
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      textStyle: { color: t.label, fontSize: 10 * k },
      valueFormatter: (v: number) => `${v}${unit ? ` ${unit}` : ""}`,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.time),
      boundaryGap: false,
      axisLine: { show: true, lineStyle: { color: t.axis, width: k } },
      axisTick: { show: false },
      axisLabel: { color: t.label, fontSize: ROW_AXIS_FONT * k, margin: LABEL_MARGIN * k },
    },
    yAxis: {
      type: "value",
      // Value axes hide their line by default; draw it so both axes are visible.
      axisLine: { show: true, lineStyle: { color: t.axis, width: k } },
      scale: true,
      splitLine: { lineStyle: { color: t.grid, type: "dashed" } },
      axisLabel: { color: t.label, fontSize: ROW_AXIS_FONT * k, margin: LABEL_MARGIN * k },
    },
    series: [
      {
        type: "line",
        data: data.map((d) => d.value),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: t.accent, width: 1.8 * k },
        areaStyle: { color: t.accent, opacity: 0.08 },
        markLine: {
          silent: true,
          symbol: "none",
          label: { show: false },
          data: markers.map((mk) => ({
            yAxis: mk.value,
            lineStyle: { color: mk.color, type: "dashed", width: k },
          })),
        },
      },
    ],
  };

  const legend = (actual || markers.length > 0) && (
    <>
      {actual && (
        <span style={{ color: MARKER_COLOR.actual }} className="font-medium">
          {actual}
        </span>
      )}
      {markers.map((mk) => (
        <span key={mk.label} style={{ color: mk.color }}>
          {mk.label}
        </span>
      ))}
    </>
  );

  return (
    <ChartFrame legend={legend} legendLines={legendLines} caption={axisName} grow={grow}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={grow ? { flex: "1 1 0", minHeight: rem(height), width: "100%" } : { height: rem(height), width: "100%" }}
        opts={{ renderer: "canvas" }}
        notMerge
      />
    </ChartFrame>
  );
}
