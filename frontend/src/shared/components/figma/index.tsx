import type { ReactNode } from "react";
import { Card } from "@/shared/components/ui";
import { figmaAsset } from "@/shared/assets/figma";
import { cn } from "@/shared/utils";
import { rem } from "@/shared/lib/uiScale";

/**
 * A Figma raster at its frame size (`w` / `h` in design px, rendered in rem so it
 * scales on large screens). With `dark`, the light-theme `name` is swapped
 * for `dark` in the dark theme (CSS only, so it needs no ThemeProvider); with only
 * `darkW` / `darkH`, the same artwork is resized for the dark theme.
 */
export function ThemedImg({
  name,
  dark,
  w,
  h,
  darkW = w,
  darkH = h,
  className,
}: {
  name: string;
  dark?: string;
  w: number;
  h: number;
  darkW?: number;
  darkH?: number;
  className?: string;
}) {
  if (!dark && (darkW !== w || darkH !== h)) dark = name;
  if (!dark) {
    return <img src={figmaAsset(name)} alt="" style={{ width: rem(w), height: rem(h) }} className={cn("shrink-0", className)} />;
  }
  return (
    <>
      <img src={figmaAsset(name)} alt="" style={{ width: rem(w), height: rem(h) }} className={cn("shrink-0 dark:hidden", className)} />
      {/* Some dark artwork carries a near-black backing square; the design lightens
          it into the tile, which mix-blend-lighten reproduces. */}
      <img src={figmaAsset(dark)} alt="" style={{ width: rem(darkW), height: rem(darkH) }} className={cn("shrink-0 hidden dark:block mix-blend-lighten", className)} />
    </>
  );
}

/** Heading text on a panel's title strip: 14px, uppercase, teal / cyan. */
export const PANEL_HEADING = "text-sm font-semibold uppercase text-jjm-blue-light dark:text-jjm-cyan";

/**
 * The Figma section card used on every dashboard: 8px corners, a 1px stroke, and
 * a 27px title strip (#EDF4F9 / #1C2D54) over a white / #0E1526 body.
 *
 * Given more height than it needs (a page column filling the screen, see
 * `FILL_COLUMN`), the body takes it, and a plain body hands it to its child -
 * so the tiles inside stretch rather than leaving the space empty.
 */
export function Panel({
  title,
  aside,
  children,
  className,
  headerClassName,
  bodyClassName = "px-2 py-2 flex flex-col [&>*]:grow",
}: {
  title?: ReactNode;
  /** Right-aligned heading text, e.g. "Total Scheme: 389". */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col rounded-lg overflow-hidden shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border",
        className,
      )}
    >
      {title !== undefined && (
        <div
          className={cn(
            "h-[1.6875rem] shrink-0 px-4 flex items-center justify-between gap-4 bg-jjm-light-bg dark:bg-jjm-surface",
            headerClassName,
          )}
        >
          <h2 className={cn(PANEL_HEADING, "truncate")}>{title}</h2>
          {aside !== undefined && <span className={cn(PANEL_HEADING, "whitespace-nowrap")}>{aside}</span>}
        </div>
      )}
      <div className={cn(bodyClassName, "grow")}>{children}</div>
    </Card>
  );
}

/**
 * A page column that fills the screen's height from 1280px up: each child grows
 * by an equal share of the spare height (and Panels pass it on to their tiles).
 * Tablet and phone layouts keep their natural height.
 */
export const FILL_COLUMN = "flex flex-col xl:[&>*]:grow";

/**
 * A stroked value tile: 6px corners, #F0F4F9 / #0E1526 fill, an 11px label over a
 * 16px value, optionally led by an icon. Its height is a minimum (pass `min-h-*`),
 * so it stretches with a panel that fills the screen.
 */
export function StatTile({
  label,
  value,
  icon,
  className,
  valueClassName = "text-base",
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-11 min-w-0 flex items-center gap-2 px-3 py-1 rounded-md border border-jjm-light-stroke dark:border-jjm-border bg-jjm-light-tile dark:bg-jjm-canvas text-black dark:text-white",
        className,
      )}
    >
      {icon}
      <div className="min-w-0 flex flex-col justify-center">
        <span className="text-[0.76875rem] leading-[1.0625rem] truncate">{label}</span>
        <span className={cn("font-bold leading-[1.25rem]", valueClassName)}>{value}</span>
      </div>
    </div>
  );
}

/**
 * A card whose heading sits on a full-width strip (40px by default) - the ESR
 * dashboard's figure, chart and detail cards. Like Panel, extra height goes to
 * the body.
 */
export function BandCard({
  title,
  icon,
  children,
  className,
  bandClassName = "h-10 justify-center",
  titleClassName = "text-[0.6875rem] leading-[0.8125rem] text-center",
  bodyClassName,
}: {
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  bandClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col rounded-lg overflow-hidden shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border",
        className,
      )}
    >
      <div className={cn("shrink-0 flex items-center gap-2 px-3 bg-jjm-light-bg dark:bg-jjm-surface", bandClassName)}>
        {icon}
        <h3 className={cn("font-semibold text-jjm-blue-light dark:text-jjm-cyan", titleClassName)}>{title}</h3>
      </div>
      <div className={cn(bodyClassName, "grow")}>{children}</div>
    </Card>
  );
}
