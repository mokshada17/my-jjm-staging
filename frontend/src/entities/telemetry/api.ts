import { http, type RequestOptions } from "@/shared/api/http";
import { scopeParams, type HierarchyScope } from "../hierarchy/scope";

/**
 * The mock/PI datasets are "wide": one row per ESR carrying day1..day7 value and date
 * columns. These types mirror that shape; the mappers below flatten them into series.
 */
export interface WaterConsumptionRow {
  id: number;
  /** The AF root the row sits under; not in the single-state guide. */
  state: string;
  region: string;
  circle: string;
  division: string;
  scheme_id: string;
  village_name: string;
  esr_name: string;
  [key: string]: string | number;
}

export interface ChlorineRow extends WaterConsumptionRow {}
export interface PressureRow extends WaterConsumptionRow {}

/**
 * Not part of the PI guide - PI carries no demographic figures. Seeded in
 * db.json so LPCD and population roll up from data instead of literals.
 */
export interface DemographicsRow {
  id: number;
  state?: string;
  region: string;
  circle: string;
  division: string;
  sub_division: string;
  block: string;
  scheme_id: string;
  scheme_name: string;
  village_name: string;
  village_webid: string;
  population: number;
  households: number;
  avg_supply_hours: number;
  /** The village's scheme water source (a dam, river, well...). Not a PI figure. */
  water_source?: string;
}

/**
 * Asset register, not a PI table - PI carries no pipe schedules or operator
 * contacts. Seeded in db.json so the ESR dashboard has no literals.
 */
export interface AssetDetailsRow {
  id: number;
  scheme_id: string;
  village_name: string;
  esr_name: string;
  reservoir_category: string;
  inlet_line_size: string;
  inlet_line_material: string;
  inlet_rising_line_size: string;
  inlet_rising_line_material: string;
  distribution_line_size: string;
  distribution_line_material: string;
  outlet_line_size: string;
  outlet_line_material: string;
  operator_name: string;
  operator_contact: string;
}

export interface CommunicationStatusRow {
  id: number;
  scheme_id: string;
  village_name: string;
  esr_name: string;
  chlorine_connected: string;
  pressure_connected: string;
  flow_meter_connected: string;
  chlorine_status: string;
  pressure_status: string;
  flow_meter_status: string;
  chlorine_0h_72h: string;
  pressure_0h_72h: string;
  flow_meter_0h_72h: string;
  chlorine_72h: string;
  pressure_72h: string;
  flow_meter_72h: string;
  last_checked_at: string;
}

/**
 * Each getter takes a hierarchy scope, which the mock server applies as
 * `?region=...&circle=...` filters. Every scope names the state, so even the
 * State tier's request is one state's rows, never the whole table.
 *
 * Every table must come back as a JSON array: `getList` turns anything else into
 * an ApiError instead of handing it to the aggregation code. Pass React Query's
 * `signal` so a dropped query cancels its request.
 */
const table =
  <Row>(endpoint: string) =>
  (scope?: HierarchyScope, options?: RequestOptions) =>
    http.getList<Row>(endpoint, scopeParams(scope), options);

export const telemetryApi = {
  waterConsumption: table<WaterConsumptionRow>("/api/water-consumption"),
  chlorine: table<ChlorineRow>("/api/chlorine-data"),
  pressure: table<PressureRow>("/api/pressure-data"),
  communicationStatus: table<CommunicationStatusRow>("/api/communication-status"),
  demographics: table<DemographicsRow>("/api/demographics"),
  assetDetails: table<AssetDetailsRow>("/api/asset-details"),
};

export interface SeriesPoint {
  label: string;
  value: number;
}

/**
 * Flattens the day1..dayN column pairs of one row into an ordered series.
 * Stops at the first missing day so a 5-day row does not yield empty points.
 */
export function flattenDaySeries(
  row: Record<string, unknown> | undefined,
  valuePrefix: string,
  datePrefix: string,
  maxDays = 7
): SeriesPoint[] {
  if (!row) return [];
  const points: SeriesPoint[] = [];
  for (let day = 1; day <= maxDays; day++) {
    const value = row[`${valuePrefix}${day}`];
    const label = row[`${datePrefix}${day}`];
    if (value === undefined || label === undefined) break;
    points.push({ label: String(label), value: Number(value) });
  }
  return points;
}
