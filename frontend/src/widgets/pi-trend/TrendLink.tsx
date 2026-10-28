import type { ReactNode } from "react";

interface TrendLinkProps {
  /** e.g. "Open Chlorine trend". */
  label: string;
  onOpen: () => void;
  children: ReactNode;
}

/**
 * Makes a dashboard symbol open its popup trend, as clicking any value, gauge
 * or chart does in PI Vision. Keyboard users get the same with Enter or Space.
 */
export function TrendLink({ label, onOpen, children }: TrendLinkProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      // w-full: symbols such as the flow gauge size themselves to their container,
      // and a flex card body would otherwise shrink this wrapper to nothing. A flex
      // column that grows, so a chart that fills its card (grow) can.
      className="w-full grow flex flex-col cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-jjm-cyan"
    >
      {children}
    </div>
  );
}
