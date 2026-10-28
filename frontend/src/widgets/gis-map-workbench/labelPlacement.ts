import type { Geometry } from "geojson";

/**
 * District-label placement shared by the state map and the region maps.
 *
 * Every length here is in the map's own viewBox units, which differ between maps
 * (the state map is 820 wide, each region map is cropped to its own bounds), so the
 * sizes come in through `LabelMetrics` rather than as constants.
 */

export type Point = [number, number];
/** Axis-aligned box: [left, top, right, bottom]. */
export type Box = [number, number, number, number];

export interface LabelMetrics {
  /** Largest font a label is set at. */
  maxFont: number;
  /** Smallest font preferred before a label must shrink further. */
  minFont: number;
  /** Last resort for narrow districts, before a label is moved outside its shape. */
  floorFont: number;
  /** Below this much interior width a label is set outside the district. */
  minRoom: number;
  /** Clearance kept between a label and the district border on each side. */
  inset: number;
  /** Rows (relative to the label's centre line) sampled to find the room it has. */
  sampleRows: number[];
  /** Vertical step between candidate rows. */
  rowStep: number;
  /** HQ pin geometry: the pin is 2 × half-width wide and `pinHeight` tall above its tip. */
  pinHalfWidth: number;
  pinHeight: number;
  /** Gap kept between a label and any pin. */
  pinClearance: number;
}

/** Metrics for a map drawn at 1 viewBox unit per pixel (the state map). */
export const BASE_METRICS: LabelMetrics = {
  maxFont: 11,
  minFont: 7.5,
  floorFont: 6.5,
  minRoom: 20,
  inset: 3,
  sampleRows: [-5, 0, 5],
  rowStep: 2,
  pinHalfWidth: 7,
  pinHeight: 19,
  pinClearance: 2,
};

/** `BASE_METRICS` for a map whose viewBox unit is `scale` times the base unit. */
export function scaleMetrics(scale: number, overrides: Partial<LabelMetrics> = {}): LabelMetrics {
  return {
    maxFont: BASE_METRICS.maxFont * scale,
    minFont: BASE_METRICS.minFont * scale,
    floorFont: BASE_METRICS.floorFont * scale,
    minRoom: BASE_METRICS.minRoom * scale,
    inset: BASE_METRICS.inset * scale,
    sampleRows: BASE_METRICS.sampleRows.map((r) => r * scale),
    rowStep: BASE_METRICS.rowStep * scale,
    pinHalfWidth: BASE_METRICS.pinHalfWidth * scale,
    pinHeight: BASE_METRICS.pinHeight * scale,
    pinClearance: BASE_METRICS.pinClearance * scale,
    ...overrides,
  };
}

/** Average glyph advance as a share of the font size, for a 600-weight sans. */
const GLYPH_WIDTH = 0.6;
/**
 * Labels set outside their district sit on open canvas with room to spare, so
 * they are drawn larger than the in-district minimum.
 */
const OUTSIDE_FONT_SCALE = 1.5;
/** Line spacing of two-line labels, as a multiple of the font size. */
export const LINE_HEIGHT = 1.1;
/** Horizontal positions tried within a span, as fractions of its width. */
const SPAN_POSITIONS = [0.5, 0.35, 0.65, 0.2, 0.8];

export interface PlacedLabel {
  lines: string[];
  fontSize: number;
  x: number;
  y: number;
  anchor: "middle" | "end";
  /** False when the label sits outside the district (off its west or north edge). */
  inside: boolean;
  /**
   * For a label outside its district: a short line from the label to a point just
   * inside the district, so it is clear which district the label names.
   */
  leader?: [Point, Point];
}

/** All rings of a (Multi)Polygon, projected to screen space. */
export function projectedRings(
  geometry: Geometry,
  project: (p: Point) => Point | null
): Point[][] {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  return polygons.flatMap((rings) =>
    rings.map((ring) =>
      ring.map((p) => project(p as Point)).filter((p): p is Point => p !== null)
    )
  );
}

/** The horizontal spans where the row `y` lies inside the rings (even-odd rule). */
function rowSpans(rings: Point[][], y: number): Point[] {
  const xs: number[] = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const [ax, ay] = ring[i];
      const [bx, by] = ring[(i + 1) % ring.length];
      if (ay > y !== by > y) xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
    }
  }
  xs.sort((a, b) => a - b);
  const spans: Point[] = [];
  for (let i = 0; i + 1 < xs.length; i += 2) spans.push([xs[i], xs[i + 1]]);
  return spans;
}

/** Room for a label centred at `x` on row `y`: the narrowest of the sampled rows. */
function roomAt(rings: Point[][], x: number, y: number, m: LabelMetrics) {
  const width = Math.min(
    ...m.sampleRows.map((dy) => {
      const span = rowSpans(rings, y + dy).find(([l, r]) => l <= x && x <= r);
      return span ? 2 * Math.min(x - span[0], span[1] - x) : 0;
    })
  );
  return Math.max(0, width - 2 * m.inset);
}

export const overlaps = (a: Box, b: Box) =>
  a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** Box of an HQ pin whose tip is at `point` (head above), plus clearance. */
export function pinBox([px, py]: Point, m: LabelMetrics): Box {
  return [
    px - m.pinHalfWidth - m.pinClearance,
    py - m.pinHeight - m.pinClearance,
    px + m.pinHalfWidth + m.pinClearance,
    py + m.pinClearance,
  ];
}

/** Where a label may be forced outside its district: west over the sea, or north of the state. */
export type OutsideSide = "west" | "north";

/** Box a label occupies, centred on (x, y); `anchor: "end"` puts x on its right edge. */
export function labelBox(
  { lines, fontSize }: { lines: string[]; fontSize: number },
  x: number,
  y: number,
  anchor: "middle" | "end" = "middle"
): Box {
  const width = Math.max(...lines.map((l) => l.length)) * fontSize * GLYPH_WIDTH;
  const half = ((lines.length - 1) * fontSize * LINE_HEIGHT) / 2 + fontSize * 0.6;
  const left = anchor === "end" ? x - width : x - width / 2;
  return [left, y - half, left + width, y + half];
}

/**
 * Picks the largest font (maxFont down to minFont) at which `text` fits in
 * `available`, wrapping multi-word names onto two lines first when that lets them
 * stay larger. Narrow districts may go down to floorFont: a slightly smaller name
 * inside its own district reads better than one parked on a neighbour. Returns
 * null when nothing legible fits.
 */
function fitLabel(text: string, available: number, m: LabelMetrics) {
  const words = text.split(" ");
  const layouts = [[text]];
  if (words.length > 1) {
    const mid = Math.ceil(words.length / 2);
    layouts.push([words.slice(0, mid).join(" "), words.slice(mid).join(" ")]);
  }
  const sized = layouts.map((lines) => {
    const longest = Math.max(...lines.map((l) => l.length));
    return { lines, fontSize: Math.min(m.maxFont, available / (longest * GLYPH_WIDTH)) };
  });
  // One line at full size wins; otherwise take whichever layout is set larger.
  if (sized[0].fontSize >= m.maxFont) return sized[0];
  const largest = sized.reduce((a, b) => (b.fontSize > a.fontSize ? b : a));
  if (largest.fontSize >= m.minFont) return largest;
  if (available >= m.minRoom) {
    return { lines: largest.lines, fontSize: Math.max(largest.fontSize, m.floorFont) };
  }
  return null;
}

/**
 * Where a district's label goes and at what size.
 *
 * The bounding box overstates the room (most districts are irregular, and the
 * coastal ones are long and thin), so this measures the district's real interior
 * row by row. Among the spots where the label fits and clears every obstacle (the
 * HQ pins) it takes the largest font, then the one nearest the centroid. When the
 * district is too small for any legible size (Mumbai) the label goes just off its
 * western edge, over open water, and left of any pin there. `outside` sends it
 * outside regardless - "west" for coastal strips that only fit a label at an
 * unreadable size, "north" (just above the district's top edge) for small
 * districts on the state's northern border.
 */
export function placeDistrictLabel(
  text: string,
  rings: Point[][],
  centroid: Point,
  bounds: [Point, Point],
  obstacles: Box[],
  m: LabelMetrics,
  { outside: forceOutside }: { outside?: OutsideSide } = {}
): PlacedLabel {
  const [cx, cy] = centroid;
  const [[left, top], [, bottom]] = bounds;
  let best: (Omit<PlacedLabel, "anchor" | "inside"> & { score: number }) | null = null;

  for (let y = top + m.rowStep * 2; !forceOutside && y <= bottom - m.rowStep * 2; y += m.rowStep) {
    for (const [l, r] of rowSpans(rings, y)) {
      for (const t of SPAN_POSITIONS) {
        const x = l + (r - l) * t;
        const label = fitLabel(text, roomAt(rings, x, y, m), m);
        if (!label) continue;
        if (obstacles.some((o) => overlaps(labelBox(label, x, y), o))) continue;
        const score =
          (label.fontSize / m.maxFont) * 110 -
          (0.4 * Math.abs(y - cy) + 0.2 * Math.abs(x - cx)) / (m.maxFont / BASE_METRICS.maxFont);
        if (!best || score > best.score) best = { x, y, ...label, score };
      }
    }
  }

  if (best) {
    const { x, y, lines, fontSize } = best;
    return { x, y, lines, fontSize, anchor: "middle", inside: true };
  }

  const outside = { lines: [text], fontSize: m.minFont * OUTSIDE_FONT_SCALE };

  if (forceOutside === "north") {
    // Centred on the district's topmost row, a label's height above it, with the
    // leader dropping straight down into the district.
    const spans = rowSpans(rings, top + m.rowStep);
    const [l, r] = spans.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a), spans[0] ?? [cx, cx]);
    const x = (l + r) / 2;
    const y = top - m.inset * 3 - outside.fontSize * 0.6;
    const leader: [Point, Point] = [
      [x, y + outside.fontSize * 0.6 + m.inset / 2],
      [x, top + m.inset * 2],
    ];
    return { ...outside, x, y, anchor: "middle", inside: false, leader };
  }

  let x = left - m.inset * 3;
  for (const o of obstacles) {
    if (overlaps(labelBox(outside, x, cy, "end"), o)) x = o[0] - m.inset / 3;
  }
  // Leader: from the label's right end across the coast to just inside the
  // district's western edge on the same row (or its centroid if the row misses).
  const coast = rowSpans(rings, cy).reduce<Point | null>((a, b) => (!a || b[0] < a[0] ? b : a), null);
  const into = coast ? coast[0] + Math.min(m.inset * 2, (coast[1] - coast[0]) / 2) : cx;
  const leader: [Point, Point] = [
    [x + m.inset / 2, cy],
    [into, coast ? cy : centroid[1]],
  ];
  return { ...outside, x, y: cy, anchor: "end", inside: false, leader };
}
