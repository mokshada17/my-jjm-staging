import { CommStatusMatrix } from "@/entities/telemetry";
import { TableCell } from "@/shared/components/ui";
import { DEFAULT_COMM_STATUS_MATRIX } from "@/entities/telemetry/utils";
import { PressureIcon } from "@/shared/assets/icons";
import { ThemedImg } from "@/shared/components/figma";

export interface CommStatusMatrixCellProps {
  status?: CommStatusMatrix;
}

export function CommStatusMatrixCell({
  status = DEFAULT_COMM_STATUS_MATRIX,
}: CommStatusMatrixCellProps) {
  return (
    <TableCell colSpan={3} className="py-2 px-3">
      <div className="space-y-1.5 font-mono text-[0.6875rem]">
        {/* Chlorine Row */}
        <div className="grid grid-cols-4 items-center">
          <span className="w-4 h-4 rounded-full bg-[#0284C7] dark:bg-jjm-cyan-light text-white flex items-center justify-center text-[0.5rem] font-bold">
            CL
          </span>
          <span className="text-center font-bold text-[#008000] dark:text-[#24FF00]">
            {status.chlorine.h24}
          </span>
          <span className="text-center font-bold text-[#D97706] dark:text-[#FFA800]">
            {status.chlorine.h0To72}
          </span>
          <span className="text-center font-bold text-[#DC2626] dark:text-[#FF3838]">
            {status.chlorine.h72Plus}
          </span>
        </div>

        {/* Pressure Row */}
        <div className="grid grid-cols-4 items-center">
          <span className="flex items-center justify-center text-[#0284C7] dark:text-jjm-cyan">
            <PressureIcon width="0.75rem" height="0.75rem" />
          </span>
          <span className="text-center font-bold text-[#008000] dark:text-[#24FF00]">
            {status.pressure.h24}
          </span>
          <span className="text-center font-bold text-[#D97706] dark:text-[#FFA800]">
            {status.pressure.h0To72}
          </span>
          <span className="text-center font-bold text-[#DC2626] dark:text-[#FF3838]">
            {status.pressure.h72Plus}
          </span>
        </div>

        {/* Flow Row */}
        <div className="grid grid-cols-4 items-center">
          <span className="text-center text-xs text-[#0284C7] dark:text-jjm-cyan">≈</span>
          <span className="text-center font-bold text-[#008000] dark:text-[#24FF00]">
            {status.flow.h24}
          </span>
          <span className="text-center font-bold text-[#D97706] dark:text-[#FFA800]">
            {status.flow.h0To72}
          </span>
          <span className="text-center font-bold text-[#DC2626] dark:text-[#FF3838]">
            {status.flow.h72Plus}
          </span>
        </div>
      </div>
    </TableCell>
  );
}

/*
 * Grouped layout: the same matrix as four real columns - sensor icon, 24Hrs,
 * 0-72Hrs, >72Hrs - each stacking one 54px line per sensor, as in the Figma.
 */
const STROKE = "border-jjm-light-stroke dark:border-[#1F3146]";
const LINE = "h-[3.375rem] flex items-center justify-center";
const SENSORS = [
  { key: "chlorine", icon: <ThemedImg name="kpi-chlorine" w={20} h={20} /> },
  { key: "pressure", icon: <ThemedImg name="kpi-pressure" w={20} h={20} /> },
  { key: "flow", icon: <ThemedImg name="sensor-flow" w={20} h={16} /> },
] as const;

type Window = (s: CommStatusMatrix["flow"]) => number;

function WindowCell({ status, value, tone, last = false }: { status: CommStatusMatrix; value: Window; tone: string; last?: boolean }) {
  return (
    <TableCell className={`p-0 text-xs font-bold ${tone} ${last ? "" : `border-r ${STROKE}`}`}>
      <div className="divide-y divide-jjm-light-stroke dark:divide-[#1F3146]">
        {SENSORS.map(({ key }) => (
          <div key={key} className={LINE}>{value(status[key])}</div>
        ))}
      </div>
    </TableCell>
  );
}

export function CommStatusCells({ status = DEFAULT_COMM_STATUS_MATRIX }: CommStatusMatrixCellProps) {
  return (
    <>
      <TableCell className={`p-0 w-[2.5625rem] border-r ${STROKE}`}>
        <div className="divide-y divide-jjm-light-stroke dark:divide-[#1F3146]">
          {SENSORS.map(({ key, icon }) => (
            <div key={key} className={LINE}>{icon}</div>
          ))}
        </div>
      </TableCell>
      <WindowCell status={status} value={(s) => s.h24} tone="text-[#16A349] dark:text-[#21C45D]" />
      <WindowCell status={status} value={(s) => s.h0To72} tone="text-[#D97706] dark:text-[#FBBF23]" />
      <WindowCell status={status} value={(s) => s.h72Plus} tone="text-jjm-red" last />
    </>
  );
}
