import { useParams } from "react-router-dom";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui";
import {
  useActiveHierarchyNode,
  useOpenHierarchyNode,
  labelFromRouteId,
} from "@/features/select-hierarchy-node";
import { DashboardLayout } from "@/shared/components/layout";
import { FILL_COLUMN } from "@/shared/components/figma";
import { CircleIcon, LpcdIcon, DivisionIcon, SubDivisionIcon, BlockIcon, SchemeIcon, WaterConsumptionIcon } from "@/shared/assets/icons";
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

const HEAD = "h-auto p-0 text-xs leading-[0.8125rem] font-semibold text-jjm-blue-light dark:text-jjm-cyan";

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
      contentClassName="grid grid-cols-1 xl:grid-cols-[640fr_755fr] xl:dark:grid-cols-[641fr_756fr] gap-2 p-2 w-full max-w-[120rem] mx-auto items-stretch"
    >
      <Card className="rounded-lg shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border p-2 flex flex-col gap-2">
        {/* Region district map, projected from real boundaries */}
        {/* Takes the card's spare height when the page fills the screen. */}
        <RegionDistrictMap map={stateMap} regionId={id} className="min-h-[25rem] xl:grow" />

        <CommStatusPanel roll={roll}  bandClassName="h-[2.1875rem] dark:h-[2.1875rem]" />

        {/* Circle table: its column headings sit inside the title strip */}
        <Card className="rounded-lg shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border ">
          <Table className="table-fixed ">
            <TableHeader className="[&_tr]:border-0">
              <TableRow className="h-[2.375rem] bg-jjm-light-bg  dark:bg-jjm-surface hover:bg-jjm-light-bg dark:hover:bg-jjm-surface">
                <TableHead className={`${HEAD} w-[31%] text-left p-2`}>
                  <span className="inline-flex items-center gap-2">
                    <CircleIcon width={25} height={25} />
                    Circle
                  </span>
                </TableHead>
                <TableHead className={`${HEAD} w-[36%] text-center`}>
                  <span className="inline-flex items-center gap-[0.4375rem]">
                    <LpcdIcon width={30} height={25} />
                    <span>
                      Liter Per Capita day (LPCD)
                      <br />
                      -Previous Day
                    </span>
                  </span>
                </TableHead>
                <TableHead className={`${HEAD} w-[33%] text-center`}>
                  <span className="inline-flex items-center gap-[0.4375rem]">
                    <WaterConsumptionIcon  width={40} height={30} />
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
                  <TableCell className="p-3 text-black dark:text-white">{circle.name}</TableCell>
                  <TableCell className="p-3 text-center font-bold text-black dark:text-white">
                    {formatLitres(circle.water)}
                  </TableCell>
                  <TableCell className="p-3 text-center font-bold text-[#0FB880]">
                    {formatLakhLitres(circle.water)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Card>

      <div className={`${FILL_COLUMN} min-w-0 gap-2`}>
        <NodeSummaryPanel
          name={regionLabel}
          tiles={[
            { label: "Number of Circle", value: roll.counts.circles, icon: <CircleIcon width={25} height={22} /> },
            { label: "Number of Division", value: roll.counts.divisions, icon: <DivisionIcon width={25} height={25} /> },
            { label: "Number of Sub Division", value: roll.counts.subDivisions, icon: <SubDivisionIcon width={25} height={25} /> },
            { label: "Number of Block", value: roll.counts.blocks, icon: <BlockIcon width={25} height={25} /> },
            { label: "Number of Scheme", value: roll.counts.schemes, icon: <SchemeIcon width={25} height={25} strokeWidth={20}  color="currentColor" className="text-[#0284C7] dark:text-jjm-cyan group-data-[current=true]:text-white"/> },
          ]}
        />
        <CoveragePanel roll={roll} />
        <ReservoirPanel roll={roll} />
        <FunctionalityRow roll={roll} />
        <PerformanceKpiCard
          title="Scheme Performance (KPI's)"
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
          title="Village Level Performance (KPI's)"
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
