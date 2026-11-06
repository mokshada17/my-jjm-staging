import type { ReactNode } from "react";
import { ChlorineIcon, CommunicationIcon, LpcdIcon, PressureIcon, WaterConsumptionIcon } from "@/shared/assets/icons";
import { TableHead } from "@/shared/components/ui";

/*
 * Header cells of the shared overview sections, one piece per section so a table
 * can include any of them (see sections.tsx). Each section has a top-row cell and
 * its sub-header row cells.
 */

/** Village Level: 8 columns - LPCD (2), Chlorine (3), Pressure (3). */
export function VillageKpisHeadCell() {
  return (
    <TableHead colSpan={8} className="py-2 px-3 text-center border-r border-slate-200 dark:border-jjm-border bg-[#E0F2FE] dark:bg-[#0E1A38] transition-colors duration-150">
      <span className="block text-sm font-bold text-jjm-blue-light dark:text-jjm-cyan mb-1">VILLAGE LEVEL</span>
      <div className="grid w-full grid-cols-8 text-xs text-slate-600 dark:text-slate-300 font-normal">
        <span className="col-span-2 text-center text-jjm-blue-light dark:text-jjm-cyan font-semibold text-xs">LPCD</span>
        <span className="col-span-3 text-center text-jjm-blue-light dark:text-jjm-cyan font-semibold text-xs">Chlorine</span>
        <span className="col-span-3 text-center text-jjm-blue-light dark:text-jjm-cyan font-semibold text-xs">Pressure</span>
      </div>
    </TableHead>
  );
}

export function WaterConsumptionHeadCell() {
  return (
    <TableHead
      className={`py-3 px-2 border-r border-slate-200 dark:border-jjm-border text-sm text-center text-jjm-blue-light dark:text-jjm-cyan ${WATER_COLUMN_W}`}
    >
      <span className="flex items-center justify-center gap-1">
        <WaterConsumptionIcon width={35} height={35}  />
        Water Consumption
      </span>
    </TableHead>
  );
}

/** Communication Status: 3 columns - 24Hrs, 0-72Hrs, >72Hrs. */
export function CommStatusHeadCell() {
  return (
    <TableHead colSpan={3} className="py-2 px-3 text-sm text-center bg-[#E0F2FE] dark:bg-[#0E1A38] transition-colors duration-150">
      <div className="flex items-center justify-center gap-1 text-jjm-blue-light dark:text-jjm-cyan mb-1">
        <CommunicationIcon width="1.5rem" height="1.5rem"  />
        <span className="text-sm font-bold">COMMUNICATION STATUS</span>
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
export const VILLAGE_KPI_COLUMN_W = "w-[3.75rem]";
export const COMM_STATUS_ICON_COLUMN_W = "w-[3rem]";
export const COMM_STATUS_VALUE_COLUMN_W = "w-[3.5rem]";
export const OVERVIEW_ICON_SIZE = 25;

const BAND = `py-1 px-1 ${VILLAGE_KPI_COLUMN_W} text-center border-r border-slate-200 dark:border-jjm-border/60 font-semibold `;
const GOOD = "#22C55E";
const WARN = "#FBBF24";
const BAD = "#EF4444";

/** Village Level sub-header: the 8 threshold bands. `className` adds to every cell. */
export function VillageKpisBandCells({ className = "" }: { className?: string }) {
  return (
    <>
      <TableHead
        className={`${BAND}  text-[0.5rem] ${className}`}
        style={{ color: GOOD }}
      >
        &gt;55 LPCD
      </TableHead>
      <TableHead className={`${BAND} ${className}`} style={{ color: BAD }}>
        &lt;55 LPCD
      </TableHead>
      <TableHead
        className={`${BAND} text-[0.5rem] ${className}`}
        style={{ color: GOOD }}
      >
        0.2–0.5 mg/l
      </TableHead>
      <TableHead
        className={`${BAND} text-[0.5rem] ${className}`}
        style={{ color: WARN }}
      >
        &lt;0.2 mg/l
      </TableHead>
      <TableHead
        className={`${BAND} text-[0.5rem] ${className}`}
        style={{ color: BAD }}
      >
        &gt;0.5 mg/l
      </TableHead>
      <TableHead className={`${BAND} ${className}`} style={{ color: GOOD }}>
        &gt;7mh
      </TableHead>
      <TableHead className={`${BAND} ${className}`} style={{ color: WARN }}>
        2-0.5mh
      </TableHead>
      <TableHead
        className={`py-1 text-center border-r border-slate-200 dark:border-jjm-border font-semibold ${className}`}
        style={{ color: BAD }}
      >
        &lt;2mh
      </TableHead>
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
// Slightly stronger dividers keep the grouped headers and communication bands distinct.
export const G_STROKE = "border-[#CBD5E1] dark:border-[#2A3D58]";
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
    <TableHead colSpan={8} className={`${G_CELL} ${G_STRIP} ${G_TEXT} h-10 text-sm font-semibold `}>
      Village Level
    </TableHead>
  );
}

function GroupHead({ span, icon, label }: { span: number; icon: ReactNode; label: string }) {
  return (
    <TableHead colSpan={span} className={`${G_CELL} ${G_STRIP} ${G_TEXT} h-[1.625rem] p-0 text-xs font-semibold`}>
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
      <GroupHead span={2} icon={<LpcdIcon width={OVERVIEW_ICON_SIZE} height={OVERVIEW_ICON_SIZE} className="object-contain" />} label="LPCD" />
      <GroupHead span={3} icon={<ChlorineIcon width={OVERVIEW_ICON_SIZE} height={OVERVIEW_ICON_SIZE} className="object-contain" />} label="Chlorine" />
      <GroupHead span={3} icon={<PressureIcon width={OVERVIEW_ICON_SIZE} height={OVERVIEW_ICON_SIZE} className="object-contain" />} label="Pressure" />
    </>
  );
}

const G_BAND = `${G_CELL} ${G_PLAIN} ${VILLAGE_KPI_COLUMN_W} h-9 px-1 font-semibold whitespace-normal`;

export function GroupedVillageKpisBandCells() {
  return (
    <>
      <TableHead className={`${G_BAND} text-xs ${G_GOOD}`}>&gt;55 LPCD</TableHead>
      <TableHead className={`${G_BAND} text-xs ${G_BAD}`}>&lt;55 LPCD</TableHead>
      <TableHead className={`${G_BAND} text-xs leading-[0.625rem] ${G_GOOD}`}>
        0.2–0.5
        <br />
        mg/l
      </TableHead>
      <TableHead className={`${G_BAND} text-xs ${G_WARN}`}>&lt;0.2 mg/l</TableHead>
      <TableHead className={`${G_BAND} text-xs ${G_BAD}`}>&gt;0.5 mg/l</TableHead>
      <TableHead className={`${G_BAND} text-xs ${G_GOOD}`}>&gt;7mh</TableHead>
      <TableHead className={`${G_BAND} text-xs ${G_WARN}`}>2-6.9mh</TableHead>
      <TableHead className={`${G_BAND} text-xs ${G_BAD}`}>&lt;2mh</TableHead>
    </>
  );
}

/**
 * The shared Water Consumption width for its header and body cells.
 */
export const WATER_COLUMN_W = "w-40";

/** Water Consumption icon width used by the compact overview cards. */
export const WATER_ICON_W = OVERVIEW_ICON_SIZE;

/** Water Consumption covers all three header rows. */
export function GroupedWaterConsumptionHeadCell() {
  return (
    <TableHead rowSpan={3} className={`${G_CELL} ${G_PLAIN} ${G_TEXT} px-2 text-sm font-semibold ${WATER_COLUMN_W}`}>
      <span className="flex items-center justify-center gap-1">
        {/* 4kscreen */}
        <WaterConsumptionIcon width={35} height={30} />
        Water Consumption
      </span>
    </TableHead>
  );
}

/** Communication Status title across its icon column and three windows. */
export function GroupedCommStatusTopCell() {
  return (
    <TableHead colSpan={4} className={`border-b ${G_STROKE} ${G_STRIP} ${G_TEXT} h-10 text-center text-sm font-semibold `}>
      <span className="flex items-center justify-center gap-1">
        {/* <ThemedImg name="comm-antenna-light" dark="comm-antenna-dark" w={OVERVIEW_ICON_SIZE} h={OVERVIEW_ICON_SIZE} darkW={OVERVIEW_ICON_SIZE} darkH={OVERVIEW_ICON_SIZE} className="object-contain" /> */}
        <CommunicationIcon width={OVERVIEW_ICON_SIZE} height={OVERVIEW_ICON_SIZE} />
        Communication status
      </span>
    </TableHead>
  );
}

/** The sensor-icon column and one coloured column per window, covering two rows. */
export function GroupedCommStatusSubCells() {
  const sub = `${G_CELL} ${G_STRIP} px-1 text-xs font-semibold`;
  return (
    <>
      <TableHead rowSpan={2} className={`${sub} ${COMM_STATUS_ICON_COLUMN_W}`} />
      <TableHead rowSpan={2} className={`${sub} ${COMM_STATUS_VALUE_COLUMN_W} ${G_GOOD}`}>24Hrs</TableHead>
      <TableHead rowSpan={2} className={`${sub} ${COMM_STATUS_VALUE_COLUMN_W} ${G_WARN}`}>
        0Hrs-
        <br />
        72Hrs
      </TableHead>
      <TableHead rowSpan={2} className={`border-b ${G_STROKE} ${G_STRIP} text-center px-1 text-xs font-semibold ${COMM_STATUS_VALUE_COLUMN_W} ${G_BAD}`}>
        &gt;72Hrs
      </TableHead>
    </>
  );
}
