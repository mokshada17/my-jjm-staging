import { VillageLevelKpiValues } from "@/entities/telemetry";
import { TableCell } from "@/shared/components/ui";
import { DEFAULT_VILLAGE_KPIS } from "@/entities/telemetry/utils";

export interface VillageLevelKpisCellsProps {
  kpis?: VillageLevelKpiValues;
}

// Figma overview rows: 14px counts in each band's colour, on #1F3146 / #E2E8EF strokes.
const CELL = "px-2 text-center text-sm font-semibold border-r border-jjm-light-stroke dark:border-[#1F3146]";
const GOOD = `${CELL} text-[#16A349] dark:text-[#21C45D]`;
const BAD = `${CELL} text-jjm-red`;
const WARN = `${CELL} text-[#D97706] dark:text-[#FBBF23]`;

export function VillageLevelKpisCells({
  kpis = DEFAULT_VILLAGE_KPIS,
}: VillageLevelKpisCellsProps) {
  return (
    <>
      {/* LPCD */}
      <TableCell className={GOOD}>{kpis.lpcdAbove55}</TableCell>
      <TableCell className={BAD}>{kpis.lpcdBelow55}</TableCell>

      {/* Chlorine */}
      <TableCell className={GOOD}>{kpis.chlorineIdeal}</TableCell>
      <TableCell className={BAD}>{kpis.chlorineLow}</TableCell>
      <TableCell className={WARN}>{kpis.chlorineHigh}</TableCell>

      {/* Pressure */}
      <TableCell className={GOOD}>{kpis.pressureHigh}</TableCell>
      <TableCell className={WARN}>{kpis.pressureModerate}</TableCell>
      <TableCell className={BAD}>{kpis.pressureLow}</TableCell>
    </>
  );
}
