import { geoMercator, geoPath } from "d3-geo";
import { topology } from "topojson-server";
import { merge } from "topojson-client";
import type { GeometryCollection, MultiPolygon, Polygon } from "topojson-specification";
import type { StateMap } from "./stateMaps";

/** The Figma ribbon's state icon (ribbon-maharashtra.png): 17x16, filled #2595D4. */
const WIDTH = 17;
const HEIGHT = 16;
const FILL = "#2595D4";

const outlines = new Map<string, string>();

/** The state's silhouette: its districts merged into one shape, fitted to the icon box. */
function outline(map: StateMap): string {
  let d = outlines.get(map.state);
  if (d === undefined) {
    const topo = topology({ districts: map.districts });
    // District shapes are all polygons, which is what merge() takes.
    const districts = (topo.objects.districts as GeometryCollection).geometries as Array<Polygon | MultiPolygon>;
    const shape = merge(topo, districts);
    d = geoPath(geoMercator().fitSize([WIDTH, HEIGHT], shape))(shape) ?? "";
    outlines.set(map.state, d);
  }
  return d;
}

/**
 * The breadcrumb root's icon for a state the Figma has no artwork for: the same
 * size and blue as Maharashtra's, drawn from the state's own district map.
 */
export function StateOutlineIcon({ map }: { map: StateMap }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      // Sized by the breadcrumb tab, like the other tier icons (HierarchyBreadcrumbs).
      aria-hidden
      data-state-outline={map.state}
    >
      <path d={outline(map)} fill={FILL} />
    </svg>
  );
}
