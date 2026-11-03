import type { ComponentType } from "react";
import { useOpenHierarchyNode } from "@/features/select-hierarchy-node";
import {
  Card,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui";
import {
  ChlorineIcon,
  FlowIcon,
  PressureIcon,
  VillageIcon,
  WaterTankIcon,
} from "@/shared/assets/icons";
import {
  esrSensorHealth,
  formatBar,
  formatLakhLitres,
  formatMgL,
  type EsrRecord,
  type SensorHealth,
} from "@/entities/hierarchy";
import { rem } from "@/shared/lib";

type Sensor = "flow" | "chlorine" | "pressure";

interface VillageEsrTopologyProps {
  villageName: string;
  /** The village's reservoirs; one branch is drawn per row. */
  esrs: EsrRecord[];
  className?: string;
}

const DOT: Record<SensorHealth, string> = {
  ok: "bg-jjm-green",
  warn: "bg-jjm-amber",
  bad: "bg-jjm-red",
  offline: "bg-slate-400 dark:bg-slate-600",
};

/** What each band means for each sensor, for the tooltip and screen readers. */
const MEANING: Record<Sensor, Record<SensorHealth, string>> = {
  flow: { ok: "Supplying", warn: "Supplying", bad: "No flow", offline: "Offline" },
  chlorine: { ok: "Ideal (0.2-0.5)", warn: "Low (<0.2)", bad: "High (>0.5)", offline: "Offline" },
  pressure: { ok: "Standard", warn: "Over pressure", bad: "Low pressure", offline: "Offline" },
};

const SENSORS: {
  key: Sensor;
  label: string;
  Icon: ComponentType<{ width?: number | string; height?: number | string; "aria-hidden"?: boolean }>;
  /** Design px; drawn in rem so the glyphs scale on large screens. */
  size: [number, number];
  reading: (esr: EsrRecord) => string;
}[] = [
  { key: "flow", label: "Flow", Icon: FlowIcon, size: [30, 24], reading: (e) => formatLakhLitres(e.water.latest) },
  { key: "chlorine", label: "Chlorine", Icon: ChlorineIcon, size: [26, 26], reading: (e) => formatMgL(e.chlorine.latest) },
  { key: "pressure", label: "Pressure", Icon: PressureIcon, size: [26, 26], reading: (e) => formatBar(e.pressure.latest) },
];

/** Branch and trunk strokes of the tree. */
const LINE = "bg-slate-300 dark:bg-slate-500";

/**
 * Village -> reservoir tree for the Village dashboard: the village on the left,
 * a branch to each ESR's water tank, and per ESR a Flow / Chlorine / Pressure
 * panel whose dots colour by the latest reading (see `esrSensorHealth`).
 */
export function VillageEsrTopology({ villageName, esrs, className = "" }: VillageEsrTopologyProps) {
  // Opens the reservoir with its full ancestry, so its page fetches only its branch.
  const openNode = useOpenHierarchyNode();

  return (
    <TooltipProvider delayDuration={150}>
      <Card className={`p-4 flex items-center justify-center ${className}`}>
        {/* Village node */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-sm font-bold text-slate-900 dark:text-white">{villageName}</span>
          <VillageIcon width="3rem" height="2.375rem" aria-hidden />
        </div>

        {esrs.length === 0 ? (
          <span className="ml-8 text-xs text-slate-500 dark:text-slate-400">No reservoirs reported</span>
        ) : (
          <>
            {/* Stub from the village to the trunk */}
            <span className={`w-10 h-0.5 shrink-0 ${LINE}`} aria-hidden />

            <ul className="flex flex-col" aria-label={`Reservoirs in ${villageName}`}>
              {esrs.map((esr, i) => {
                const health = esrSensorHealth(esr);
                const first = i === 0;
                const last = i === esrs.length - 1;

                return (
                  <li key={esr.key} className="relative flex items-center gap-3 pl-10 py-1.5">
                    {/* Trunk: each row draws its share, so the line runs from the
                        first branch to the last and no further. */}
                    {!(first && last) && (
                      <span
                        aria-hidden
                        className={`absolute left-0 w-0.5 ${LINE} ${
                          first ? "top-1/2 bottom-0" : last ? "top-0 bottom-1/2" : "inset-y-0"
                        }`}
                      />
                    )}
                    {/* Branch */}
                    <span aria-hidden className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-0.5 ${LINE}`} />

                    <WaterTankIcon width="1.375rem" height="1.75rem" className="shrink-0" aria-hidden />

                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openNode(esr, "ESR")}
                        title={`View SCADA for ${esr.esrName}`}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-jjm-blue-light dark:hover:text-jjm-cyan transition"
                      >
                        {esr.esrName}
                      </button>

                      <div className="grid grid-cols-3 gap-x-10 gap-y-2 px-6 py-2.5 rounded-lg bg-jjm-light-surface dark:bg-jjm-surface border border-slate-200 dark:border-jjm-border">
                        {SENSORS.map(({ key, Icon, size }) => (
                          <div key={key} className="flex items-center justify-center h-7">
                            <Icon width={rem(size[0])} height={rem(size[1])} aria-hidden />
                          </div>
                        ))}
                        {SENSORS.map(({ key, label, reading }) => {
                          const state = health[key];
                          const text = `${label}: ${MEANING[key][state]}${
                            state === "offline" ? ` (last ${reading(esr)})` : ` - ${reading(esr)}`
                          }`;
                          return (
                            <div key={key} className="flex justify-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    role="img"
                                    tabIndex={0}
                                    aria-label={`${esr.esrName} ${text}`}
                                    data-health={state}
                                    className={`w-5 h-5 rounded-full shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-jjm-cyan ${DOT[state]}`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>{text}</TooltipContent>
                              </Tooltip>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>
    </TooltipProvider>
  );
}
