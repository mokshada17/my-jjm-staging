import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { PathNode } from "@/entities/hierarchy";
import type { VillageLevelKpiValues } from "@/entities/telemetry";
import { OverviewTable, type OverviewColumn } from "./OverviewTable";
import { OpenNodeButton } from "./OpenNodeButton";
import { STANDARD_SECTIONS, type OverviewSection } from "./sections";

interface Row {
  id: string;
  name: string;
  count: number;
  path: PathNode[];
  waterConsumption: string;
  villageKpis: VillageLevelKpiValues;
}

const kpis: VillageLevelKpiValues = {
  lpcdAbove55: 11,
  lpcdBelow55: 12,
  chlorineIdeal: 13,
  chlorineLow: 14,
  chlorineHigh: 15,
  pressureHigh: 16,
  pressureModerate: 17,
  pressureLow: 18,
};

const rows: Row[] = [
  { id: "a", name: "Nagpur", count: 3, path: [], waterConsumption: "1.54 LL", villageKpis: kpis },
  { id: "b", name: "Amravati", count: 1, path: [], waterConsumption: "1.33 LL", villageKpis: kpis },
];

const columns: OverviewColumn<Row>[] = [
  { id: "name", header: "Name", cell: (r) => r.name },
  { id: "count", header: "Count", kind: "number", cell: (r) => r.count, className: "text-red-500" },
  {
    id: "open",
    header: "Open",
    kind: "plain",
    cell: (r) => (
      <OpenNodeButton path={r.path} variant="large" title={`Open ${r.name}`}>
        {r.name}
      </OpenNodeButton>
    ),
  },
];

function renderTable(sections: OverviewSection[], state = { isLoading: false, isError: false }, data = rows) {
  return render(
    <MemoryRouter>
      <OverviewTable columns={columns} rows={data} sections={sections} layout="standard" {...state} />
    </MemoryRouter>
  );
}

describe("OverviewTable", () => {
  it("draws the columns then the sections, with the sub-header row for Village Level", () => {
    const { container } = renderTable(STANDARD_SECTIONS);
    const headerRows = container.querySelectorAll("thead tr");

    expect(headerRows).toHaveLength(2);
    const top = [...headerRows[0].querySelectorAll("th")].map((th) => th.textContent);
    expect(top.slice(0, 3)).toEqual(["Name", "Count", "Open"]);
    expect(top[3]).toContain("VILLAGE LEVEL");
    expect(top[4]).toContain("Water Consumption");
    expect(top[5]).toContain("COMMUNICATION STATUS");
    // Sub-header: one blank per column, then 8 bands + 1 + 3.
    expect(headerRows[1].querySelectorAll("th")).toHaveLength(3 + 8 + 1 + 3);
    expect(headerRows[1].textContent).toContain(">0.5 mg/l");
  });

  it("skips the sub-header row when Village Level is not shown", () => {
    const { container } = renderTable(["commStatus"]);
    expect(container.querySelectorAll("thead tr")).toHaveLength(1);
  });

  it.each([
    [STANDARD_SECTIONS, 3 + 8 + 1 + 3],
    [["commStatus"] as OverviewSection[], 3 + 3],
    [[] as OverviewSection[], 3],
  ])("spans the loading row across every column (%j -> %i)", (sections, span) => {
    const { container } = renderTable(sections, { isLoading: true, isError: false }, []);
    expect(container.querySelector("tbody td")!.getAttribute("colspan")).toBe(String(span));
  });

  it("styles cells by kind and merges a column's className over it", () => {
    renderTable(STANDARD_SECTIONS);
    const cell = screen.getByText("3").closest("td")!;
    expect(cell.className).toContain("text-center"); // number kind
    expect(cell.className).toContain("text-red-500"); // column override...
    expect(cell.className).not.toContain("text-slate-800"); // ...replacing the kind's colour
  });

  it("renders each row's section cells and opens rows with the chosen button style", () => {
    renderTable(STANDARD_SECTIONS);
    const row = screen.getByTitle("Open Nagpur").closest("tr")!;
    expect(within(row).getByText("1.54 LL")).toBeInTheDocument();
    expect(screen.getByTitle("Open Nagpur").className).toContain("w-[11.125rem]"); // variant="large": 178px, in rem
  });

  describe('layout="grouped"', () => {
    function renderGrouped(state = { isLoading: false, isError: false }, data = rows) {
      return render(
        <MemoryRouter>
          <OverviewTable columns={columns} rows={data} sections={STANDARD_SECTIONS} layout="grouped" {...state} />
        </MemoryRouter>
      );
    }

    it("draws three header rows, with the columns and Water Consumption covering all of them", () => {
      const { container } = renderGrouped();
      const headerRows = container.querySelectorAll("thead tr");
      expect(headerRows).toHaveLength(3);

      const top = [...headerRows[0].querySelectorAll("th")];
      expect(top.slice(0, 3).map((th) => th.getAttribute("rowspan"))).toEqual(["3", "3", "3"]);
      expect(top[3].textContent).toContain("Village Level"); // uppercased by CSS
      expect(top[4].textContent).toContain("Water Consumption");
      expect(top[4].getAttribute("rowspan")).toBe("3");
      expect(top[5].getAttribute("colspan")).toBe("4"); // icon column + 3 windows
      expect(top[3].getAttribute("colspan")).toBe("8");

      // Row 2: LPCD / Chlorine / Pressure spans 2 / 3 / 3 bands.
      const groupHeads = [...headerRows[1].querySelectorAll("th")];
      const middle = groupHeads.map((th) => th.textContent);
      expect(middle.slice(0, 3)).toEqual(["LPCD", "Chlorine", "Pressure"]);
      expect(groupHeads.slice(0, 3).map((th) => th.getAttribute("colspan"))).toEqual(["2", "3", "3"]);
      expect(middle).toHaveLength(3 + 4);
      // Row 3: only the 8 Village Level bands.
      expect(headerRows[2].querySelectorAll("th")).toHaveLength(8);
      expect(headerRows[2].textContent).toContain(">0.5 mg/l");
    });

    it("spans the loading row across the extra sensor-icon column", () => {
      const { container } = renderGrouped({ isLoading: true, isError: false }, []);
      expect(container.querySelector("tbody td")!.getAttribute("colspan")).toBe(String(3 + 8 + 1 + 4));
    });

    it("centres the column cells and draws Communication Status as four cells", () => {
      const { container } = renderGrouped();
      expect(screen.getByText("Nagpur", { selector: "td" }).className).toContain("text-center");
      const firstRow = container.querySelector("tbody tr")!;
      const cells = [...firstRow.querySelectorAll("td")];
      expect(cells).toHaveLength(3 + 8 + 1 + 4);
      expect(cells.slice(5, 8).map((cell) => cell.textContent)).toEqual(["13", "14", "15"]);
      expect(cells[6].className).toContain("text-[#D97706]");
      expect(cells[7].className).toContain("text-jjm-red");
      expect(cells[11].className).toContain("w-40");
      expect(cells[11].className).toContain("text-center");
    });
  });
});
