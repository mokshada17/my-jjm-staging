import { useState } from "react";
import { Button } from "@/shared/components/ui";
import { RefreshCw, RotateCw } from "lucide-react";
import { useAppStore, resolveTimeWindow } from "@/app/store";
import { formatTimestamp } from "@/shared/lib/date";
import { formatDuration } from "@/shared/lib/timeRange";
import { DurationMenu } from "@/widgets/pi-trend/DurationMenu";

/**
 * A window-start / window-end stamp: a 38px-tall box, bordered in the light frame;
 * in dark the same box filled with the #1C2D54 tile colour and a transparent
 * border, so the text lines up in both.
 * At least Figma's 209px wide, but it grows to fit its text with equal padding
 * either side, so the 18px stamp never runs past the border. Tabular digits keep
 * the width steady as the seconds tick.
 */
const STAMP =
  "h-8 lg:h-[2.375rem] w-auto lg:min-w-[13.0625rem] flex items-center justify-center px-2 lg:px-4 rounded-[0.1875rem] border border-jjm-light-stroke dark:border-transparent dark:bg-jjm-surface text-sm lg:text-lg leading-none tabular-nums whitespace-nowrap";

interface TimeScrubberBarProps {
  className?: string;
  onRefresh?: () => void;
}

export function TimeScrubberBar({ className = "", onRefresh }: TimeScrubberBarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const windowMs = useAppStore((s) => s.windowMs);
  const windowEndsAt = useAppStore((s) => s.windowEndsAt);
  const setTimePreset = useAppStore((s) => s.setTimePreset);
  const stepWindow = useAppStore((s) => s.stepWindow);
  const goLive = useAppStore((s) => s.goLive);

  const { start, end } = resolveTimeWindow(windowMs, windowEndsAt);
  const isLive = windowEndsAt === null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    // Figma bottom bar. Dark: 56px #0E1526, white 18px stamps, a #05CF11 "Now".
    // Light: #EDF4F9 with each stamp and the preset in a 1px #E2E8EF box,
    // #8090AC step arrows and an emerald "Now". Figma's light bar is 40px, which
    // left the 38px boxes touching its edges; at 48px they sit visibly centred.
    // A 1px top border parts the bar from the page: #293E66 in dark, and in light
    // slate-300 at 60%, as the #E2E8EF card stroke barely shows on the bar's #EDF4F9.
    // Both themes share one geometry (the light frame's boxes, gaps and padding;
    // dark draws the same boxes with a transparent border), so every item sits at
    // the same place whichever theme is on. Only colours and the bar's height differ.
    // Three columns - two equal flexible sides round the step group - so the step
    // group sits in the exact middle at every width and in both themes. (The 1440px
    // frames pin it at 37.1% / 40.8%, which read as off-centre on the wall.) The
    // sides can never overlap it: below 1024px (tablets) everything shrinks to its
    // content, from lg up the Figma box sizes apply.
    <div
      className={`relative w-full h-12 dark:h-14 shrink-0 bg-jjm-light-bg dark:bg-jjm-canvas border-t border-slate-300/60 dark:border-jjm-border px-[0.625rem] grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-jjm-light-ink dark:text-[#FBFDFD] select-none transition-colors duration-150 ${className}`}
    >
      {/* Left: Window start and Refresh */}
      <div className="justify-self-start flex items-center gap-1 lg:gap-[0.875rem]">
        <span className={STAMP}>
          {formatTimestamp(start)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleRefresh}
          title="Refresh telemetry"
          className="h-8 w-8 lg:h-[2.375rem] lg:w-[3.25rem] p-0 rounded-[0.1875rem] text-jjm-light-ink hover:text-jjm-light-ink hover:bg-transparent dark:text-white dark:hover:text-white"
        >
          <span className={isRefreshing ? "animate-spin" : ""}>
            <RotateCw className="!w-[1.0625rem] !h-[1.0625rem] dark:hidden" strokeWidth={2.5} />
            <RefreshCw className="!w-[1.1875rem] !h-[1.1875rem] hidden dark:block" strokeWidth={3} />
          </span>
        </Button>
      </div>

      {/* Center: Window stepping and preset */}
      <div className="flex items-center gap-2 lg:gap-[0.6875rem]">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          title="Step backward"
          aria-label="Step backward"
          onClick={() => stepWindow(-1)}
          className="h-auto p-0 hover:bg-transparent text-jjm-light-arrow hover:text-jjm-light-arrow dark:text-white dark:hover:text-white"
        >
          <StepArrow direction={-1} />
        </Button>
        {/* PI Vision: the duration opens a 1h/8h/1d/1w/1mo row; a trend zoom
            leaves an arbitrary span here, e.g. "5h 3m". */}
        <DurationMenu onSelect={setTimePreset}>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            title="Change time window"
            className="h-8 w-[4.25rem] lg:h-[2.375rem] lg:w-[7.4375rem] rounded-[0.1875rem] border border-jjm-light-stroke dark:border-transparent text-sm lg:text-base font-normal text-jjm-light-ink hover:text-jjm-light-ink hover:bg-transparent dark:text-white dark:hover:text-white"
          >
            {formatDuration(windowMs)}
          </Button>
        </DurationMenu>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          title="Step forward"
          aria-label="Step forward"
          onClick={() => stepWindow(1)}
          disabled={isLive}
          className="h-auto p-0 hover:bg-transparent text-jjm-light-arrow hover:text-jjm-light-arrow dark:text-white dark:hover:text-white disabled:opacity-100"
        >
          <StepArrow direction={1} />
        </Button>
      </div>

      {/* Right: Live pill, then window end */}
      <div className="justify-self-end flex items-center gap-2 lg:gap-[0.875rem]">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={goLive}
          aria-pressed={isLive}
          className={`h-8 w-[4.25rem] lg:h-[2.375rem] lg:w-[7.1875rem] rounded text-sm lg:text-[1.0625rem] font-normal text-white hover:text-white transition active:scale-95 ${
            isLive
              ? "bg-jjm-green hover:bg-jjm-green dark:bg-jjm-now dark:hover:bg-jjm-now"
              : "bg-jjm-green/60 hover:bg-jjm-green dark:bg-jjm-now/60 dark:hover:bg-jjm-now"
          }`}
        >
          Now
        </Button>
        <span className={STAMP}>
          {formatTimestamp(end)}
        </span>
      </div>
    </div>
  );
}

/** Solid step triangle, 26x25 in the light frame (27x26 in the dark one); one size for both. */
function StepArrow({ direction }: { direction: -1 | 1 }) {
  return (
    <svg
      viewBox="0 0 27 26"
      aria-hidden="true"
      className="!w-5 !h-5 lg:!w-[1.625rem] lg:!h-[1.5625rem]"
      fill="currentColor"
    >
      <polygon points={direction === 1 ? "0,0 27,13 0,26" : "27,0 0,13 27,26"} />
    </svg>
  );
}
