import { describe, expect, it } from "vitest";
import {
  chlorineHealth,
  esrSensorHealth,
  flowHealth,
  pressureHealth,
  type EsrRecord,
  type SensorComm,
} from "./aggregation";

describe("chlorineHealth", () => {
  it("is ok across the 0.2-0.5 mg/l ideal band, inclusive", () => {
    expect(chlorineHealth(0.2)).toBe("ok");
    expect(chlorineHealth(0.31)).toBe("ok");
    expect(chlorineHealth(0.5)).toBe("ok");
  });
  it("warns below 0.2 and is bad above 0.5", () => {
    expect(chlorineHealth(0.11)).toBe("warn");
    expect(chlorineHealth(0)).toBe("warn");
    expect(chlorineHealth(0.65)).toBe("bad");
  });
});

describe("pressureHealth", () => {
  it("is ok over 7 m up to 12 m", () => {
    expect(pressureHealth(8.4)).toBe("ok");
    expect(pressureHealth(12)).toBe("ok");
  });
  it("warns over 12 m and is bad at 7 m or under, including zero", () => {
    expect(pressureHealth(12.6)).toBe("warn");
    expect(pressureHealth(7)).toBe("bad");
    expect(pressureHealth(0)).toBe("bad");
  });
});

describe("flowHealth", () => {
  it("is bad only on a zero-flow day", () => {
    expect(flowHealth(133000)).toBe("ok");
    expect(flowHealth(0)).toBe("bad");
  });
});

describe("esrSensorHealth", () => {
  const live: SensorComm = { connected: true, online: true, in0To72: true, over72: false };
  const down: SensorComm = { connected: true, online: false, in0To72: false, over72: true };
  const esr = (comm: Partial<EsrRecord["comm"]>) =>
    ({
      water: { latest: 68000 },
      chlorine: { latest: 0.65 },
      pressure: { latest: 12.6 },
      comm: { flow: live, chlorine: live, pressure: live, ...comm },
    }) as EsrRecord;

  it("judges each live sensor on its latest reading", () => {
    expect(esrSensorHealth(esr({}))).toEqual({ flow: "ok", chlorine: "bad", pressure: "warn" });
  });

  it("reports an offline sensor as offline rather than by its stale value", () => {
    expect(esrSensorHealth(esr({ flow: down })).flow).toBe("offline");
    expect(esrSensorHealth(esr({ chlorine: { ...live, connected: false } })).chlorine).toBe("offline");
  });
});
