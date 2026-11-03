import { useState, type ReactNode } from "react";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui";
import { BandCard, Panel, ThemedImg } from "@/shared/components/figma";
import { cn } from "@/shared/utils";
import { Link, useParams } from "react-router-dom";
import { Clock } from "lucide-react";
import { DashboardLayout } from "@/shared/components/layout";
import { useMediaQuery } from "@/shared/hooks";
import { ScadaHydraulicSchematic } from "@/widgets/scada-hydraulic-schematic/ScadaHydraulicSchematic";
import { useActiveHierarchyNode, labelFromRouteId } from "@/features/select-hierarchy-node";
import { useTierSummary } from "@/entities/overview";
import {
  formatBar,
  flowRateM3h,
  formatHours,
  formatLakhLitres,
  formatMgL,
  reservoirCapacity,
  reservoirType,
  toLakhLitres,
  villageKey,
  useAssetDetails,
} from "@/entities/hierarchy";
import {
  ConsumptionBarChart,
  ThresholdLineChart,
  FlowRateGauge,
  ChartState,
  MARKER_COLOR,
  gaugeMax,
} from "@/widgets/telemetry-charts-panel";
import { PopupTrend, TrendLink, esrTrendSet, type EsrTrendKind } from "@/widgets/pi-trend";
import {
  useWaterConsumptionSeries,
  useChlorineSeries,
  usePressureSeries,
  CHLORINE_LIMITS,
  PRESSURE_LIMITS_BAR,
  type SeriesPoint,
} from "@/entities/telemetry";

const PILL =
  "flex items-center justify-center h-[1.8125rem] w-[13.9375rem] rounded-md bg-jjm-blue-light text-sm font-bold normal-case text-white dark:h-[1.5625rem] dark:w-[13.75rem] dark:rounded dark:border dark:border-[#00BCD4]";
const BOX =
  "rounded-md border border-jjm-light-stroke dark:border-jjm-border bg-jjm-light-tile dark:bg-jjm-canvas flex items-center justify-center text-black dark:text-white";
/** Line Details grid cell: centred text on the panel stroke. */
const LINE_CELL = "p-0 text-center border-jjm-light-stroke dark:border-jjm-border";
const CHART_HEIGHT = 220;
/**
 * Legend lines each critical-parameter chart reserves above its plot while the
 * three sit side by side. Pressure's five thresholds wrap to two lines on a third of
 * a 1280-1680px screen, so all three keep room for two: the plots then start, and
 * their x axes sit, at the same height.
 */
const ROW_LEGEND_LINES = 2;

/** A totalizer reads as a running total, so the daily series is accumulated. */
function cumulative(points: SeriesPoint[]) {
  let total = 0;
  return points.map((p) => {
    total += p.value;
    return { time: p.label, value: total };
  });
}

function latest(points: SeriesPoint[] | undefined): number | undefined {
  return points?.length ? points[points.length - 1].value : undefined;
}

/** Figma shows Max/Min markers alongside the fixed Hi/Lo thresholds. */
function bound(points: SeriesPoint[] | undefined, kind: "max" | "min"): number {
  if (!points?.length) return 0;
  const values = points.map((p) => p.value);
  return kind === "max" ? Math.max(...values) : Math.min(...values);
}

function totalizerTotal(points: SeriesPoint[] | undefined): string {
  if (!points?.length) return "—";
  const total = points.reduce((sum, p) => sum + p.value, 0);
  return total.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export function EsrScadaDashboardPage() {
  const { id } = useParams();
  const { rows, rollup: roll, villages, name } = useTierSummary("ESR", id);
  const esr = rows[0];
  // Pass the resolved name back, like every other tier page: without it the node is
  // stored nameless and the page re-fetches at its village's (wider) scope.
  useActiveHierarchyNode({
    tier: "ESR",
    id: id ?? "esr",
    label: labelFromRouteId(id, "ESR"),
    name,
    row: esr,
  });

  // This reservoir's own village supply window, whatever scope the rollup covers.
  const supplyHours = esr ? (villages.get(villageKey(esr))?.avgSupplyHours ?? 0) : 0;

  // Once the reservoir is known, its asset row and its three series are each
  // fetched by name rather than by pulling a table and searching it.
  const esrScope = esr
    ? { scheme_id: esr.schemeId, village_name: esr.villageName, esr_name: esr.esrName }
    : {};
  const hasEsr = Boolean(esr);
  const { data: asset } = useAssetDetails(esrScope, hasEsr);

  // "Previous Day" is the second-to-last point of each 7-day series (guide §5).
  const previous = (series: { value: number }[]) =>
    series.length > 1 ? series[series.length - 2].value : 0;

  // The three series follow the reservoir in the route rather than the first row.
  const consumption = useWaterConsumptionSeries(esrScope, hasEsr);
  const chlorine = useChlorineSeries(esrScope, hasEsr);
  const pressure = usePressureSeries(esrScope, hasEsr);

  // A disabled query is not "loading", so the charts would flash their empty
  // state while the route is still being resolved. Treat that as loading too.
  const pendingEsr = !hasEsr;

  // PI Vision: clicking a chart or the gauge opens its popup trend.
  const [trend, setTrend] = useState<EsrTrendKind | null>(null);
  // xl and up the three charts are abreast and line up their axes (see ROW_LEGEND_LINES);
  // below it the bar chart has a row to itself and keeps its standalone look.
  const chartsAbreast = useMediaQuery("(min-width: 1280px)", true);
  const legendLines = chartsAbreast ? ROW_LEGEND_LINES : 0;
  const flowNow = esr ? flowRateM3h(esr.water.latest, supplyHours) : 0;

  const tile =
    "h-[2.5625rem] min-w-0 rounded-md border border-jjm-light-stroke dark:border-jjm-border bg-jjm-light-tile dark:bg-jjm-canvas px-1.5 flex flex-col justify-center text-black dark:text-white";
  const figure = (title: ReactNode, icon: ReactNode, prev: string, current: string) => (
    <BandCard title={title} icon={icon} bodyClassName="grid grid-cols-2 gap-[0.3125rem] p-[0.3125rem]">
      <div className={cn(BOX, "h-[1.9375rem] text-xs")}>Previous Day</div>
      <div className={cn(BOX, "h-[1.9375rem] text-xs")}>Current Day</div>
      <div className={cn(BOX, "h-[2.1875rem] text-base font-bold text-jjm-cyan")}>{prev}</div>
      <div className={cn(BOX, "h-[2.1875rem] text-base font-bold text-[#0FB880]")}>{current}</div>
    </BandCard>
  );

  return (
    // Figma 2:11688 / 2:13722: a 520px column of asset details beside an 890px one
    // of critical parameters, 10px apart.
    <DashboardLayout
      currentTier="ESR"
      contentClassName="grid grid-cols-1 xl:grid-cols-[520fr_890fr] gap-[0.625rem] px-[0.625rem] pt-[0.3125rem] pb-3 w-full max-w-[120rem] mx-auto items-stretch"
    >
      <div className="min-w-0 flex flex-col gap-[0.625rem]">
        {/* The reservoir's own box: name pill, its scheme and village */}
        <Panel
          title={<span className={PILL}>{esr?.esrName ?? "-"}</span>}
          headerClassName="h-[2.4375rem] dark:h-[2.1875rem]"
          bodyClassName="grid grid-cols-[347fr_151fr] gap-3 p-[0.3125rem]"
        >
          <div className={cn(tile, "text-xs font-semibold")}>
            Schema ID - Name :- {esr ? `${esr.schemeId} ${esr.schemeName}` : "-"}
          </div>
          <div className={tile}>
            <span className="text-[0.6875rem]">Village Name</span>
            <span className="text-xs font-bold">{esr?.villageName ?? "-"}</span>
          </div>
        </Panel>

        <Panel
          title="Reservoir Details"
          headerClassName="h-[2.1875rem]"
          bodyClassName="grid grid-cols-3 gap-[0.3125rem] p-[0.3125rem]"
        >
          {[
            ["Region", esr?.region],
            ["Circle", esr?.circle],
            ["Division", esr?.division],
            ["Sub Division", esr?.subDivision],
            ["Block", esr?.block],
            ["Habitation", esr?.villageName],
            ["Reservoir Type", esr ? reservoirType(esr.esrName) : undefined],
            ["Reservoir Category", asset?.reservoir_category],
            ["Reservoir Capacity", esr ? reservoirCapacity(esr.esrName) : undefined],
          ].map(([label, value]) => (
            <div key={label} className={tile}>
              <span className="text-[0.6875rem]">{label}</span>
              <span className="text-xs font-bold">{value ?? "-"}</span>
            </div>
          ))}
        </Panel>

        {/* Line Details beside Time Duration and Operator Details */}
        <Card className="rounded-lg overflow-hidden shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border grid grid-cols-[315fr_192fr] gap-[0.625rem] pr-[0.1875rem]">
          <div>
            <div className="h-[2.1875rem] flex items-center px-4 bg-jjm-light-bg dark:bg-jjm-surface">
              <h2 className="text-sm font-semibold uppercase text-jjm-blue-light dark:text-jjm-cyan">Line Details</h2>
            </div>
            <Table className="table-fixed text-xs">
              <TableHeader className="[&_tr]:border-jjm-light-stroke dark:[&_tr]:border-jjm-border">
                <TableRow className="h-11 hover:bg-transparent">
                  <TableHead className={cn(LINE_CELL, "h-auto border-r")} />
                  <TableHead className={cn(LINE_CELL, "h-auto border-r font-semibold text-black dark:text-white")}>Line Size</TableHead>
                  <TableHead className={cn(LINE_CELL, "h-auto font-semibold text-black dark:text-white")}>Line Materials</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-semibold text-black dark:text-white [&_tr]:border-jjm-light-stroke dark:[&_tr]:border-jjm-border">
                {[
                  ["Inlet Line", asset?.inlet_line_size, asset?.inlet_line_material],
                  ["Inlet Rising Line", asset?.inlet_rising_line_size, asset?.inlet_rising_line_material],
                  ["Distribution Line", asset?.distribution_line_size, asset?.distribution_line_material],
                  ["Outlet Line", asset?.outlet_line_size, asset?.outlet_line_material],
                ].map(([line, size, material]) => (
                  <TableRow key={line} className="h-11 hover:bg-transparent last:border-0">
                    <TableCell className={cn(LINE_CELL, "border-r")}>{line}</TableCell>
                    <TableCell className={cn(LINE_CELL, "border-r")}>{size ?? "-"}</TableCell>
                    <TableCell className={LINE_CELL}>{material ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-[0.625rem] py-[0.1875rem]">
            <BandCard
              title="Time Duration Water Supply"
              icon={<Clock className="w-4 h-4 text-jjm-blue-light dark:text-jjm-cyan" />}
              bandClassName="h-[2.1875rem] justify-center"
              bodyClassName="h-[4.375rem] flex items-center justify-center text-xs font-semibold text-[#0FB880]"
            >
              {formatHours(roll.avgSupplyHours).replace("Hours", "hours")}
            </BandCard>
            <BandCard
              title="Operator Details"
              bandClassName="h-[2.1875rem] justify-center"
              titleClassName="text-sm"
              bodyClassName="px-1 py-2 space-y-3 text-[0.6875rem] font-semibold text-black dark:text-white"
            >
              <p>
                Operator Name :-
                <br />
                {asset?.operator_name ?? "-"}
              </p>
              <p>
                Contact Number :-
                <br />
                {asset?.operator_contact ?? "-"}
              </p>
            </BandCard>
          </div>
        </Card>

        {/* ESR process diagram (ESR_Flow), dots coloured by each sensor's latest
            reading. It takes the column's spare height, centred. */}
        <ScadaHydraulicSchematic esr={esr} className="xl:grow" />
      </div>

      <div className="min-w-0 flex flex-col gap-[0.625rem]">
        <div className="relative h-[2.1875rem] flex items-center justify-center bg-jjm-light-bg dark:bg-jjm-surface">
          <h2 className="text-sm font-semibold uppercase text-jjm-blue-light dark:text-jjm-cyan">Critical Parameters</h2>
          {/* PI Vision links this caption to the three-sensor trend display. */}
          <Link
            to={`/dashboard/esr/${id ?? ""}/sensor-fusion`}
            className="absolute right-9 text-[0.6875rem] font-semibold text-black dark:text-white hover:underline focus-visible:underline outline-none"
          >
            Sensor Fusion Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-[0.3125rem]">
          {figure(
            <>
              Water Consumption Per
              <br />
              Day (LL)
            </>,
            <ThemedImg name="water-hand" w={26} h={25} />,
            esr ? formatLakhLitres(previous(esr.water.series)) : "-",
            esr ? formatLakhLitres(esr.water.latest) : "-",
          )}
          {figure(
            "Chlorine(mg/l)",
            <ThemedImg name="kpi-chlorine" w={20} h={20} />,
            esr ? formatMgL(previous(esr.chlorine.series)) : "-",
            esr ? formatMgL(esr.chlorine.latest) : "-",
          )}
          {figure(
            "Pressure(Bar)",
            <ThemedImg name="kpi-pressure" w={20} h={20} />,
            esr ? formatBar(previous(esr.pressure.series)) : "-",
            esr ? formatBar(esr.pressure.latest) : "-",
          )}
        </div>

        {/* Figma: three abreast. Below xl the page is one column, so on tablets the
            bar chart takes a full-width row (its seven value labels collided at a
            third of the width) with Chlorine and Pressure side by side under it;
            below md all three stack. */}
        {/* This row and the flow row below share the column's spare height: the
            charts grow into it when the page fills the screen. */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[0.3125rem] xl:grow">
          <BandCard
            title="Water Consumption (LL)"
            icon={<ThemedImg name="water-hand" w={26} h={25} />}
            className="md:col-span-2 xl:col-span-1"
            bodyClassName="p-1 flex flex-col"
          >
            <ChartState
              isLoading={pendingEsr || consumption.isLoading}
              isError={consumption.isError}
              isEmpty={!consumption.data?.length}
              height={CHART_HEIGHT}
              grow
            >
              <TrendLink label="Open Water Consumption trend" onOpen={() => setTrend("water")}>
                <ConsumptionBarChart
                  // The series is in litres; the card and the tiles above read lakh litres.
                  data={(consumption.data ?? []).map((p) => ({ date: p.label, value: toLakhLitres(p.value) }))}
                  height={CHART_HEIGHT}
                  yName="Water Comption"
                  xName="Date"
                  layout={chartsAbreast ? "row" : "standalone"}
                  legendLines={legendLines}
                  grow
                />
              </TrendLink>
            </ChartState>
          </BandCard>
          <BandCard title="Chlorine(mg/l)" icon={<ThemedImg name="kpi-chlorine" w={20} h={20} />} bodyClassName="p-1 flex flex-col">
            <ChartState
              isLoading={pendingEsr || chlorine.isLoading}
              isError={chlorine.isError}
              isEmpty={!chlorine.data?.length}
              height={CHART_HEIGHT}
              grow
            >
              <TrendLink label="Open Chlorine trend" onOpen={() => setTrend("chlorine")}>
                <ThresholdLineChart
                  data={(chlorine.data ?? []).map((p) => ({ time: p.label, value: p.value }))}
                  height={CHART_HEIGHT}
                  legendLines={legendLines}
                  grow
                  unit="mg/l"
                  actual={`Actual:- ${latest(chlorine.data)?.toFixed(2) ?? "0.00"}mg/L`}
                  axisName="Chlorine (mg/l)"
                  markers={[
                    { label: `Max- ${bound(chlorine.data, "max").toFixed(2)} mg/l`, value: bound(chlorine.data, "max"), color: MARKER_COLOR.bound },
                    { label: `Min- ${bound(chlorine.data, "min").toFixed(2)} mg/l`, value: bound(chlorine.data, "min"), color: MARKER_COLOR.bound },
                    { label: `Hi- ${CHLORINE_LIMITS.hi} mg/l`, value: CHLORINE_LIMITS.hi, color: MARKER_COLOR.hi },
                    { label: `Lo- ${CHLORINE_LIMITS.lo} mg/l`, value: CHLORINE_LIMITS.lo, color: MARKER_COLOR.lo },
                  ]}
                />
              </TrendLink>
            </ChartState>
          </BandCard>
          <BandCard title="Pressure(Bar)" icon={<ThemedImg name="kpi-pressure" w={20} h={20} />} bodyClassName="p-1 flex flex-col">
            <ChartState
              isLoading={pendingEsr || pressure.isLoading}
              isError={pressure.isError}
              isEmpty={!pressure.data?.length}
              height={CHART_HEIGHT}
              grow
            >
              <TrendLink label="Open Pressure trend" onOpen={() => setTrend("pressure")}>
                <ThresholdLineChart
                  data={(pressure.data ?? []).map((p) => ({ time: p.label, value: p.value }))}
                  height={CHART_HEIGHT}
                  legendLines={legendLines}
                  grow
                  unit="bar"
                  actual={`Actual:- ${latest(pressure.data)?.toFixed(1) ?? "0.0"} bar`}
                  axisName="Pressure (bar)"
                  markers={[
                    { label: `Max- ${bound(pressure.data, "max").toFixed(2)} bar`, value: bound(pressure.data, "max"), color: MARKER_COLOR.bound },
                    { label: `Min- ${bound(pressure.data, "min").toFixed(2)} bar`, value: bound(pressure.data, "min"), color: MARKER_COLOR.bound },
                    { label: `Hi- ${PRESSURE_LIMITS_BAR.hi} bar`, value: PRESSURE_LIMITS_BAR.hi, color: MARKER_COLOR.hi },
                    { label: `HiHi- ${PRESSURE_LIMITS_BAR.hiHi} bar`, value: PRESSURE_LIMITS_BAR.hiHi, color: MARKER_COLOR.lo },
                    { label: `Lo- ${PRESSURE_LIMITS_BAR.lo} bar`, value: PRESSURE_LIMITS_BAR.lo, color: MARKER_COLOR.bound },
                  ]}
                />
              </TrendLink>
            </ChartState>
          </BandCard>
        </div>

        <div className="grid grid-cols-2 gap-[0.375rem] xl:grow">
          <BandCard
            title="Flow Rate (m³/h)"
            icon={<ThemedImg name="sensor-flow" w={20} h={16} />}
            bodyClassName="px-3 pt-2 pb-3 flex items-center justify-center"
          >
            {/* Average rate while the supply ran: today's volume over its supply hours. */}
            <TrendLink label="Open Flow Rate trend" onOpen={() => setTrend("flow")}>
              <FlowRateGauge value={flowNow} unit="m³/h" height={250} />
            </TrendLink>
          </BandCard>
          <BandCard title="Totalizer Flow" icon={<ThemedImg name="esr-arrow" w={30} h={20} />} bodyClassName="px-3 pt-2 pb-2 flex flex-col">
            <ChartState
              isLoading={pendingEsr || consumption.isLoading}
              isError={consumption.isError}
              isEmpty={!consumption.data?.length}
              height={250}
              grow
            >
              <TrendLink label="Open Totalizer Flow trend" onOpen={() => setTrend("totalizer")}>
                <ThresholdLineChart
                  data={cumulative(consumption.data ?? [])}
                  height={250}
                  grow
                  actual={`Actual:- ${totalizerTotal(consumption.data)}`}
                  axisName="Totalizer Flow (m³)"
                />
              </TrendLink>
            </ChartState>
          </BandCard>
        </div>
      </div>

      {trend && (
        <PopupTrend
          esr={esr}
          set={esrTrendSet(trend, esr?.esrName ?? "", { flowMax: gaugeMax(flowNow) })}
          onClose={() => setTrend(null)}
        />
      )}
    </DashboardLayout>
  );
}
