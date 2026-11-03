import { useState } from "react";
import { useActiveState, type HierarchyTier } from "@/entities/hierarchy";
import type { OverviewQueryResult } from "@/entities/overview";
import { DashboardLayout } from "@/shared/components/layout";
import { RegionRibbon } from "@/widgets/region-selector";
import { useMediaQuery } from "@/shared/hooks";
import {
  OverviewCards,
  OverviewTable,
  STANDARD_SECTIONS,
  type OverviewColumn,
  type OverviewDensity,
  type OverviewLayout,
  type OverviewSection,
  type SectionRow,
} from "@/widgets/overview-master-table";

export interface TierOverviewPageProps<Row extends { id: string } & SectionRow> {
  /** Highlights this tier in the breadcrumb ribbon. */
  tier: HierarchyTier;
  /** The tier's rows hook, filtered by the region ribbon. */
  useRows: (region?: string) => OverviewQueryResult<Row>;
  /** This tier's own columns; the shared sections follow them. */
  columns: OverviewColumn<Row>[];
  sections?: OverviewSection[];
  density?: OverviewDensity;
  /** Table header layout; see OverviewTable. */
  layout?: OverviewLayout;
}

/**
 * The shell every tier overview page shares: the dashboard layout, the region
 * filter ribbon and the overview table. A page only supplies its tier, its rows
 * hook and its column config.
 */
export function TierOverviewPage<Row extends { id: string } & SectionRow>({
  tier,
  useRows,
  columns,
  sections = STANDARD_SECTIONS,
  density,
  layout,
}: TierOverviewPageProps<Row>) {
  const { name: state, defaultRegion } = useActiveState();
  // The tab is remembered per state: switching state opens the new one's default.
  const [picked, setPicked] = useState<{ state: string; region: string } | null>(null);
  const activeRegion = picked?.state === state ? picked.region : defaultRegion;
  const setActiveRegion = (region: string) => setPicked({ state, region });
  const { rows, isLoading, isError } = useRows(activeRegion);
  // The table needs ~1,060-1,220px for its 19-21 columns, so below 1280px
  // (tablets) each row is drawn as a card instead of scrolling sideways.
  const wide = useMediaQuery("(min-width: 1280px)", true);

  return (
    // Figma: the region tabs sit 14px under the ribbon, the table 26px under them.
    <DashboardLayout currentTier={tier} contentClassName="w-full max-w-[120rem] mx-auto px-[0.5625rem] pt-[0.875rem] pb-4">
      {/* The table card runs down to the time bar however few rows it holds. */}
      <div className="grow flex flex-col gap-[1.625rem]">
        <RegionRibbon activeRegion={activeRegion} onSelectRegion={setActiveRegion} />
        {wide ? (
          <OverviewTable
            className="grow"
            columns={columns}
            rows={rows}
            sections={sections}
            density={density}
            layout={layout}
            isLoading={isLoading}
            isError={isError}
          />
        ) : (
          <OverviewCards columns={columns} rows={rows} sections={sections} isLoading={isLoading} isError={isError} />
        )}
      </div>
    </DashboardLayout>
  );
}
