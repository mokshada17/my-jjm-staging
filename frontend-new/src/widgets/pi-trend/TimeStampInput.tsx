import { useState } from "react";
import { cn } from "@/shared/utils";

interface TimeStampInputProps {
  label: string;
  /** The stamp while not being edited, e.g. "8/25/2026 12:02:29 PM". */
  shown: string;
  /** Applies a typed PI time; false means unreadable, so the draft stays open. */
  onCommit: (input: string) => boolean;
  className?: string;
  "data-testid"?: string;
}

/**
 * A time-bar start or end that takes a PI time on click, as PI Vision's does:
 * `*-8h`, `t`, `y+22h`, `+6h` (in the end: six hours after the start),
 * `23-aug-22 15:00`. Enter applies; Escape or clicking away reverts.
 */
export function TimeStampInput({ label, shown, onCommit, className, "data-testid": testId }: TimeStampInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const reset = () => {
    setDraft(null);
    setInvalid(false);
  };
  const changed = draft !== null && draft.trim() !== shown;
  return (
    <input
      aria-label={label}
      aria-invalid={invalid}
      data-testid={testId}
      title="PI time, e.g. *-8h, t, y+22h, +6h, 23-aug-22 15:00"
      spellCheck={false}
      size={shown.length}
      value={draft ?? shown}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setDraft(e.target.value);
        setInvalid(false);
      }}
      onBlur={reset}
      onKeyDown={(e) => {
        if (e.key === "Escape") e.currentTarget.blur();
        if (e.key !== "Enter") return;
        if (!changed || onCommit(draft)) e.currentTarget.blur();
        else setInvalid(true);
      }}
      className={cn(
        "bg-transparent text-center outline-none focus:border-jjm-green aria-[invalid=true]:border-red-500",
        className
      )}
    />
  );
}
