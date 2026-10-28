import { useState, type ReactNode } from "react";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui";
import { TIME_PRESETS, type TimePreset } from "@/shared/lib/timeRange";
import { cn } from "@/shared/utils";

interface DurationMenuProps {
  /** The duration box itself; clicking it opens the preset row above it. */
  children: ReactNode;
  onSelect: (preset: TimePreset) => void;
}

/**
 * PI Vision's duration picker: clicking the duration in the time bar opens a row
 * of presets (1h 8h 1d 1w 1mo) just above it. Picking one keeps the end time and
 * re-spans the window.
 */
export function DurationMenu({ children, onSelect }: DurationMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={6}
        aria-label="Time range presets"
        className="w-auto p-1 flex gap-1 bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border"
      >
        {TIME_PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelect(preset);
              setOpen(false);
            }}
            className={cn(
              "h-7 min-w-[2.625rem] px-2 rounded-[0.1875rem] text-xs font-normal",
              "border border-jjm-light-stroke bg-jjm-light-bg text-jjm-light-ink hover:bg-jjm-light-surface",
              "dark:border-jjm-border dark:bg-jjm-surface dark:text-white dark:hover:bg-jjm-border"
            )}
          >
            {preset}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
