import type { ReactNode } from "react";
import { Panel, ThemedImg } from "@/shared/components/figma";
import { cn } from "@/shared/utils";

export interface PerformanceKpiValues {
  lpcdAbove55: number;
  lpcdBelow55: number;
  chlorineIdeal: number;
  chlorineLow: number;
  chlorineHigh: number;
  pressureHigh: number;
  pressureModerate: number;
  pressureLow: number;
}

interface PerformanceKpiCardProps {
  /** e.g. "Scheme Performance (KPIs)" — rendered uppercase. */
  title: string;
  /** e.g. "Total Scheme: 389". */
  totalLabel?: ReactNode;
  /** Distinguishes the LPCD sub-label: "Scheme" or "Village". */
  lpcdScope: string;
  values: PerformanceKpiValues;
  className?: string;
}

export const KPI_GOOD = "text-[#0FB880]";
export const KPI_WARN = "text-[#F49E0A]";
export const KPI_BAD = "text-jjm-red";

/** Sub-card stroke and fills, per the Figma KPI blocks (2:352 / 2:10). */
const BLOCK =
  "min-w-0 flex flex-col rounded-lg overflow-hidden border border-jjm-light-stroke dark:border-jjm-border bg-white dark:bg-jjm-canvas";
const CELL =
  "rounded-md border border-jjm-light-stroke dark:border-jjm-border bg-jjm-light-tile dark:bg-jjm-canvas";

/** One KPI block: a 35px icon-and-heading strip over band labels and counts. */
export function KpiBlock({
  icon,
  heading,
  labels,
  values,
  gapClass,
  labelClassName,
}: {
  icon: ReactNode;
  heading: ReactNode;
  labels: string[];
  values: { value: number; tone: string }[];
  gapClass: string;
  /** Extra classes for the band-label cells, e.g. a smaller size at one breakpoint. */
  labelClassName?: string;
}) {
  return (
    <div className={BLOCK}>
      <div className="h-[3.1875rem] shrink-0 flex items-center justify-center gap-2 px-1 bg-jjm-light-bg dark:bg-jjm-surface">
        {icon}
        <span className="text-[0.725rem] leading-[1.2] font-semibold text-center text-jjm-blue-light dark:text-jjm-cyan">
          {heading}
        </span>
      </div>
      <div
        // The counts row takes any spare height when the card fills the screen.
        className={cn("grow grid grid-rows-[auto_auto] px-2 py-2  gap-y-[0.475rem]", gapClass)}
        style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
      >
        {labels.map((label) => (
          <div key={label} className={cn(CELL, "h-10 flex items-center justify-center text-xs whitespace-nowrap text-black dark:text-white", labelClassName)}>
            {label}
          </div>
        ))}
        {values.map(({ value, tone }, i) => (
          <div key={i} className={cn(CELL, "h-10 flex items-center justify-center text-xs font-bold", tone)}>
            {value}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The Scheme and Village performance modules are the same card with a different
 * title, total, and LPCD scope label. Figma: three blocks at 190 : 267.5 : 267.5,
 * each a 35px icon-and-heading strip over a row of band labels and a row of counts.
 */
export function PerformanceKpiCard({
  title,
  totalLabel,
  lpcdScope,
  values,
  className = "",
}: PerformanceKpiCardProps) {
  return (
    <Panel
      title={title}
      aside={totalLabel}
      className={className}
      bodyClassName="grid grid-cols-[190fr_267.5fr_267.5fr] gap-x-1.5 gap-y-1.5 px-2 py-2"
    >
      <KpiBlock
        icon={<ThemedImg name="kpi-lpcd" w={38} h={22} darkW={26} darkH={22} />}
        heading={
          <>
            LiIter Per Capita Day (LPCD) -{" "}
            <br />
            {lpcdScope}
          </>
        }
        labels={[">55 LPCD", "<55 LPCD"]}
        values={[
          { value: values.lpcdAbove55, tone: KPI_GOOD },
          { value: values.lpcdBelow55, tone: KPI_BAD },
        ]}
        gapClass="gap-x-[0.3125rem]"
      />
      <KpiBlock
        icon={<ThemedImg name="kpi-chlorine" w={23} h={23} darkW={25} darkH={25} />}
        heading={
          <>
            Chlorine(mg/l)-
            <br />
            Number of Reservoir
          </>
        }
        labels={["0.2-0.5mg/l", "<0.2mg/l", ">0.5mg/l"]}
        values={[
          { value: values.chlorineIdeal, tone: KPI_GOOD },
          { value: values.chlorineLow, tone: KPI_WARN },
          { value: values.chlorineHigh, tone: KPI_BAD },
        ]}
        gapClass="gap-x-1"
      />
      <KpiBlock
        icon={<ThemedImg name="kpi-pressure" w={25} h={25} />}
        heading={
          <>
            <span className="dark:hidden">Pressure (bar)-</span>
            <span className="hidden dark:inline">Pressure (bar) -</span>
            <br />
            Number of Reservoir
          </>
        }
        labels={[">0.7 bar", "0.2-0.7 bar", "<0.2 bar"]}
        values={[
          { value: values.pressureHigh, tone: KPI_GOOD },
          { value: values.pressureModerate, tone: KPI_WARN },
          { value: values.pressureLow, tone: KPI_BAD },
        ]}
        gapClass="gap-x-1"
      />
    </Panel>
  );
}
