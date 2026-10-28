import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { DashboardLayout } from "@/shared/components/layout";
import { cn } from "@/shared/utils";
import { useAppStore } from "@/app/store";
import { useActiveHierarchyNode, labelFromRouteId } from "@/features/select-hierarchy-node";
import { useTierSummary } from "@/entities/overview";
import type { SensorComm } from "@/entities/hierarchy";
import {
  PiTrend,
  esrTrendSet,
  resolveDomains,
  useNow,
  useTrendData,
  type EsrTrendKind,
  type TrendZoom,
} from "@/widgets/pi-trend";

const PILL =
  "flex items-center justify-center h-[1.8125rem] min-w-0 px-3 rounded-md bg-jjm-blue-light text-sm font-bold text-white truncate dark:h-[1.5625rem] dark:rounded dark:border dark:border-[#00BCD4]";

const SENSORS: { kind: EsrTrendKind; label: string; comm: "chlorine" | "pressure" | "flow"; units: string }[] = [
  { kind: "chlorine", label: "Chlorine", comm: "chlorine", units: "mg/l" },
  { kind: "pressure", label: "Pressure", comm: "pressure", units: "bar" },
  { kind: "flow", label: "Flow Rate", comm: "flow", units: "m³/h" },
];

/** Communication status, as the dot beside each trend shows it. */
function commTone(c: SensorComm | undefined): { className: string; label: string } {
  if (c?.connected && c.online) return { className: "bg-jjm-green", label: "Online, reporting within 24 hours" };
  if (c?.connected && c.in0To72) return { className: "bg-jjm-amber", label: "Last reported 24 to 72 hours ago" };
  return { className: "bg-jjm-red", label: "Offline for more than 72 hours" };
}

/**
 * The PI Vision "JJM Sensor Fusion Dashboard": the reservoir's chlorine,
 * pressure and flow trends stacked on one time axis.
 *  - All three follow the page time bar.
 *  - A cursor dropped on one is dropped on all, so the three readings at one
 *    instant can be compared.
 *  - Dragging across any trend zooms the page's time range (the time bar then
 *    shows the zoomed span, e.g. "5h 3m").
 */
export function SensorFusionDashboardPage() {
  const { id } = useParams();
  const { rows, name } = useTierSummary("ESR", id);
  const esr = rows[0];
  useActiveHierarchyNode({
    tier: "ESR",
    id: id ?? "esr",
    label: labelFromRouteId(id, "ESR"),
    name,
    row: esr,
  });

  const windowMs = useAppStore((s) => s.windowMs);
  const windowEndsAt = useAppStore((s) => s.windowEndsAt);
  const setTimeWindow = useAppStore((s) => s.setTimeWindow);
  const live = windowEndsAt === null;
  const now = useNow(60_000, live);
  const end = windowEndsAt ?? now;
  const start = end - windowMs;

  const [defs] = useState(() => SENSORS.map((s) => esrTrendSet(s.kind, "").traces[0]));
  const traces = useTrendData(esr, defs, { start, end }, Boolean(esr));
  const [cursors, setCursors] = useState<number[]>([]);

  const onZoom = (z: TrendZoom) => setTimeWindow(z.start, z.end);

  return (
    <DashboardLayout
      currentTier="ESR"
      contentClassName="flex-1 w-full max-w-[120rem] mx-auto px-[0.625rem] pt-[0.3125rem] pb-3 flex flex-col"
    >
      <Card className="flex-1 min-h-[35rem] flex flex-col gap-2 p-2 rounded-lg shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border">
        {/* The label column is 110px with 14px labels from xl; on tablets it shrinks
            to 76px / 12px so the trends get the width. The pill row matches it. */}
        <div className="grid grid-cols-[4.75rem_minmax(0,350fr)_minmax(0,170fr)_minmax(0,170fr)] xl:grid-cols-[6.875rem_minmax(0,350fr)_minmax(0,170fr)_minmax(0,170fr)] gap-2">
          <span />
          <span className={PILL}>{esr ? `${esr.schemeId}  –  ${esr.schemeName}` : "-"}</span>
          <span className={PILL}>{esr?.villageName ?? "-"}</span>
          <span className={PILL}>{esr?.esrName ?? "-"}</span>
        </div>

        {SENSORS.map((sensor, i) => {
          const trace = traces[i];
          const tone = commTone(esr?.comm[sensor.comm]);
          const domains = resolveDomains({
            traces: [trace],
            start,
            end,
            layout: "single",
            mode: "auto",
            custom: {},
          });
          return (
            <div key={sensor.kind} className="flex-1 min-h-[10rem] grid grid-cols-[4.75rem_minmax(0,1fr)] xl:grid-cols-[6.875rem_minmax(0,1fr)] gap-2">
              <div className="flex items-center justify-between gap-1 pl-1 pr-1.5 xl:pl-2 xl:pr-3 text-xs xl:text-sm font-semibold text-black dark:text-white">
                <span className="whitespace-nowrap">{sensor.label}</span>
                <span
                  role="img"
                  aria-label={`${sensor.label}: ${tone.label}`}
                  className={cn("shrink-0 w-2.5 h-2.5 xl:w-3 xl:h-3 rounded-full", tone.className)}
                />
              </div>
              <div className="min-h-0 rounded-md border border-jjm-light-stroke dark:border-jjm-border bg-jjm-light-tile dark:bg-jjm-page">
                <PiTrend
                  traces={[trace]}
                  start={start}
                  end={end}
                  now={now}
                  domains={domains}
                  layout="single"
                  style="line-markers"
                  zoomMode="time"
                  cursors={cursors}
                  onCursorsChange={setCursors}
                  onZoom={onZoom}
                  showFooter
                  yLabel={sensor.units}
                  ariaLabel={`${sensor.label} trend`}
                />
              </div>
            </div>
          );
        })}
      </Card>
    </DashboardLayout>
  );
}
