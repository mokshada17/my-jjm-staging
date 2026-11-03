import { describe, expect, it } from "vitest";
import type { EsrRecord } from "@/entities/hierarchy";
import { areaTrendSet } from "./areaTraces";

const esr = (villageName: string, esrName: string) =>
  ({ key: `x|${villageName}|${esrName}`, state: "Maharashtra", villageName, esrName }) as EsrRecord;

describe("areaTrendSet (Scheme / Village chart trends)", () => {
  const scheme = [esr("Alesur", "MBR 1.75 LL"), esr("Paunarkhari", "ESR 1.00 LL")];

  it("draws the total and one trace per reservoir, each on its own reservoir", () => {
    const { traces, subject } = areaTrendSet("water", scheme, 2950, "Scheme 631010");
    expect(subject).toBe("Scheme 631010");
    expect(traces.map((t) => t.label)).toEqual(["Total", "Alesur MBR 1.75 LL", "Paunarkhari ESR 1.00 LL"]);
    expect(traces[0].source).toMatchObject({ kind: "sum", factor: 1 / 100_000 });
    expect(traces[1].source).toMatchObject({ kind: "attribute", esr: scheme[0] });
  });

  it("draws a single reservoir once, as the total", () => {
    const { traces } = areaTrendSet("water", [scheme[0]], 1800, "Alesur");
    expect(traces).toHaveLength(1);
    expect(traces[0].label).toBe("Water Consumption");
  });

  it("charts LPCD as the total over the population, against the 55 L benchmark", () => {
    const { traces } = areaTrendSet("lpcd", scheme, 2950, "Scheme 631010");
    expect(traces[0].source).toMatchObject({ kind: "sum", factor: 1 / 2950 });
    expect(traces[1].source).toEqual({ kind: "constant", value: 55 });
  });
});
