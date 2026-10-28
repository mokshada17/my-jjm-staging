import { useState, type ReactNode } from "react";
import { Card } from "@/shared/components/ui";
import { ThemedImg } from "@/shared/components/figma";
import { cn } from "@/shared/utils";
import {
  formatLakhLitres,
  formatLpcd,
  lpcd,
  meetsLpcdBenchmark,
  type EsrRecord,
  type TierRollup,
} from "@/entities/hierarchy";
import { DailyWaterLpcdCharts } from "@/widgets/telemetry-charts-panel";
import { PopupTrend, TrendLink, areaTrendSet, type AreaTrendKind } from "@/widgets/pi-trend";

// "Critical Parameters" on the Scheme and Village dashboards (Figma 2:10744 /
// 2:11238 and light twins): a 27px strip, two 60px-headed figure cards, then the
// two 7-day charts. "Achiving" and "LCPD" are the frames' own spelling. As on the
// ESR page, clicking a chart opens its popup trend (PI Vision behaviour).

const BOX =
  "rounded-md border border-jjm-light-stroke dark:border-jjm-border bg-jjm-light-tile dark:bg-jjm-canvas flex items-center justify-center";
const CARD = "rounded-lg overflow-hidden shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border";

function FigureCard({
  head,
  labels,
  values,
}: {
  head: ReactNode;
  labels: [string, string];
  values: [ReactNode, ReactNode];
}) {
  return (
    <Card className={CARD}>
      <div className="h-[3.75rem] flex items-center px-3 bg-jjm-light-bg dark:bg-jjm-surface">{head}</div>
      <div className="grid grid-cols-2 gap-[0.3125rem] p-[0.3125rem]">
        {labels.map((l) => (
          <div key={l} className={cn(BOX, "h-[1.9375rem] text-xs text-black dark:text-white whitespace-nowrap")}>
            {l}
          </div>
        ))}
        {values.map((v, i) => (
          <div key={i} className={cn(BOX, "h-[2.1875rem] text-base font-bold")}>
            {v}
          </div>
        ))}
      </div>
    </Card>
  );
}

const HEADING = "text-[0.6875rem] leading-[0.8125rem] font-semibold text-center text-jjm-blue-light dark:text-jjm-cyan";

const TREND_LABEL: Record<AreaTrendKind, string> = {
  water: "Open Water Consumption trend",
  lpcd: "Open LPCD trend",
};

export function CriticalParameters({
  roll,
  rows,
  isLoading,
  isError,
  subject,
}: {
  roll: TierRollup;
  rows: EsrRecord[];
  isLoading: boolean;
  isError: boolean;
  /** What the trends are of, e.g. "Scheme 631010" or "Alesur". */
  subject: string;
}) {
  const [trend, setTrend] = useState<AreaTrendKind | null>(null);
  // LPCD on the previous day, the figure the "LPCD - Previous Day" card reports.
  const lpcdPrevious = lpcd(roll.waterLitresPrevious, roll.population);
  const met = meetsLpcdBenchmark(lpcdPrevious);

  return (
    <div className="flex flex-col gap-[0.625rem]">
      <div className="h-[1.6875rem] flex items-center justify-center gap-1.5 rounded-t-lg bg-jjm-light-bg dark:bg-jjm-surface">
        {/* Only the light frames lead the heading with the antenna. */}
        <span className="dark:hidden">
          <ThemedImg name="comm-antenna-light" w={18} h={19} />
        </span>
        <h2 className="text-sm font-semibold uppercase text-jjm-blue-light dark:text-jjm-cyan">Critical Parameters</h2>
      </div>

      <div className="grid grid-cols-2 gap-[0.375rem]">
        <FigureCard
          head={
            <span className="flex-1 flex items-center justify-center gap-2">
              <ThemedImg name="water-hand" w={26} h={25} />
              <span className={HEADING}>
                Water Consumption Per
                <br />
                Day (LL)
              </span>
            </span>
          }
          labels={["Previous Day", "Current Day"]}
          values={[
            <span className="text-jjm-cyan">{formatLakhLitres(roll.waterLitresPrevious)}</span>,
            <span className="text-[#0FB880]">{formatLakhLitres(roll.waterLitres)}</span>,
          ]}
        />
        <FigureCard
          head={
            <span className="flex-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <ThemedImg name="kpi-lpcd" w={26} h={17} />
                <span className={cn(HEADING, "text-left")}>
                  Liter Per Capita Day
                  <br />( LPCD - Previous Day)
                </span>
              </span>
              <span className="flex flex-col items-center gap-1.5">
                <span className="text-[0.625rem] font-semibold text-black dark:text-white">Achiving or not achiving</span>
                <span className="flex items-center gap-4 text-[0.5rem] font-semibold text-black dark:text-white">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0FB880]" />
                    &gt;55 LCPD
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-jjm-red" />
                    &lt;55 LCPD
                  </span>
                </span>
              </span>
            </span>
          }
          labels={["Previous Day", "Achiving or not achiving"]}
          values={[
            <span className="text-jjm-cyan">{formatLpcd(lpcdPrevious)}</span>,
            <span
              className={cn("w-[1.375rem] h-[1.375rem] rounded-full", met ? "bg-[#0FB880]" : "bg-jjm-red")}
              role="img"
              aria-label={met ? "Achieving 55 LPCD" : "Not achieving 55 LPCD"}
            />,
          ]}
        />
      </div>

      <DailyWaterLpcdCharts
        rows={rows}
        population={roll.population}
        isLoading={isLoading}
        isError={isError}
        linkChart={(kind, chart) => (
          <TrendLink label={TREND_LABEL[kind]} onOpen={() => setTrend(kind)}>
            {chart}
          </TrendLink>
        )}
      />

      {trend && (
        <PopupTrend
          esr={undefined}
          set={areaTrendSet(trend, rows, roll.population, subject)}
          onClose={() => setTrend(null)}
        />
      )}
    </div>
  );
}
