import { describe, it, expect } from "vitest";
import { geoArea, geoMercator, geoPath } from "d3-geo";
import { topology } from "topojson-server";
import { merge } from "topojson-client";
import type { GeometryCollection, MultiPolygon, Polygon } from "topojson-specification";
import { STATE_MAPS, type StateMap } from "./stateMaps";

// Every state the officer can switch to is held to the same checks.
const maps = Object.values(STATE_MAPS).map((map) => [map.state, map] as const);

describe.each(maps)("%s", (_, map: StateMap) => {
  const collection = map.districts;
  const geoNames = collection.features.map((f) => f.properties.district);
  const REGIONS = map.regions;
  const REGION_BY_DISTRICT = map.regionByDistrict;

  describe("region mapping", () => {
    it("covers every district present in the boundary data", () => {
      const unmapped = geoNames.filter((name) => !REGION_BY_DISTRICT[name]);
      expect(unmapped).toEqual([]);
    });

    it("does not reference districts missing from the boundary data", () => {
      const missing = REGIONS.flatMap((r) => r.districts).filter(
        (d) => !geoNames.includes(d)
      );
      expect(missing).toEqual([]);
    });

    it("assigns each district to exactly one region", () => {
      const all = REGIONS.flatMap((r) => r.districts);
      expect(new Set(all).size).toBe(all.length);
      expect(all).toHaveLength(geoNames.length);
    });

    it("keeps the boundary asset small enough to bundle", () => {
      const bytes = JSON.stringify(collection).length;
      expect(bytes).toBeLessThan(40_000);
    });
  });

  describe("projection", () => {
    const WIDTH = 820;
    const HEIGHT = 640;
    const projection = geoMercator().fitExtent(
      [
        [28, 28],
        [WIDTH - 28, HEIGHT - 28],
      ],
      collection
    );
    const path = geoPath(projection);

    it("renders a non-empty path for every district", () => {
      const empty = collection.features
        .filter((f) => !path(f))
        .map((f) => f.properties.district);
      expect(empty).toEqual([]);
    });

    it("places every district label inside the viewBox", () => {
      const outside = collection.features
        .map((f) => ({ name: f.properties.district, c: path.centroid(f) }))
        .filter(
          ({ c }) =>
            !Number.isFinite(c[0]) ||
            !Number.isFinite(c[1]) ||
            c[0] < 0 ||
            c[0] > WIDTH ||
            c[1] < 0 ||
            c[1] > HEIGHT
        )
        .map(({ name }) => name);
      expect(outside).toEqual([]);
    });

    it("fits every region individually for the region dashboard", () => {
      const W = 440;
      const H = 340;
      const P = 26;

      for (const region of REGIONS) {
        const subset = {
          type: "FeatureCollection" as const,
          features: collection.features.filter((f) =>
            region.districts.includes(f.properties.district)
          ),
        };
        expect(subset.features, `${region.label} has no districts`).toHaveLength(
          region.districts.length
        );

        const rp = geoMercator().fitExtent(
          [
            [P, P],
            [W - P, H - P],
          ],
          subset
        );
        const rPath = geoPath(rp);

        for (const f of subset.features) {
          const name = f.properties.district;
          expect(rPath(f), `${name} rendered no path`).toBeTruthy();
          const [cx, cy] = rPath.centroid(f);
          expect(Number.isFinite(cx) && Number.isFinite(cy), `${name} centroid`).toBe(true);
          expect(cx).toBeGreaterThanOrEqual(0);
          expect(cx).toBeLessThanOrEqual(W);
          expect(cy).toBeGreaterThanOrEqual(0);
          expect(cy).toBeLessThanOrEqual(H);
        }

        const hq = rp(region.hq);
        expect(hq, `${region.label} HQ did not project`).not.toBeNull();
        expect(hq![0]).toBeGreaterThanOrEqual(0);
        expect(hq![0]).toBeLessThanOrEqual(W);
        expect(hq![1]).toBeGreaterThanOrEqual(0);
        expect(hq![1]).toBeLessThanOrEqual(H);
      }
    });

    it("projects each regional HQ inside the viewBox", () => {
      for (const region of REGIONS) {
        const point = projection(region.hq);
        expect(point, `${region.label} HQ did not project`).not.toBeNull();
        expect(point![0]).toBeGreaterThanOrEqual(0);
        expect(point![0]).toBeLessThanOrEqual(WIDTH);
        expect(point![1]).toBeGreaterThanOrEqual(0);
        expect(point![1]).toBeLessThanOrEqual(HEIGHT);
      }
    });
  });

  // The district borders must line up exactly: neighbours share every vertex of
  // their common edge. Simplifying districts one at a time broke that and left 102
  // gaps and overlaps, drawn as doubled, jagged borders. scripts/build-state-geo.mjs
  // simplifies with the topology intact; this guards the assets it writes.
  describe("district boundaries", () => {
    const topo = topology({ districts: collection });
    const shapes = (topo.objects.districts as GeometryCollection).geometries as (Polygon | MultiPolygon)[];
    const state = merge(topo, shapes);
    const polygons = state.coordinates; // merge() always returns a MultiPolygon

    it("leaves no gaps between districts", () => {
      // A gap between neighbours survives the merge as a hole in the state outline.
      // The pre-fix asset had 42 of them.
      expect(polygons.flatMap((rings) => rings.slice(1))).toEqual([]);
    });

    it("winds every district the way d3-geo expects", () => {
      // Reversed rings read as "the whole globe except the district", ~4π sr. The
      // largest district, Kutch, is ~0.0011 sr, so 0.01 sr still sits far apart.
      for (const f of collection.features) expect(geoArea(f)).toBeLessThan(0.01);
    });
  });
});
