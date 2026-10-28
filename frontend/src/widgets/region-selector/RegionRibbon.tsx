import { useActiveState } from "@/entities/hierarchy";
import { Button } from "@/shared/components/ui";

export interface RegionRibbonProps {
  /** Defaults to the chosen state's default region. */
  activeRegion?: string;
  onSelectRegion?: (region: string) => void;
  className?: string;
}

/** The overview pages' region tabs: the chosen state's regions. */
export function RegionRibbon({ activeRegion, onSelectRegion, className = "" }: RegionRibbonProps) {
  const { regionTabs, defaultRegion } = useActiveState();
  const active = (activeRegion ?? defaultRegion).toLowerCase();

  return (
    <div
      // Figma overview frames: 233x44 tabs, 8px corners, 10px (light) / 12px (dark) apart.
      // Five 233px tabs need ~1,210px, so below 1280px the row scrolled with a hidden
      // scrollbar. Now each tab starts at 130px and grows to its 233px design width,
      // sharing the row; a long name wraps onto a second line inside the same 44px
      // tab. Tabs that do not fit at 130px move to another row instead of scrolling,
      // so any number of regions stays fully visible.
      className={`flex flex-wrap items-center gap-2.5 dark:gap-3 ${className}`}
      role="tablist"
      aria-label="Region Filter"
    >
      {regionTabs.map((reg) => {
        const isActive = active === reg.toLowerCase();
        return (
          <Button
            variant="ghost"
            size="sm"
            key={reg}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectRegion?.(reg)}
            className={`flex-[1_1_8.125rem] max-w-[14.5625rem] h-11 px-2 rounded-lg whitespace-normal leading-tight text-center text-sm font-semibold ${
              isActive
                ? "bg-jjm-blue-light hover:bg-jjm-blue-light text-white hover:text-white"
                : "bg-jjm-light-stroke hover:bg-jjm-light-stroke text-[#0F162A] hover:text-[#0F162A] dark:bg-[#11243B] dark:hover:bg-[#11243B] dark:text-white dark:hover:text-white"
            }`}
          >
            {reg}
          </Button>
        );
      })}
    </div>
  );
}
