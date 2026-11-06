import { describe, expect, it } from "vitest";
import { pathTo, routeFor } from "./path";

const row = {
  state: "Maharashtra",
  region: "Nagpur",
  circle: "Nagpur",
  division: "Ramtek",
  subDivision: "Ramtek",
  block: "Ramtek",
  schemeId: "631010",
  villageName: "Alesur",
  esrName: "MBR 1.75 LL",
};

describe("pathTo", () => {
  it("names every tier from the row's state down to the target", () => {
    expect(pathTo(row, "Block").map((n) => [n.tier, n.id, n.name])).toEqual([
      ["State", "maharashtra", "Maharashtra"],
      ["Region", "nagpur", "Nagpur"],
      ["Circle", "nagpur", "Nagpur"],
      ["Division", "ramtek", "Ramtek"],
      ["SubDivision", "ramtek", "Ramtek"],
      ["Block", "ramtek", "Ramtek"],
    ]);
  });

  it("needs only the tiers down to the target", () => {
    expect(pathTo({ state: "Maharashtra", region: "Amravati" }, "Region").map((n) => n.name)).toEqual([
      "Maharashtra",
      "Amravati",
    ]);
  });

  it("roots the path at the row's own state", () => {
    const path = pathTo({ state: "Madhya Pradesh", region: "Bhopal", circle: "Bhopal" }, "Circle");
    expect(path[0]).toEqual({ tier: "State", id: "madhya-pradesh", label: "Madhya Pradesh", name: "Madhya Pradesh" });
    expect(routeFor(path)).toBe("/dashboard/circle/bhopal");
  });
});

describe("routeFor", () => {
  it.each([
    ["Region", "/dashboard/region/nagpur"],
    ["SubDivision", "/dashboard/subdivision/ramtek"],
    ["Scheme", "/dashboard/scheme/631010"],
    ["ESR", "/dashboard/esr/mbr-1-75-ll"],
  ] as const)("routes a %s path to its dashboard", (tier, route) => {
    expect(routeFor(pathTo(row, tier))).toBe(route);
  });
});
