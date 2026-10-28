/**
 * PI Vision time-range rules, shared by the page time bar and the popup trend.
 *
 * A range is a duration ending at a moment, or ending "now" while live. The
 * duration box offers PI's presets (1h, 8h, 1d, 1w, 1mo); zooming a trend sets
 * an arbitrary span, which is then labelled the way PI Vision labels it
 * ("5h 3m", "6d 12h", "43m 6s").
 */

export type TimePreset = "1h" | "8h" | "1d" | "1w" | "1mo";

export const TIME_PRESETS: TimePreset[] = ["1h", "8h", "1d", "1w", "1mo"];

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const FIXED_PRESET_MS: Record<Exclude<TimePreset, "1mo">, number> = {
  "1h": HOUR,
  "8h": 8 * HOUR,
  "1d": DAY,
  "1w": 7 * DAY,
};

/**
 * The span a preset covers when the range ends at `end`. "1mo" is a calendar
 * month, so it is 28-31 days depending on where it ends - PI labels the
 * Jul 25 - Aug 25 month "31d".
 */
export function presetSpan(preset: TimePreset, end: number): number {
  if (preset !== "1mo") return FIXED_PRESET_MS[preset];
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);
  return end - start.getTime();
}

const UNITS: [string, number][] = [
  ["d", DAY],
  ["h", HOUR],
  ["m", MINUTE],
  ["s", SECOND],
];

/**
 * PI Vision's duration label: the largest non-zero unit and, when non-zero, the
 * one after it - "1d", "8h", "5h 3m", "6d 12h", "43m 6s", "31d".
 */
export function formatDuration(ms: number): string {
  let rest = Math.max(0, Math.round(ms / SECOND)) * SECOND;
  const parts = UNITS.map(([label, size]) => {
    const n = Math.floor(rest / size);
    rest -= n * size;
    return [label, n] as const;
  });
  const first = parts.findIndex(([, n]) => n > 0);
  if (first === -1) return "0s";
  const [label, n] = parts[first];
  const next = parts[first + 1];
  return next && next[1] > 0 ? `${n}${label} ${next[1]}${next[0]}` : `${n}${label}`;
}

export interface TimeWindow {
  start: number;
  end: number;
}

/** Steps a window by its own span; stepping past now snaps to live (`end: null`). */
export function stepEnd(spanMs: number, endsAt: number | null, direction: -1 | 1, now = Date.now()) {
  const end = endsAt ?? now;
  const next = end + direction * spanMs;
  return next >= now ? null : next;
}
