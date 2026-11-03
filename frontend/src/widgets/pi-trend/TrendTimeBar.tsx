import { RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui";
import { formatDuration, type TimePreset } from "@/shared/lib/timeRange";
import { cn } from "@/shared/utils";
import { DurationMenu } from "./DurationMenu";
import { formatTrendTime } from "./model";

interface TrendTimeBarProps {
  start: number;
  end: number;
  live: boolean;
  onPreset: (preset: TimePreset) => void;
  onStep: (direction: -1 | 1) => void;
  onNow: () => void;
  /** Back to the time range the trend opened with. */
  onRevert: () => void;
}

const STAMP =
  "h-8 min-w-[11rem] px-3 flex items-center rounded-[0.1875rem] border border-jjm-light-stroke dark:border-jjm-border text-sm whitespace-nowrap";

/**
 * The popup trend's own time bar - the same controls as the display's, but
 * scoped to the popup: changing it does not move the page behind.
 */
export function TrendTimeBar({ start, end, live, onPreset, onStep, onNow, onRevert }: TrendTimeBarProps) {
  return (
    <div className="relative h-12 shrink-0 px-3 flex items-center justify-between bg-jjm-light-bg dark:bg-jjm-scrubber text-jjm-light-ink dark:text-white">
      <div className="flex items-center gap-2">
        <span className={STAMP} data-testid="trend-start">{formatTrendTime(start)}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRevert}
          title="Revert to the original time range"
          aria-label="Revert time range"
          className="h-8 w-8 p-0 text-current hover:bg-transparent hover:text-current"
        >
          <RotateCcw className="!w-4 !h-4" />
        </Button>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <StepButton direction={-1} onClick={() => onStep(-1)} />
        <DurationMenu onSelect={onPreset}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Change time range"
            data-testid="trend-duration"
            className="h-8 min-w-[4.5rem] rounded-[0.1875rem] border border-jjm-light-stroke dark:border-jjm-border text-sm font-normal text-current hover:bg-transparent hover:text-current"
          >
            {formatDuration(end - start)}
          </Button>
        </DurationMenu>
        <StepButton direction={1} onClick={() => onStep(1)} disabled={live} />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onNow}
          aria-pressed={live}
          className={cn(
            "h-8 w-[4.5rem] rounded text-sm font-normal text-white hover:text-white",
            live ? "bg-jjm-green hover:bg-jjm-green dark:bg-jjm-now" : "bg-jjm-green/50 hover:bg-jjm-green dark:bg-jjm-now/40"
          )}
        >
          Now
        </Button>
        <span className={STAMP} data-testid="trend-end">{formatTrendTime(end)}</span>
      </div>
    </div>
  );
}

function StepButton({ direction, onClick, disabled }: { direction: -1 | 1; onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 1 ? "Step forward" : "Step backward"}
      className="h-8 w-8 p-0 text-jjm-light-arrow dark:text-white hover:bg-transparent disabled:opacity-40"
    >
      <svg viewBox="0 0 27 26" aria-hidden="true" className="!w-5 !h-5" fill="currentColor">
        <polygon points={direction === 1 ? "0,0 27,13 0,26" : "27,0 0,13 27,26"} />
      </svg>
    </Button>
  );
}
