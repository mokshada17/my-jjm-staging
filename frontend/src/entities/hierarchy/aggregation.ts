/**
 * Rebuilds the 9-tier JJM network from the four relational tables the PI
 * ingestion cron jobs write (PI_WEB_API_USAGE_GUIDE §5).
 *
 * Every one of those tables carries the full hierarchy on each row - region,
 * circle, division, sub_division, block, scheme_id, scheme_name, village_name,
 * esr_name (§2.4 path parsing) - so the whole tree and every tier's rollup can
 * be derived from them without walking the AF tree over HTTP.
 */
import type {
  ChlorineRow,
  CommunicationStatusRow,
  DemographicsRow,
  PressureRow,
  WaterConsumptionRow,
} from "../telemetry/api";
import { flattenDaySeries, type SeriesPoint } from "../telemetry/api";
import type { CommStatusMatrix, VillageLevelKpiValues } from "../telemetry/types";

/** Litres in one lakh litre, the unit the dashboards display consumption in. */
const LAKH_LITRES = 100_000;

/** Service-level benchmark the LPCD columns split on. */
export const LPCD_BENCHMARK = 55;

export interface EsrRecord {
  key: string;
  /** The state (AF root) the reservoir sits under. */
  state: string;
  region: string;
  circle: string;
  division: string;
  subDivision: string;
  block: string;
  schemeId: string;
  schemeName: string;
  villageName: string;
  esrName: string;

  chlorine: {
    series: SeriesPoint[];
    latest: number;
    /** §5.1 analytics counters, in days out of the 7-day window. */
    ideal: number;
    low: number;
    high: number;
    zero: number;
  };
  pressure: {
    series: SeriesPoint[];
    latest: number;
    /** §5.2 counters: 0<p<=7, 7<p<=12 (standard), p>12. */
    low: number;
    standard: number;
    over: number;
    zero: number;
  };
  water: {
    series: SeriesPoint[];
    /** Latest day's total, in litres. */
    latest: number;
    weekTotal: number;
    zeroDays: number;
  };
  comm: {
    chlorine: SensorComm;
    pressure: SensorComm;
    flow: SensorComm;
  };
}

export interface SensorComm {
  connected: boolean;
  online: boolean;
  in0To72: boolean;
  over72: boolean;
}

export interface VillageRecord {
  key: string;
  name: string;
  population: number;
  households: number;
  /** Not a PI figure; seeded alongside demographics in db.json. */
  avgSupplyHours: number;
  /** Where the village's water comes from; not a PI figure either. "" when unknown. */
  waterSource: string;
}

/** §2.1 Tier 9 names reservoirs "<ReservoirType> <Capacity> <Name>". */
export type ReservoirType = "ESR" | "MBR" | "GSR";

export function reservoirType(esrName: string): ReservoirType {
  const upper = esrName.toUpperCase();
  if (upper.includes("MBR")) return "MBR";
  if (upper.includes("GSR")) return "GSR";
  return "ESR";
}

export interface JjmNetwork {
  esrs: EsrRecord[];
  villages: Map<string, VillageRecord>;
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

/** URL-safe id used by the `/dashboard/:tier/:id` routes. */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** §5.1: rows upsert on [scheme_id, village_name, esr_name]. */
const esrKey = (schemeId: string, village: string, esr: string) =>
  `${schemeId}|${village}|${esr}`;

export const villageKey = (r: Pick<EsrRecord, "schemeId" | "villageName">) =>
  `${r.schemeId}|${r.villageName}`;

// Composite keys keep same-named units in different branches apart.
export const regionKey = (r: EsrRecord) => r.region;
export const circleKey = (r: EsrRecord) => `${r.region}|${r.circle}`;
export const divisionKey = (r: EsrRecord) => `${circleKey(r)}|${r.division}`;
export const subDivisionKey = (r: EsrRecord) => `${divisionKey(r)}|${r.subDivision}`;
export const blockKey = (r: EsrRecord) => `${subDivisionKey(r)}|${r.block}`;
export const schemeKey = (r: EsrRecord) => r.schemeId;

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export interface NetworkSources {
  water: WaterConsumptionRow[];
  chlorine: ChlorineRow[];
  pressure: PressureRow[];
  comm: CommunicationStatusRow[];
  demographics: DemographicsRow[];
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Last point of a series, or 0 when the reservoir reported nothing. */
const lastValue = (series: SeriesPoint[]) =>
  series.length > 0 ? series[series.length - 1].value : 0;

/** §5.4 stores '1' / '0' strings rather than booleans. */
const flag = (v: string | undefined) => v === "1";

function sensorComm(
  row: CommunicationStatusRow | undefined,
  connectedField: keyof CommunicationStatusRow,
  statusField: keyof CommunicationStatusRow,
  band0To72: keyof CommunicationStatusRow,
  band72: keyof CommunicationStatusRow
): SensorComm {
  return {
    connected: row?.[connectedField] === "Connected",
    online: row?.[statusField] === "Online",
    in0To72: flag(row?.[band0To72] as string | undefined),
    over72: flag(row?.[band72] as string | undefined),
  };
}

export function buildNetwork(sources: NetworkSources): JjmNetwork {
  const chlorineByKey = new Map(
    sources.chlorine.map((r) => [esrKey(r.scheme_id, r.village_name, r.esr_name), r])
  );
  const pressureByKey = new Map(
    sources.pressure.map((r) => [esrKey(r.scheme_id, r.village_name, r.esr_name), r])
  );
  const commByKey = new Map(
    sources.comm.map((r) => [esrKey(r.scheme_id, r.village_name, r.esr_name), r])
  );

  // water_consumption is the spine: it carries every hierarchy column and one
  // row per reservoir, same as the other three tables.
  const esrs = sources.water.map<EsrRecord>((w) => {
    const key = esrKey(w.scheme_id, w.village_name, w.esr_name);
    const cl = chlorineByKey.get(key);
    const pr = pressureByKey.get(key);
    const cm = commByKey.get(key);

    const waterSeries = flattenDaySeries(w, "water_value_day", "water_date_day");
    const chlorineSeries = flattenDaySeries(cl, "chlorine_value_", "chlorine_date_day_");
    const pressureSeries = flattenDaySeries(pr, "pressure_value_", "pressure_date_day_");

    return {
      key,
      state: String(w.state ?? ""),
      region: String(w.region ?? ""),
      circle: String(w.circle ?? ""),
      division: String(w.division ?? ""),
      subDivision: String(w.sub_division ?? ""),
      block: String(w.block ?? ""),
      schemeId: String(w.scheme_id ?? ""),
      schemeName: String(w.scheme_name ?? ""),
      villageName: String(w.village_name ?? ""),
      esrName: String(w.esr_name ?? ""),

      chlorine: {
        series: chlorineSeries,
        latest: lastValue(chlorineSeries),
        ideal: num(cl?.chlorine_between_02_05_mgl),
        low: num(cl?.chlorine_less_than_02_mgl),
        high: num(cl?.chlorine_greater_than_05_mgl),
        zero: num(cl?.number_of_consistent_zero_value_in_chlorine),
      },
      pressure: {
        series: pressureSeries,
        latest: lastValue(pressureSeries),
        low: num(pr?.pressure_0_to_7_m),
        standard: num(pr?.pressure_7_to_12_m),
        over: num(pr?.pressure_greater_than_12_m),
        zero: num(pr?.number_of_consistent_zero_value_in_pressure),
      },
      water: {
        series: waterSeries,
        latest: lastValue(waterSeries),
        weekTotal: waterSeries.reduce((sum, p) => sum + p.value, 0),
        zeroDays: num(w.zero_value_count),
      },
      comm: {
        chlorine: sensorComm(cm, "chlorine_connected", "chlorine_status", "chlorine_0h_72h", "chlorine_72h"),
        pressure: sensorComm(cm, "pressure_connected", "pressure_status", "pressure_0h_72h", "pressure_72h"),
        flow: sensorComm(cm, "flow_meter_connected", "flow_meter_status", "flow_meter_0h_72h", "flow_meter_72h"),
      },
    };
  });

  const villages = new Map<string, VillageRecord>(
    sources.demographics.map((d) => [
      `${d.scheme_id}|${d.village_name}`,
      {
        key: `${d.scheme_id}|${d.village_name}`,
        name: d.village_name,
        population: num(d.population),
        households: num(d.households),
        avgSupplyHours: num(d.avg_supply_hours),
        waterSource: String(d.water_source ?? "").trim(),
      },
    ])
  );

  return { esrs, villages };
}

// ---------------------------------------------------------------------------
// Rollups
// ---------------------------------------------------------------------------

export interface TierRollup {
  population: number;
  households: number;
  /** Latest day's consumption across the scope, in litres. */
  waterLitres: number;
  /** The day before, for the "Previous Day" tiles. */
  waterLitresPrevious: number;
  /** Population-weighted mean of the villages in scope. */
  avgSupplyHours: number;
  counts: {
    circles: number;
    divisions: number;
    subDivisions: number;
    blocks: number;
    schemes: number;
    villages: number;
    reservoirs: number;
    esr: number;
    mbr: number;
    gsr: number;
  };
  /**
   * A scheme or village counts as functional when at least one of its
   * reservoirs has a sensor reporting inside 24 hours (§5.4 "Online").
   */
  functionality: {
    schemes: { total: number; functional: number; nonFunctional: number };
    villages: { total: number; functional: number; nonFunctional: number };
  };
  kpis: VillageLevelKpiValues;
  commStatus: CommStatusMatrix;
}

const distinct = (rows: EsrRecord[], key: (r: EsrRecord) => string) =>
  new Set(rows.map(key)).size;

export function rollup(rows: EsrRecord[], villages: Map<string, VillageRecord>): TierRollup {
  const villageKeys = new Set(rows.map(villageKey));

  let population = 0;
  let households = 0;
  let supplyHourPersons = 0;
  for (const k of villageKeys) {
    const v = villages.get(k);
    population += v?.population ?? 0;
    households += v?.households ?? 0;
    supplyHourPersons += (v?.avgSupplyHours ?? 0) * (v?.population ?? 0);
  }

  // LPCD is per village: the village's latest-day supply over its population.
  let lpcdAbove55 = 0;
  let lpcdBelow55 = 0;
  for (const k of villageKeys) {
    const pop = villages.get(k)?.population ?? 0;
    if (pop <= 0) continue;
    const litres = rows
      .filter((r) => villageKey(r) === k)
      .reduce((sum, r) => sum + r.water.latest, 0);
    if (litres / pop >= LPCD_BENCHMARK) lpcdAbove55 += 1;
    else lpcdBelow55 += 1;
  }

  const sum = (pick: (r: EsrRecord) => number) => rows.reduce((t, r) => t + pick(r), 0);
  const count = (pred: (r: EsrRecord) => boolean) => rows.filter(pred).length;

  const isOnline = (r: EsrRecord) =>
    r.comm.chlorine.online || r.comm.pressure.online || r.comm.flow.online;

  const functionalityOf = (key: (r: EsrRecord) => string) => {
    const groups = groupBy(rows, key);
    const functional = groups.filter((g) => g.rows.some(isOnline)).length;
    return { total: groups.length, functional, nonFunctional: groups.length - functional };
  };

  return {
    population,
    households,
    waterLitres: sum((r) => r.water.latest),
    waterLitresPrevious: sum((r) =>
      r.water.series.length > 1 ? r.water.series[r.water.series.length - 2].value : 0
    ),
    avgSupplyHours: population > 0 ? supplyHourPersons / population : 0,
    functionality: {
      schemes: functionalityOf(schemeKey),
      villages: functionalityOf(villageKey),
    },
    counts: {
      circles: distinct(rows, circleKey),
      divisions: distinct(rows, divisionKey),
      subDivisions: distinct(rows, subDivisionKey),
      blocks: distinct(rows, blockKey),
      schemes: distinct(rows, schemeKey),
      villages: villageKeys.size,
      reservoirs: rows.length,
      esr: count((r) => reservoirType(r.esrName) === "ESR"),
      mbr: count((r) => reservoirType(r.esrName) === "MBR"),
      gsr: count((r) => reservoirType(r.esrName) === "GSR"),
    },
    kpis: {
      lpcdAbove55,
      lpcdBelow55,
      // §5.1 counters, summed across the scope (reservoir-days in band).
      chlorineIdeal: sum((r) => r.chlorine.ideal),
      chlorineLow: sum((r) => r.chlorine.low),
      chlorineHigh: sum((r) => r.chlorine.high),
      // §5.2 has three pressure bands; the Figma columns are coloured
      // green / amber / red, so standard maps to green and over-pressure to amber.
      pressureHigh: sum((r) => r.pressure.standard),
      pressureModerate: sum((r) => r.pressure.over),
      pressureLow: sum((r) => r.pressure.low),
    },
    commStatus: {
      // §5.4: one reservoir contributes to a band when its stored flag says so.
      chlorine: {
        h24: count((r) => r.comm.chlorine.online),
        h0To72: count((r) => r.comm.chlorine.in0To72),
        h72Plus: count((r) => r.comm.chlorine.over72),
      },
      pressure: {
        h24: count((r) => r.comm.pressure.online),
        h0To72: count((r) => r.comm.pressure.in0To72),
        h72Plus: count((r) => r.comm.pressure.over72),
      },
      flow: {
        h24: count((r) => r.comm.flow.online),
        h0To72: count((r) => r.comm.flow.in0To72),
        h72Plus: count((r) => r.comm.flow.over72),
      },
    },
  };
}

export interface KpiBands {
  lpcd: { good: number; bad: number };
  cl: { good: number; mid: number; bad: number };
  pr: { good: number; mid: number; bad: number };
}

/** Village-level bands: the scope's counters as they stand. */
export function villageBands(roll: TierRollup): KpiBands {
  return {
    lpcd: { good: roll.kpis.lpcdAbove55, bad: roll.kpis.lpcdBelow55 },
    cl: { good: roll.kpis.chlorineIdeal, mid: roll.kpis.chlorineLow, bad: roll.kpis.chlorineHigh },
    pr: { good: roll.kpis.pressureHigh, mid: roll.kpis.pressureModerate, bad: roll.kpis.pressureLow },
  };
}

/**
 * Scheme-level bands: a scheme contributes once to a band when any of its
 * reservoirs falls in it, rather than summing reservoir-days.
 */
export function schemeBands(
  rows: EsrRecord[],
  villages: Map<string, VillageRecord>
): KpiBands {
  const groups = groupBy(rows, schemeKey);
  const band = (pick: (r: TierRollup) => number) =>
    groups.filter((g) => pick(rollup(g.rows, villages)) > 0).length;
  return {
    lpcd: { good: band((r) => r.kpis.lpcdAbove55), bad: band((r) => r.kpis.lpcdBelow55) },
    cl: {
      good: band((r) => r.kpis.chlorineIdeal),
      mid: band((r) => r.kpis.chlorineLow),
      bad: band((r) => r.kpis.chlorineHigh),
    },
    pr: {
      good: band((r) => r.kpis.pressureHigh),
      mid: band((r) => r.kpis.pressureModerate),
      bad: band((r) => r.kpis.pressureLow),
    },
  };
}

/** Groups reservoirs by a tier key, preserving first-seen order. */
export function groupBy(
  rows: EsrRecord[],
  key: (r: EsrRecord) => string
): Array<{ key: string; rows: EsrRecord[] }> {
  const groups = new Map<string, EsrRecord[]>();
  for (const row of rows) {
    const k = key(row);
    const bucket = groups.get(k);
    if (bucket) bucket.push(row);
    else groups.set(k, [row]);
  }
  return [...groups].map(([k, r]) => ({ key: k, rows: r }));
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export const formatPopulation = (n: number) => n.toLocaleString("en-IN");

/** Dashboards show consumption in lakh litres, e.g. "1.33 LL". */
export const formatLakhLitres = (litres: number) =>
  `${(litres / LAKH_LITRES).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} LL`;

/**
 * Average flow while the supply runs, in m³/h: the day's volume over the hours
 * water was supplied. §5.3 carries a daily total, not an instantaneous rate, and
 * supply runs about an hour a day, so spreading it over 24 h would understate the
 * rate roughly twenty-fold. 0 when the supply duration is unknown.
 */
export const flowRateM3h = (litres: number, supplyHours: number) =>
  supplyHours > 0 ? litres / 1000 / supplyHours : 0;

/** Litres to lakh litres, rounded to the two decimals the dashboards print. */
export const toLakhLitres = (litres: number) => Math.round((litres / LAKH_LITRES) * 100) / 100;

export const formatLitres =(litres: number) => `${Math.round(litres).toLocaleString("en-IN")}L`;

export const formatHours = (h: number) => `${h.toFixed(2)} Hours`;

/**
 * The water source(s) of the villages under `rows`, in first-seen order, e.g.
 * "Wainganga River". A scheme's villages normally share one source; if they
 * differ, all are listed rather than one picked arbitrarily. "" when none is known.
 */
export function waterSources(rows: EsrRecord[], villages: Map<string, VillageRecord>): string {
  const seen = new Set<string>();
  for (const r of rows) {
    const source = villages.get(villageKey(r))?.waterSource;
    if (source) seen.add(source);
  }
  return [...seen].join(", ");
}

/** Litres per capita per day for a scope, 0 when population is unknown. */
export const lpcd = (litres: number, population: number) =>
  population > 0 ? litres / population : 0;

/**
 * Health of one sensor reading, on the same bands the KPI tiles count:
 * ok -> green, warn -> amber, bad -> red, offline -> no live reading to judge.
 */
export type SensorHealth = "ok" | "warn" | "bad" | "offline";

/** §5.1: 0.2-0.5 mg/l is ideal, under 0.2 is low (amber), over 0.5 is high (red). */
export function chlorineHealth(mgL: number): SensorHealth {
  if (mgL < 0.2) return "warn";
  if (mgL > 0.5) return "bad";
  return "ok";
}

/** §5.2 head in metres: 7-12 standard, over 12 amber, 7 or under (incl. zero) red. */
export function pressureHealth(metres: number): SensorHealth {
  if (metres > 12) return "warn";
  if (metres > 7) return "ok";
  return "bad";
}

/** §5.3: any supply on the latest day is healthy, a zero-flow day is not. */
export const flowHealth = (litres: number): SensorHealth => (litres > 0 ? "ok" : "bad");

/**
 * An ESR's three sensors, each judged on its latest reading. A sensor that is not
 * connected and online is "offline": its last value is stale, so colouring it
 * green or red would misreport the reservoir.
 */
export function esrSensorHealth(esr: EsrRecord): Record<"flow" | "chlorine" | "pressure", SensorHealth> {
  const live = (c: SensorComm) => c.connected && c.online;
  return {
    flow: live(esr.comm.flow) ? flowHealth(esr.water.latest) : "offline",
    chlorine: live(esr.comm.chlorine) ? chlorineHealth(esr.chlorine.latest) : "offline",
    pressure: live(esr.comm.pressure) ? pressureHealth(esr.pressure.latest) : "offline",
  };
}

/** Whether an LPCD figure meets the 55 L service-level benchmark. */
export const meetsLpcdBenchmark = (v: number) => v >= LPCD_BENCHMARK;

/**
 * A scope's day-by-day consumption in litres: every ESR's §5.3 7-day series summed
 * per date, oldest first. An ESR reporting zero still contributes its dates.
 */
export function dailyWater(rows: EsrRecord[]): SeriesPoint[] {
  const byDay = new Map<string, number>();
  for (const r of rows) {
    for (const p of r.water.series) byDay.set(p.label, (byDay.get(p.label) ?? 0) + p.value);
  }
  return [...byDay].map(([label, value]) => ({ label, value }));
}

/** LPCD for each day of a consumption series, over the scope's population. */
export const dailyLpcd = (water: SeriesPoint[], population: number): SeriesPoint[] =>
  water.map((p) => ({ label: p.label, value: lpcd(p.value, population) }));

export const formatLpcd = (v: number) =>
  `${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;

/** PI stores pressure as head in metres (§5.2); the Figma tiles read in bar. */
export const METRES_PER_BAR = 10.1972;
export const formatBar = (metres: number) => `${(metres / METRES_PER_BAR).toFixed(2)} bar`;

/** §2.1 embeds capacity in the reservoir name, e.g. "MBR 1.75 LL". */
export function reservoirCapacity(esrName: string): string {
  const m = esrName.match(/(\d+(?:\.\d+)?)\s*LL/i);
  return m ? `${Number(m[1]).toFixed(2)} LL` : "-";
}

export const formatMgL = (v: number) => `${v.toFixed(2)} mg/l`;
export const formatMetres = (v: number) => `${v.toFixed(2)} m`;
