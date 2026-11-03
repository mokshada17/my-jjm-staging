import { useMemo, useState } from "react";
import { geoPath } from "d3-geo";
import { topology } from "topojson-server";
import { mesh } from "topojson-client";
import type { GeometryCollection, GeometryObject } from "topojson-specification";
import type { DistrictCollection, StateMap } from "./stateMaps";
import { HEIGHT, LEGEND_SCALE, WIDTH, fitState, legendLayout } from "./stateMapLayout";
import {
  BASE_METRICS,
  LINE_HEIGHT,
  pinBox,
  placeDistrictLabel,
  projectedRings,
  type Point,
} from "./labelPlacement";
import { MIN_ZOOM, MapZoomControls, useMapZoom } from "./useMapZoom";

interface StateRegionMapProps {
  /** The state to draw: its districts, coloured by region (see stateMaps.ts). */
  map: StateMap;
  selectedRegion?: string;
  onSelectRegion?: (regionId: string) => void;
  className?: string;
}

interface DistrictProps {
  district: string;
}

/** Width of region borders and the state's outer edge, in px. */
const REGION_EDGE = 1.5;
/** Width of the lines between districts of the same region, in px. */
const DISTRICT_EDGE = 0.8;

const UNASSIGNED_FILL = "#CBD5E1";

/** Colour of the region borders and district lines: a soft charcoal. */
const EDGE_COLOUR = "#374151";

const EXTENT: [Point, Point] = [
  [0, 0],
  [WIDTH, HEIGHT],
];

/** A state's districts coloured by region, with HQ pins and a region legend. */
export function StateRegionMap({
  map,
  selectedRegion,
  onSelectRegion,
  className = "",
}: StateRegionMapProps) {
  const { regions, regionByDistrict, displayNames, outsideLabels } = map;
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const { districts, lines, project } = useMemo(() => {
    const collection = map.districts as DistrictCollection;
    const projection = fitState(collection, legendLayout(regions.map((r) => r.label)));
    const generator = geoPath(projection);
    // Labels are placed around the HQ pins so a pin never sits on a name. Pins and
    // labels scale together while zooming, so clearing them at zoom 1 clears them always.
    const obstacles = regions.map((r) => projection(r.hq))
      .filter((p): p is Point => p !== null)
      .map((p) => pinBox(p, BASE_METRICS));

    // Borders as lines, each drawn exactly once. The asset's districts share their
    // borders vertex-for-vertex (see scripts/build-state-geo.mjs), so a
    // topology recovers each shared border as a single arc: no doubled strokes,
    // no gaps. mesh() then splits them by what lies either side.
    const topo = topology({ districts: collection });
    const shapes = topo.objects.districts as GeometryCollection<DistrictProps>;
    const regionOf = (g: GeometryObject) =>
      regionByDistrict[(g.properties as Partial<DistrictProps> | undefined)?.district ?? ""]?.id;
    const lines = {
      // Between two districts of the same region.
      district: generator(mesh(topo, shapes, (a, b) => a !== b && regionOf(a) === regionOf(b))) ?? "",
      // Between regions, plus the state's outer edge (an arc with one side, a === b).
      region: generator(mesh(topo, shapes, (a, b) => a === b || regionOf(a) !== regionOf(b))) ?? "",
    };

    return {
      lines,
      districts: collection.features.map((feature) => {
        const name = feature.properties.district;
        return {
          name,
          region: regionByDistrict[name],
          d: generator(feature) ?? "",
          label: placeDistrictLabel(
            displayNames[name] ?? name,
            projectedRings(feature.geometry, projection),
            generator.centroid(feature),
            generator.bounds(feature),
            obstacles,
            BASE_METRICS,
            { outside: outsideLabels[name] }
          ),
        };
      }),
      project: projection,
    };
  }, [map, regions, regionByDistrict, displayNames, outsideLabels]);

  // Only the map layer zooms; the compass and legend stay put. The wheel scrolls the
  // page rather than zooming - the +/- buttons are the only zoom control here.
  const mapZoom = useMapZoom(EXTENT, { wheelZoom: false });
  const { svgRef, transform } = mapZoom;

  const activeRegion = hoveredRegion ?? selectedRegion;
  const activeLabel = regions.find((r) => r.id === activeRegion)?.label ?? activeRegion;
  const legend = useMemo(() => legendLayout(regions.map((r) => r.label)), [regions]);

  return (
    <div
      className={`relative w-full h-full min-h-[31.25rem] flex flex-col justify-between rounded-xl bg-white dark:bg-jjm-canvas border border-slate-200 dark:border-jjm-border p-4 select-none overflow-hidden transition-colors duration-150 ${className}`}
    >
      <div className="relative w-full flex-1 flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          // overflow-visible: when zoomed, the map fills the whole card (which clips it)
          // instead of stopping at the letterboxed viewBox edge.
          className={`w-full h-full max-h-[35rem] touch-none overflow-visible ${
            transform.k > MIN_ZOOM ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          role="img"
          aria-label={`${map.state} regional water supply map`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform={transform.toString()}>
            {/* District fills, coloured by their region. No stroke: the border
                lines below cover every edge. Dimming uses a filter, not opacity -
                translucent fills let the background seam through at shared edges. */}
            {districts.map(({ name, region, d }) => {
              const isActive = region?.id === activeRegion;
              return (
                <path
                  key={name}
                  d={d}
                  fill={region?.fill ?? UNASSIGNED_FILL}
                  className="cursor-pointer transition-[filter] duration-150"
                  style={{ filter: isActive ? "brightness(1.08)" : "brightness(0.86)" }}
                  onClick={() => region && onSelectRegion?.(region.id)}
                  onMouseEnter={() => setHoveredRegion(region?.id ?? null)}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  {/* Just the hovered district's own name, not its region as well */}
                  <title>{displayNames[name] ?? name}</title>
                </path>
              );
            })}

            {/* Borders, each drawn once: thin between districts, heavier between regions */}
            <path
              data-lines="district"
              d={lines.district}
              fill="none"
              stroke={EDGE_COLOUR}
              strokeWidth={DISTRICT_EDGE}
              strokeLinejoin="round"
              className="pointer-events-none"
              vectorEffect="non-scaling-stroke"
            />
            <path
              data-lines="region"
              d={lines.region}
              fill="none"
              stroke={EDGE_COLOUR}
              strokeWidth={REGION_EDGE}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="pointer-events-none"
              vectorEffect="non-scaling-stroke"
            />

            {/* Regional HQ pins. They scale with the map, like the district labels:
                held at a fixed size they looked tiny beside labels grown by zoom. */}
            {regions.map((region) => {
              const point = project(region.hq);
              if (!point) return null;
              return (
                <g
                  key={`hq-${region.id}`}
                  data-pin={region.id}
                  transform={`translate(${point[0]}, ${point[1]})`}
                  className="pointer-events-none"
                >
                  <path
                    d="M 0 0 C -4 -4 -7 -8 -7 -12 A 7 7 0 1 1 7 -12 C 7 -8 4 -4 0 0 Z"
                    fill="#E53935"
                    stroke="#FFF"
                    strokeWidth="1"
                  />
                  <circle cx="0" cy="-12" r="2.5" fill="#FFF" />
                </g>
              );
            })}

            {/* Leaders tying each outside label (Mumbai, Ratnagiri, Sindhudurg,
                Bhandara) to its district, ending in a dot just inside it. They scale
                with the map, like the labels they belong to. */}
            {districts.map(({ name, label }) =>
              label.leader ? (
                <g
                  key={`leader-${name}`}
                  data-leader={name}
                  className="pointer-events-none stroke-slate-500 fill-slate-500 dark:stroke-slate-400 dark:fill-slate-400"
                >
                  <line
                    x1={label.leader[0][0]}
                    y1={label.leader[0][1]}
                    x2={label.leader[1][0]}
                    y2={label.leader[1][1]}
                    strokeWidth={0.75}
                  />
                  <circle
                    cx={label.leader[1][0]}
                    cy={label.leader[1][1]}
                    r={1.8}
                    stroke="none"
                  />
                </g>
              ) : null
            )}

            {/* District labels, drawn after the pins so an HQ pin never hides a name.
                No halo: at these sizes a stroke outline renders as a jagged edge. */}
            {districts.map(({ name, label }) => (
              <text
                key={`label-${name}`}
                x={label.x}
                y={label.y - ((label.lines.length - 1) * label.fontSize * LINE_HEIGHT) / 2}
                textAnchor={label.anchor}
                dominantBaseline="middle"
                fontSize={label.fontSize}
                fontWeight={600}
                textRendering="geometricPrecision"
                className={
                  label.inside
                    ? // Sits on a pastel district fill, which stays light in both themes.
                      "pointer-events-none fill-slate-900"
                    : // Sits on the canvas, so it has to invert with the theme.
                      "pointer-events-none fill-slate-700 dark:fill-slate-300"
                }
              >
                {label.lines.map((line, i) => (
                  <tspan key={line} x={label.x} dy={i === 0 ? 0 : label.fontSize * LINE_HEIGHT}>
                    {line}
                  </tspan>
                ))}
              </text>
            ))}
          </g>

          {/* Region legend, drawn at LEGEND_SCALE and anchored so its backing panel
              (see legendLayout: one column up to six regions, then two) stays
              inside the bottom-right corner. */}
          <g
            transform={`translate(${WIDTH - 8 - (legend.width - 8) * LEGEND_SCALE}, ${
              HEIGHT - 8 - (legend.height - 12) * LEGEND_SCALE
            }) scale(${LEGEND_SCALE})`}
          >
            {/* Backing panel once the zoomed map can pan underneath */}
            {transform.k > MIN_ZOOM && (
              <rect
                x="-8"
                y="-12"
                width={legend.width}
                height={legend.height}
                rx="6"
                className="fill-white/90 stroke-slate-200 dark:fill-jjm-canvas/90 dark:stroke-jjm-border"
                strokeWidth="0.8"
              />
            )}
            <text x="0" y="0" fontSize="9" className="fill-slate-500 dark:fill-[#94A3B8]" fontWeight="bold">
              Regions
            </text>
            {regions.map((region, i) => (
              <g
                key={`legend-${region.id}`}
                transform={`translate(${Math.floor(i / legend.rows) * legend.colWidth}, ${
                  8 + (i % legend.rows) * 12
                })`}
                className="cursor-pointer"
                onClick={() => onSelectRegion?.(region.id)}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <rect x="0" y="0" width="14" height="8" fill={region.fill} rx="1" />
                <text
                  x="20"
                  y="7"
                  fontSize="8"
                  className="fill-slate-600 dark:fill-[#CBD5E1]"
                  fontWeight={region.id === activeRegion ? 700 : 400}
                >
                  {region.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="absolute top-3 left-3 bg-white/90 dark:bg-[#0B1528]/90 border border-[#0E7490]/40 dark:border-jjm-cyan/40 px-3 py-1.5 rounded-lg text-xs text-slate-700 dark:text-white backdrop-blur-md">
        <span className="text-[#0E7490] dark:text-jjm-cyan font-bold">{activeLabel} Region</span> — Click to inspect telemetry
      </div>

      <MapZoomControls zoom={mapZoom} className="absolute top-3 right-3" />

      {/* Compass rose, pinned to the card's bottom-left corner like the badge and
          zoom controls in the other corners - not inside the map drawing, which is
          letterboxed and would leave it floating mid-card. */}
      <svg
        data-compass
        viewBox="-28 -36 56 64"
        width="3.5rem"
        height="4rem"
        className="absolute bottom-[6.375rem] left-3 pointer-events-none opacity-85"
        aria-hidden
      >
        {/* Backing disc once the zoomed map can pan underneath */}
        {transform.k > MIN_ZOOM && (
          <circle r="27" className="fill-white/90 dark:fill-jjm-canvas/90" />
        )}
        <circle
          cx="0"
          cy="0"
          r="18"
          fill="none"
          className="stroke-[#0E7490] dark:stroke-jjm-cyan"
          strokeWidth="0.8"
          strokeDasharray="1 3"
        />
        <polygon points="0,-22 4,-4 0,0 -4,-4" className="fill-[#0E7490] dark:fill-jjm-cyan" />
        <polygon points="0,22 4,4 0,0 -4,4" className="fill-slate-400 dark:fill-[#475569]" />
        <polygon points="22,0 4,4 0,0 4,-4" className="fill-slate-400 dark:fill-[#475569]" />
        <polygon points="-22,0 -4,4 0,0 -4,-4" className="fill-slate-400 dark:fill-[#475569]" />
        <text
          x="0"
          y="-26"
          fontSize="9"
          className="fill-[#0E7490] dark:fill-jjm-cyan"
          textAnchor="middle"
          fontWeight="bold"
        >
          N
        </text>
      </svg>
    </div>
  );
}
