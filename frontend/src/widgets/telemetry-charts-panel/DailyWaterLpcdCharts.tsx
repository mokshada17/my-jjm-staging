import type { ReactNode } from "react";
import { Card } from "@/shared/components/ui";
import { ThemedImg } from "@/shared/components/figma";
import { useTheme } from "@/app/providers";
import { dailyLpcd, dailyWater, toLakhLitres, type EsrRecord } from "@/entities/hierarchy";
import { ChartState } from "./ChartState";
import { ConsumptionBarChart } from "./ConsumptionBarChart";

interface DailyWaterLpcdChartsProps {
  /** The scope's ESR rows; their §5.3 7-day series are summed per day. */
  rows: EsrRecord[];
  /** The scope's population, from `demographics`, which LPCD divides by. */
  population: number;
  isLoading: boolean;
  isError: boolean;
  /**
   * Wraps each chart, e.g. in a TrendLink that opens its popup trend, as on the
   * ESR page. Charts are drawn as-is without it.
   */
  linkChart?: (kind: DailyChartKind, chart: ReactNode) => ReactNode;
}

export type DailyChartKind = "water" | "lpcd";

const CHART_HEIGHT = 226;

/** Figma chart card: a 52px title strip (icon + 11px heading) over the chart. */
function ChartCard({ icon, title, children }: { icon: ReactNode; title: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col rounded-lg overflow-hidden shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border">
      <div className="h-[3.25rem] shrink-0 flex items-center justify-center gap-2 px-2 bg-jjm-light-bg dark:bg-jjm-surface">
        {icon}
        <h3 className="text-[0.6875rem] leading-[0.8125rem] font-semibold text-center text-jjm-blue-light dark:text-jjm-cyan">
          {title}
        </h3>
      </div>
      <div className="grow flex flex-col px-2 pt-2 pb-1">{children}</div>
    </Card>
  );
}

/**
 * The Scheme and Village "Water Consumption (LL)" and "LPCD - Previous Day" 7-day
 * bar charts, drawn from the scope's water_consumption series.
 */
export function DailyWaterLpcdCharts({
  rows,
  population,
  isLoading,
  isError,
  linkChart = (_kind, chart) => chart,
}: DailyWaterLpcdChartsProps) {
  const { theme } = useTheme();
  const water = dailyWater(rows);
  const consumption = water.map((p) => ({ date: p.label, value: toLakhLitres(p.value) }));
  const perCapita = dailyLpcd(water, population).map((p) => ({
    date: p.label,
    value: Math.round(p.value * 100) / 100,
  }));

  return (
    <div className="grid grid-cols-2 gap-[0.3125rem]">
      <ChartCard icon={<ThemedImg name="water-hand" w={26} h={25} />} title="Water Consumption (LL)">
        <ChartState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!consumption.length}
          height={CHART_HEIGHT}
        >
          {linkChart(
            "water",
            <ConsumptionBarChart
              data={consumption}
              height={CHART_HEIGHT}
              unit="LL"
              // "Water Comption" is the dark frame's own typo (see AGENTS.md).
              yName={theme === "dark" ? "Water Comption" : "Water Consumption"}
              xName="Date"
            />
          )}
        </ChartState>
      </ChartCard>

      <ChartCard
        icon={<ThemedImg name="kpi-lpcd" w={37} h={25} />}
        title={
          <>
            Liter Per Capita Day
            <br />( LPCD - Previous Day)
          </>
        }
      >
        {/* Without a population LPCD is undefined, not zero - say so instead of
            drawing a row of empty bars. */}
        <ChartState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!perCapita.length || population <= 0}
          height={CHART_HEIGHT}
        >
          {linkChart(
            "lpcd",
            <ConsumptionBarChart data={perCapita} height={CHART_HEIGHT} unit="L" yName="LPCD" xName="Date" />
          )}
        </ChartState>
      </ChartCard>
    </div>
  );
}
