import { describe, expect, it } from "vitest";
import db from "../../../pi-mock-server/db.json";
import { parsePiTime, plotResponse, recordedSamples } from "../../../pi-mock-server/plot.mjs";
import { esrAfPath, toSamples } from "./trend";

const DAY = 86_400_000;
const NOW = Date.parse("2026-10-06T08:00:00Z");
const AUG_19 = Date.parse("2026-08-19T00:00:00Z");
const attr = (suffix: string) => `A0k-7zR3_XEEa5vK9QdYwAAA_${suffix}_WEBID`;

/** Every sample of one UTC day. */
const day = (webId: string, start: number) => recordedSamples(db, webId, start, start + DAY - 1, NOW)!;

describe("mock PI trend history (pi-mock-server/plot.mjs)", () => {
  it("averages each day's 15-minute chlorine and pressure samples to the seeded daily summary", () => {
    for (const [webId, summaryType] of [
      [attr("CHLORINE_ATTR"), "Average"],
      [attr("PRESSURE_ATTR"), "Average"],
    ]) {
      const summary = db.streamSummaries.find((x) => x.attributeWebId === webId && x.summaryType === summaryType)!;
      summary.Items.forEach((item, i) => {
        const { samples } = day(webId, AUG_19 + i * DAY);
        expect(samples).toHaveLength(96); // 4 packets an hour
        const mean = samples.reduce((a, [, v]) => a + v, 0) / samples.length;
        expect(mean).toBeCloseTo(item.Value.Value as number, 2);
      });
    }
  });

  it("integrates each day's flow rate to that day's CALC water consumption", () => {
    const water = db.streamSummaries.find((x) => x.attributeWebId === attr("WATER_CONSUMPTION_ATTR"))!;
    water.Items.forEach((item, i) => {
      const { samples } = day(attr("FLOW_RATE_ATTR"), AUG_19 + i * DAY);
      const litres = samples.reduce((a, [, v]) => a + v * 60, 0); // L/s over one-minute samples
      expect(litres).toBeCloseTo(item.Value.Value as number, -1);
    });
  });

  it("repeats the seeded week outside it, so a live window always has data", () => {
    const live = recordedSamples(db, attr("CHLORINE_ATTR"), NOW - DAY, NOW, NOW)!;
    expect(live.samples.length).toBeGreaterThan(90);
    expect(live.samples[live.samples.length - 1][0]).toBeLessThanOrEqual(NOW);
  });

  it("returns the system state, not readings, for a point that never reported", () => {
    const res = plotResponse(db, attr("ESR1_CHLORINE_ATTR"), { startTime: "*-1d", endTime: "*" }, NOW)!;
    expect(res.Items).toHaveLength(1);
    expect(res.Items[0].Good).toBe(false);
    expect(toSamples(res as never).systemState).toBe("Pt Created");
  });

  it("decimates a month of one-minute flow to first/min/max/last per interval", () => {
    const raw = recordedSamples(db, attr("FLOW_RATE_ATTR"), NOW - 31 * DAY, NOW, NOW)!.samples;
    const res = plotResponse(db, attr("FLOW_RATE_ATTR"), { startTime: "*-31d", endTime: "*", intervals: 400 }, NOW)!;
    expect(res.Items.length).toBeLessThanOrEqual(4 * 400 + 1);
    expect(res.Items.length).toBeLessThan(raw.length / 10);
    // the peak survives decimation
    const peak = Math.max(...raw.map(([, v]) => v));
    expect(Math.max(...res.Items.map((i) => i.Value as number))).toBe(peak);
  });

  it("understands PI relative times", () => {
    expect(parsePiTime("*", NOW)).toBe(NOW);
    expect(parsePiTime("*-8h", NOW)).toBe(NOW - 8 * 3_600_000);
    expect(parsePiTime("*-1d", NOW)).toBe(NOW - DAY);
    expect(parsePiTime("2026-08-19T00:00:00Z", NOW)).toBe(AUG_19);
  });
});

describe("esrAfPath", () => {
  it("rebuilds every reservoir's AF path from its §5 row", () => {
    for (const row of db.water_consumption) {
      const path = esrAfPath({
        state: row.state,
        region: row.region,
        circle: row.circle,
        division: row.division,
        subDivision: row.sub_division,
        block: row.block,
        schemeId: row.scheme_id,
        schemeName: row.scheme_name,
        villageName: row.village_name,
        esrName: row.esr_name,
      });
      expect(db.elementChildren.some((e) => e.Path === path)).toBe(true);
    }
  });
});
