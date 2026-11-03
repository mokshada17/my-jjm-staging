/**
 * DOM helpers shared by the map tests. They read positions back from the rendered
 * SVG, so the assertions check what is drawn rather than the placement internals.
 */

/** The <g> that carries the zoom transform (the district layer). */
export function mapLayer(container: HTMLElement) {
  return container.querySelector("svg > g[transform]") as SVGGElement;
}

/** Current zoom scale of the map layer. */
export function scaleOf(layer: SVGGElement) {
  const match = /scale\(([\d.]+)\)/.exec(layer.getAttribute("transform") ?? "");
  return match ? Number(match[1]) : NaN;
}

type Box = [number, number, number, number];

/**
 * HQ pins: <g data-pin transform="translate(x, y) [scale(s)]">, 14s wide and 19s
 * tall above the tip. Found by `data-pin`, not by their transform, so a pin drawn
 * without a scale (it scales with the map) is still counted.
 */
export function pinBoxes(layer: SVGGElement): Box[] {
  return [...layer.querySelectorAll("g[data-pin]")].map((g) => {
    const t = g.getAttribute("transform")!;
    const [, x, y] = /translate\(([-\d.e]+),\s*([-\d.e]+)\)/.exec(t)!.map(Number);
    const s = Number(/scale\(([-\d.e]+)\)/.exec(t)?.[1] ?? 1);
    return [x - 7 * s, y - 19 * s, x + 7 * s, y];
  });
}

/** District labels with the box each occupies (same glyph estimate as the placement). */
function labelBoxes(layer: SVGGElement) {
  return [...layer.querySelectorAll("text")].map((text) => {
    const x = Number(text.getAttribute("x"));
    const y = Number(text.getAttribute("y"));
    const size = Number(text.getAttribute("font-size"));
    const lines = [...text.querySelectorAll("tspan")].map((t) => t.textContent ?? "");
    const width = Math.max(...lines.map((l) => l.length)) * size * 0.6;
    const left = text.getAttribute("text-anchor") === "end" ? x - width : x - width / 2;
    const top = y - size * 0.6;
    const box: Box = [left, top, left + width, top + lines.length * size * 1.1];
    return { name: lines.join(" "), box };
  });
}

/** Names of labels that overlap an HQ pin, plus the counts found (for sanity checks). */
export function pinCollisions(layer: SVGGElement) {
  const pins = pinBoxes(layer);
  const labels = labelBoxes(layer);
  const collisions = labels
    .filter(({ box }) =>
      pins.some((p) => box[0] < p[2] && p[0] < box[2] && box[1] < p[3] && p[1] < box[3])
    )
    .map((l) => l.name);
  return { pins: pins.length, labels: labels.length, collisions };
}
