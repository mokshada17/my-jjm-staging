/**
 * The state map's frame: an 820x640 viewBox with the region legend in its
 * bottom-right corner, and the projection that fits a state into it without
 * hiding any district under that legend.
 */
import { geoMercator } from "d3-geo";
import { projectedRings, type Point } from "./labelPlacement";
import type { DistrictCollection } from "./stateMaps";

export const WIDTH = 820;
export const HEIGHT = 640;
/** Leaves room for the legend and compass without clipping the state's edges. */
export const PADDING = 28;
/** The region legend reads too small at its base 8-9px, so it is drawn at 1.5x. */
export const LEGEND_SCALE = 1.5;
/** Space kept between the map and a legend it has been moved clear of. */
const LEGEND_GAP = 12;

/** Regions one legend column holds; more split into two columns so the panel stays short. */
const MAX_LEGEND_ROWS = 6;

/** The legend panel's shape, in units before LEGEND_SCALE. */
export interface LegendLayout {
  cols: number;
  rows: number;
  colWidth: number;
  /** At least 160, Maharashtra's single-column panel. */
  width: number;
  /** A 20-unit header and a 12-unit row per region. */
  height: number;
}

export function legendLayout(labels: string[]): LegendLayout {
  const cols = labels.length > MAX_LEGEND_ROWS ? 2 : 1;
  const rows = Math.ceil(labels.length / cols);
  // A 14-unit swatch and 6 of gap, then 8px text at ~4.6 units a character.
  const colWidth = 20 + Math.max(0, ...labels.map((l) => l.length)) * 4.6 + 10;
  return { cols, rows, colWidth, width: Math.max(160, cols * colWidth + 8), height: 20 + rows * 12 };
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** The legend panel's box in viewBox units, anchored 8px inside the bottom-right corner. */
export function legendBox(legend: LegendLayout): Box {
  const x1 = WIDTH - 8;
  const y1 = HEIGHT - 8;
  return { x0: x1 - legend.width * LEGEND_SCALE, y0: y1 - legend.height * LEGEND_SCALE, x1, y1 };
}

const insideRing = ([x, y]: Point, ring: Point[]) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/**
 * True when any district would be drawn under `box`: one of its outline points
 * falls inside the box, or the box's corners or centre fall inside the district.
 */
export function underLegend(
  collection: DistrictCollection,
  project: (p: Point) => Point | null,
  box: Box
): boolean {
  const inBox = ([x, y]: Point) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
  const probes: Point[] = [
    [box.x0, box.y0],
    [box.x1, box.y0],
    [box.x0, box.y1],
    [(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2],
  ];
  return collection.features.some((f) => {
    const rings = projectedRings(f.geometry, project);
    return rings.some((ring) => ring.some(inBox)) || probes.some((p) => rings.some((ring) => insideRing(p, ring)));
  });
}

const fit = (collection: DistrictCollection, x1: number, y1: number) =>
  geoMercator().fitExtent(
    [
      [PADDING, PADDING],
      [x1, y1],
    ],
    collection
  );

/**
 * Fits the state to the panel. Where the legend corner is empty (Maharashtra) that
 * is the whole panel; otherwise the state is fitted beside or above the legend,
 * whichever leaves it larger, so no district is hidden under it.
 */
export function fitState(collection: DistrictCollection, legend: LegendLayout) {
  const full = fit(collection, WIDTH - PADDING, HEIGHT - PADDING);
  const box = legendBox(legend);
  if (!underLegend(collection, full, box)) return full;
  const beside = fit(collection, box.x0 - LEGEND_GAP, HEIGHT - PADDING);
  const above = fit(collection, WIDTH - PADDING, box.y0 - LEGEND_GAP);
  return beside.scale() >= above.scale() ? beside : above;
}
