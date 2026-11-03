import { describe, expect, it } from "vitest";
import {
  autoDomain,
  formatTrendValue,
  integrate,
  lastValue,
  resolveDomains,
  sumSamples,
  traceStats,
  valueAt,
  type TraceData,
  type TraceDef,
} from "./model";

const s = (time: number, value: number | null) => ({ time, value });

const def = (id: string, over: Partial<TraceDef> = {}): TraceDef => ({
  id,
  name: `ESR|${id}`,
  label: id,
  description: "",
  units: "",
  color: "#000",
  source: { kind: "attribute", attribute: id },
  step: false,
  database: [0, 100],
  ...over,
});

const data = (d: TraceDef, samples: { time: number; value: number | null }[]): TraceData => ({
  def: d,
  samples,
  isLoading: false,
  isError: false,
});

describe("valueAt (what a cursor reads)", () => {
  const samples = [s(0, 1), s(10, 3), s(20, null), s(30, 5)];

  it("holds the previous reading on a stepped trace", () => {
    expect(valueAt(samples, 5, true)).toBe(1);
  });

  it("interpolates a continuous trace", () => {
    expect(valueAt(samples, 5, false)).toBe(2);
  });

  it("reads nothing inside a gap or before the data", () => {
    expect(valueAt(samples, 25, false)).toBeNull();
    expect(valueAt(samples, -1, false)).toBeNull();
  });

  it("holds the last reading after the data", () => {
    expect(valueAt(samples, 99, false)).toBe(5);
  });
});

describe("lastValue", () => {
  it("skips trailing bad data", () => {
    expect(lastValue([s(0, 2), s(1, null)])).toBe(2);
    expect(lastValue([s(0, null)])).toBeNull();
  });
});

describe("traceStats (details table)", () => {
  it("weights a stepped trace by how long each value was held", () => {
    // 1 for 30 s, then 4 for 10 s -> 70 / 40
    const stats = traceStats([s(0, 1), s(30_000, 4)], 0, 40_000, true);
    expect(stats.average).toBeCloseTo(1.75);
    expect(stats.minimum).toBe(1);
    expect(stats.maximum).toBe(4);
  });

  it("holds a stepped trace's last value into the window", () => {
    // A daily total written at midnight (t = -100) is still the reading all day.
    const stats = traceStats([s(-100, 0.9)], 0, 40, true);
    expect(stats).toEqual({ average: 0.9, minimum: 0.9, maximum: 0.9 });
    // ... and the autorange is drawn round it, not on an empty 0-1.
    expect(autoDomain([s(-100, 1.58)], 0, 40, true)).toEqual([1.58 - 0.158, 1.58 + 0.158]);
  });

  it("ignores samples outside the window and gaps", () => {
    const stats = traceStats([s(-5, 100), s(0, 2), s(10, null), s(20, 2)], 0, 20, false);
    expect(stats.maximum).toBe(2);
    expect(stats.average).toBe(2);
  });
});

describe("sumSamples (scheme / village totals)", () => {
  it("adds the values each stepped series holds at every sample time", () => {
    const a = [s(0, 1), s(20, 2)];
    const b = [s(10, 5)];
    expect(sumSamples([a, b])).toEqual([s(0, 1), s(10, 6), s(20, 7)]);
  });

  it("leaves out a series with no good data, and is a gap only where all are", () => {
    expect(sumSamples([[s(0, 3)], [s(0, null)]])).toEqual([s(0, 3)]);
    expect(sumSamples([[s(0, null)], [s(0, null)]])).toEqual([s(0, null)]);
  });
});

describe("integrate (totalizer from a rate)", () => {
  it("accumulates value x seconds x factor", () => {
    // 2 L/s for 60 s = 120 L = 0.12 m3
    const out = integrate([s(0, 2), s(60_000, 2)], 1 / 1000);
    expect(out[0].value).toBe(0);
    expect(out[1].value).toBeCloseTo(0.12);
  });
});

describe("resolveDomains (scale buttons)", () => {
  const a = data(def("a", { custom: [0, 5] }), [s(0, 1), s(10, 2)]);
  const b = data(def("b", { database: [0, 10] }), [s(0, 8), s(10, 9)]);
  const base = { traces: [a, b], start: 0, end: 10, custom: { a: [0, 5] as [number, number] } };

  it("autoranges each trace to its data in multiple scales", () => {
    const d = resolveDomains({ ...base, layout: "multiple", mode: "auto" });
    expect(d.a[0]).toBeLessThan(1);
    expect(d.a[1]).toBeGreaterThan(2);
    expect(d.a[1]).toBeLessThan(8);
    expect(d.b[0]).toBeGreaterThan(2);
  });

  it("shares the union of the ranges in a single scale", () => {
    const d = resolveDomains({ ...base, layout: "single", mode: "auto" });
    expect(d.a).toEqual(d.b);
    expect(d.a[0]).toBeLessThan(1);
    expect(d.a[1]).toBeGreaterThan(9);
  });

  it("uses PI zero/span for Database and Bottom/Top for Custom", () => {
    expect(resolveDomains({ ...base, layout: "multiple", mode: "database" }).b).toEqual([0, 10]);
    expect(resolveDomains({ ...base, layout: "multiple", mode: "custom" }).a).toEqual([0, 5]);
  });

  it("lets a value zoom override the scale mode", () => {
    const d = resolveDomains({ ...base, layout: "multiple", mode: "database", zoom: { b: [8.5, 9] } });
    expect(d.b).toEqual([8.5, 9]);
    expect(d.a).toEqual([0, 100]);
  });
});

describe("formatTrendValue", () => {
  it("prints values the way the PI Vision cursor does", () => {
    expect(formatTrendValue(1109327.4)).toBe("1,109,327");
    expect(formatTrendValue(70.16123)).toBe("70.161");
    expect(formatTrendValue(0.69)).toBe("0.69");
    expect(formatTrendValue(null)).toBe("-");
  });
});
