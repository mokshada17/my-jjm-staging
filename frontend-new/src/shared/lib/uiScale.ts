/**
 * Large-screen scaling. The root font size is 16px up to 1920px and grows with
 * the viewport above it (see globals.css), so anything sized in rem scales with
 * it. These helpers cover the sizes that cannot be classes.
 */

/**
 * Fired on window when the root font size changes without a resize - the page
 * being re-fitted to the screen - so px-drawn charts redraw at the new scale.
 */
export const UI_SCALE_EVENT = "jjm:uiscale";

/**
 * Marks a page that is longer than a screen by design (the Region Overview's
 * region cards): it is sized to the screen like every page, but never shrunk to
 * fit its height - it scrolls, by itself in wall mode. Set by DashboardLayout's
 * `scrolls` prop.
 */
export const SCROLLING_PAGE = "data-page-scrolls";

/** A design-pixel size as rem, for inline styles and SVG width / height props. */
export const rem = (px: number) => `${px / 16}rem`;

/** The current scale: root font size over the 16px it is drawn at (1 up to 1920px). */
export function readUiScale(): number {
  if (typeof window === "undefined" || typeof getComputedStyle === "undefined") return 1;
  const size = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(size) && size > 0 ? size / 16 : 1;
}
