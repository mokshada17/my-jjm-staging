import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FILL_COLUMN, Panel, StatTile, ThemedImg } from "@/shared/components/figma";
import { DashboardLayout } from "@/shared/components/layout";
import { StateRegionMap } from "@/widgets/gis-map-workbench/StateRegionMap";
import { findRegion, useStateMap } from "@/widgets/gis-map-workbench/stateMaps";
import { useActiveHierarchyNode } from "@/features/select-hierarchy-node";
import { PerformanceKpiCard } from "@/widgets/dashboard-kpi-grid/PerformanceKpiCard";
import { useTierSummary } from "@/entities/overview";
import {
  formatPopulation,
  sameRegion,
  schemeBands,
  slug,
  useActiveState,
  useAfInventory,
  useAfRegions,
  villageBands,
} from "@/entities/hierarchy";
import { useAppStore } from "@/app/store";

export function EnterpriseDashboardPage() {
  const navigate = useNavigate();
  const state = useActiveState();
  const stateMap = useStateMap();
  // The highlighted region is remembered per state; a new state opens on its default.
  const [picked, setPicked] = useState<{ state: string; region: string } | null>(null);
  const selectedRegion =
    picked?.state === state.name ? picked.region : findRegion(stateMap, state.defaultRegion)?.id;

  // "IOT Project Overview" is the whole AF inventory; "MetaData Received" is the
  // part of it the ingestion jobs have actually written rows for.
  const { data: inventory } = useAfInventory();
  const { data: afRegions } = useAfRegions();
  const drillTo = useAppStore((state) => state.drillTo);

  /**
   * Clicking a region on the map records its AF name on the breadcrumb before
   * navigating, so the region dashboard can issue `?region=<name>` straight away
   * instead of first looking the name up.
   */
  const openRegion = (mapRegionId: string) => {
    const match = afRegions?.find((r) => sameRegion(r.name, mapRegionId));
    const name = match?.name;
    drillTo({
      tier: "Region",
      id: name ? slug(name) : mapRegionId,
      label: name ?? mapRegionId,
      name,
    });
    navigate(`/dashboard/region/${name ? slug(name) : mapRegionId}`);
  };
  const { rows, rollup: roll, villages } = useTierSummary("State");
  const scheme = schemeBands(rows, villages);
  const village = villageBands(roll);
  const af = (n?: number) => n ?? 0;

  useActiveHierarchyNode({
    tier: "State",
    id: state.id,
    label: state.name,
    name: state.name,
  });

  const tiles = (items: [string, number][], cols: string) => (
    <div className={`grid ${cols} gap-x-2 gap-y-2`}>
      {items.map(([label, value]) => (
        <StatTile key={label} label={label} value={value} />
      ))}
    </div>
  );

  return (
    // Figma 2:352 / 2:10: a 634px map card and a 755px column of panels, 16px apart.
    <DashboardLayout
      currentTier="State"
      contentClassName="grid grid-cols-1 xl:grid-cols-[634fr_755fr] gap-4 pl-4 pr-[1.1875rem] py-2.5 dark:py-2 w-full max-w-[120rem] mx-auto"
    >
      <StateRegionMap
        map={stateMap}
        selectedRegion={selectedRegion}
        onSelectRegion={(reg) => {
          setPicked({ state: state.name, region: reg });
          openRegion(reg);
        }}
        className="h-full"
      />

      <div className={`${FILL_COLUMN} gap-[0.3125rem] min-w-0`}>
        {/* "IOT Project Overview" is the whole AF inventory */}
        <Panel title="IOT Project Overview">
          <div className="grid grid-cols-6 gap-x-2 gap-y-2">
            <StatTile className="col-span-2" label="Region" value={af(inventory?.regions)} />
            <StatTile className="col-span-2" label="Number of Circle" value={af(inventory?.circles)} />
            <StatTile className="col-span-2" label="Number of Division" value={af(inventory?.divisions)} />
            {/* Figma splits this row into two equal halves, not 2/3 + 1/3. */}
            <StatTile className="col-span-3" label="Number of Sub Division" value={af(inventory?.subDivisions)} />
            <StatTile className="col-span-3" label="Number of Scheme" value={af(inventory?.schemes)} />
          </div>
        </Panel>

        {/* "MetaData Received" is the part the ingestion jobs have written rows for */}
        <Panel title="MetaData Received">
          {tiles(
            [
              ["Region", roll.counts.circles > 0 ? new Set(rows.map((r) => r.region)).size : 0],
              ["Number of Circle", roll.counts.circles],
              ["Number of Division", roll.counts.divisions],
              ["Number of Sub Division", roll.counts.subDivisions],
              ["Number of Block", roll.counts.blocks],
              ["Number of Scheme", roll.counts.schemes],
            ],
            "grid-cols-3",
          )}
        </Panel>

        <Panel title="Villages, Population, Household Covered under scheme">
          <div className="grid grid-cols-3 gap-x-2 gap-y-2">
            <StatTile
              // className="min-h-[2.5625rem]"
              valueClassName="text-sm"
              icon={<ThemedImg name="tile-villages-light" dark="tile-villages-dark" w={31} h={25} darkW={44} darkH={35} className="dark:-ml-1.5" />}
              label="Number of Villages"
              value={formatPopulation(roll.counts.villages)}
            />
            <StatTile
              // className="min-h-[2.5625rem]"
              valueClassName="text-sm"
              icon={<ThemedImg name="tile-population-light" dark="tile-population-dark" w={25} h={25} darkW={35} darkH={35} />}
              label="Population"
              value={formatPopulation(roll.population)}
            />
            <StatTile
              // className="min-h-[2.5625rem]"
              valueClassName="text-sm"
              icon={<ThemedImg name="tile-household-light" dark="tile-household-dark" w={34} h={25} darkW={47} darkH={35} />}
              label="Household"
              value={formatPopulation(roll.households)}
            />
          </div>
        </Panel>

        <Panel title="Reservoir Information">
          <div className="grid grid-cols-3 gap-x-2 gap-y-2">
            <StatTile
              // className="min-h-[3.25rem] pl-2 gap-[0.1875rem]"
              icon={<ThemedImg name="tile-esr-light" dark="tile-esr-dark" w={25} h={29} darkW={26} darkH={30} />}
              label="ESR"
              value={roll.counts.esr}
            />
            <StatTile
              // className="min-h-[3.25rem] pl-2 gap-[0.1875rem]"
              icon={<ThemedImg name="tile-gsr-light" dark="tile-gsr-dark" w={30} h={25} darkW={36} darkH={30} />}
              label="GSR"
              value={roll.counts.gsr}
            />
            <StatTile
              // className="min-h-[3.25rem] pl-2 gap-[0.1875rem]"
              icon={<ThemedImg name="tile-mbr-light" dark="tile-mbr-dark" w={25} h={25} darkW={30} darkH={30} />}
              label="MBR"
              value={roll.counts.mbr}
            />
          </div>
        </Panel>

        <PerformanceKpiCard
          title="Scheme Performance (KPIs)"
          totalLabel={`Total Scheme: ${roll.counts.schemes}`}
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
          // The light frame reads "Total Village", the dark one "Total Villages".
          totalLabel={
            <>
              <span className="dark:hidden">Total Village: {roll.counts.villages}</span>
              <span className="hidden dark:inline">Total Villages: {roll.counts.villages}</span>
            </>
          }
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
    </DashboardLayout>
  );
}
