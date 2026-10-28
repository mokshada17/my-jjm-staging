import { describe, expect, it } from "vitest";
import { formatDuration, presetSpan, stepEnd } from "./timeRange";

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
