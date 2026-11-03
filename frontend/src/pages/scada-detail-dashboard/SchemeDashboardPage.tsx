import { useParams } from "react-router-dom";
import {
  useActiveHierarchyNode,
  useOpenHierarchyNode,
  labelFromRouteId,
} from "@/features/select-hierarchy-node";
import { DashboardLayout } from "@/shared/components/layout";
import { FILL_COLUMN, ThemedImg } from "@/shared/components/figma";
import { PerformanceKpiCard } from "@/widgets/dashboard-kpi-grid/PerformanceKpiCard";
import {
  AvgSupplyCard,
  CommStatusPanel,
  CoveragePanel,
  CriticalParameters,
  DetailTable,
  NodeSummaryPanel,
  ReservoirPanel,
} from "@/widgets/tier-dashboard";
import { useTierSummary } from "@/entities/overview";
import {
  formatHours,
  formatLakhLitres,
  formatLpcd,
  groupBy,
  lpcd,
  rollup,
  villageBands,
  villageKey,
  waterSources,
} from "@/entities/hierarchy";

/** Figma 2:10744 (dark) / 2:10246 (light). */
export function SchemeDashboardPage() {
  // Child rows open with their full ancestry recorded, so the next page fetches
  // only its own branch from the mock server.
  const openNode = useOpenHierarchyNode();
  const { id } = useParams();
  const { rows, rollup: roll, villages, name, isLoading, isError } = useTierSummary("Scheme", id);
  // Every row under this node shares its ancestry, so any one names its branch.
  const branch = rows[0];
  useActiveHierarchyNode({
    tier: "Scheme",
    id: id ?? "scheme",
    label: labelFromRouteId(id, "Scheme"),
    name,
    row: branch,
  });

  const village = villageBands(roll);

  // Child units under this Scheme, with the figures the Figma columns show.
  const childUnits = groupBy(rows, villageKey).map((group) => {
    const r = rollup(group.rows, villages);
    return {
      key: group.key,
      name: group.rows[0].villageName,
      open: () => openNode(group.rows[0], "Village"),
      // The column reads "LPCD - Previous Day", so divide the previous day's supply.
      lpcd: lpcd(r.waterLitresPrevious, r.population),
      water: r.waterLitres,
      hours: r.avgSupplyHours,
    };
  });

  return (
    // A 669px column of the scheme's own panels beside an 822px one of critical
    // parameters, 10px apart.
    <DashboardLayout
      currentTier="Scheme"
      contentClassName="grid grid-cols-1 xl:grid-cols-[669fr_822fr] gap-[0.625rem] px-[0.3125rem] pt-[0.3125rem] pb-3 w-full max-w-[120rem] mx-auto items-stretch"
    >
      <div className={`${FILL_COLUMN} min-w-0 gap-[0.3125rem]`}>
        <NodeSummaryPanel
          name={branch ? `${branch.schemeId} - ${branch.schemeName}` : labelFromRouteId(id, "Scheme")}
          pillClassName="w-auto min-w-[13.9375rem] px-4 dark:w-auto dark:min-w-[13.75rem] dark:h-[1.4375rem] text-xs whitespace-nowrap"
          headerClassName="h-[2.4375rem] dark:h-[2.0625rem]"
          tiles={[
            { label: "Region", value: branch?.region ?? "-" },
            { label: "Circle", value: branch?.circle ?? "-" },
            { label: "Division", value: branch?.division ?? "-" },
            { label: "Sub-Division", value: branch?.subDivision ?? "-" },
            { label: "Block", value: branch?.block ?? "-" },
            { label: "Water Source", value: waterSources(rows, villages) || "-" },
          ]}
        />
        <CoveragePanel roll={roll} />
        <ReservoirPanel roll={roll} />

        <div className="grid grid-cols-[492fr_160fr] gap-2">
          <CommStatusPanel roll={roll} className="px-[0.3125rem] pt-[0.3125rem]" bandClassName="dark:h-[2.1875rem]" />
          <AvgSupplyCard roll={roll} compact />
        </div>

        <PerformanceKpiCard
          title="Village Level Performance (KPIs)"
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

      {/* The charts keep their Figma size; the table below them takes the column's
          spare height when the page fills the screen. */}
      <div className="min-w-0 flex flex-col gap-[0.625rem]">
        <CriticalParameters
          roll={roll}
          rows={rows}
          isLoading={isLoading}
          isError={isError}
          subject={branch ? `Scheme ${branch.schemeId}` : labelFromRouteId(id, "Scheme")}
        />

        <DetailTable
          className="xl:grow"
          rows={childUnits}
          rowKey={(u) => u.key}
          rowTitle={(u) => `Drill down into ${u.name} Village`}
          onOpen={(u) => u.open()}
          columns={[
            {
              id: "village",
              header: (
                <span className="inline-flex items-center gap-2">
                  <ThemedImg name="tile-villages-light" dark="tile-villages-dark" w={20} h={16} darkW={20} darkH={16} />
                  Village Name
                </span>
              ),
              cell: (u) => u.name,
              className: "text-left",
            },
            {
              id: "lpcd",
              header: (
                <>
                  Liter Per Capita Day (LPCD) (
                  <br />- Previous Day
                </>
              ),
              cell: (u) => formatLpcd(u.lpcd),
            },
            {
              id: "water",
              header: (
                <>
                  Water Consumption ( LL)(
                  <br />
                  -Current Day
                </>
              ),
              cell: (u) => formatLakhLitres(u.water),
              className: "text-[#0FB880]",
            },
            {
              id: "hours",
              header: (
                <>
                  Average Time Duration of Water (
                  <br />
                  Supply per Day - Current Day
                </>
              ),
              cell: (u) => formatHours(u.hours).replace("Hours", "hours"),
              className: "text-[#0FB880]",
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
