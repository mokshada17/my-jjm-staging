import { useState, type ReactNode } from "react";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui";
import { BandCard, Panel } from "@/shared/components/figma";
import { cn } from "@/shared/utils";
import { Link, useParams } from "react-router-dom";
import { Clock } from "lucide-react";
import {
  ChlorineIcon,
  FlowIcon,
  PressureIcon,
  TokenizerFlowIcon,
  WaterConsumptionIcon,
} from "@/shared/assets/icons";
import { DashboardLayout } from "@/shared/components/layout";
import { useMediaQuery } from "@/shared/hooks";
import { ScadaHydraulicSchematic } from "@/widgets/scada-hydraulic-schematic/ScadaHydraulicSchematic";
import {
  useActiveHierarchyNode,
  labelFromRouteId,
} from "@/features/select-hierarchy-node";
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
import {
  PopupTrend,
  TrendLink,
  esrTrendSet,
  useNow,
  useTrendData,
  type EsrTrendKind,
} from "@/widgets/pi-trend";
import { useAppStore } from "@/app/store";
import { formatDuration } from "@/shared/lib/timeRange";
import {
  useWaterConsumptionSeries,
  CHLORINE_LIMITS,
  PRESSURE_LIMITS_BAR,
  type TrendSample,
} from "@/entities/telemetry";

const PILL =
  "flex items-center justify-center h-[1.8125rem] w-[13.9375rem] rounded-md bg-jjm-blue-light text-sm font-bold normal-case text-white dark:h-[1.5625rem] dark:w-[13.75rem] dark:rounded dark:border dark:border-[#00BCD4]";
const BOX =
  "rounded-md border border-jjm-light-stroke dark:border-jjm-border bg-jjm-light-tile dark:bg-jjm-canvas flex items-center justify-center";
/** Line Details grid cell: centred text on the panel stroke. */
const LINE_CELL =
  "p-0 text-center border-jjm-light-stroke dark:border-jjm-border";
const CHART_HEIGHT = 220;
/**
 * Legend lines each critical-parameter chart reserves above its plot while the
 * three sit side by side. Pressure's compact summary uses three rows, so all three
 * keep the same reserve: the plots then start, and
 * their x axes sit, at the same height.
 */
const ROW_LEGEND_LINES = 3;

/** Figma shows Max/Min markers alongside the fixed Hi/Lo thresholds. */
function bound(points: { value: number }[], kind: "max" | "min"): number {
  if (!points.length) return 0;
  const values = points.map((p) => p.value);
  return kind === "max" ? Math.max(...values) : Math.min(...values);
}

/** Chlorine, pressure and totalizer plot PI's intraday traces over the page window (Figma: a Time axis). */
const LINE_TRACES = (["chlorine", "pressure", "totalizer"] as const).map((k) => esrTrendSet(k, "").traces[0]);
const pad = (n: number) => String(n).padStart(2, "0");

/** Time stamp "02/11/2026 02:46:12 PM" (DD/MM/YYYY, 12-hour). */
function axisTime(t: number): string {
  const d = new Date(t);
  const h = d.getHours();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(h % 12 || 12)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${h < 12 ? "AM" : "PM"}`;
}

/** PI Vision's trend footer: window start, its span ("1d"), window end, over the axis title. */
function TimeRangeCaption({ start, end }: { start: number; end: number }) {
  return (
    <>
      <span className="flex justify-between gap-2 whitespace-nowrap">
        <span>{axisTime(start)}</span>
        <span>{formatDuration(end - start)}</span>
        <span>{axisTime(end)}</span>
      </span>
      <span className="block">Time</span>
    </>
  );
}

/** Plotted samples on a time axis; a gap (no good data) is skipped. */
function timePoints(samples: TrendSample[]) {
  return samples
    .filter((s): s is { time: number; value: number } => s.value !== null)
    .map((s) => ({ time: axisTime(s.time), value: s.value }));
}

/** The running total at the window's end. */
function totalizerTotal(points: { value: number }[]): string {
  if (!points.length) return "—";
  return points[points.length - 1].value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const supplyHours = esr
    ? (villages.get(villageKey(esr))?.avgSupplyHours ?? 0)
    : 0;

  // Once the reservoir is known, its asset row and its three series are each
  // fetched by name rather than by pulling a table and searching it.
  const esrScope = esr
    ? {
        scheme_id: esr.schemeId,
        village_name: esr.villageName,
        esr_name: esr.esrName,
      }
    : {};
  const hasEsr = Boolean(esr);
  const { data: asset } = useAssetDetails(esrScope, hasEsr);

  // "Previous Day" is the second-to-last point of each 7-day series (guide §5).
  const previous = (series: { value: number }[]) =>
    series.length > 1 ? series[series.length - 2].value : 0;

  // The three series follow the reservoir in the route rather than the first row.
  const consumption = useWaterConsumptionSeries(esrScope, hasEsr);
  // Chlorine and pressure follow the page time bar, like the Sensor Fusion display.
  const windowMs = useAppStore((s) => s.windowMs);
  const windowEndsAt = useAppStore((s) => s.windowEndsAt);
  const now = useNow(60_000, windowEndsAt === null);
  const end = windowEndsAt ?? now;
  const start = end - windowMs;
  const [chlorine, pressure, totalizer] = useTrendData(esr, LINE_TRACES, { start, end }, hasEsr);
  const chlorinePoints = timePoints(chlorine.samples);
  const pressurePoints = timePoints(pressure.samples);
  const totalizerPoints = timePoints(totalizer.samples);

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
  const figure = (
    title: ReactNode,
    icon: ReactNode,
    prev: string,
    current: string,
  ) => (
    <BandCard
      title={title}
      icon={icon}
      bodyClassName="grid grid-cols-2 gap-[0.3125rem] p-[0.3125rem]"
    >
      <div className={cn(BOX, "h-[1.9375rem] text-xs text-black dark:text-white")}>Previous Day</div>
      <div className={cn(BOX, "h-[1.9375rem] text-xs text-black dark:text-white")}>Current Day</div>
      <div
        className={cn(BOX, "h-[2.1875rem] text-base font-bold text-jjm-cyan")}
      >
        {prev}
      </div>
      <div
        className={cn(BOX, "h-[2.1875rem] text-base font-bold text-[#0FB880]")}
      >
        {current}
      </div>
    </BandCard>
  );

  return (
    // Figma 2:11688 / 2:13722: a 520px column of asset details beside an 890px one
    // of critical parameters, 10px apart.
    <DashboardLayout
      currentTier="ESR"
      contentClassName="grid grid-cols-1 xl:grid-cols-[520fr_890fr] gap-2 p-2 w-full max-w-[120rem] mx-auto items-stretch"
    >
      <div className="min-w-0 flex flex-col gap-2">
        {/* The reservoir's own box: name pill, its scheme and village */}
        <Panel
          title={<span className={PILL}>{esr?.esrName ?? "-"}</span>}
          headerClassName="h-[2.4375rem] dark:h-[2.1875rem]"
          bodyClassName="grid grid-cols-[347fr_151fr] gap-2 p-2"
        >
          <div className={cn(tile, "text-xs font-semibold")}>
            Schema ID - Name :-{" "}
            {esr ? `${esr.schemeId} ${esr.schemeName}` : "-"}
          </div>
          <div className={tile}>
            <span className="text-[0.6875rem]">Village Name</span>
            <span className="text-xs font-bold">{esr?.villageName ?? "-"}</span>
          </div>
        </Panel>

        <Panel
          title="Reservoir Details"
          headerClassName="h-[2.1875rem]"
          bodyClassName="grid grid-cols-3 gap-2 p-2"
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
            [
              "Reservoir Capacity",
              esr ? reservoirCapacity(esr.esrName) : undefined,
            ],
          ].map(([label, value]) => (
            <div key={label} className={tile}>
              <span className="text-[0.6875rem]">{label}</span>
              <span className="text-xs font-bold">{value ?? "-"}</span>
            </div>
          ))}
        </Panel>

        {/* Line Details beside Time Duration and Operator Details */}
        <Card className="rounded-lg overflow-hidden shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border grid grid-cols-[315fr_192fr] gap-2 p-2">
          <div>
            <div className="h-[2.1875rem] flex items-center px-2 bg-jjm-light-bg dark:bg-jjm-surface">
              <h2 className="text-sm font-semibold text-jjm-blue-light dark:text-jjm-cyan">
                Line Details
              </h2>
            </div>
            <Table className="table-fixed text-xs">
              <TableHeader className="[&_tr]:border-jjm-light-stroke dark:[&_tr]:border-jjm-border">
                <TableRow className="h-11 hover:bg-transparent">
                  <TableHead className={cn(LINE_CELL, "h-auto border-r")} />
                  <TableHead
                    className={cn(
                      LINE_CELL,
                      "h-auto border-r font-semibold text-black dark:text-white",
                    )}
                  >
                    Line Size
                  </TableHead>
                  <TableHead
                    className={cn(
                      LINE_CELL,
                      "h-auto font-semibold text-black dark:text-white",
                    )}
                  >
                    Line Materials
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-semibold text-black dark:text-white [&_tr]:border-jjm-light-stroke dark:[&_tr]:border-jjm-border">
                {[
                  [
                    "Inlet Line",
                    asset?.inlet_line_size,
                    asset?.inlet_line_material,
                  ],
                  [
                    "Inlet Rising Line",
                    asset?.inlet_rising_line_size,
                    asset?.inlet_rising_line_material,
                  ],
                  [
                    "Distribution Line",
                    asset?.distribution_line_size,
                    asset?.distribution_line_material,
                  ],
                  [
                    "Outlet Line",
                    asset?.outlet_line_size,
                    asset?.outlet_line_material,
                  ],
                ].map(([line, size, material]) => (
                  <TableRow
                    key={line}
                    className="h-11 hover:bg-transparent last:border-0"
                  >
                    <TableCell className={cn(LINE_CELL, "border-r")}>
                      {line}
                    </TableCell>
                    <TableCell className={cn(LINE_CELL, "border-r")}>
                      {size ?? "-"}
                    </TableCell>
                    <TableCell className={LINE_CELL}>
                      {material ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-2 ">
            <BandCard
              title="Time Duration Water Supply"
              titleClassName="text-sm"
              icon={
                <Clock className="w-4 h-4 text-jjm-blue-light dark:text-jjm-cyan" />
              }
              bandClassName="h-[2.1875rem] justify-center"
              bodyClassName="h-[4.375rem] flex items-center justify-center text-sm font-semibold text-[#0FB880]"
            >
              {formatHours(roll.avgSupplyHours).replace("Hours", "hours")}
            </BandCard>
            <BandCard
              title="Operator Details"
              bandClassName="h-[2.1875rem] justify-center"
              titleClassName="text-sm"
              bodyClassName="p-2 space-y-3 text-[0.6875rem] font-semibold text-black dark:text-white"
            >
              <p>
                <span className="font-semibold text-slate-400 dark:text-slate-300">
                  Operator Name :-
                </span>
                <br />
                <span className="font-bold text-black dark:text-white">
                  {asset?.operator_name ?? "-"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-400 dark:text-slate-300">
                  Contact Number :-
                </span>
                <br />
                <span className="font-bold text-black dark:text-white">
                  {asset?.operator_contact ?? "-"}
                </span>
              </p>
            </BandCard>
          </div>
        </Card>

        {/* ESR process diagram (ESR_Flow), dots coloured by each sensor's latest
            reading. It takes the column's spare height, centred. */}
        <ScadaHydraulicSchematic esr={esr} className="xl:grow" />
      </div>

      <div className="min-w-0 flex flex-col gap-2">
        <div className="relative h-[2.1875rem] flex items-center justify-center bg-jjm-light-bg dark:bg-jjm-surface border border-[#CBD5E1] dark:border-jjm-border">
          <h2 className="text-sm font-semibold text-jjm-blue-light dark:text-jjm-cyan">
            Critical Parameters
          </h2>
          {/* PI Vision links this caption to the three-sensor trend display. */}
          <Link
            to={`/dashboard/esr/${id ?? ""}/sensor-fusion`}
            className="absolute right-9 text-xs font-semibold text-black dark:text-white hover:underline focus-visible:underline outline-none"
          >
            Sensor Fusion Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {figure(
            <>
              Water Consumption Per
              <br />
              Day (LL)
            </>,
            <WaterConsumptionIcon width={30} height={30} />,
            esr ? formatLakhLitres(previous(esr.water.series)) : "-",
            esr ? formatLakhLitres(esr.water.latest) : "-",
          )}
          {figure(
            "Chlorine(mg/l)",
            <ChlorineIcon width={30} height={25} />,
            esr ? formatMgL(previous(esr.chlorine.series)) : "-",
            esr ? formatMgL(esr.chlorine.latest) : "-",
          )}
          {figure(
            "Pressure(Bar)",
            <PressureIcon
              width={30}
              height={25}
              className="shrink-0"
              aria-hidden="true"
            />,
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 xl:grow">
          <BandCard
            title="Water Consumption (LL)"
            icon={<WaterConsumptionIcon width={30} height={30} />}
            className="md:col-span-2 xl:col-span-1"
            bodyClassName="p-2 flex flex-col"
          >
            <ChartState
              isLoading={pendingEsr || consumption.isLoading}
              isError={consumption.isError}
              isEmpty={!consumption.data?.length}
              height={CHART_HEIGHT}
              grow
            >
              <TrendLink
                label="Open Water Consumption trend"
                onOpen={() => setTrend("water")}
              >
                <ConsumptionBarChart
                  // The series is in litres; the card and the tiles above read lakh litres.
                  data={(consumption.data ?? []).map((p) => ({
                    date: p.label,
                    value: toLakhLitres(p.value),
                  }))}
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
          <BandCard
            title="Chlorine(mg/l)"
            icon={<ChlorineIcon width={30} height={25} />}
            bodyClassName="p-1 flex flex-col"
          >
            <ChartState
              isLoading={pendingEsr || chlorine.isLoading}
              isError={chlorine.isError}
              isEmpty={!chlorinePoints.length}
              height={CHART_HEIGHT}
              grow
            >
              <TrendLink
                label="Open Chlorine trend"
                onOpen={() => setTrend("chlorine")}
              >
                <ThresholdLineChart
                  data={chlorinePoints}
                  height={CHART_HEIGHT}
                  legendLines={legendLines}
                  summaryLayout="chlorine"
                  grow
                  unit="mg/l"
                  actualValue={`${esr?.chlorine.latest.toFixed(2) ?? "0.00"}mg/L`}
                  axisName={<TimeRangeCaption start={start} end={end} />}
                  hideXLabels
                  yAxisName="Chlorine (mg/l)"
                  markers={[
                    {
                      label: `Max- ${bound(chlorinePoints, "max").toFixed(2)} mg/l`,
                      value: bound(chlorinePoints, "max"),
                      color: MARKER_COLOR.bound,
                      position: { column: 1, row: 1 },
                    },
                    {
                      label: `Min- ${bound(chlorinePoints, "min").toFixed(2)} mg/l`,
                      value: bound(chlorinePoints, "min"),
                      color: MARKER_COLOR.bound,
                      position: { column: 1, row: 2 },
                    },
                    {
                      label: `Hi- ${CHLORINE_LIMITS.hi} mg/l`,
                      value: CHLORINE_LIMITS.hi,
                      color: MARKER_COLOR.hi,
                      position: { column: 2, row: 1 },
                    },
                    {
                      label: `Lo- ${CHLORINE_LIMITS.lo} mg/l`,
                      value: CHLORINE_LIMITS.lo,
                      color: MARKER_COLOR.lo,
                      position: { column: 2, row: 2 },
                    },
                  ]}
                />
              </TrendLink>
            </ChartState>
          </BandCard>
          <BandCard
            title="Pressure(Bar)"
            icon={<PressureIcon width={30} height={25} />}
            bodyClassName="p-1 flex flex-col"
          >
            <ChartState
              isLoading={pendingEsr || pressure.isLoading}
              isError={pressure.isError}
              isEmpty={!pressurePoints.length}
              height={CHART_HEIGHT}
              grow
            >
              <TrendLink
                label="Open Pressure trend"
                onOpen={() => setTrend("pressure")}
              >
                <ThresholdLineChart
                  data={pressurePoints}
                  height={CHART_HEIGHT}
                  legendLines={legendLines}
                  summaryLayout="pressure"
                  grow
                  unit="bar"
                  // The §5.2 reading is metres of head, as the Current Day tile shows it.
                  actualValue={esr ? formatBar(esr.pressure.latest) : "0.00 bar"}
                  axisName={<TimeRangeCaption start={start} end={end} />}
                  hideXLabels
                  yAxisName="Pressure (bar)"
                  markers={[
                    {
                      label: `Max- ${bound(pressurePoints, "max").toFixed(2)} bar`,
                      value: bound(pressurePoints, "max"),
                      color: MARKER_COLOR.bound,
                      position: { column: 1, row: 1 },
                    },
                    {
                      label: `Min- ${bound(pressurePoints, "min").toFixed(2)} bar`,
                      value: bound(pressurePoints, "min"),
                      color: MARKER_COLOR.bound,
                      position: { column: 1, row: 2 },
                    },
                    {
                      label: `Hi- ${PRESSURE_LIMITS_BAR.hi} bar`,
                      value: PRESSURE_LIMITS_BAR.hi,
                      color: MARKER_COLOR.hi,
                      position: { column: 2, row: 2 },
                    },
                    {
                      label: `HiHi- ${PRESSURE_LIMITS_BAR.hiHi} bar`,
                      value: PRESSURE_LIMITS_BAR.hiHi,
                      color: MARKER_COLOR.lo,
                      position: { column: 2, row: 1 },
                    },
                    {
                      label: `Lo- ${PRESSURE_LIMITS_BAR.lo} bar`,
                      value: PRESSURE_LIMITS_BAR.lo,
                      color: MARKER_COLOR.bound,
                      position: { column: 2, row: 3 },
                    },
                  ]}
                />
              </TrendLink>
            </ChartState>
          </BandCard>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grow">
          <BandCard
            title="Flow Rate (m³/h)"
            icon={<FlowIcon width={20} height={20} />}
            bodyClassName="p-2 flex items-center justify-center"
          >
            {/* Average rate while the supply ran: today's volume over its supply hours. */}
            <TrendLink
              label="Open Flow Rate trend"
              onOpen={() => setTrend("flow")}
            >
              <FlowRateGauge value={flowNow} unit="m³/h" height={250} />
            </TrendLink>
          </BandCard>
          <BandCard
            title="Totalizer Flow"
            icon={
              <TokenizerFlowIcon
                width={25}
                height={30}
                className="shrink-0"
                aria-hidden="true"
              />
            }
            bodyClassName="p-2 flex flex-col"
          >
            <ChartState
              isLoading={pendingEsr || totalizer.isLoading}
              isError={totalizer.isError}
              isEmpty={!totalizerPoints.length}
              height={250}
              grow
            >
              <TrendLink
                label="Open Totalizer Flow trend"
                onOpen={() => setTrend("totalizer")}
              >
                <ThresholdLineChart
                  data={totalizerPoints}
                  height={250}
                  grow
                  unit="m³"
                  actualValue={totalizerTotal(totalizerPoints)}
                  axisName={<TimeRangeCaption start={start} end={end} />}
                  hideXLabels
                  yAxisName="Totalizer Flow (m³)"
                />
              </TrendLink>
            </ChartState>
          </BandCard>
        </div>
      </div>

      {trend && (
        <PopupTrend
          esr={esr}
          set={esrTrendSet(trend, esr?.esrName ?? "", {
            flowMax: gaugeMax(flowNow),
          })}
          onClose={() => setTrend(null)}
        />
      )}
    </DashboardLayout>
  );
}
