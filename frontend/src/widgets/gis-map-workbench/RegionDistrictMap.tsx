import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { findRegion, type DistrictCollection, type StateMap } from "./stateMaps";
import {
  LINE_HEIGHT,
  pinBox,
  placeDistrictLabel,
  projectedRings,
  scaleMetrics,
  type Point,
} from "./labelPlacement";
import { MIN_ZOOM, MapZoomControls, useMapZoom } from "./useMapZoom";

interface RegionDistrictMapProps {
  /** The state the region belongs to (see stateMaps.ts). */
  map: StateMap;
  /** Region id from the route, e.g. "nagpur", or its name. */
  regionId?: string;
  onSelectDistrict?: (district: string) => void;
  className?: string;
}

/**
 * Regions differ wildly in shape — Konkan is a tall coastal ribbon, Nagpur is broad.
 * Projecting into a fixed box would letterbox Konkan into a sliver, so each region is
 * projected into a square reference frame and the viewBox is then cropped to its own
 * bounds. Aspect ratio stays true; the region just fills the panel.
 */
const REFERENCE = 400;
const PAD_RATIO = 0.05;
/** Rendered height of the map, in CSS px (matches the svg's h-[17rem]). */
const SVG_HEIGHT = 272;

export function RegionDistrictMap({
  map,
  regionId,
  onSelectDistrict,
  className = "",
}: RegionDistrictMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const region = useMemo(() => findRegion(map, regionId), [map, regionId]);

  const view = useMemo(() => {
    if (!region) return null;

    const all: DistrictCollection = map.districts;
    const subset: DistrictCollection = {
      type: "FeatureCollection",
      features: all.features.filter((f) =>
        region.districts.includes(f.properties.district)
      ),
    };
    if (!subset.features.length) return null;

    // Fitted to this region alone, so the view is genuinely zoomed to it rather
    // than a crop of the state projection.
    const projection = geoMercator().fitExtent(
      [
        [0, 0],
        [REFERENCE, REFERENCE],
      ],
      subset
    );
    const generator = geoPath(projection);

    const [[x0, y0], [x1, y1]] = generator.bounds(subset);
    const pad = Math.max(x1 - x0, y1 - y0) * PAD_RATIO;
    const viewW = x1 - x0 + pad * 2;
    const viewH = y1 - y0 + pad * 2;
    const extent: [Point, Point] = [
      [x0 - pad, y0 - pad],
      [x1 + pad, y1 + pad],
    ];

    // Lengths here are in viewBox units, which track the crop, not the panel. Label
    // sizes are specified in screen px (the same as the state map) and converted
    // through the rendered height; the pin keeps its existing crop-relative scale.
    const pinScale = Math.max(viewW, viewH) / REFERENCE;
    const metrics = scaleMetrics(viewH / SVG_HEIGHT, {
      pinHalfWidth: 7 * pinScale,
      pinHeight: 19 * pinScale,
      pinClearance: 2 * pinScale,
    });
    const hq = projection(region.hq);
    const obstacles = hq ? [pinBox(hq, metrics)] : [];

    return {
      viewBox: `${extent[0][0]} ${extent[0][1]} ${viewW} ${viewH}`,
      extent,
      pinScale,
      hq,
      districts: subset.features.map((feature) => {
        const name = feature.properties.district;
        const display = map.displayNames[name] ?? name;
        return {
          name,
          display,
          d: generator(feature) ?? "",
          label: placeDistrictLabel(
            display,
            projectedRings(feature.geometry, projection),
            generator.centroid(feature),
            generator.bounds(feature),
            obstacles,
            metrics
          ),
        };
      }),
    };
  }, [map, region]);

  // Only the map layer zooms. Switching region resets to the full view. As on the
  // state map, the wheel scrolls the page - the +/- buttons are the only zoom control.
  const mapZoom = useMapZoom(view?.extent ?? null, { wheelZoom: false });
  const { svgRef, transform } = mapZoom;

  if (!region || !view) {
    return (
      <div
        className={`rounded-xl bg-white dark:bg-jjm-canvas border border-slate-200 dark:border-jjm-border p-3 flex items-center justify-center min-h-[18.75rem] text-xs text-slate-500 dark:text-slate-400 ${className}`}
      >
        No boundary data for region "{regionId}"
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-white dark:bg-jjm-canvas border border-slate-200 dark:border-jjm-border p-3 flex flex-col min-h-[18.75rem] relative overflow-hidden shadow-sm transition-colors duration-150 ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[0.6875rem] font-bold text-jjm-blue-light dark:text-jjm-cyan uppercase tracking-wider">
          {region.label} Region
        </h2>
        <span className="text-[0.625rem] text-slate-500 dark:text-slate-400">
          {hovered ?? `${view.districts.length} districts`}
        </span>
      </div>

      {/* The zoomed map may spread past the svg box to fill this panel, which clips
          it below the header. */}
      <div className="relative flex-1 flex items-center overflow-hidden select-none">
        {/* Fixed height with auto width: every region renders at the same visual weight
            and keeps its true proportions instead of being stretched to the panel. */}
        <svg
          ref={svgRef}
          viewBox={view.viewBox}
          preserveAspectRatio="xMidYMid meet"
          className={`h-[17rem] w-auto max-w-full mx-auto touch-none overflow-visible ${
            transform.k > MIN_ZOOM ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          role="img"
          aria-label={`${region.label} region district map`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <g transform={transform.toString()}>
            {view.districts.map(({ name, display, d }) => (
              <path
                key={name}
                d={d}
                fill={region.fill}
                className="cursor-pointer transition-[opacity] duration-150 stroke-white dark:stroke-jjm-canvas"
                strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
                opacity={hovered === null || hovered === display ? 1 : 0.7}
                onClick={() => onSelectDistrict?.(name)}
                onMouseEnter={() => setHovered(display)}
                onMouseLeave={() => setHovered(null)}
              >
                <title>{display}</title>
              </path>
            ))}

            {/* Internal district boundaries drawn over the fills */}
            {view.districts.map(({ name, d }) => (
              <path
                key={`edge-${name}`}
                d={d}
                fill="none"
                className="pointer-events-none stroke-white/70 dark:stroke-jjm-canvas/60"
                strokeWidth={0.8}
                strokeDasharray="3 2"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Regional HQ. It scales with the map, like the district labels: held
                at a fixed size it looked tiny beside labels grown by zoom. */}
            {view.hq && (
              <g
                data-pin="hq"
                transform={`translate(${view.hq[0]}, ${view.hq[1]}) scale(${view.pinScale})`}
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
            )}

            {/* District labels, placed clear of the HQ pin and drawn after it. No
                halo: at these sizes a stroke outline renders as a jagged edge. */}
            {view.districts.map(({ name, label }) => (
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
                    ? // Sits on the pastel region fill, which stays light in both themes.
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
        </svg>

        <MapZoomControls zoom={mapZoom} className="absolute top-1 right-1" />
      </div>
    </div>
  );
}
