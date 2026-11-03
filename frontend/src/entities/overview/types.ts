import { VillageLevelKpiValues, CommStatusMatrix } from "../telemetry/types";
import type { PathNode } from "../hierarchy/path";

export interface OverviewRowCommon {
  id: string;
  /** Maharashtra down to this row's node, for opening it with its branch scoped. */
  path: PathNode[];
  population: string;
  waterConsumption: string;
  villageKpis?: VillageLevelKpiValues;
  commStatus?: CommStatusMatrix;
}

export interface CircleOverviewRow extends OverviewRowCommon {
  region: string;
  circle: string;
  circleRoute: string;
  noOfDivision: number;
  noOfScheme: number;
  noOfVillage: number;
  noOfReservoir: number;
}

export interface DivisionOverviewRow extends OverviewRowCommon {
  circle: string;
  division: string;
  divisionRoute: string;
  noOfSubDivision: number;
  noOfScheme: number;
  noOfVillage: number;
  noOfReservoir: number;
}

export interface SubDivOverviewRow extends OverviewRowCommon {
  division: string;
  subDivision: string;
  subDivisionRoute: string;
  noOfBlock: number;
  noOfScheme: number;
  noOfVillage: number;
  noOfReservoir: number;
}

export interface BlockOverviewRow extends OverviewRowCommon {
  subDivision: string;
  block: string;
  blockRoute: string;
  noOfScheme: number;
  noOfVillage: number;
  noOfReservoir: number;
}

export interface SchemeOverviewRow extends OverviewRowCommon {
  blockName: string;
  schemeId: string;
  schemeName: string;
  schemeRoute: string;
  household: string;
  noOfVillage: number;
  noOfReservoir: number;
}

export interface VillageOverviewRow extends OverviewRowCommon {
  schemeNameBadge: string;
  schemeFullName: string;
  villageName: string;
  villageRoute: string;
  household: string;
  noOfReservoir: number;
  esr: number;
  mbr: number;
  gsr: number;
}

export interface EsrOverviewRow {
  /** Maharashtra down to this reservoir, for opening it with its branch scoped. */
  path: PathNode[];
  id: string;
  schemeId: string;
  schemeName: string;
  schemeSubtext: string;
  villageName: string;
  esrName: string;
  esrRoute: string;
  chlorine: string;
  pressure: string;
  waterConsumption: string;
  commStatus: CommStatusMatrix;
}
