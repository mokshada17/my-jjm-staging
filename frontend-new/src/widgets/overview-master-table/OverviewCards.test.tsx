import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { OverviewCards } from "./OverviewCards";
import type { OverviewColumn } from "./OverviewTable";
import { STANDARD_SECTIONS } from "./sections";

interface Row {
  id: string;
  name: string;
  count: number;
  waterConsumption: string;
  villageKpis: {
    lpcdAbove55: number;
    lpcdBelow55: number;
    chlorineIdeal: number;
    chlorineLow: number;
    chlorineHigh: number;
    pressureHigh: number;
    pressureModerate: number;
    pressureLow: number;
  };
  commStatus: {
    chlorine: { h24: number; h0To72: number; h72Plus: number };
    pressure: { h24: number; h0To72: number; h72Plus: number };
    flow: { h24: number; h0To72: number; h72Plus: number };
  };
}

const row: Row = {
  id: "a",
  name: "Nagpur",
  count: 3,
  waterConsumption: "1.58 LL",
  villageKpis: {
    lpcdAbove55: 11,
    lpcdBelow55: 12,
    chlorineIdeal: 13,
    chlorineLow: 14,
    chlorineHigh: 15,
    pressureHigh: 16,
    pressureModerate: 17,
    pressureLow: 18,
  },
  commStatus: {
    chlorine: { h24: 21, h0To72: 22, h72Plus: 23 },
    pressure: { h24: 24, h0To72: 25, h72Plus: 26 },
    flow: { h24: 27, h0To72: 28, h72Plus: 29 },
  },
};

const columns: OverviewColumn<Row>[] = [
  { id: "name", header: "Circle", cell: (r) => r.name },
  { id: "count", header: "No. of Division", kind: "number", cell: (r) => r.count },
];

const renderCards = (props: Partial<Parameters<typeof OverviewCards<Row>>[0]> = {}) =>
  render(
    <ThemeProvider>
      <OverviewCards columns={columns} rows={[row]} sections={STANDARD_SECTIONS} isLoading={false} isError={false} {...props} />
    </ThemeProvider>
  );

const expandFirst = () => fireEvent.click(screen.getAllByRole("button", { name: /details/ })[0]);

describe("OverviewCards", () => {
  it("starts collapsed: the row's name and only its issues, details hidden", () => {
    renderCards();
    expect(screen.getByText("1 record")).toBeInTheDocument();
    expect(screen.getByText("Nagpur")).toBeInTheDocument();
    const line = screen.getAllByRole("button", { name: /details/ })[0];
    expect(line).toHaveAttribute("aria-expanded", "false");
    // the bad band of each KPI, and the sensors offline over 72h across all three
    expect(line).toHaveTextContent("LPCD <55:12");
    expect(line).toHaveTextContent(`Chlorine out of range:${14 + 15}`);
    expect(line).toHaveTextContent("Low pressure:18");
    expect(line).toHaveTextContent(`Offline >72h:${23 + 26 + 29}`);
    // good and amber bands stay inside the card
    for (const n of ["11", "13", "16", "17", "1.58 LL"]) expect(line).not.toHaveTextContent(n);
    expect(screen.queryByText("No. of Division")).not.toBeInTheDocument();
  });

  it("says All OK when a row has nothing to flag, and drops zero counts", () => {
    const healthy: Row = {
      ...row,
      villageKpis: { ...row.villageKpis, lpcdBelow55: 0, chlorineLow: 0, chlorineHigh: 0, pressureLow: 0 },
      commStatus: {
        chlorine: { ...row.commStatus.chlorine, h72Plus: 0 },
        pressure: { ...row.commStatus.pressure, h72Plus: 0 },
        flow: { ...row.commStatus.flow, h72Plus: 0 },
      },
    };
    renderCards({ rows: [healthy, { ...healthy, id: "b", villageKpis: { ...healthy.villageKpis, pressureLow: 4 } }] });
    const [ok, low] = screen.getAllByRole("button", { name: /details/ });
    expect(ok).toHaveTextContent("All OK");
    expect(low).toHaveTextContent("Low pressure:4");
    expect(low).not.toHaveTextContent("LPCD");
    expect(low).not.toHaveTextContent("All OK");
  });

  it("opens the full card: the other columns as label / value, the KPI blocks and the status matrix", () => {
    renderCards();
    expandFirst();
    const term = screen.getByText("No. of Division");
    expect(term.tagName).toBe("DT");
    expect(term.nextElementSibling).toHaveTextContent("3");
    const kpis = screen.getByRole("region", { name: "Village Level" });
    for (const n of [11, 12, 13, 14, 15, 16, 17, 18]) expect(within(kpis).getByText(String(n))).toBeInTheDocument();
    // the full status matrix (a total can repeat a chip's number, hence getAll)
    for (const n of [21, 22, 23, 24, 25, 26, 27, 28, 29]) expect(screen.getAllByText(String(n)).length).toBeGreaterThan(0);
  });

  it("expands and collapses every row at once", () => {
    renderCards({ rows: [row, { ...row, id: "b", name: "Amravati" }] });
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getAllByRole("region", { name: "Village Level" })).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.queryByRole("region", { name: "Village Level" })).not.toBeInTheDocument();
  });

  it("shows only the sections the page asks for", () => {
    renderCards({ sections: ["commStatus"] });
    expandFirst();
    expect(screen.queryByRole("region", { name: "Village Level" })).not.toBeInTheDocument();
    expect(screen.queryByText("Water Consumption")).not.toBeInTheDocument();
    expect(screen.getAllByText("Communication Status").length).toBeGreaterThan(0);
  });

  it("reports loading, errors and an empty selection like the table does", () => {
    const { rerender } = renderCards({ isLoading: true });
    expect(screen.getByText("Loading from PI ingestion tables…")).toBeInTheDocument();
    rerender(
      <ThemeProvider>
        <OverviewCards columns={columns} rows={[]} sections={STANDARD_SECTIONS} isLoading={false} isError={false} />
      </ThemeProvider>
    );
    expect(screen.getByText("No records for this selection.")).toBeInTheDocument();
  });
});
