import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { useAppStore } from "@/app/store";
import { server } from "@/test/msw/node";
import { EsrScadaDashboardPage } from "./EsrScadaDashboardPage";

vi.mock("echarts-for-react/esm/core", () => ({
  default: () => <div data-testid="echart" />,
}));

const ESR = "Proposed 1.00 LL MBR-Outlet-1";

function recordRequests() {
  const seen: string[] = [];
  server.events.removeAllListeners("request:start");
  server.events.on("request:start", ({ request }) => {
    const url = new URL(request.url);
    seen.push(decodeURIComponent(url.pathname));
  });
  return seen;
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <EsrScadaDashboardPage />
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

async function openTrend(name: string) {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: `Open ${name} trend` }));
  return screen.findByRole("dialog");
}

/** A click on the plot: press and release at the same point. */
function clickPlot(dialog: HTMLElement, x: number) {
  const plot = within(dialog).getByTestId("trend-plot");
  fireEvent.pointerDown(plot, { button: 0, clientX: x, clientY: 120, pointerId: 1 });
  fireEvent.pointerUp(plot, { button: 0, clientX: x, clientY: 120, pointerId: 1 });
}

beforeEach(() => {
  useAppStore.setState({ windowMs: 8 * 3_600_000, windowEndsAt: null });
});

describe("ESR popup trends", () => {
  it("does not fetch trend history until a trend is opened", async () => {
    const seen = recordRequests();
    renderPage();
    await screen.findByRole("button", { name: "Open Pressure trend" });
    expect(seen.filter((u) => u.startsWith("/piwebapi"))).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Open Pressure trend" }));
    await waitFor(() => expect(seen.some((u) => u.endsWith("/plot"))).toBe(true));
    // element by path, its attributes, then one plot call: the Hi/HiHi/Lo limits
    // are fixed traces and cost nothing
    const pi = seen.filter((u) => u.startsWith("/piwebapi"));
    expect(pi).toEqual([
      "/piwebapi/elements",
      "/piwebapi/elements/E0k-7zR3_XEEa5vK9QdYwAAA_AMBIKAPUR_MBR1_WEBID/attributes",
      "/piwebapi/streams/A0k-7zR3_XEEa5vK9QdYwAAA_PRESSURE_ATTR_WEBID/plot",
    ]);
  });

  it("opens the pressure trend with its Hi, HiHi and Lo limit traces in the details table", async () => {
    const dialog = await openTrend("Pressure");
    expect(within(dialog).getByText("Popup Trend")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Show details" }));
    const table = within(dialog).getByRole("table");
    for (const name of [`${ESR}|Pressure`, `${ESR}|Pressure|Hi`, `${ESR}|Pressure|HiHi`, `${ESR}|Pressure|Lo`]) {
      expect(within(table).getByText(name)).toBeInTheDocument();
    }
    for (const h of ["Value", "Units", "Average", "Minimum", "Maximum", "Bottom", "Top"]) {
      expect(within(table).getByText(h)).toBeInTheDocument();
    }
    // the limits print their fixed value; pressure is converted from metres to bar
    const hi = within(table).getByText(`${ESR}|Pressure|Hi`).closest("tr")!;
    expect(within(hi).getAllByText("0.69").length).toBeGreaterThan(0);
    const pressure = within(table).getByText(`${ESR}|Pressure`).closest("tr")!;
    await waitFor(() => expect(within(pressure).getAllByText(/^0\.\d+$/).length).toBeGreaterThanOrEqual(4));
  });

  it("removes a trace from the trend", async () => {
    const dialog = await openTrend("Pressure");
    fireEvent.click(within(dialog).getByRole("button", { name: "Show details" }));
    fireEvent.click(within(dialog).getByRole("button", { name: `Remove ${ESR}|Pressure|HiHi` }));
    expect(within(dialog).queryByText(`${ESR}|Pressure|HiHi`)).not.toBeInTheDocument();
  });

  it("switches scale, trace style and back via the toolbar", async () => {
    const dialog = await openTrend("Pressure");
    const pressed = (name: string) => within(dialog).getByRole("button", { name }).getAttribute("aria-pressed");

    // a multi-trace trend offers multiple scales; it opens on a single scale
    expect(pressed("Single scale")).toBe("true");
    fireEvent.click(within(dialog).getByRole("button", { name: "Multiple scales" }));
    expect(pressed("Multiple scales")).toBe("true");

    // pressure readings open as markers on a line, so packets can be counted
    expect(pressed("Line with markers")).toBe("true");
    fireEvent.click(within(dialog).getByRole("button", { name: "Markers only" }));
    expect(pressed("Markers only")).toBe("true");

    // nothing custom yet, so Custom scale is unavailable
    expect(within(dialog).getByRole("button", { name: "Custom scale" })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Database scale" }));
    expect(pressed("Database scale")).toBe("true");
  });

  it("opens the flow trend on the gauge's own scale", async () => {
    const dialog = await openTrend("Flow Rate");
    // a single trace: no multiple-scales group
    expect(within(dialog).queryByRole("button", { name: "Multiple scales" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Custom scale" })).toHaveAttribute("aria-pressed", "true");
  });

  it("changes, undoes and redoes the popup's own time range without moving the page", async () => {
    const dialog = await openTrend("Chlorine");
    const duration = within(dialog).getByTestId("trend-duration");
    expect(duration).toHaveTextContent("8h");
    expect(within(dialog).getByRole("button", { name: "Undo zoom" })).toBeDisabled();

    fireEvent.click(duration);
    fireEvent.click(await screen.findByRole("button", { name: "1w" }));
    expect(duration).toHaveTextContent("7d");
    expect(useAppStore.getState().windowMs).toBe(8 * 3_600_000);

    fireEvent.click(within(dialog).getByRole("button", { name: "Step backward" }));
    expect(within(dialog).getByRole("button", { name: "Now" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(within(dialog).getByRole("button", { name: "Undo zoom" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Undo zoom" }));
    expect(duration).toHaveTextContent("8h");
    fireEvent.click(within(dialog).getByRole("button", { name: "Redo zoom" }));
    expect(duration).toHaveTextContent("7d");
  });

  it("drops a cursor where the plot is clicked and zooms the time range on a drag", async () => {
    const dialog = await openTrend("Chlorine");
    await waitFor(() => expect(within(dialog).queryByText("Loading…")).not.toBeInTheDocument());

    clickPlot(dialog, 400);
    expect(within(dialog).getAllByTestId("trend-cursor")).toHaveLength(1);
    clickPlot(dialog, 600);
    expect(within(dialog).getAllByTestId("trend-cursor")).toHaveLength(2);

    const plot = within(dialog).getByTestId("trend-plot");
    fireEvent.pointerDown(plot, { button: 0, clientX: 100, clientY: 120, pointerId: 1 });
    fireEvent.pointerMove(dialog.querySelector("svg[role=img]")!, { clientX: 300, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(dialog.querySelector("svg[role=img]")!, { clientX: 300, clientY: 120, pointerId: 1 });
    // 200 of ~740 plot pixels of an 8h window
    expect(within(dialog).getByTestId("trend-duration").textContent).toMatch(/^2h \d+m$/);
    expect(within(dialog).getByRole("button", { name: "Undo zoom" })).toBeEnabled();
  });

  it("closes from the toolbar", async () => {
    const dialog = await openTrend("Totalizer Flow");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
