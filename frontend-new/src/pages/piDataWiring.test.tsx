/**
 * Every tier screen must render from the PI ingestion tables rather than from
 * literals. The MSW handlers serve pi-mock-server/db.json, so these assertions
 * are against the same seed the mock server serves.
 */
import { afterEach, describe, it, expect, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { server } from "@/test/msw/node";
import { useAppStore } from "@/app/store";

import {
  CircleOverviewPage,
  DivisionOverviewPage,
  SubDivOverviewPage,
  BlockOverviewPage,
  SchemeOverviewPage,
  VillageOverviewPage,
  EsrOverviewPage,
  RegionOverviewPage,
} from "@/pages/overview";
import { RegionDashboardPage } from "@/pages/region-dashboard/RegionDashboardPage";
import { CircleDashboardPage } from "@/pages/region-dashboard/CircleDashboardPage";
import { DivisionDashboardPage } from "@/pages/region-dashboard/DivisionDashboardPage";
import { SubDivisionDashboardPage } from "@/pages/region-dashboard/SubDivisionDashboardPage";
import { BlockDashboardPage } from "@/pages/region-dashboard/BlockDashboardPage";
import { SchemeDashboardPage } from "@/pages/scada-detail-dashboard/SchemeDashboardPage";
import { VillageDashboardPage } from "@/pages/scada-detail-dashboard/VillageDashboardPage";
import { EnterpriseDashboardPage } from "@/pages/enterprise-dashboard/EnterpriseDashboardPage";

// jsdom has no canvas; the charts are irrelevant to this suite.
vi.mock("echarts-for-react/esm/core", () => ({
  default: () => <div data-testid="echart" />,
}));

function renderAt(path: string, pattern: string, element: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Routes>
            <Route path={pattern} element={element} />
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("Overview tables read from the PI ingestion tables", () => {
  // The region ribbon defaults to Nagpur, whose branch is Circle-Nagpur >
  // Division-Ramtek > Sub Division-Ramtek > Block-Ramtek > Scheme-631010.
  const cases: Array<[string, React.ReactElement, string]> = [
    ["circle", <CircleOverviewPage />, "Nagpur"],
    ["division", <DivisionOverviewPage />, "Ramtek"],
    ["subdivision", <SubDivOverviewPage />, "Ramtek"],
    ["block", <BlockOverviewPage />, "Ramtek"],
    ["scheme", <SchemeOverviewPage />, "Gobarwahi RR Retrofitting"],
    ["village", <VillageOverviewPage />, "Alesur"],
    ["esr", <EsrOverviewPage />, "MBR 1.75 LL"],
  ];

  it.each(cases)("%s overview lists units from the seed", async (_tier, element, expected) => {
    renderAt(`/dashboard/${_tier}/overview`, `/dashboard/${_tier}/overview`, element);
    await waitFor(() =>
      expect(screen.getAllByText(expected).length).toBeGreaterThan(0)
    );
  });

  it("region overview lists every region the AF tree holds, not a literal array", async () => {
    renderAt("/dashboard/region/overview", "/dashboard/region/overview", <RegionOverviewPage />);

    // db.json seeds six Tier 2 elements; only two carry telemetry.
    await waitFor(() => expect(screen.getByText("Konkan")).toBeInTheDocument());
    for (const region of ["Amravati", "Nagpur", "Pune", "Nashik", "Chhatrapati Sambhajinagar"]) {
      expect(screen.getAllByText(region).length).toBeGreaterThan(0);
    }
  });
});

describe("Tier dashboards resolve their :id against the seed", () => {
  it("region dashboard rolls up only the requested region", async () => {
    renderAt("/dashboard/region/nagpur", "/dashboard/region/:id", <RegionDashboardPage />);

    // Nagpur holds one circle, one division, one sub-division, one block and
    // one scheme, over two villages and two reservoirs.
    await waitFor(() =>
      expect(screen.getByText("Number of Circle").parentElement?.textContent).toContain("1")
    );
    expect(screen.getByText("Population").parentElement?.textContent).toContain("2,950");
  });

  it("circle dashboard drills into its divisions", async () => {
    renderAt("/dashboard/circle/nagpur", "/dashboard/circle/:id", <CircleDashboardPage />);
    await waitFor(() => expect(screen.getAllByText(/Ramtek/).length).toBeGreaterThan(0));
  });

  it("division dashboard drills into its sub-divisions", async () => {
    renderAt("/dashboard/division/ramtek", "/dashboard/division/:id", <DivisionDashboardPage />);
    await waitFor(() => expect(screen.getAllByText(/Ramtek/).length).toBeGreaterThan(0));
  });

  it("sub-division dashboard drills into its blocks", async () => {
    renderAt("/dashboard/subdivision/ramtek", "/dashboard/subdivision/:id", <SubDivisionDashboardPage />);
    await waitFor(() => expect(screen.getAllByText(/Ramtek/).length).toBeGreaterThan(0));
  });

  it("block dashboard drills into its schemes", async () => {
    renderAt("/dashboard/block/ramtek", "/dashboard/block/:id", <BlockDashboardPage />);
    await waitFor(() => expect(screen.getAllByText(/631010/).length).toBeGreaterThan(0));
  });

  it("scheme dashboard drills into its villages", async () => {
    renderAt("/dashboard/scheme/631010", "/dashboard/scheme/:id", <SchemeDashboardPage />);
    await waitFor(() => expect(screen.getAllByText(/Alesur/).length).toBeGreaterThan(0));
  });

  it("village dashboard drills into its reservoirs", async () => {
    renderAt("/dashboard/village/alesur", "/dashboard/village/:id", <VillageDashboardPage />);
    await waitFor(() => expect(screen.getAllByText(/MBR 1.75 LL/).length).toBeGreaterThan(0));
  });

  // Previous day is day 6 of the §5.3 series. Scheme 631010 is Alesur (92,000 L)
  // plus Paunarkhari (62,000 L) over 1,800 + 1,150 people = 52.20 L, below 55.
  it("scheme dashboard reports previous-day LPCD and charts the 7-day series", async () => {
    renderAt("/dashboard/scheme/631010", "/dashboard/scheme/:id", <SchemeDashboardPage />);
    await waitFor(() => expect(screen.getByText("52.20 L")).toBeInTheDocument());
    expect(screen.getByRole("img", { name: "Not achieving 55 LPCD" })).toBeInTheDocument();
    expect(screen.getAllByTestId("echart")).toHaveLength(2);
    expect(screen.queryByText(/Dec/)).not.toBeInTheDocument();
  });

  // Water Source used to be a literal ("Nagpur", then "-"); it now comes from the
  // scheme's villages in demographics, so each scheme shows its own.
  it.each([
    ["631010", "Wainganga River"],
    ["20027951", "Katepurna Dam"],
  ])("scheme %s dashboard shows its water source from the seed", async (scheme, source) => {
    renderAt(`/dashboard/scheme/${scheme}`, "/dashboard/scheme/:id", <SchemeDashboardPage />);
    const label = await screen.findByText("Water Source");
    await waitFor(() => expect(label.nextElementSibling).toHaveTextContent(source));
  });

  // Ambikapur: 131,000 L over 2,300 people = 56.96 L, meeting the benchmark.
  it("village dashboard reports previous-day LPCD against the benchmark", async () => {
    renderAt("/dashboard/village/ambikapur", "/dashboard/village/:id", <VillageDashboardPage />);
    await waitFor(() => expect(screen.getByText("56.96 L")).toBeInTheDocument());
    expect(screen.getByRole("img", { name: "Achieving 55 LPCD" })).toBeInTheDocument();
    expect(screen.getAllByTestId("echart")).toHaveLength(2);
  });

  // Paunarkhari's ESR: chlorine 0.65 mg/l (high), pressure 12.6 m (over), and a
  // flow meter the communication table reports as not connected.
  it("village topology colours each sensor dot from its latest reading", async () => {
    renderAt("/dashboard/village/paunarkhari", "/dashboard/village/:id", <VillageDashboardPage />);
    const tree = await screen.findByRole("list", { name: "Reservoirs in Paunarkhari" });
    const dot = (label: RegExp) =>
      within(tree).getByRole("img", { name: label }).getAttribute("data-health");
    expect(dot(/Chlorine: High/)).toBe("bad");
    expect(dot(/Pressure: Over pressure/)).toBe("warn");
    expect(dot(/Flow: Offline/)).toBe("offline");
  });
});

describe("request shape", () => {
  /** Every request the render issued, in order. */
  function recordRequests() {
    const seen: string[] = [];
    server.events.removeAllListeners("request:start");
    server.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      seen.push(url.pathname + url.search);
    });
    return seen;
  }

  it("loads a block dashboard with one scoped round of requests", async () => {
    const seen = recordRequests();
    renderAt("/dashboard/block/ramtek", "/dashboard/block/:id", <BlockDashboardPage />);
    await waitFor(() => expect(screen.getAllByText(/631010/).length).toBeGreaterThan(0));

    const tables = seen.filter((u) => u.startsWith("/api/"));
    // the five §5 tables, once each — no per-row or per-child follow-ups
    expect(tables).toHaveLength(5);
    expect(new Set(tables.map((u) => u.split("?")[0])).size).toBe(5);
  });

  it("does not crawl the AF tree node by node to count the estate", async () => {
    const seen = recordRequests();
    renderAt("/dashboard", "/dashboard", <EnterpriseDashboardPage />);
    await waitFor(() => expect(screen.getByText("5,250")).toBeInTheDocument());

    const tree = seen.filter((u) => u.includes("/piwebapi/elements"));
    // root lookup, the Tier 2 children for the region list, and one
    // full-hierarchy enumeration — not one request per element
    expect(tree.length).toBeLessThanOrEqual(3);
    expect(tree.some((u) => u.includes("searchFullHierarchy=true"))).toBe(true);
  });
});

describe("switching state", () => {
  afterEach(() => useAppStore.getState().setActiveState("Maharashtra"));

  /** Every request the render issued, in order. */
  function recordRequests() {
    const seen: URL[] = [];
    server.events.removeAllListeners("request:start");
    server.events.on("request:start", ({ request }) => {
      seen.push(new URL(request.url));
    });
    return seen;
  }

  it("rolls the Enterprise dashboard up from the chosen state only", async () => {
    useAppStore.getState().setActiveState("Gujarat");
    const seen = recordRequests();
    renderAt("/dashboard", "/dashboard", <EnterpriseDashboardPage />);

    // Manjusar 2,100 + Samlaya 1,400 + Gomta 1,650 - none of Maharashtra's 5,250.
    await waitFor(() => expect(screen.getByText("5,150")).toBeInTheDocument());
    expect(screen.getByRole("img", { name: "Gujarat regional water supply map" })).toBeInTheDocument();

    const tables = seen.filter((u) => u.pathname.startsWith("/api/"));
    expect(tables.length).toBeGreaterThan(0);
    for (const u of tables) expect(u.searchParams.get("state"), u.toString()).toBe("Gujarat");
    const root = seen.find((u) => u.pathname === "/piwebapi/elements");
    expect(root?.searchParams.get("path")).toBe("\\\\DemoAF\\JJM\\JJM\\Gujarat");
  });

  it("re-rolls an Enterprise dashboard that is already open when the state changes", async () => {
    renderAt("/dashboard", "/dashboard", <EnterpriseDashboardPage />);
    await waitFor(() => expect(screen.getByText("5,250")).toBeInTheDocument());

    // The breadcrumb picker navigates /dashboard -> /dashboard, so the page stays
    // mounted; it must not keep Maharashtra's figures.
    act(() => useAppStore.getState().setActiveState("Gujarat"));
    await waitFor(() => expect(screen.getByText("5,150")).toBeInTheDocument());
    expect(screen.queryByText("5,250")).not.toBeInTheDocument();
  });

  it("lists the chosen state's regions on the Region Overview", async () => {
    useAppStore.getState().setActiveState("Madhya Pradesh");
    renderAt("/dashboard/region/overview", "/dashboard/region/overview", <RegionOverviewPage />);

    await waitFor(() => expect(screen.getAllByText("Bhopal").length).toBeGreaterThan(0));
    for (const region of ["Indore", "Jabalpur", "Narmadapuram"]) {
      expect(screen.getAllByText(region).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText("Nagpur")).not.toBeInTheDocument();
  });

  it("opens the overview tables on the chosen state's default region", async () => {
    useAppStore.getState().setActiveState("Gujarat");
    renderAt("/dashboard/circle/overview", "/dashboard/circle/overview", <CircleOverviewPage />);

    expect(screen.getByRole("tab", { name: "Central Gujarat" })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(screen.getAllByText("Vadodara").length).toBeGreaterThan(0));
    expect(screen.queryByText("Nagpur")).not.toBeInTheDocument();
  });
});
