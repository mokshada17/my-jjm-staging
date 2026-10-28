import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemographicsCoverageCard } from "./DemographicsCoverageCard";

describe("DemographicsCoverageCard", () => {
  it("renders with default demographic statistics", () => {
    render(<DemographicsCoverageCard />);

    expect(screen.getByText("Demographics & Coverage")).toBeInTheDocument();
    expect(screen.getByText("4,120")).toBeInTheDocument();
    expect(screen.getByText("8,321,423")).toBeInTheDocument();
    expect(screen.getByText("1,878,006")).toBeInTheDocument();
    expect(screen.getByText("Villages")).toBeInTheDocument();
    expect(screen.getByText("Population")).toBeInTheDocument();
    expect(screen.getByText("Households")).toBeInTheDocument();
  });

  it("renders with custom data passed via props", () => {
    render(
      <DemographicsCoverageCard
        data={{
          villages: "250",
          population: "450,000",
          households: "95,000",
        }}
      />
    );

    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("450,000")).toBeInTheDocument();
    expect(screen.getByText("95,000")).toBeInTheDocument();
  });
});
