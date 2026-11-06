import { describe, expect, it } from "vitest";
import { editWindow, formatDuration, parsePiTime, presetSpan, stepEnd } from "./timeRange";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatDuration", () => {
  // Every label below appears in the PI Vision walkthrough's time bar.
  it.each([
    [HOUR, "1h"],
    [8 * HOUR, "8h"],
    [DAY, "1d"],
    [7 * DAY, "7d"],
    [31 * DAY, "31d"],
    [5 * HOUR + 3 * MIN, "5h 3m"],
    [6 * DAY + 12 * HOUR, "6d 12h"],
    [10 * HOUR + MIN, "10h 1m"],
    [2 * HOUR + 34 * MIN, "2h 34m"],
    [43 * MIN + 6000, "43m 6s"],
  ])("labels %d ms as %s", (ms, label) => {
    expect(formatDuration(ms)).toBe(label);
  });
});

describe("presetSpan", () => {
  it("treats 1mo as a calendar month, so Jul 25 - Aug 25 is 31 days", () => {
    const end = new Date(2026, 7, 25, 12, 0, 0).getTime();
    expect(formatDuration(presetSpan("1mo", end))).toBe("31d");
  });

  it("gives the fixed presets their span", () => {
    expect(presetSpan("1w", Date.now())).toBe(7 * DAY);
    expect(presetSpan("8h", Date.now())).toBe(8 * HOUR);
  });
});

describe("stepEnd", () => {
  it("steps back by one span from now while live", () => {
    expect(stepEnd(DAY, null, -1, 10 * DAY)).toBe(9 * DAY);
  });

  it("snaps to live when stepping forward reaches now", () => {
    expect(stepEnd(DAY, 9.5 * DAY, 1, 10 * DAY)).toBeNull();
    expect(stepEnd(DAY, 8 * DAY, 1, 10 * DAY)).toBe(9 * DAY);
  });
});

describe("parsePiTime", () => {
  // Monday 26 Oct 2026, 11:30 local - the backend PiTimeTest's NOW.
  const NOW = new Date(2026, 9, 26, 11, 30).getTime();
  const at = (y: number, mo: number, d: number, h = 0, m = 0, s = 0) => new Date(y, mo - 1, d, h, m, s).getTime();

  // Every example of SRS 4.1.3.3 and 4.1.3.4.
  it.each([
    ["*", NOW],
    ["23-aug-22 15:00:00", at(2022, 8, 23, 15)],
    ["25-sep-22", at(2022, 9, 25)],
    ["24-Aug-2022 09:50:00", at(2022, 8, 24, 9, 50)],
    ["3-1", at(2026, 3, 1)],
    ["3/1", at(2026, 3, 1)],
    ["2020", at(2020, 10, 26)],
    ["25", at(2026, 10, 25)],
    ["t", at(2026, 10, 26)],
    ["y", at(2026, 10, 25)],
    ["tue", at(2026, 10, 20)],
    ["Monday", at(2026, 10, 26)],
    ["*-1h", at(2026, 10, 26, 10, 30)],
    ["t+8h", at(2026, 10, 26, 8)],
    ["y-8h", at(2026, 10, 24, 16)],
    ["mon+14.5h", at(2026, 10, 26, 14, 30)],
    ["sat-1m", at(2026, 10, 23, 23, 59)],
    ["*+1h", at(2026, 10, 26, 12, 30)],
    ["t+3d", at(2026, 10, 29)],
    ["Y+1y", at(2027, 10, 25)],
    ["t-1mo", at(2026, 9, 26)],
    ["*-2 hours", at(2026, 10, 26, 9, 30)],
    ["2026-08-18", at(2026, 8, 18)],
  ])("reads %s", (input, expected) => {
    expect(parsePiTime(input, NOW, NOW)).toBe(expected);
  });

  it("counts a bare offset from the base", () => {
    expect(parsePiTime("-1d", NOW, NOW)).toBe(at(2026, 10, 25, 11, 30));
    expect(parsePiTime("+6h", at(2026, 10, 25), NOW)).toBe(at(2026, 10, 25, 6));
  });

  it.each(["", "last tuesday", "t+1d+2h", "t+1.5d", "*-3q", "13-1", "31-feb-22"])("rejects %j", (input) => {
    expect(parsePiTime(input, NOW, NOW)).toBeNull();
  });

  it("clamps a month offset to the month's last day", () => {
    expect(parsePiTime("-1mo", at(2026, 3, 31), NOW)).toBe(at(2026, 2, 28));
  });
});

describe("editWindow", () => {
  const NOW = new Date(2026, 9, 26, 11, 30).getTime();
  const current = { start: NOW - 8 * HOUR, end: NOW };

  it("counts a bare start offset from now and a bare end offset from the start", () => {
    expect(editWindow("start", "-1d", current, NOW)).toEqual({ start: NOW - DAY, end: NOW });
    expect(editWindow("end", "+6h", current, NOW)).toEqual({ start: current.start, end: current.start + 6 * HOUR });
  });

  it("refuses an empty or unreadable range", () => {
    expect(editWindow("end", "-30m", current, NOW)).toBeNull();
    expect(editWindow("start", "nonsense", current, NOW)).toBeNull();
  });
});
