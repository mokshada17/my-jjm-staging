import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/shared/utils";
import { useMediaQuery } from "@/shared/hooks";
import { SCROLLING_PAGE } from "@/shared/lib/uiScale";
import { useAppStore } from "@/app/store";
import { HierarchyTier } from "@/entities/hierarchy";
import { HierarchyBreadcrumbs } from "@/widgets/hierarchy-breadcrumbs/HierarchyBreadcrumbs";
import { TimeScrubberBar } from "@/widgets/dashboard-kpi-grid/TimeScrubberBar";
import { JjmHeader } from "./JjmHeader";
import { headerTitle } from "./headerTitle";

export interface DashboardLayoutProps {
  currentTier?: HierarchyTier;
  /** Overrides the route-derived heading; see `headerTitle`. */
  title?: string;
  children: ReactNode;
  contentClassName?: string;
  hideScrubber?: boolean;
  onSelectTier?: (tier: HierarchyTier) => void;
  /**
   * The page is longer than a screen by design: it keeps the screen's size and
   * scrolls instead of being shrunk to fit (features/screen-fit).
   */
  scrolls?: boolean;
}

export function DashboardLayout({
  currentTier = "State",
  title,
  children,
  contentClassName = "max-w-[120rem] w-full mx-auto p-3",
  hideScrubber = false,
  onSelectTier,
  scrolls = false,
}: DashboardLayoutProps) {
  const { pathname } = useLocation();
  const heading = title ?? headerTitle(pathname, currentTier);
  // Desktop and wider screens are fitted to the screen (features/screen-fit).
  const fitted = useMediaQuery("(min-width: 1280px)");
  const wallMode = useAppStore((s) => s.wallMode);

  return (
    <div
      {...(scrolls && { [SCROLLING_PAGE]: "" })}
      className="min-h-screen bg-jjm-light-page dark:bg-jjm-page text-slate-900 dark:text-white flex flex-col justify-between selection:bg-jjm-cyan/30 overflow-x-hidden transition-colors duration-150">
      {/* Universal JJM Top Header */}
      <JjmHeader title={heading} />

      {/* Universal 9-Tier Breadcrumb Ribbon: white (light), #0E1526 with a 1px
          #283D66 underline (dark); the tabs span its width. 10px above and below
          the 36px tabs, so it grows with the enlarged tabs from 2560px
          (HierarchyBreadcrumbs). Outside wall mode (fullscreen) the ribbon is
          taller: 12px around 44px tabs, 68px in all. */}
      <div
        className={cn(
          "py-2.5 shrink-0 flex items-center px-4 bg-white dark:bg-jjm-canvas dark:border-b dark:border-jjm-border transition-colors duration-150",
          !wallMode && "py-3"
        )}
      >
        <HierarchyBreadcrumbs
          currentTier={currentTier}
          onSelectTier={onSelectTier}
          className="min-w-0"
          tall={!wallMode}
        />
      </div>

      {/* Page Canvas */}
      {/* A fitted page spans the whole screen: on a 16:9 screen the 1920 cap
          already is its width, and a 21:9 wall or a page shrunk to fit its height
          would otherwise leave empty bands either side. */}
      <main className={cn("flex-1 flex flex-col", contentClassName, fitted && "max-w-none")}>
        {children}
      </main>

      {/* Universal Time Scrubber Bar */}
      {!hideScrubber && <TimeScrubberBar />}
    </div>
  );
}
