/**
 * Regenerates src/shared/assets/geo/<state>-districts.json, the district map of
 * one state (see widgets/gis-map-workbench/stateMaps.ts).
 *
 * Source: https://github.com/udit-001/india-maps-data (district boundaries, MIT).
 * Download geojson/states/<state>.geojson and pass its path and the state's slug:
 *
 *   node scripts/build-state-geo.mjs <path-to-maharashtra.geojson> maharashtra
 *   node scripts/build-state-geo.mjs <path-to-gujarat.geojson> gujarat
 *   node scripts/build-state-geo.mjs <path-to-madhya-pradesh.geojson> madhya-pradesh
 *
 * maharashtra-districts.json was built from the repository's 2011-census file
 * (Aurangabad, Osmanabad); its current file uses the renamed districts, so
 * rebuilding Maharashtra also means updating its region list.
 *
 * The raw file is ~1.2 MB, far too large to bundle, so it is simplified and its
 * coordinates rounded to 3 decimals (~110 m), well below one screen pixel at the
 * sizes this map renders.
 *
 * Simplification must be topology-aware. Simplifying each district on its own
 * simplifies every shared border twice, differently, which left 102 gaps and
 * overlaps between neighbours - visible as doubled, jagged border lines. mapshaper
 * (run via npx, so it is not a project dependency) simplifies each shared border
 * once, so neighbouring districts keep an identical edge and the map can draw
 * every border exactly once.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { geoArea } from "d3-geo";

const [SRC, STATE] = process.argv.slice(2);
const OUT = `src/shared/assets/geo/${STATE}-districts.json`;
const MAPSHAPER = "mapshaper@0.7.69";
// ~3 km, the same detail the earlier 0.03-degree Douglas-Peucker pass kept.
const SIMPLIFY_INTERVAL_M = Number(process.env.GEO_INTERVAL ?? 3000);
/** Drops offshore islets that add points but are invisible at dashboard scale. */
const MIN_ISLAND_KM2 = 18;

if (!SRC || !STATE || !/^[a-z-]+$/.test(STATE)) {
  console.error("usage: node scripts/build-state-geo.mjs <state.geojson> <state-slug>");
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), `${STATE}-geo-`));
const tmp = join(dir, "districts.json");

const run = spawnSync(
  "npx",
  [
    "-y",
    MAPSHAPER,
    SRC,
    "-filter-fields", "district",
    "-simplify", "dp", `interval=${SIMPLIFY_INTERVAL_M}`, "keep-shapes",
    "-filter-islands", `min-area=${MIN_ISLAND_KM2}km2`,
    // Rounding can leave hairline slivers; -clean resolves them to one owner.
    "-o", "format=geojson", "precision=0.001", tmp,
  ],
  { stdio: "inherit", shell: process.platform === "win32" }
);
if (run.status !== 0) process.exit(run.status ?? 1);

// Re-read, clean the rounded output, then fix winding for d3.
const cleaned = join(dir, "clean.json");
const clean = spawnSync(
  "npx",
  ["-y", MAPSHAPER, tmp, "-clean", "-o", "format=geojson", "precision=0.001", cleaned],
  { stdio: "inherit", shell: process.platform === "win32" }
);
if (clean.status !== 0) process.exit(clean.status ?? 1);

/**
 * d3-geo reads rings wound the opposite way from mapshaper's output (a polygon
 * then covers the whole globe except the district). Reverse any polygon whose
 * spherical area exceeds a hemisphere.
 */
function rewindPolygon(rings) {
  const area = geoArea({ type: "Polygon", coordinates: rings });
  return area > 2 * Math.PI ? rings.map((r) => [...r].reverse()) : rings;
}

const source = JSON.parse(readFileSync(cleaned, "utf8"));
const features = source.features.map((f) => {
  const g = f.geometry;
  const geometry =
    g.type === "Polygon"
      ? { type: "Polygon", coordinates: rewindPolygon(g.coordinates) }
      : { type: "MultiPolygon", coordinates: g.coordinates.map(rewindPolygon) };
  return { type: "Feature", properties: { district: f.properties.district }, geometry };
});

writeFileSync(OUT, JSON.stringify({ type: "FeatureCollection", features }));
rmSync(dir, { recursive: true, force: true });

const points = (fc) =>
  fc.features.reduce((n, f) => n + f.geometry.coordinates.flat(Infinity).length / 2, 0);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const raw = JSON.parse(readFileSync(SRC, "utf8"));
console.log(`districts: ${features.length}`);
console.log(`points:    ${points(raw)} -> ${points({ features })}`);
console.log(`size:      ${kb(readFileSync(SRC).length)} -> ${kb(readFileSync(OUT).length)}`);
