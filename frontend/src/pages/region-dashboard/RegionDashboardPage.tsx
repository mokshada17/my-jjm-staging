import { useParams } from "react-router-dom";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui";
import {
  useActiveHierarchyNode,
  useOpenHierarchyNode,
  labelFromRouteId,
} from "@/features/select-hierarchy-node";
import { DashboardLayout } from "@/shared/components/layout";
import { FILL_COLUMN, ThemedImg } from "@/shared/components/figma";
import { RegionDistrictMap } from "@/widgets/gis-map-workbench/RegionDistrictMap";
import { findRegion, useStateMap } from "@/widgets/gis-map-workbench/stateMaps";
import { PerformanceKpiCard } from "@/widgets/dashboard-kpi-grid/PerformanceKpiCard";
import {
  CommStatusPanel,
  CoveragePanel,
  FunctionalityRow,
  NodeSummaryPanel,
  ReservoirPanel,
} from "@/widgets/tier-dashboard";
import { useTierSummary } from "@/entities/overview";
import {
  circleKey,
  formatLakhLitres,
  formatLitres,
  groupBy,
  rollup,
  schemeBands,
  villageBands,
} from "@/entities/hierarchy";

const HEAD = "h-auto p-0 text-[0.6875rem] leading-[0.8125rem] font-semibold text-jjm-blue-light dark:text-jjm-cyan";

/** Figma 2:2289 (dark) / 2:3809 (light). */
export function RegionDashboardPage() {
  // Child rows open with their full ancestry recorded, so the next page fetches
  // only its own branch from the mock server.
  const openNode = useOpenHierarchyNode();
  const { id } = useParams();
  const stateMap = useStateMap();
  // The state's map regions carry proper display names ("Chhatrapati Sambhajinagar");
  // anything else falls back to a title-cased route param.
  const regionLabel = findRegion(stateMap, id)?.label ?? labelFromRouteId(id, "Region");

  const { rows, rollup: roll, villages, name } = useTierSummary("Region", id);
  useActiveHierarchyNode({
    tier: "Region",
    id: id ?? "region",
    label: regionLabel,
    name,
    row: rows[0],
  });

  const scheme = schemeBands(rows, villages);
  const village = villageBands(roll);

  // One row per circle under this region.
  const circles = groupBy(rows, circleKey).map((group) => {
    const r = rollup(group.rows, villages);
    return {
      key: group.key,
      name: group.rows[0].circle,
      open: () => openNode(group.rows[0], "Circle"),
      water: r.waterLitres,
    };
  });

  return (
    // Dark: a 641px card and a 756px column, 10px in and apart. Light: 640 / 755,
    // 16px in and 17px apart.
    <DashboardLayout
      currentTier="Region"
      contentClassName="grid grid-cols-1 xl:grid-cols-[640fr_755fr] xl:dark:grid-cols-[641fr_756fr] gap-[1.0625rem] dark:gap-[0.625rem] pl-4 pr-3 dark:px-[0.625rem] pt-[0.3125rem] dark:pt-4 pb-4 dark:pb-2 w-full max-w-[120rem] mx-auto items-stretch"
    >
      <Card className="rounded-lg shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border p-[0.875rem] pr-[0.25rem] flex flex-col gap-[0.5625rem]">
        {/* Region district map, projected from real boundaries */}
        {/* Takes the card's spare height when the page fills the screen. */}
        <RegionDistrictMap map={stateMap} regionId={id} className="min-h-[25rem] xl:grow" />

        <CommStatusPanel roll={roll} className="mr-[0.6875rem]" bandClassName="dark:h-[2.1875rem]" />

        {/* Circle table: its column headings sit inside the title strip */}
        <Card className="mr-[0.6875rem] rounded-lg shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border px-3 pt-[0.3125rem] pb-3">
          <Table className="table-fixed">
            <TableHeader className="[&_tr]:border-0">
              <TableRow className="h-[2.375rem] bg-jjm-light-bg dark:bg-jjm-surface hover:bg-jjm-light-bg dark:hover:bg-jjm-surface">
                <TableHead className={`${HEAD} w-[31%] text-left pl-1`}>
                  <span className="inline-flex items-center gap-2">
                    <ThemedImg name="tier-circle" w={28} h={25} />
                    Circle
                  </span>
                </TableHead>
                <TableHead className={`${HEAD} w-[36%] text-center`}>
                  <span className="inline-flex items-center gap-[0.4375rem]">
                    <ThemedImg name="kpi-lpcd" w={37} h={25} />
                    <span>
                      Liter Per Capita day (LPCD)
                      <br />
                      -Previous Day
                    </span>
                  </span>
                </TableHead>
                <TableHead className={`${HEAD} w-[33%] text-center`}>
                  <span className="inline-flex items-center gap-[0.4375rem]">
                    <ThemedImg name="water-hand" w={26} h={25} />
                    <span>
                      Water Consumption(LL)
                      <br />
                      -Current Day
                    </span>
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[0.8125rem]">
              {circles.map((circle) => (
                <TableRow
                  key={circle.key}
                  onClick={circle.open}
                  title={`Drill down into ${circle.name} Circle`}
                  className="h-10 border-0 cursor-pointer hover:bg-transparent"
                >
                  <TableCell className="p-0 text-black dark:text-white">{circle.name}</TableCell>
                  <TableCell className="p-0 text-center font-bold text-black dark:text-white">
                    {formatLitres(circle.water)}
                  </TableCell>
                  <TableCell className="p-0 text-center font-bold text-[#0FB880]">
                    {formatLakhLitres(circle.water)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Card>

      <div className={`${FILL_COLUMN} min-w-0 gap-[0.3125rem] dark:gap-2`}>
        <NodeSummaryPanel
          name={regionLabel}
          tiles={[
            { label: "Number of Circle", value: roll.counts.circles, icon: <ThemedImg name="tier-circle" w={25} h={22} /> },
            { label: "Number of Division", value: roll.counts.divisions, icon: <ThemedImg name="tier-division" w={25} h={25} /> },
            { label: "Number of Sub Division", value: roll.counts.subDivisions, icon: <ThemedImg name="tier-subdivision" w={25} h={22} /> },
            { label: "Number of Block", value: roll.counts.blocks, icon: <ThemedImg name="tier-block" w={30} h={25} /> },
            { label: "Number of Scheme", value: roll.counts.schemes, icon: <ThemedImg name="tier-scheme" w={31} h={25} /> },
          ]}
        />
        <CoveragePanel roll={roll} />
        <ReservoirPanel roll={roll} />
        <FunctionalityRow roll={roll} />
        <PerformanceKpiCard
          title="Scheme Performance (KPIs)"
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
