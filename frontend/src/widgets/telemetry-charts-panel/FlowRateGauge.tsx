// `lib/core` is CommonJS; deep-importing it makes the default export resolve to the
// module namespace object instead of the component. The esm build exports it properly.
import ReactEChartsCore from "echarts-for-react/esm/core";
import { useEffect, useRef, useState } from "react";
import { echarts } from "./echartsSetup";
import { CHART_FONT, useChartTheme } from "./useChartTheme";
import { useUiScale } from "@/shared/hooks/useUiScale";
import { rem } from "@/shared/lib/uiScale";

interface FlowRateGaugeProps {
  value: number;
  min?: number;
  /** Top of the scale; defaults to a round figure comfortably above `value`. */
  max?: number;
  unit?: string;
  /** Height of the dial itself; the value line below adds ~24px. */
  height?: number;
}

const SPLITS = 6;
/**
 * Figma 2:11688's broad flat track. The Figma leaves it unfilled; the arc now
 * fills from the bottom of the scale up to the reading, so the flow can be read
 * at a glance across a room as well as from the needle.
 */
const RING = 34;
/** Room above and beside the ring for the scale labels, which sit outside it. */
const LABEL_ROOM = 26;
/** Room below the centre for the needle's anchor. */
const ANCHOR_ROOM = 10;
/** Tick marks: 6px long, standing just outside the track. */
const TICK_LENGTH = 6;
const TICK_DISTANCE = -RING - TICK_LENGTH;
/** Scale labels are centred this far outside the track, inside LABEL_ROOM. */
const LABEL_OFFSET = 18;

/** 120 unless the reading needs more; then the next multiple of 60 with headroom. */
export const gaugeMax = (v: number) => Math.max(120, Math.ceil((v * 1.15) / 60) * 60);

/** Tracks an element's width so the dial can be sized to fill it. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export function FlowRateGauge({
  value,
  min = 0,
  max,
  unit = "m³/h",
  height = 150,
}: FlowRateGaugeProps) {
  const t = useChartTheme();
  const [ref, width] = useWidth<HTMLDivElement>();
  const top = max ?? gaugeMax(value);

  // The dial is drawn in canvas px: `height` and the constants above are design
  // px, scaled by the large-screen factor (1 up to 1920px). `width` is measured,
  // so it is already in screen px.
  const k = useUiScale();
  const h = height * k;
  const ring = RING * k;
  const labelRoom = LABEL_ROOM * k;
  const anchorRoom = ANCHOR_ROOM * k;
  const tickLength = TICK_LENGTH * k;
  const tickDistance = TICK_DISTANCE * k;

  // A semicircle is twice as wide as it is tall: take the largest radius that fits
  // both the height and the measured width once the outside labels have room.
  const byHeight = h - labelRoom - anchorRoom;
  const byWidth = width > 0 ? width / 2 - labelRoom - 8 * k : byHeight;
  const radius = Math.max(40 * k, Math.min(byHeight, byWidth));

  const option = {
    textStyle: { fontFamily: CHART_FONT },
    series: [
      {
        type: "gauge",
        startAngle: 180,
        endAngle: 0,
        min,
        max: top,
        splitNumber: SPLITS,
        center: ["50%", h - anchorRoom],
        radius,
        // The needle angle and the filled arc both follow `value`. The fill is the
        // track's own width, in the accent the line charts beside it use for readings.
        progress: { show: true, width: ring, roundCap: false, itemStyle: { color: t.accent } },
        axisLine: { lineStyle: { width: ring, color: [[1, t.track]] } },
        axisTick: { show: false },
        // Ticks stand just outside the track, beside their labels.
        splitLine: { length: tickLength, distance: tickDistance, lineStyle: { color: t.ink, width: k } },
        // ECharts places labels at r - splitLine.length - (label.distance +
        // splitLine.distance), so the tick offset is cancelled out here. Without
        // that the labels landed 86px outside the ring - off the canvas.
        axisLabel: {
          color: t.ink,
          fontSize: 9 * k,
          distance: (-LABEL_OFFSET - TICK_LENGTH - TICK_DISTANCE) * k,
          // Unrotated gauge labels are anchored on their inner edge (built for
          // labels inside the ring), which drew "0" and "120" across their ticks,
          // and `align` is ignored. Any non-zero rotation centres them instead.
          rotate: 0.001,
        },
        // A thin needle reaching the track's inner edge.
        pointer: { width: 3 * k, length: radius - 4 * k, itemStyle: { color: t.ink } },
        anchor: { show: true, size: 12 * k, itemStyle: { color: t.ink } },
        // The reading is printed under the dial instead.
        detail: { show: false },
        data: [{ value }],
      },
    ],
  };

  return (
    <div ref={ref} className="w-full flex flex-col items-center">
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: rem(height), width: "100%" }}
        opts={{ renderer: "canvas" }}
        notMerge
      />
      <span className="mt-1 text-base font-semibold text-[#0FB880]">
        {value.toFixed(2)} {unit}
      </span>
    </div>
  );
}
