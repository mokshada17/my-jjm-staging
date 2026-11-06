import { describe, expect, it } from "vitest";
import { geoMercator } from "d3-geo";
import { HEIGHT, PADDING, WIDTH, fitState, legendBox, legendLayout, underLegend } from "./stateMapLayout";
import { STATE_MAPS } from "./stateMaps";

describe("state map layout", () => {
  it.each(Object.values(STATE_MAPS).map((map) => [map.state, map] as const))(
    "%s: no district is drawn under the region legend",
    (_state, map) => {
      const legend = legendLayout(map.regions.map((r) => r.label));
      const projection = fitState(map.districts, legend);
      expect(underLegend(map.districts, projection, legendBox(legend))).toBe(false);
    }
  );

  it("keeps Maharashtra on the full panel, as in Figma: its legend corner is empty", () => {
    const { districts, regions } = STATE_MAPS.Maharashtra;
    const full = geoMercator().fitExtent(
      [
        [PADDING, PADDING],
        [WIDTH - PADDING, HEIGHT - PADDING],
      ],
      districts
    );
    const legend = legendLayout(regions.map((r) => r.label));
    expect(legend).toMatchObject({ cols: 1, rows: 6, width: 160, height: 92 });
    expect(fitState(districts, legend).scale()).toBe(full.scale());
  });

  it("splits a long legend into two columns", () => {
    const mp = STATE_MAPS["Madhya Pradesh"].regions.map((r) => r.label);
    expect(legendLayout(mp)).toMatchObject({ cols: 2, rows: 5 });
  });

  it("catches a district under the legend", () => {
    // Gujarat's Navsari / Valsad and Madhya Pradesh's Mandla / Balaghat reach the
    // corner when fitted to the full panel.
    for (const map of [STATE_MAPS.Gujarat, STATE_MAPS["Madhya Pradesh"]]) {
      const full = geoMercator().fitExtent(
        [
          [PADDING, PADDING],
          [WIDTH - PADDING, HEIGHT - PADDING],
        ],
        map.districts
      );
      const legend = legendLayout(map.regions.map((r) => r.label));
      expect(underLegend(map.districts, full, legendBox(legend)), map.state).toBe(true);
    }
  });
});
