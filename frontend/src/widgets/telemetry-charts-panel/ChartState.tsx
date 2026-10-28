import type { ReactNode } from "react";
import { rem } from "@/shared/lib/uiScale";

interface ChartStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  height?: number;
  /** Grow past `height` (then a minimum) in a flex column, like the chart it holds. */
  grow?: boolean;
  children: ReactNode;
}

/** Renders the chart only once data has arrived; otherwise holds the same height. */
export function ChartState({
  isLoading,
  isError,
  isEmpty = false,
  height = 112,
  grow = false,
  children,
}: ChartStateProps) {
  if (isLoading || isError || isEmpty) {
    return (
      <div
        style={grow ? { minHeight: rem(height) } : { height: rem(height) }}
        className={`${grow ? "grow " : ""}w-full flex items-center justify-center text-[0.5625rem] font-medium text-slate-400 dark:text-slate-500`}
        role="status"
      >
        {isError
          ? "Telemetry unavailable"
          : isLoading
            ? "Loading telemetry…"
            : "No readings in window"}
      </div>
    );
  }
  return <>{children}</>;
}
