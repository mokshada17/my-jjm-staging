import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { EsrScadaDashboardPage } from "./EsrScadaDashboardPage";

// jsdom has no canvas, so the echarts renderer is stubbed. The series each chart
// receives is exposed as a data attribute so the query -> chart wiring stays asserted.
vi.mock("echarts-for-react/esm/core", () => ({
  default: ({ option }: { option: Record<string, unknown> }) => (
    <div data-testid="echart" data-option={JSON.stringify(option)} />
  ),
}));

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <EsrScadaDashboardPage />
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe("EsrScadaDashboardPage", () => {
  it("shows a loading state before telemetry resolves", () => {
    renderPage();
    expect(screen.getAllByText(/Loading telemetry/i).length).toBeGreaterThan(0);
  });

  it("fills the ESR_Flow diagram with the reservoir's latest readings", async () => {
    renderPage();

    // The first reservoir in the seed: all three sensors online and in band.
    const diagram = await screen.findByRole("img", {
      name: "Proposed 1.00 LL MBR-Outlet-1 process diagram",
    });
    for (const reading of ["1.00 LL", "1.33 LL", "0.82 bar", "0.31 mg/l"]) {
      expect(within(diagram).getByText(reading)).toBeInTheDocument();
    }
    // ESR_Flow's "ok" fill, once per sensor (FM, PS, RCA).
    expect(diagram.querySelectorAll('circle[fill="#20b85a"]')).toHaveLength(3);
  });

  // 133,000 L supplied over the village's 0.93 h supply window, not litres / 1000.
  it("shows the flow rate in m³/h under the gauge, with a scale that fits it", async () => {
    renderPage();

    expect(await screen.findByText("143.01 m³/h")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId("echart")).toHaveLength(5));
    const gauge = screen
      .getAllByTestId("echart")
      .map((el) => JSON.parse(el.getAttribute("data-option") ?? "{}"))
      .find((o) => o.series?.[0]?.type === "gauge");
    expect(gauge.series[0].max).toBe(180);
    // ECharts' label radius is r - splitLine.length - (label.distance + splitLine.distance):
    // the labels must clear the ring yet stay on the canvas.
    const { axisLabel, splitLine } = gauge.series[0];
    const outside = -(splitLine.length + axisLabel.distance + splitLine.distance);
    expect(outside).toBeGreaterThan(0);
    expect(outside).toBeLessThanOrEqual(26);
  });

  // ECharts hides a value axis's line unless asked, which left every y axis blank.
  it("draws both the x and y axis line on every cartesian chart", async () => {
    renderPage();

    await waitFor(() => expect(screen.getAllByTestId("echart")).toHaveLength(5));
    const cartesian = screen
      .getAllByTestId("echart")
      .map((el) => JSON.parse(el.getAttribute("data-option") ?? "{}"))
      .filter((o) => o.xAxis);

    // consumption bars, chlorine, pressure and totalizer (the gauge has no axes)
    expect(cartesian).toHaveLength(4);
    for (const o of cartesian) {
      expect(o.xAxis.axisLine.show).toBe(true);
      expect(o.yAxis.axisLine.show).toBe(true);
    }
  });

  it("renders every telemetry chart once the queries resolve", async () => {
    renderPage();

    await waitFor(() => {
      // consumption bars, chlorine, pressure, totalizer, and the flow gauge
      expect(screen.getAllByTestId("echart")).toHaveLength(5);
    });
  });

  it("feeds the chlorine chart the values returned by the API", async () => {
    renderPage();

    await waitFor(() => expect(screen.getAllByTestId("echart")).toHaveLength(5));

    const options = screen
      .getAllByTestId("echart")
      .map((el) => JSON.parse(el.getAttribute("data-option") ?? "{}"));

    // Threshold labels now live in the legend strip (Figma renders them as text, not
    // as echarts markLine labels), so identify the series by its values.
    const chlorine = options.find(
      (o) => o.series?.[0]?.data?.[0] === 0.28
    );
    expect(chlorine).toBeDefined();
    expect(chlorine.series[0].data).toEqual([0.28, 0.32, 0.45, 0.38, 0.29, 0.35, 0.31]);
  });

  it("renders the Figma threshold legend for chlorine and pressure", async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByTestId("echart")).toHaveLength(5));

    for (const label of [
      "Hi- 0.5 mg/l",
      "Lo- 0.2 mg/l",
      "Hi- 0.69 bar",
      "HiHi- 0.7 bar",
      "Lo- 0.2 bar",
      "Totalizer Flow (m³)",
      "Chlorine (mg/l)",
      "Pressure (bar)",
    ]) {
      expect(screen.getByText(label), `missing legend label: ${label}`).toBeInTheDocument();
    }
  });

  it("drives the flow gauge needle from the reading rather than a fixed angle", async () => {
    renderPage();

    await waitFor(() => expect(screen.getAllByTestId("echart")).toHaveLength(5));

    const gauge = screen
      .getAllByTestId("echart")
      .map((el) => JSON.parse(el.getAttribute("data-option") ?? "{}"))
      .find((o) => o.series?.[0]?.type === "gauge");

    expect(gauge).toBeDefined();
    // 133,000 L on the last day of the window over Ambikapur's 0.93 h supply.
    expect(gauge.series[0].data[0].value).toBeCloseTo(143.01, 2);
  });

  // Figma 2:11688 formats this as "Actual:- 0.00mg/L".
  it("renders the actual chlorine reading in the Figma format", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Actual:- 0.31mg/L")).toBeInTheDocument()
    );
  });
});
