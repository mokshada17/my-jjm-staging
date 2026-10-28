import { describe, expect, it } from "vitest";
import { headerTitle } from "./headerTitle";

const S = " | Jal Jeevan Mission-Har Ghar Jal";

describe("headerTitle", () => {
  it("defaults the landing page to the Enterprise Level heading", () => {
    expect(headerTitle("/dashboard", "State")).toBe(`JJM Enterprise Level Dashboard${S}`);
  });

  it("shows the Overview heading only on breadcrumb overview routes", () => {
    expect(headerTitle("/dashboard/region/overview", "Region")).toBe(
      `JJM Region Overview Dashboard${S}`,
    );
    expect(headerTitle("/dashboard/subdivision/overview/", "SubDivision")).toBe(
      `JJM Sub Division Overview Dashboard${S}`,
    );
  });

  it("names only the level, not the selected node, on drilled-into dashboards", () => {
    expect(headerTitle("/dashboard/region/nagpur", "Region")).toBe(
      `JJM Region Level Dashboard${S}`,
    );
    expect(headerTitle("/dashboard/circle/nagpur", "Circle")).toBe(
      `JJM Circle Level Dashboard${S}`,
    );
    expect(headerTitle("/dashboard/esr/esr-3.73ll-1", "ESR")).toBe(`JJM ESR Level Dashboard${S}`);
  });

  it("titles the ESR's linked trend display the way PI Vision does", () => {
    expect(headerTitle("/dashboard/esr/esr-3.73ll-1/sensor-fusion", "ESR")).toBe(
      `JJM Sensor Fusion Dashboard${S}`,
    );
  });
});
