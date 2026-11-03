import { describe, expect, it } from "vitest";
import {
  dailyLpcd,
  dailyWater,
  flowRateM3h,
  meetsLpcdBenchmark,
  toLakhLitres,
  waterSources,
  type EsrRecord,
  type VillageRecord,
} from "./aggregation";

describe("waterSources", () => {
  const row = (schemeId: string, villageName: string) => ({ schemeId, villageName }) as EsrRecord;
  const village = (key: string, waterSource: string) =>
    [key, { key, name: key, population: 0, households: 0, avgSupplyHours: 0, waterSource }] as const;
  const villages = new Map<string, VillageRecord>([
    village("1|A", "Wainganga River"),
    village("1|B", "Wainganga River"),
    village("2|C", "Katepurna Dam"),
    village("3|D", ""),
  ]);

  it("names a scheme's shared source once", () => {
    expect(waterSources([row("1", "A"), row("1", "B")], villages)).toBe("Wainganga River");
  });

  it("lists every distinct source when villages differ", () => {
    expect(waterSources([row("1", "A"), row("2", "C")], villages)).toBe("Wainganga River, Katepurna Dam");
  });

  it("is empty when no source is known", () => {
    expect(waterSources([row("3", "D"), row("9", "Z")], villages)).toBe("");
  });
});

const esr = (series: [string, number][]) =>
  ({ water: { series: series.map(([label, value]) => ({ label, value })) } }) as EsrRecord;

describe("dailyWater", () => {
  it("sums every ESR's series per date, oldest first", () => {
    const rows = [
      esr([["19-Aug", 88000], ["20-Aug", 91000]]),
      esr([["19-Aug", 64000], ["20-Aug", 67000]]),
    ];
    expect(dailyWater(rows)).toEqual([
      { label: "19-Aug", value: 152000 },
      { label: "20-Aug", value: 158000 },
    ]);
  });

  it("keeps the dates of an ESR that reported zero", () => {
    expect(dailyWater([esr([["19-Aug", 0]])])).toEqual([{ label: "19-Aug", value: 0 }]);
  });

  it("is empty for a scope with no ESRs", () => {
    expect(dailyWater([])).toEqual([]);
  });
});

describe("dailyLpcd", () => {
  it("divides each day by the population", () => {
    expect(dailyLpcd([{ label: "24-Aug", value: 131000 }], 2300)[0].value).toBeCloseTo(56.96, 2);
  });

  it("is zero, not Infinity, without a population", () => {
    expect(dailyLpcd([{ label: "24-Aug", value: 131000 }], 0)[0].value).toBe(0);
  });
});

describe("helpers", () => {
  it("converts litres to lakh litres at two decimals", () => {
    expect(toLakhLitres(154000)).toBe(1.54);
    expect(toLakhLitres(133333)).toBe(1.33);
  });

  it("splits LPCD on the 55 L benchmark", () => {
    expect(meetsLpcdBenchmark(55)).toBe(true);
    expect(meetsLpcdBenchmark(52.2)).toBe(false);
  });
});

describe("flowRateM3h", () => {
  it("averages the day's volume over the hours supplied", () => {
    expect(flowRateM3h(90000, 1.25)).toBe(72);
  });

  it("is zero, not Infinity, without a supply duration", () => {
    expect(flowRateM3h(90000, 0)).toBe(0);
  });
});
