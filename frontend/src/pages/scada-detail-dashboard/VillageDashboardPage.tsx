import { useParams } from "react-router-dom";
import {
  useActiveHierarchyNode,
  useOpenHierarchyNode,
  labelFromRouteId,
} from "@/features/select-hierarchy-node";
import { DashboardLayout } from "@/shared/components/layout";
import { FILL_COLUMN, Panel, StatTile, ThemedImg } from "@/shared/components/figma";
import { VillageEsrTopology } from "@/widgets/village-esr-topology";
import {
  AvgSupplyCard,
  CommStatusPanel,
  CriticalParameters,
  DetailTable,
  ReservoirPanel,
} from "@/widgets/tier-dashboard";
import { useTierSummary } from "@/entities/overview";
import {
  formatBar,
  formatHours,
  formatLakhLitres,
  formatMgL,
  formatPopulation,
  reservoirCapacity,
} from "@/entities/hierarchy";

const PILL =
  "flex items-center justify-center h-[1.8125rem] w-[13.9375rem] rounded-md bg-jjm-blue-light text-sm font-bold normal-case text-white dark:h-[1.5625rem] dark:w-[13.75rem] dark:rounded dark:border dark:border-[#00BCD4]";

/** Figma 2:11238 (dark) / 2:13270 (light). */
export function VillageDashboardPage() {
  // Child rows open with their full ancestry recorded, so the next page fetches
  // only its own branch from the mock server.
  const openNode = useOpenHierarchyNode();
  const { id } = useParams();
  const { rows, rollup: roll, name, isLoading, isError } = useTierSummary("Village", id);
  // Every row under this node shares its ancestry, so any one names its branch.
  const branch = rows[0];
  useActiveHierarchyNode({
    tier: "Village",
    id: id ?? "village",
    label: labelFromRouteId(id, "Village"),
    name,
    row: branch,
  });
  const villageName = rows[0]?.villageName ?? name ?? labelFromRouteId(id, "Village");

  const esrUnits = rows.map((r) => ({
    key: r.key,
    name: r.esrName,
    open: () => openNode(r, "ESR"),
    capacity: reservoirCapacity(r.esrName),
    chlorine: r.chlorine.latest,
    pressure: r.pressure.latest,
    water: r.water.latest,
  }));

  return (
    // A 615px column of the village's panels beside an 822px one of critical
    // parameters, 10px apart.
    <DashboardLayout
      currentTier="Village"
      contentClassName="grid grid-cols-1 xl:grid-cols-[615fr_822fr] gap-[0.625rem] px-[0.625rem] pt-[0.625rem] pb-3 w-full max-w-[120rem] mx-auto items-stretch"
    >
      <div className={`${FILL_COLUMN} min-w-0 gap-[0.625rem]`}>
        {/* The village's own box: name pill, its scheme, households and people */}
        <Panel
          title={<span className={PILL}>{villageName}</span>}
          headerClassName="h-[2.4375rem] dark:h-[2.1875rem]"
          bodyClassName="px-4 pt-3 pb-2 flex flex-col"
        >
          <p className="mb-3 text-xs font-semibold text-black dark:text-white">
            Scheme ID Name: {branch ? `${branch.schemeId}  - ${branch.schemeName}` : "-"}
          </p>
          <div className="grow grid grid-cols-2 gap-x-3">
            <StatTile
              className="min-h-[2.5625rem]"
              valueClassName="text-sm"
              icon={<ThemedImg name="tile-household-light" dark="tile-household-dark" w={34} h={25} darkW={36} darkH={27} />}
              label="Household"
              value={formatPopulation(roll.households)}
            />
            <StatTile
              className="min-h-[2.5625rem]"
              valueClassName="text-sm"
              icon={<ThemedImg name="tile-population-light" dark="tile-population-dark" w={25} h={25} darkW={27} darkH={27} />}
              label="Population"
              value={formatPopulation(roll.population)}
            />
          </div>
        </Panel>

        <Panel title="Village Details" bodyClassName="grid grid-cols-6 gap-x-3 gap-y-1 px-2 py-2">
          <StatTile className="col-span-2" label="Region" value={branch?.region ?? "-"} />
          <StatTile className="col-span-2" label="Circle" value={branch?.circle ?? "-"} />
          <StatTile className="col-span-2" label="Division" value={branch?.division ?? "-"} />
          <StatTile className="col-span-3" label="Sub-Division" value={branch?.subDivision ?? "-"} />
          <StatTile className="col-span-3" label="Block" value={branch?.block ?? "-"} />
        </Panel>
        <ReservoirPanel roll={roll} />

        <div className="grid grid-cols-[479fr_131fr] gap-[0.4375rem]">
          <CommStatusPanel roll={roll} className="px-[0.3125rem] pt-[0.3125rem]" bandClassName="dark:h-[2.1875rem]" />
          <AvgSupplyCard roll={roll} compact className="[&_h2]:whitespace-normal" />
        </div>

        {/* Village -> reservoir tree, dots coloured by each sensor's latest reading */}
        <VillageEsrTopology villageName={villageName} esrs={rows} />
      </div>

      {/* The charts keep their Figma size; the table below them takes the column's
          spare height when the page fills the screen. */}
      <div className="min-w-0 flex flex-col gap-[0.625rem]">
        <CriticalParameters roll={roll} rows={rows} isLoading={isLoading} isError={isError} subject={villageName} />

        <DetailTable
          className="xl:grow"
          rows={esrUnits}
          rowKey={(u) => u.key}
          rowTitle={(u) => `Drill down into ${u.name} live SCADA`}
          onOpen={(u) => u.open()}
          rowClassName="h-[3.125rem]"
          columns={[
            { id: "esr", header: "ESR Name", cell: (u) => u.name },
            { id: "capacity", header: "ESR Capacity", cell: (u) => u.capacity },
            {
              id: "chlorine",
              header: (
                <span className="inline-flex items-center gap-1.5">
                  <ThemedImg name="kpi-chlorine" w={17} h={17} />
                  Chlorine
                </span>
              ),
              cell: (u) => formatMgL(u.chlorine),
              className: "text-[#0FB880]",
            },
            {
              id: "pressure",
              header: (
                <span className="inline-flex items-center gap-1.5">
                  <ThemedImg name="kpi-pressure" w={17} h={17} />
                  Pressure
                </span>
              ),
              cell: (u) => formatBar(u.pressure),
              className: "text-[#0FB880]",
            },
            {
              id: "water",
              header: (
                <span className="inline-flex items-center gap-1.5">
                  <ThemedImg name="water-hand" w={26} h={25} />
                  <span>
                    Water Consumption
                    <br />( LL)
                    <br />
                    -Current Day
                  </span>
                </span>
              ),
              cell: (u) => formatLakhLitres(u.water),
              className: "text-[#0FB880]",
            },
            {
              id: "hours",
              header: "Water supply in Hours",
              cell: () => formatHours(roll.avgSupplyHours).replace("Hours", "hours"),
              className: "text-[#0FB880]",
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
