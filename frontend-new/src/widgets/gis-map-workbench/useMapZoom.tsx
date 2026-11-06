import { useEffect, useRef, useState } from "react";
import { select, zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/shared/components/ui";

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 8;
/** Scale factor applied by one press of the zoom buttons. */
const ZOOM_STEP = 1.6;
const ZOOM_DURATION_MS = 250;

export interface MapZoomOptions {
  /**
   * Whether the mouse wheel (and double-click) zoom the map. Off, the wheel scrolls
   * the page as usual and only the buttons zoom; dragging still pans.
   */
  wheelZoom?: boolean;
}

/**
 * Zoom & pan for an SVG map: wheel/pinch zooms about the pointer (unless
 * `wheelZoom` is off), drag pans, and `zoomIn` / `zoomOut` / `reset` step about
 * the centre. `extent` is the map's
 * viewBox as [[x0, y0], [x1, y1]]; panning never leaves it. d3-zoom also swallows
 * the click that ends a drag, so panning never selects a district by accident.
 *
 * Apply `transform.toString()` to the <g> holding the map layer, and keep chrome
 * (legend, compass) outside that group.
 */
export function useMapZoom(
  extent: [[number, number], [number, number]] | null,
  { wheelZoom = true }: MapZoomOptions = {}
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const key = extent ? extent.flat().join(",") : "";

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !extent) return;
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .extent(extent)
      .translateExtent(extent)
      // d3's default filter, minus the wheel when it is switched off. Letting the
      // wheel event through un-handled means the page scrolls instead.
      .filter(
        (event: MouseEvent) =>
          (wheelZoom ? !event.ctrlKey || event.type === "wheel" : event.type !== "wheel" && !event.ctrlKey) &&
          !event.button
      )
      .on("zoom", (event: { transform: ZoomTransform }) => setTransform(event.transform));
    zoomRef.current = behavior;
    const selection = select(svg).call(behavior);
    if (!wheelZoom) selection.on("dblclick.zoom", null);
    // A new extent (another region) starts from the full view.
    selection.call(behavior.transform, zoomIdentity);
    return () => {
      selection.on(".zoom", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures `extent`
  }, [key, wheelZoom]);

  const animate = (apply: (behavior: ZoomBehavior<SVGSVGElement, unknown>) => void) => {
    if (svgRef.current && zoomRef.current) apply(zoomRef.current);
  };
  const zoomBy = (factor: number) =>
    animate((b) =>
      select(svgRef.current!).transition().duration(ZOOM_DURATION_MS).call(b.scaleBy, factor)
    );

  return {
    svgRef,
    transform,
    zoomIn: () => zoomBy(ZOOM_STEP),
    zoomOut: () => zoomBy(1 / ZOOM_STEP),
    reset: () =>
      animate((b) =>
        select(svgRef.current!)
          .transition()
          .duration(ZOOM_DURATION_MS)
          .call(b.transform, zoomIdentity)
      ),
  };
}

interface MapZoomControlsProps {
  zoom: ReturnType<typeof useMapZoom>;
  className?: string;
}

/** The +/−/reset button stack that drives `useMapZoom`. */
export function MapZoomControls({ zoom: z, className = "" }: MapZoomControlsProps) {
  const k = z.transform.k;
  const buttons = [
    { label: "Zoom in", icon: ZoomIn, onClick: z.zoomIn, disabled: k >= MAX_ZOOM },
    { label: "Zoom out", icon: ZoomOut, onClick: z.zoomOut, disabled: k <= MIN_ZOOM },
    // Returns to the full view; a "maximise" glyph read as full-screen.
    { label: "Reset zoom", icon: RotateCcw, onClick: z.reset, disabled: k <= MIN_ZOOM },
  ];
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {buttons.map(({ label, icon: Icon, onClick, disabled }) => (
        <Button
          key={label}
          variant="outline"
          size="icon"
          type="button"
          title={label}
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className="h-8 w-8 bg-white/90 dark:bg-[#0B1528]/90 border-[#0E7490]/40 dark:border-jjm-cyan/40 text-[#0E7490] dark:text-jjm-cyan hover:bg-white dark:hover:bg-jjm-surface backdrop-blur-md"
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}
