import type { ReactNode } from "react";
import { TableCell } from "@/shared/components/ui";
import type { CommStatusMatrix, VillageLevelKpiValues } from "@/entities/telemetry";
import { CommStatusCells, CommStatusMatrixCell } from "./CommStatusMatrixCell";
import { VillageLevelKpisCells } from "./VillageLevelKpisCells";
import {
  CommStatusHeadCell,
  CommStatusSubCells,
  GroupedCommStatusSubCells,
  GroupedCommStatusTopCell,
  GroupedVillageKpisBandCells,
  GroupedVillageKpisGroupCells,
  GroupedVillageKpisTopCell,
  GroupedWaterConsumptionHeadCell,
  VillageKpisBandCells,
  VillageKpisHeadCell,
  WaterConsumptionHeadCell,
  WaterConsumptionSubCell,
} from "./VillageLevelKpisHeader";

/**
 * The column blocks shared across overview tables, drawn after a table's own
 * columns in the order given:
 *  - villageKpis       Village Level: LPCD, Chlorine, Pressure bands (8 columns)
 *  - waterConsumption  Water Consumption (1 column)
 *  - commStatus        Communication Status: 24Hrs, 0-72Hrs, >72Hrs (3 columns)
 */
export type OverviewSection = "villageKpis" | "waterConsumption" | "commStatus";

/** The fields a row needs for the sections it shows. */
export interface SectionRow {
  villageKpis?: VillageLevelKpiValues;
  waterConsumption?: string;
  commStatus?: CommStatusMatrix;
}

interface SectionDef {
  /** Columns the section occupies, for the loading row's colSpan. */
  span: number;
  head: ReactNode;
  /** Sub-header row cells (only drawn when the table has a sub-header row). */
  sub: ReactNode;
  cells: (row: SectionRow) => ReactNode;
  /** The section in the grouped (three header row) layout. */
  grouped: {
    span: number;
    /** Header rows 1-3; a cell covering the rows below it carries rowSpan. */
    top: ReactNode;
    middle?: ReactNode;
    bands?: ReactNode;
    cells?: (row: SectionRow) => ReactNode;
  };
}

export const SECTIONS: Record<OverviewSection, SectionDef> = {
  villageKpis: {
    span: 8,
    head: <VillageKpisHeadCell />,
    sub: <VillageKpisBandCells />,
    cells: (row) => <VillageLevelKpisCells kpis={row.villageKpis} />,
    grouped: {
      span: 8,
      top: <GroupedVillageKpisTopCell />,
      middle: <GroupedVillageKpisGroupCells />,
      bands: <GroupedVillageKpisBandCells />,
    },
  },
  waterConsumption: {
    span: 1,
    head: <WaterConsumptionHeadCell />,
    sub: <WaterConsumptionSubCell />,
    cells: (row) => (
      <TableCell className="py-4 px-3 text-sm font-semibold text-[#1D283B] dark:text-white text-center border-r border-jjm-light-stroke dark:border-[#1F3146]">
        {row.waterConsumption}
      </TableCell>
    ),
    grouped: { span: 1, top: <GroupedWaterConsumptionHeadCell /> },
  },
  commStatus: {
    span: 3,
    head: <CommStatusHeadCell />,
    sub: <CommStatusSubCells />,
    cells: (row) => <CommStatusMatrixCell status={row.commStatus} />,
    grouped: {
      span: 4,
      top: <GroupedCommStatusTopCell />,
      middle: <GroupedCommStatusSubCells />,
      cells: (row) => <CommStatusCells status={row.commStatus} />,
    },
  },
};

/** The standard trailing blocks of a tier overview table. */
export const STANDARD_SECTIONS: OverviewSection[] = ["villageKpis", "waterConsumption", "commStatus"];
