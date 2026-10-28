import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { EnterpriseDashboardPage } from "./EnterpriseDashboardPage";

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <EnterpriseDashboardPage />
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe("EnterpriseDashboardPage", () => {
  // Titles are asserted exactly as they appear in Figma 2:352 / 2:10 — Title Case,
  // not the uppercase the page previously rendered.
  it("renders all six Figma modules", () => {
    renderPage();

    expect(screen.getByText("IOT Project Overview")).toBeInTheDocument();
    expect(screen.getByText("MetaData Received")).toBeInTheDocument();
    expect(
      screen.getByText("Villages, Population, Household Covered under scheme")
    ).toBeInTheDocument();
    expect(screen.getByText("Reservoir Information")).toBeInTheDocument();
    expect(screen.getByText("Scheme Performance (KPIs)")).toBeInTheDocument();
    expect(screen.getByText("Village Level Performance (KPIs)")).toBeInTheDocument();
  });

  // The seed in pi-mock-server/db.json holds 2 schemes across 3 villages.
  it("keeps the scheme and village KPI totals distinct after the shared-card extraction", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Total Scheme: 2")).toBeInTheDocument()
    );
    expect(screen.getByText("Total Villages: 3")).toBeInTheDocument();
    expect(
      screen.getByText("LiIter Per Capita Day (LPCD) - Scheme")
    ).toBeInTheDocument();
    expect(
      screen.getByText("LiIter Per Capita Day (LPCD) - Village")
    ).toBeInTheDocument();
  });

  // Summed from the demographics rows the mock server serves.
  it("rolls the demographic figures up out of the ingestion tables", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText("5,250")).toBeInTheDocument());
    expect(screen.getByText("1,050")).toBeInTheDocument();
  });

  // The seed holds two MBRs and two ESRs, and no GSR (guide §3 templates).
  it("counts reservoirs by the type embedded in the element name", async () => {
    renderPage();

    // The heading sits on the panel's title strip, whose parent is the panel.
    const card = screen.getByText("Reservoir Information").parentElement!.parentElement as HTMLElement;

    await waitFor(() => {
      const tiles = within(card)
        .getAllByText(/^(ESR|GSR|MBR)$/)
        .map((label) => label.parentElement?.textContent ?? "");
      expect(tiles).toEqual(["ESR2", "GSR0", "MBR2"]);
    });
  });
});
