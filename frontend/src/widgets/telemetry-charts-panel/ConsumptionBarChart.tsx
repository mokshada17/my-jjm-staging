import ReactEChartsCore from "echarts-for-react/esm/core";
import { echarts } from "./echartsSetup";
import { CHART_FONT, LABEL_MARGIN, useChartTheme } from "./useChartTheme";
import { useUiScale } from "@/shared/hooks/useUiScale";
import { rem } from "@/shared/lib/uiScale";
import { ChartFrame, ROW_AXIS_FONT, ROW_GRID } from "./ThresholdLineChart";

export interface ConsumptionPoint {
  date: string;
  value: number;
}

interface ConsumptionBarChartProps {
  data: ConsumptionPoint[];
  height?: number;
  unit?: string;
  /** Rotated y-axis title, e.g. "Water Consumption". */
  yName?: string;
  /** x-axis title under the dates, e.g. "Date". */
  xName?: string;
  /**
   * `standalone` (default): the Scheme / Village chart, axis titles drawn by
   * ECharts. `row`: beside ThresholdLineCharts (ESR) - it takes their frame, grid
   * and axis font, with `xName` / `yName` as the frame's captions, so its x and y
   * axes sit at the same height as theirs.
   */
  layout?: "standalone" | "row";
  /** `row` only: the legend lines the neighbouring charts reserve (see ChartFrame). */
  legendLines?: number;
  /**
   * Grow past `height` (then a minimum) to fill a flex column - the Scheme and
   * Village charts, when the page fills the screen.
   */
  grow?: boolean;
}

/**
 * Figma 7-day bar chart (Scheme / Village dashboards): square #1D6B89 bars, each
 * labelled with its value and unit ("14.84LL"), on plain axes with left ticks and
 * no grid lines - white on dark, black on light.
 */
export function ConsumptionBarChart({
  data,
  height = 112,
  unit = "LL",
  yName,
  xName,
  layout = "standalone",
  legendLines,
  grow = false,
}: ConsumptionBarChartProps) {
  const t = useChartTheme();
  // ECharts draws on a canvas in px: design sizes are multiplied by the large-screen
  // scale (1 up to 1920px), and the container is sized in rem to match.
  const k = useUiScale();

  // The rotated y title sits `nameGap` px left of the axis line, so it has to clear
  // the widest tick label ("100,000" at 8px is ~40px with its tick) or it is drawn
  // on top of them. ECharts rounds the top tick up, so allow one more digit.
  const widestTick = Math.max(0, ...data.map((d) => d.value)).toLocaleString("en-US").length + 1;
  const yNameGap = Math.max(26, widestTick * 5 + 12) * k;
  const row = layout === "row";
  const tickFont = row ? ROW_AXIS_FONT : 8;

  const option = {
    textStyle: { fontFamily: CHART_FONT },
    grid: row
      ? { left: 4 * k, right: 8 * k, top: ROW_GRID.top * k, bottom: ROW_GRID.bottom * k, containLabel: true }
      : { left: (yName ? 24 : 4) * k, right: 4 * k, top: 22 * k, bottom: (xName ? 26 : 4) * k, containLabel: true },
    tooltip: {
      trigger: "axis",
      backgroundColor: t.tooltipBg,
      borderColor: t.tooltipBorder,
      textStyle: { color: t.label, fontSize: 10 * k },
      valueFormatter: (v: number) => `${v} ${unit}`,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.date),
      // In a row the caption under the plot names the axis instead.
      name: row ? undefined : xName,
      nameLocation: "middle",
      nameGap: 22 * k,
      nameTextStyle: { color: t.ink, fontSize: 12 * k },
      axisLine: { show: true, lineStyle: { color: t.ink, width: k } },
      axisTick: { show: false },
      axisLabel: {
        color: t.ink,
        fontSize: (row ? ROW_AXIS_FONT : 9) * k,
        margin: LABEL_MARGIN * k,
        // Every date that fits, like the line charts beside it. ECharts' own spacing
        // is cautious and drops alternate days at 1440px though all seven fit, so try
        // every label and let it hide only the ones that would touch their neighbour.
        ...(row && { interval: 0, hideOverlap: true }),
      },
    },
    yAxis: {
      type: "value",
      name: row ? undefined : yName,
      nameLocation: "middle",
      nameRotate: 90,
      nameGap: yNameGap,
      nameTextStyle: { color: t.ink, fontSize: 10 * k },
      axisLine: { show: true, lineStyle: { color: t.ink, width: k } },
      axisTick: { show: true, inside: false, length: 4 * k, lineStyle: { color: t.ink } },
      splitLine: { show: false },
      axisLabel: { color: t.ink, fontSize: tickFont * k, margin: LABEL_MARGIN * k },
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => d.value),
        itemStyle: { color: t.bar },
        barMaxWidth: 22 * k,
        label: {
          show: true,
          position: "top",
          color: t.ink,
          fontSize: 8 * k,
          fontWeight: 600,
          formatter: ({ value }: { value: number }) => `${value}${unit}`,
        },
      },
    ],
  };

  const chart = (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={grow ? { flex: "1 1 0", minHeight: rem(height), width: "100%" } : { height: rem(height), width: "100%" }}
      opts={{ renderer: "canvas" }}
      notMerge
    />
  );

  return row ? (
    <ChartFrame legendLines={legendLines} caption={xName} yCaption={yName} grow={grow}>
      {chart}
    </ChartFrame>
  ) : (
    chart
  );
}
