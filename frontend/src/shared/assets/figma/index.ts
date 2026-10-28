// Rasters exported straight from the Figma frames (the PDFs embed them), so the
// screens show the design's own artwork rather than redrawn approximations.
// `-dark` / `-light` pairs are where the two themes use different artwork.
const files = import.meta.glob<string>("./*.{png,jpg}", { eager: true, import: "default" });

/** A Figma asset by file name, without its extension. */
export function figmaAsset(name: string): string {
  const src = files[`./${name}.png`] ?? files[`./${name}.jpg`];
  if (!src) throw new Error(`Unknown Figma asset "${name}"`);
  return src;
}
