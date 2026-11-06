/**
 * Screen fitting: the root font size that shows a page exactly on one screen. Every size in the app is in rem, so the root font size scales the
 * whole page (see the rule in globals.css).
 */

/** The design frame every Figma screen is drawn in. */
export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;
/** The root font size the design is drawn at. */
export const DESIGN_FONT = 16;

/**
 * Screens at least this wide are fitted: the desktop layouts start here (xl).
 * Narrower ones - tablets, phones - have layouts of their own and keep them.
 */
export const FIT_MIN_WIDTH = 1280;

/**
 * The page's scale is never cut below this share of the screen's own scale. A
 * page that still does not fit (a long region list) scrolls - by itself in wall
 * mode. Text below ~60% stops being readable across a control room.
 */
export const MIN_FIT = 0.6;

/** The 1920x1080 design scaled to the screen: 720p is x0.67, 4K x2, 8K x4. */
export function screenFont(width: number, height: number): number {
  return DESIGN_FONT * Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
}

/**
 * How much the page overflows the screen at the current size: 1 when it fits,
 * 1.29 when it is 29% too tall (or too wide).
 */
export function overflow(page: { width: number; height: number }, screen: { width: number; height: number }): number {
  return Math.max(1, page.height / screen.height, page.width / screen.width);
}

/**
 * The next size to try: the current one shrunk by the overflow. Page size is
 * close to linear in the root font size (it is all rem), so this converges in a
 * step or two; a fixed-size part (a border, a px chart) is why more than one is
 * allowed. Never below `floor`.
 */
export function shrinkToFit(font: number, over: number, floor: number): number {
  // A hair more than the overflow, so rounding cannot leave a 1-2px scrollbar.
  return Math.max(floor, font / (over * 1.002));
}
