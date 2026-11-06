import { EsrFlowIcon } from "@/shared/assets/icons";
import type { ProcessStatus } from "@/shared/assets/icons/ESR_Flow";
import {
  esrSensorHealth,
  formatBar,
  formatLakhLitres,
  formatMgL,
  reservoirCapacity,
  type EsrRecord,
  type SensorHealth,
} from "@/entities/hierarchy";

interface ScadaHydraulicSchematicProps {
  /** The reservoir on screen; undefined while it is still resolving. */
  esr?: EsrRecord;
  className?: string;
}

const STATUS: Record<SensorHealth, ProcessStatus> = {
  ok: "ok",
  warn: "warning",
  bad: "error",
  offline: "offline",
};

/** Pipes stay cyan while water moves and go grey on a zero-flow day. */
const PIPE_FLOWING = "#00eeee";
const PIPE_DRY = "#7b8794";

/**
 * The ESR page's process diagram: the ESR_Flow artwork (tank -> flow meter ->
 * pressure sensor / RCA analyser -> households), filled with the reservoir's
 * latest readings. Each sensor's dot uses the same bands as the Village
 * topology (`esrSensorHealth`), so a reservoir reads the same on both pages.
 */
export function ScadaHydraulicSchematic({ esr, className = "" }: ScadaHydraulicSchematicProps) {
  const health = esr ? esrSensorHealth(esr) : undefined;

  return (
    <div
      className={`w-full rounded-xl bg-white dark:bg-jjm-canvas border border-slate-200 dark:border-jjm-border p-3 flex items-center justify-center select-none shadow-sm text-slate-700 dark:text-slate-100 ${className}`}
    >
      <EsrFlowIcon
        width="100%"
        height="auto"
        className="max-h-[18.75rem]"
        aria-label={esr ? `${esr.esrName} process diagram` : "ESR process diagram"}
        labelColor="currentColor"
        tankValue={esr ? reservoirCapacity(esr.esrName) : "-"}
        tankUnit=""
        // PI supplies a daily volume, not an instantaneous rate, and supply runs
        // about an hour a day - so the meter shows today's volume rather than an
        // hourly rate averaged over 24 hours.
        flowValue={esr ? formatLakhLitres(esr.water.latest) : "-"}
        flowUnit=""
        pressureValue={esr ? formatBar(esr.pressure.latest) : "-"}
        pressureUnit=""
        rcaValue={esr ? formatMgL(esr.chlorine.latest) : "-"}
        rcaUnit=""
        flowStatus={health ? STATUS[health.flow] : "offline"}
        pressureStatus={health ? STATUS[health.pressure] : "offline"}
        rcaStatus={health ? STATUS[health.chlorine] : "offline"}
        pipeColor={health?.flow === "bad" ? PIPE_DRY : PIPE_FLOWING}
        bottomStatus={esr?.esrName ?? ""}
      />
    </div>
  );
}
