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

const OFFSET = /^(.*?)\s*([+-])\s*(\d+(?:\.\d+)?)\s*([a-z]+)$/;
const TRAILING_OFFSET = /[+-]\s*\d+(?:\.\d+)?\s*[a-z]+$/;
const CLOCK_UNITS: Record<string, number> = {
  s: SECOND, second: SECOND, seconds: SECOND,
  m: MINUTE, minute: MINUTE, minutes: MINUTE,
  h: HOUR, hour: HOUR, hours: HOUR,
};
const CALENDAR_UNITS: Record<string, "d" | "w" | "mo" | "y"> = {
  d: "d", day: "d", days: "d",
  w: "w", week: "w", weeks: "w",
  mo: "mo", month: "mo", months: "mo",
  y: "y", year: "y", years: "y",
};
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Local midnight of a date, or null when it does not exist (31 Feb, month 13). */
function localDate(year: number, month: number, day: number, h = 0, m = 0, s = 0): Date | null {
  const d = new Date(year, month, day, h, m, s);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day && h < 24 && m < 60 && s < 60
    ? d
    : null;
}

function reference(ref: string, base: number, now: number): Date | null {
  if (ref === "") return new Date(base);
  const r = ref.toLowerCase();
  const today = new Date(now);
  const [Y, M, D] = [today.getFullYear(), today.getMonth(), today.getDate()];
  if (r === "*") return today;
  if (r === "t" || r === "today") return localDate(Y, M, D);
  if (r === "y" || r === "yesterday") return new Date(Y, M, D - 1);
  const weekday = WEEKDAYS.findIndex((w) => r === w || r === w.slice(0, 3));
  if (weekday !== -1) return new Date(Y, M, D - ((today.getDay() - weekday + 7) % 7));
  if (/^\d{1,2}$/.test(r)) return localDate(Y, M, Number(r));
  if (/^\d{4}$/.test(r)) return localDate(Number(r), M, D) ?? localDate(Number(r), M, D - 1); // 29 Feb
  let m = /^(\d{1,2})[-/](\d{1,2})$/.exec(r);
  if (m) return localDate(Y, Number(m[1]) - 1, Number(m[2]));
  m = /^(\d{1,2})-([a-z]{3})-(\d{2}|\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(r);
  if (m) {
    const month = MONTHS.indexOf(m[2]);
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return month === -1
      ? null
      : localDate(year, month, Number(m[1]), Number(m[4] ?? 0), Number(m[5] ?? 0), Number(m[6] ?? 0));
  }
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(r);
  if (m) return localDate(Number(m[1]), Number(m[2]) - 1, Number(m[3])); // Date.parse would read UTC
  // ISO date-times, and the time bar's own "8/25/2026 12:02:29 PM".
  const t = Date.parse(ref);
  return Number.isNaN(t) ? null : new Date(t);
}

/** Calendar offsets move the local date, clamping the day (31 Mar - 1mo = 28 Feb), as the backend does. */
function addCalendar(d: Date, unit: "d" | "w" | "mo" | "y", n: number): Date {
  const r = new Date(d);
  if (unit === "d" || unit === "w") {
    r.setDate(r.getDate() + n * (unit === "w" ? 7 : 1));
    return r;
  }
  const day = r.getDate();
  r.setDate(1);
  if (unit === "mo") r.setMonth(r.getMonth() + n);
  else r.setFullYear(r.getFullYear() + n);
  r.setDate(Math.min(day, new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()));
  return r;
}

/**
 * A PI System time expression (SRS 4.1.3), the same grammar the backend's PiTime reads:
 * an optional reference (`*`, `t`, `y`, `tue`, `25`, `3-1`, `2020`, `23-aug-22 15:00:00`,
 * ISO) and at most one offset (`+8h`, `-1mo`, `+14.5h`; only s/m/h take fractions).
 * A bare offset counts from `base`. Null when unreadable.
 */
export function parsePiTime(input: string, base: number, now = Date.now()): number | null {
  const s = input.trim();
  if (s === "") return null;
  const m = OFFSET.exec(s.toLowerCase());
  if (!m) return reference(s, base, now)?.getTime() ?? null;
  const ref = s.slice(0, m[1].length).trim();
  if (TRAILING_OFFSET.test(ref.toLowerCase())) return null; // one offset only
  const at = reference(ref, base, now);
  if (!at) return null;
  const sign = m[2] === "-" ? -1 : 1;
  const amount = Number(m[3]);
  const clock = CLOCK_UNITS[m[4]];
  if (clock) return at.getTime() + Math.round(sign * amount * clock);
  const unit = CALENDAR_UNITS[m[4]];
  if (!unit || !Number.isInteger(amount)) return null;
  return addCalendar(at, unit, sign * amount).getTime();
}

/**
 * A start or end typed into a time bar. Per PI, a bare offset in the start counts from
 * now and in the end from the start ("+6h"), and the other edge stays put. Null when
 * unreadable or when the range would be empty.
 */
export function editWindow(
  edge: "start" | "end",
  input: string,
  current: TimeWindow,
  now = Date.now()
): TimeWindow | null {
  const t = parsePiTime(input, edge === "start" ? now : current.start, now);
  if (t === null) return null;
  const next = edge === "start" ? { start: t, end: current.end } : { start: current.start, end: t };
  return next.end > next.start ? next : null;
}
