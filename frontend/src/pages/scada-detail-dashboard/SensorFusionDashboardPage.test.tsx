import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { useAppStore } from "@/app/store";
import { SensorFusionDashboardPage } from "./SensorFusionDashboardPage";

const HOUR = 3_600_000;

function renderPage(path = "/dashboard/esr/mbr-1-75-ll/sensor-fusion") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Routes>
            <Route path="/dashboard/esr/:id/sensor-fusion" element={<SensorFusionDashboardPage />} />
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

const plots = () => screen.getAllByTestId("trend-plot");
const click = (el: Element, x: number) => {
  fireEvent.pointerDown(el, { button: 0, clientX: x, clientY: 100, pointerId: 1 });
  fireEvent.pointerUp(el, { button: 0, clientX: x, clientY: 100, pointerId: 1 });
};

beforeEach(() => {
  useAppStore.setState({ windowMs: 8 * HOUR, windowEndsAt: null });
});

describe("SensorFusionDashboardPage", () => {
  it("names the reservoir and stacks its chlorine, pressure and flow trends", async () => {
    renderPage();
    expect(await screen.findByText("MBR 1.75 LL")).toBeInTheDocument();
    expect(screen.getByText("Alesur")).toBeInTheDocument();
    for (const name of ["Chlorine trend", "Pressure trend", "Flow Rate trend"]) {
      expect(screen.getByRole("img", { name })).toBeInTheDocument();
    }
  });

  // Alesur's MBR: chlorine online, pressure last heard 24-72 h ago, flow offline.
  it("colours each sensor's dot by its communication status", async () => {
    renderPage();
    await screen.findByText("MBR 1.75 LL");
    expect(screen.getByRole("img", { name: /Chlorine: Online/ })).toHaveClass("bg-jjm-green");
    expect(screen.getByRole("img", { name: /Pressure: Last reported 24 to 72 hours ago/ })).toHaveClass("bg-jjm-amber");
    expect(screen.getByRole("img", { name: /Flow Rate: Offline/ })).toHaveClass("bg-jjm-red");
  });

  it("drops one cursor on all three trends at the same instant", async () => {
    renderPage();
    await screen.findByText("MBR 1.75 LL");
    click(plots()[1], 400);
    await waitFor(() => expect(screen.getAllByTestId("trend-cursor")).toHaveLength(3));
    const stamps = screen
      .getAllByLabelText(/^Cursor at /)
      .map((el) => el.getAttribute("aria-label"));
    expect(new Set(stamps).size).toBe(1);
  });

  it("zooms the page time range when a span is dragged across a trend", async () => {
    renderPage();
    await screen.findByText("MBR 1.75 LL");
    const svg = plots()[0].closest("svg")!;
    fireEvent.pointerDown(plots()[0], { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(svg, { clientX: 400, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(svg, { clientX: 400, clientY: 100, pointerId: 1 });

    const { windowMs, windowEndsAt } = useAppStore.getState();
    expect(windowMs).toBeLessThan(8 * HOUR);
    expect(windowMs).toBeGreaterThan(2 * HOUR);
    expect(windowEndsAt).not.toBeNull();
  });
});
