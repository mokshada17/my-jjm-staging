import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SensorCommMatrix } from "./SensorCommMatrix";

describe("SensorCommMatrix", () => {
  it("renders communication status header and column titles", () => {
    render(<SensorCommMatrix />);

    expect(screen.getByText("Communication Status")).toBeInTheDocument();
    expect(screen.getByText("<24h")).toBeInTheDocument();
    expect(screen.getByText("0-72h")).toBeInTheDocument();
    expect(screen.getByText(">72h")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("renders all three sensor rows", () => {
    render(<SensorCommMatrix />);

    expect(screen.getByText("Flow Meter")).toBeInTheDocument();
    expect(screen.getByText("Chlorine")).toBeInTheDocument();
    expect(screen.getByText("Pressure")).toBeInTheDocument();
  });

  it("displays metric counts correctly", () => {
    render(<SensorCommMatrix />);

    // Default total counts: 2,005, 1,577, 2,328
    expect(screen.getByText("2,005")).toBeInTheDocument();
    expect(screen.getByText("1,577")).toBeInTheDocument();
    expect(screen.getByText("2,328")).toBeInTheDocument();
  });
});
