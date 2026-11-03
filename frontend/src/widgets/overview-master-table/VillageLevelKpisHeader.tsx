import type { ReactNode } from "react";
import { CommunicationIcon, WaterConsumptionIcon } from "@/shared/assets/icons";
import { TableHead } from "@/shared/components/ui";
import { ThemedImg } from "@/shared/components/figma";

/*
 * Header cells of the shared overview sections, one piece per section so a table
 * can include any of them (see sections.tsx). Each section has a top-row cell and
 * its sub-header row cells.
 */

/** Village Level: 8 columns - LPCD (2), Chlorine (3), Pressure (3). */
export function VillageKpisHeadCell() {
  return (
    <TableHead colSpan={8} className="py-2 px-3 text-center border-r border-slate-200 dark:border-jjm-border bg-[#E0F2FE] dark:bg-[#0E1A38] transition-colors duration-150">
      <span className="block text-[0.6875rem] font-bold text-jjm-blue-light dark:text-jjm-cyan mb-1">VILLAGE LEVEL</span>
      <div className="grid grid-cols-8 text-[0.5625rem] text-slate-600 dark:text-slate-300 font-normal">
        <span className="col-span-2 text-center text-jjm-blue-light dark:text-jjm-cyan font-semibold">LPCD</span>
        <span className="col-span-3 text-center text-jjm-blue-light dark:text-jjm-cyan font-semibold">Chlorine</span>
        <span className="col-span-3 text-center text-jjm-blue-light dark:text-jjm-cyan font-semibold">Pressure</span>
      </div>
    </TableHead>
  );
}

export function WaterConsumptionHeadCell() {
  return (
    <TableHead className="py-3 px-3 border-r border-slate-200 dark:border-jjm-border text-center text-jjm-blue-light dark:text-jjm-cyan">
      <span className="flex items-center justify-center gap-1">
        <WaterConsumptionIcon width="0.75rem" height="0.75rem" /> Water Consumption
      </span>
    </TableHead>
  );
}

/** Communication Status: 3 columns - 24Hrs, 0-72Hrs, >72Hrs. */
export function CommStatusHeadCell() {
  return (
    <TableHead colSpan={3} className="py-2 px-3 text-center bg-[#E0F2FE] dark:bg-[#0E1A38] transition-colors duration-150">
      <div className="flex items-center justify-center gap-1 text-jjm-blue-light dark:text-jjm-cyan mb-1">
        <CommunicationIcon width="0.75rem" height="0.75rem" />
        <span className="text-[0.625rem] font-bold">COMMUNICATION STATUS</span>
      </div>
      <div className="grid grid-cols-3 text-[0.5625rem] text-slate-600 dark:text-slate-300 font-normal">
        <span>24Hrs</span>
        <span>0Hrs-72Hrs</span>
        <span>&gt;72Hrs</span>
      </div>
    </TableHead>
  );
}

// Figma 2:12808 colour-codes each threshold band rather than rendering them all grey,
// and the pressure mid-band reads "2-0.5mh".
const BAND = "py-1 text-center border-r border-slate-200 dark:border-jjm-border/60 font-semibold";
const GOOD = "#22C55E";
const WARN = "#FBBF24";
const BAD = "#EF4444";

/** Village Level sub-header: the 8 threshold bands. `className` adds to every cell. */
export function VillageKpisBandCells({ className = "" }: { className?: string }) {
  return (
    <>
      <TableHead className={`${BAND} ${className}`} style={{ color: GOOD }}>&gt;55 LPCD</TableHead>
      <TableHead className={`${BAND} ${className}`} style={{ color: BAD }}>&lt;55 LPCD</TableHead>
      <TableHead className={`${BAND} text-[0.5rem] ${className}`} style={{ color: GOOD }}>0.2-0.5(mg/l)</TableHead>
      <TableHead className={`${BAND} text-[0.5rem] ${className}`} style={{ color: BAD }}>&lt;0.2mg/l</TableHead>
      <TableHead className={`${BAND} text-[0.5rem] ${className}`} style={{ color: WARN }}>&gt;0.5mg/l</TableHead>
      <TableHead className={`${BAND} ${className}`} style={{ color: GOOD }}>&gt;7mh</TableHead>
      <TableHead className={`${BAND} ${className}`} style={{ color: WARN }}>2-0.5mh</TableHead>
      <TableHead className={`py-1 text-center border-r border-slate-200 dark:border-jjm-border font-semibold ${className}`} style={{ color: BAD }}>&lt;2mh</TableHead>
    </>
  );
}

/** Water Consumption has no sub-bands: one empty sub-header cell. */
export function WaterConsumptionSubCell() {
  return <TableHead className="border-r border-slate-200 dark:border-jjm-border"></TableHead>;
}

/** Communication Status sub-header: its bands are already in the top cell. */
export function CommStatusSubCells() {
  return (
    <>
      <TableHead className="border-r border-slate-200 dark:border-jjm-border/60"></TableHead>
      <TableHead className="border-r border-slate-200 dark:border-jjm-border/60"></TableHead>
      <TableHead></TableHead>
    </>
  );
}

/**
 * All three section headers in their fixed order.
 * @deprecated Use OverviewTable with `sections`, which composes these per table.
 */
export function VillageLevelKpisHeader() {
  return (
    <>
      <VillageKpisHeadCell />
      <WaterConsumptionHeadCell />
      <CommStatusHeadCell />
    </>
  );
}

/**
 * All three section sub-headers in their fixed order.
 * @deprecated Use OverviewTable with `sections`, which composes these per table.
 */
export function VillageLevelKpisSubHeader() {
  return (
    <>
      <VillageKpisBandCells />
      <WaterConsumptionSubCell />
      <CommStatusSubCells />
    </>
  );
}

/*
 * Grouped layout (Figma 2:1824 / 2:7856 / 2:5460 / 2:5690 / 2:12808 / 2:12151 /
 * 2:12632 and their light twins): three header rows of 40 / 26 / 36px. Section
 * strips are #11243B (dark) / #0C8785 at 10% (light) over #1F3146 / #E2E8EF strokes.
 */
export const G_STROKE = "border-jjm-light-stroke dark:border-[#1F3146]";
const G_CELL = `border-r border-b ${G_STROKE} text-center align-middle`;
const G_STRIP = "bg-[#E6F2F2] dark:bg-[#11243B]";
const G_PLAIN = "bg-white dark:bg-jjm-canvas";
const G_TEXT = "text-jjm-blue-light dark:text-jjm-cyan";

/** Band colours on the frames: green / red / amber, the light green a shade deeper. */
const G_GOOD = "text-[#16A349] dark:text-[#21C45D]";
const G_BAD = "text-jjm-red";
const G_WARN = "text-[#D97706] dark:text-[#FBBF23]";

export function GroupedVillageKpisTopCell() {
  return (
    <TableHead colSpan={8} className={`${G_CELL} ${G_STRIP} ${G_TEXT} h-10 text-xs font-semibold uppercase`}>
      Village Level
    </TableHead>
  );
}

function GroupHead({ span, icon, label }: { span: number; icon: ReactNode; label: string }) {
  return (
    <TableHead colSpan={span} className={`${G_CELL} ${G_STRIP} ${G_TEXT} h-[1.625rem] p-0 text-[0.625rem] font-semibold`}>
      <span className="flex items-center justify-center gap-1.5">
        {icon}
        {label}
      </span>
    </TableHead>
  );
}

/** LPCD / Chlorine / Pressure, each over its bands. */
export function GroupedVillageKpisGroupCells() {
  return (
    <>
      <GroupHead span={2} icon={<ThemedImg name="kpi-lpcd" w={21} h={14} />} label="LPCD" />
      <GroupHead span={3} icon={<ThemedImg name="kpi-chlorine" w={16} h={16} />} label="Chlorine" />
      <GroupHead span={3} icon={<ThemedImg name="kpi-pressure" w={16} h={16} />} label="Pressure" />
    </>
  );
}

const G_BAND = `${G_CELL} ${G_PLAIN} h-9 px-1 font-semibold whitespace-nowrap`;

export function GroupedVillageKpisBandCells() {
  return (
    <>
      <TableHead className={`${G_BAND} text-[0.5625rem] ${G_GOOD}`}>&gt;55 LPCD</TableHead>
      <TableHead className={`${G_BAND} text-[0.5625rem] ${G_BAD}`}>&lt;55 LPCD</TableHead>
      <TableHead className={`${G_BAND} text-[0.5rem] leading-[0.625rem] ${G_GOOD}`}>
        0.2-
        <br />
        0.5(mg/l)
      </TableHead>
      <TableHead className={`${G_BAND} text-[0.5rem] ${G_BAD}`}>&lt;0.2mg/l</TableHead>
      <TableHead className={`${G_BAND} text-[0.5rem] ${G_WARN}`}>&gt;0.5mg/l</TableHead>
      <TableHead className={`${G_BAND} text-[0.5625rem] ${G_GOOD}`}>&gt;7mh</TableHead>
      <TableHead className={`${G_BAND} text-[0.5625rem] ${G_WARN}`}>2-0.5(pm)</TableHead>
      <TableHead className={`${G_BAND} text-[0.5625rem] ${G_BAD}`}>&lt;2mh</TableHead>
    </>
  );
}

/** Water Consumption covers all three header rows. */
export function GroupedWaterConsumptionHeadCell() {
  return (
    <TableHead rowSpan={3} className={`${G_CELL} ${G_PLAIN} ${G_TEXT} px-3 text-[0.625rem] font-semibold`}>
      <span className="flex items-center justify-center gap-1.5">
        <ThemedImg name="water-hand-small" w={18} h={13} />
        Water Consumption
      </span>
    </TableHead>
  );
}

/** Communication Status title across its icon column and three windows. */
export function GroupedCommStatusTopCell() {
  return (
    <TableHead colSpan={4} className={`border-b ${G_STROKE} ${G_STRIP} ${G_TEXT} h-10 text-center text-[0.625rem] font-semibold uppercase`}>
      <span className="flex items-center justify-center gap-1">
        <ThemedImg name="comm-antenna-light" dark="comm-antenna-dark" w={16} h={17} darkW={16} darkH={16} />
        Communication status
      </span>
    </TableHead>
  );
}

/** The sensor-icon column and one coloured column per window, covering two rows. */
export function GroupedCommStatusSubCells() {
  const sub = `${G_CELL} ${G_STRIP} px-1 text-[0.5625rem] font-semibold`;
  return (
    <>
      <TableHead rowSpan={2} className={`${sub} w-[2.5625rem]`} />
      <TableHead rowSpan={2} className={`${sub} w-[2.8125rem] ${G_GOOD}`}>24Hrs</TableHead>
      <TableHead rowSpan={2} className={`${sub} w-[2.8125rem] ${G_WARN}`}>
        0Hrs-
        <br />
        72Hrs
      </TableHead>
      <TableHead rowSpan={2} className={`border-b ${G_STROKE} ${G_STRIP} text-center px-1 text-[0.5625rem] font-semibold w-[2.625rem] ${G_BAD}`}>
        &gt;72Hrs
      </TableHead>
    </>
  );
}
