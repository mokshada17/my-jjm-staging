/**
 * The Scheme and Village charts open the same PI Vision popup trend as the ESR
 * page. Their charts total several reservoirs, so the trend is built from each
 * reservoir's CALC - WATER CONSUMPTION PER DAY attribute.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { useAppStore } from "@/app/store";
import { server } from "@/test/msw/node";
import { SchemeDashboardPage } from "./SchemeDashboardPage";
import { VillageDashboardPage } from "./VillageDashboardPage";

vi.mock("echarts-for-react/esm/core", () => ({
  default: () => <div data-testid="echart" />,
}));

const WATER = "CALC - WATER CONSUMPTION PER DAY";

function recordRequests() {
  const seen: string[] = [];
  server.events.removeAllListeners("request:start");
  server.events.on("request:start", ({ request }) => {
    seen.push(decodeURIComponent(new URL(request.url).pathname));
  });
  return seen;
}

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Routes>
            <Route path="/dashboard/scheme/:id" element={<SchemeDashboardPage />} />
            <Route path="/dashboard/village/:id" element={<VillageDashboardPage />} />
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

async function openTrend(path: string, chart: string) {
  renderAt(path);
  fireEvent.click(await screen.findByRole("button", { name: `Open ${chart} trend` }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Show details" }));
  return within(dialog).getByRole("table");
}

/** The number in a details-table row's Value column. */
const valueOf = (table: HTMLElement, name: string) => {
  const row = within(table).getByText(name).closest("tr")!;
  return Number(row.querySelectorAll("td")[2].textContent);
};

beforeEach(() => {
  useAppStore.setState({ activeState: "Maharashtra", nodePath: [], windowMs: 8 * 3_600_000, windowEndsAt: null });
});

describe("Scheme and Village chart trends", () => {
  it("opens a scheme's water trend: its total and each reservoir, reading each one's own attribute", async () => {
    const seen = recordRequests();
    const table = await openTrend("/dashboard/scheme/631010", "Water Consumption");

    const total = "Scheme 631010|Total Water Consumption";
    const parts = [`MBR 1.75 LL|${WATER}`, `ESR 1.00 LL|${WATER}`];
    for (const name of [total, ...parts]) expect(within(table).getByText(name)).toBeInTheDocument();

    // The total is the sum of the reservoirs beside it.
    await waitFor(() => expect(valueOf(table, total)).toBeGreaterThan(0));
    await waitFor(() =>
      expect(valueOf(table, total)).toBeCloseTo(valueOf(table, parts[0]) + valueOf(table, parts[1]), 2)
    );

    // One attribute lookup and one plot per reservoir; the total reuses those plots.
    const pi = seen.filter((u) => u.startsWith("/piwebapi"));
    expect(pi.filter((u) => u.endsWith("/attributes"))).toHaveLength(2);
    expect(pi.filter((u) => u.endsWith("/plot"))).toHaveLength(2);
  });

  it("opens a scheme's LPCD trend against the 55 L benchmark", async () => {
    const table = await openTrend("/dashboard/scheme/631010", "LPCD");
    expect(within(table).getByText("Scheme 631010|LPCD")).toBeInTheDocument();
    const benchmark = within(table).getByText("Scheme 631010|LPCD|Benchmark").closest("tr")!;
    expect(within(benchmark).getAllByText("55").length).toBeGreaterThan(0);
    await waitFor(() => expect(valueOf(table, "Scheme 631010|LPCD")).toBeGreaterThan(0));
  });

  it("draws a one-reservoir village's water trend as that reservoir alone", async () => {
    const table = await openTrend("/dashboard/village/alesur", "Water Consumption");
    expect(within(table).getByText(`MBR 1.75 LL|${WATER}`)).toBeInTheDocument();
    expect(within(table).queryByText(/Total Water Consumption/)).not.toBeInTheDocument();
  });
});
