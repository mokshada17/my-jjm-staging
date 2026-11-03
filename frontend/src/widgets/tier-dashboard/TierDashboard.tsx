import type { ReactNode } from "react";
import { DashboardLayout } from "@/shared/components/layout";
import { FILL_COLUMN } from "@/shared/components/figma";
import { PerformanceKpiCard } from "@/widgets/dashboard-kpi-grid/PerformanceKpiCard";
import type { HierarchyTier } from "@/entities/hierarchy";
import { schemeBands, villageBands, type TierRollup } from "@/entities/hierarchy";
import {
  ChildLpcdPanel,
  CommStatusPanel,
  CoveragePanel,
  FunctionalityRow,
  NodeSummaryPanel,
  ReservoirPanel,
  SchemePerformancePanel,
  type ChildLpcdRow,
  type SchemeRow,
  type SummaryTile,
} from "./TierPanels";

export interface TierDashboardProps {
  tier: HierarchyTier;
  /** "Circle", "Division", ... for the scheme table's heading. */
  tierLabel: string;
  /** The node's own name, on the summary pill. */
  name: string;
  summaryTiles: SummaryTile[];
  roll: TierRollup;
  scheme: ReturnType<typeof schemeBands>;
  village: ReturnType<typeof villageBands>;
  /** The LPCD table of child nodes; Block has none. */
  child?: { label: string; icon: ReactNode; rows: ChildLpcdRow[] };
  schemeRows: SchemeRow[];
  /** Only some dark frames print "Total Scheme: N" beside the KPI headings. */
  totalsInDark?: boolean;
}

/**
 * Circle / Division / Sub Division / Block dashboards (Figma 2:2693, 2:4212,
 * 2:4640, 2:5059 and their light twins): the node's panels on a 756px left column,
 * its child and scheme tables on the right. Dark frames sit 10px in with 10px
 * gaps; light frames 16px in, with 5px between the left-hand panels.
 */
export function TierDashboard({
  tier,
  tierLabel,
  name,
  summaryTiles,
  roll,
  scheme,
  village,
  child,
  schemeRows,
  totalsInDark = false,
}: TierDashboardProps) {
  const total = (label: string, n: number) =>
    totalsInDark ? (
      <span className="hidden dark:inline">
        {label}: {n}
      </span>
    ) : undefined;

  return (
    <DashboardLayout
      currentTier={tier}
      contentClassName="grid grid-cols-1 xl:grid-cols-[756fr_636fr] xl:dark:grid-cols-[756fr_654fr] gap-4 dark:gap-[0.625rem] px-4 dark:px-[0.625rem] pt-[0.3125rem] pb-4 dark:pt-[0.625rem] dark:pb-[0.8125rem] w-full max-w-[120rem] mx-auto items-stretch"
    >
      <div className={`${FILL_COLUMN} min-w-0 gap-[0.3125rem] dark:gap-[0.625rem]`}>
        <NodeSummaryPanel name={name} tiles={summaryTiles} />
        <CoveragePanel roll={roll} />
        <ReservoirPanel roll={roll} />
        <FunctionalityRow roll={roll} />
        <PerformanceKpiCard
          title="Scheme Performance (KPIs)"
          totalLabel={total("Total Scheme", roll.counts.schemes)}
          lpcdScope="Scheme"
          values={{
            lpcdAbove55: scheme.lpcd.good,
            lpcdBelow55: scheme.lpcd.bad,
            chlorineIdeal: scheme.cl.good,
            chlorineLow: scheme.cl.mid,
            chlorineHigh: scheme.cl.bad,
            pressureHigh: scheme.pr.good,
            pressureModerate: scheme.pr.mid,
            pressureLow: scheme.pr.bad,
          }}
        />
        <PerformanceKpiCard
          title="Village Level Performance (KPIs)"
          totalLabel={total("Total Villages", roll.counts.villages)}
          lpcdScope="Village"
          values={{
            lpcdAbove55: village.lpcd.good,
            lpcdBelow55: village.lpcd.bad,
            chlorineIdeal: village.cl.good,
            chlorineLow: village.cl.mid,
            chlorineHigh: village.cl.bad,
            pressureHigh: village.pr.good,
            pressureModerate: village.pr.mid,
            pressureLow: village.pr.bad,
          }}
        />
      </div>

      {/* The scheme table stretches down to the left column's foot (in the light
          frames; the dark ones too, now that every page fills the screen). */}
      <div className="min-w-0 flex flex-col gap-[0.625rem]">
        <CommStatusPanel roll={roll} />
        {/* The frames keep these cards at 204px / 249px however few rows they hold. */}
        {child && (
          <ChildLpcdPanel childLabel={child.label} childIcon={child.icon} rows={child.rows} className="min-h-[12.75rem]" />
        )}
        <SchemePerformancePanel
          tierLabel={tierLabel}
          rows={schemeRows}
          className="min-h-[15.5625rem] flex-1"
        />
      </div>
    </DashboardLayout>
  );
}
