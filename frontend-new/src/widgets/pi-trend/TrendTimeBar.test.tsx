import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TrendTimeBar } from "./TrendTimeBar";

const HOUR = 3_600_000;
const END = new Date(2026, 7, 25, 12, 2, 29).getTime();

function renderBar(over: Partial<Parameters<typeof TrendTimeBar>[0]> = {}) {
  const props = {
    start: END - 24 * HOUR,
    end: END,
    live: true,
    onPreset: vi.fn(),
    onStep: vi.fn(),
    onNow: vi.fn(),
    onRevert: vi.fn(),
    onRange: vi.fn(),
    ...over,
  };
  render(<TrendTimeBar {...props} />);
  return props;
}

describe("TrendTimeBar", () => {
  it("prints start, PI duration and end", () => {
    renderBar({ start: END - (5 * HOUR + 3 * 60_000) });
    expect(screen.getByTestId("trend-duration")).toHaveTextContent("5h 3m");
    expect(screen.getByTestId("trend-end")).toHaveValue("8/25/2026 12:02:29 PM");
  });

  it("offers PI's 1h 8h 1d 1w 1mo presets from the duration box", () => {
    const props = renderBar();
    fireEvent.click(screen.getByTestId("trend-duration"));
    const presets = screen.getByLabelText("Time range presets");
    expect([...presets.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["1h", "8h", "1d", "1w", "1mo"]);
    fireEvent.click(screen.getByText("1mo"));
    expect(props.onPreset).toHaveBeenCalledWith("1mo");
  });

  it("steps, goes live and reverts", () => {
    const onStep = vi.fn();
    const props = renderBar({ live: false, onStep });
    fireEvent.click(screen.getByLabelText("Step backward"));
    fireEvent.click(screen.getByLabelText("Step forward"));
    expect(onStep.mock.calls).toEqual([[-1], [1]]);
    fireEvent.click(screen.getByText("Now"));
    expect(props.onNow).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Revert time range"));
    expect(props.onRevert).toHaveBeenCalled();
  });

  it("takes a PI time in the end, counting a bare offset from the start", () => {
    const props = renderBar({ live: false });
    const input = screen.getByLabelText("End time");
    fireEvent.change(input, { target: { value: "+6h" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onRange).toHaveBeenCalledWith({ start: END - 24 * HOUR, end: END - 18 * HOUR }, false);
  });

  it("keeps an unreadable time open and marked, and reverts on Escape", () => {
    const props = renderBar({ live: false });
    const input = screen.getByLabelText("Start time");
    input.focus();
    fireEvent.change(input, { target: { value: "t+1d+2h" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onRange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("8/24/2026 12:02:29 PM");
  });

  it("cannot step forward past now while live", () => {
    renderBar({ live: true });
    expect(screen.getByLabelText("Step forward")).toBeDisabled();
  });
});
