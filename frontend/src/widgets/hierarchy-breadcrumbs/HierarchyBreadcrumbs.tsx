import React, { useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui";
import { cn } from "@/shared/utils";
import { useNavigate } from "react-router-dom";
import {
  MaharashtraBreadcrumbIcon,
  RegionBreadcrumbIcon,
  CircleIcon,
  DivisionIcon,
  SubDivisionIcon,
  BlockIcon,
  SchemeIcon,
  VillageIcon,
  WaterTankIcon,
} from "@/shared/assets/icons";
import { useAppStore } from "@/app/store";
import { STATES, useActiveState, type HierarchyTier } from "@/entities/hierarchy";
import { StateOutlineIcon } from "@/widgets/gis-map-workbench/StateOutlineIcon";
import { STATE_MAPS } from "@/widgets/gis-map-workbench/stateMaps";

export interface BreadcrumbNode {
  tier: HierarchyTier;
  label: string;
  icon: React.ReactNode;
}

interface HierarchyBreadcrumbsProps {
  currentTier?: HierarchyTier;
  onSelectTier?: (tier: HierarchyTier) => void;
  className?: string;
  /** Taller tabs (44px, 58px from 2560px): the ribbon outside wall mode. */
  tall?: boolean;
}

/**
 * A ribbon tab: 36px tall with 12px semibold text and 25px SVG icons, as on the
 * dev branch. The icon size overrides the Button's `[&_svg]:size-4` and is in
 * rem, so it scales with the screen only - it does not follow the text below.
 * From 2560px wide (QHD, 4K and 8K walls) the tab is drawn ~33% larger - 48px
 * tall, 16px text and padding to match - as the 1920 proportions read small from
 * across a control room. The chevron's point grows with it (globals.css).
 */
const TAB =
  "chevron-tab h-[2.25rem] shrink-0 rounded-none p-0 pl-[1.0375rem] pr-[1.1rem] gap-2 text-xs font-semibold tracking-wide [&_svg]:size-[1.5625rem] " +
  "min-[2560px]:h-[3rem] min-[2560px]:pl-[1.4225rem] min-[2560px]:pr-[1.5rem] min-[2560px]:gap-[0.6875rem] min-[2560px]:text-base";

/**
 * The root tab's icon: the Maharashtra mark, or for a state there is no artwork
 * for, that state's silhouette in the same box.
 */
function stateIcon(state: string) {
  if (state === "Maharashtra" || !STATE_MAPS[state]) return <MaharashtraBreadcrumbIcon />;
  return <StateOutlineIcon map={STATE_MAPS[state]} />;
}

// The State tab's label and icon are the chosen state's, filled in at render.
const defaultNodes: BreadcrumbNode[] = [
  { tier: "State", label: "State", icon: null },
  { tier: "Region", label: "Region", icon: <RegionBreadcrumbIcon /> },
  { tier: "Circle", label: "Circle", icon: <CircleIcon /> },
  { tier: "Division", label: "Division", icon: <DivisionIcon /> },
  { tier: "SubDivision", label: "Sub Division", icon: <SubDivisionIcon /> },
  { tier: "Block", label: "Block", icon: <BlockIcon /> },
  {
    tier: "Scheme",
    label: "Scheme",
    // Its thin blue-gradient lines vanished on the navy and teal tabs: drawn heavier
    // in the tab's accent (cyan / sky), and white on the selected tab like its text.
    icon: (
      <SchemeIcon
        color="currentColor"
        strokeWidth={20}
        className="text-[#0284C7] dark:text-jjm-cyan group-data-[current=true]:text-white"
      />
    ),
  },
  { tier: "Village", label: "Village", icon: <VillageIcon /> },
  { tier: "ESR", label: "ESR", icon: <WaterTankIcon /> },
];

export function HierarchyBreadcrumbs({
  currentTier = "State",
  onSelectTier,
  className = "",
  tall = false,
}: HierarchyBreadcrumbsProps) {
  const navigate = useNavigate();
  const currentRef = useRef<HTMLButtonElement>(null);
  const activeState = useActiveState();
  const setActiveState = useAppStore((s) => s.setActiveState);

  /**
   * The root tab is the state picker. Choosing a state - the current one included -
   * opens its Enterprise dashboard, as clicking the root tab always did; choosing
   * another one first switches every scope and the breadcrumb path to it.
   */
  const chooseState = (state: string) => {
    if (state !== activeState.name) setActiveState(state);
    handleTierClick("State");
  };

  // Below ~600px even the compact ribbon scrolls; keep the selected tab in view.
  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [currentTier]);

  const handleTierClick = (tier: HierarchyTier) => {
    if (onSelectTier) {
      onSelectTier(tier);
      return;
    }
    switch (tier) {
      case "State":
        navigate("/dashboard");
        break;
      case "Region":
        navigate("/dashboard/region/overview");
        break;
      case "Circle":
        navigate("/dashboard/circle/overview");
        break;
      case "Division":
        navigate("/dashboard/division/overview");
        break;
      case "SubDivision":
        navigate("/dashboard/subdivision/overview");
        break;
      case "Block":
        navigate("/dashboard/block/overview");
        break;
      case "Scheme":
        navigate("/dashboard/scheme/overview");
        break;
      case "Village":
        navigate("/dashboard/village/overview");
        break;
      case "ESR":
        navigate("/dashboard/esr/overview");
        break;
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
    <nav
      aria-label="9-Tier Administrative Hierarchy"
      className={`w-full overflow-x-auto scrollbar-none select-none ${className}`}
    >
      {/* All nine tabs share the row via flex-1, spanning it edge to edge as in
          Figma 2:352. Full labels need ~1,100px, so below 1280px (tablets) the
          unselected tabs show only their icon - named by a tooltip and aria-label -
          and the selected tab keeps its name. min-w-max lets the row scroll only
          where even that does not fit (phones). */}
      <div className="flex items-center w-full min-w-max space-x-1">
        {defaultNodes.map((tierNode) => {
          const isRoot = tierNode.tier === "State";
          const node = isRoot
            ? { ...tierNode, label: activeState.name, icon: stateIcon(activeState.name) }
            : tierNode;
          const isCurrent = node.tier.toLowerCase() === currentTier.toLowerCase();

          const tab = (
            <Button
              ref={isCurrent ? currentRef : undefined}
              variant="ghost"
              size="sm"
              type="button"
              data-current={isCurrent}
              aria-label={node.label}
              aria-current={isCurrent ? "page" : undefined}
              // The root opens the state menu instead (its DropdownMenuTrigger).
              onClick={isRoot ? undefined : () => handleTierClick(node.tier)}
              // No hover effect: each hover colour repeats the tab's resting colour,
              // which also overrides the ghost Button's hover:bg-accent.
              className={cn(
                "group",
                TAB,
                tall && "h-[2.75rem] min-[2560px]:h-[3.625rem]",
                // Below 1280px the selected tab is exactly as wide as its name and the
                // icon-only tabs split the rest. From 1280px every tab starts from its
                // own name's width and the spare space is shared, so no name truncates.
                isCurrent
                  ? "flex-none xl:flex-auto min-w-[7.1875rem] min-[2560px]:min-w-[9.875rem]"
                  : "flex-1 xl:flex-auto min-w-[3.5rem] xl:min-w-[7.1875rem] min-[2560px]:min-w-[9.875rem]",
                isCurrent
                  ? "bg-jjm-blue-light hover:bg-jjm-blue-light text-white hover:text-white"
                  : "bg-jjm-light-bg hover:bg-jjm-light-bg dark:bg-jjm-surface dark:hover:bg-jjm-surface text-jjm-light-muted hover:text-jjm-light-muted dark:text-white dark:hover:text-white"
              )}
            >
              <span className="flex shrink-0 opacity-90">{node.icon}</span>
              {/* Always the tier name, never the selected node's name — the ribbon
                  names the level, the highlight shows where you are. The root is
                  the exception: its level is the chosen state, as in Figma. */}
              <span className={cn("truncate", !isCurrent && "hidden xl:inline")}>{node.label}</span>
              {/* `!` beats the tab's [&_svg] icon size, which is meant for the tier icon. */}
              {isRoot && <ChevronDown aria-hidden className="!size-3 shrink-0 opacity-80" />}
            </Button>
          );

          if (isRoot) {
            const menu = (
              <DropdownMenuContent align="start" className="min-w-[12rem]">
                <DropdownMenuLabel className="text-xs">Select state</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATES.map((state) => (
                  <DropdownMenuItem key={state.id} onSelect={() => chooseState(state.name)}>
                    <Check
                      aria-hidden
                      className={cn("h-4 w-4", state.name === activeState.name ? "opacity-100" : "opacity-0")}
                    />
                    {state.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            );
            return (
              <DropdownMenu key={node.tier}>
                {isCurrent ? (
                  <DropdownMenuTrigger asChild>{tab}</DropdownMenuTrigger>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>{tab}</DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs xl:hidden">
                      {node.label}
                    </TooltipContent>
                  </Tooltip>
                )}
                {menu}
              </DropdownMenu>
            );
          }

          // The selected tab always shows its name; the others need a tooltip only
          // while they are icon-only.
          return isCurrent ? (
            <React.Fragment key={node.tier}>{tab}</React.Fragment>
          ) : (
            <Tooltip key={node.tier}>
              <TooltipTrigger asChild>{tab}</TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs xl:hidden">
                {node.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </nav>
    </TooltipProvider>
  );
}
