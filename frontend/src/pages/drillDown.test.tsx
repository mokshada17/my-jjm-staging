/**
 * Clicking a child in any tier dashboard must open that child's dashboard with its
 * data fetched from the mock server, scoped to exactly its branch. These tests
 * drive real clicks through the pages and assert on the requests they send.
 *
 * Seed branches (pi-mock-server/db.json):
 *   Nagpur > Nagpur > Ramtek > Ramtek > Ramtek > 631010 > Alesur / Paunarkhari
 *   Amravati > Akola > Akola > Akola > Akola > 20027951 > Ambikapur
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { stateRootNode, useAppStore } from "@/app/store";
import { server } from "@/test/msw/node";

import { CircleOverviewPage } from "@/pages/overview";
import { RegionDashboardPage } from "@/pages/region-dashboard/RegionDashboardPage";
import { CircleDashboardPage } from "@/pages/region-dashboard/CircleDashboardPage";
import { DivisionDashboardPage } from "@/pages/region-dashboard/DivisionDashboardPage";
import { SubDivisionDashboardPage } from "@/pages/region-dashboard/SubDivisionDashboardPage";
import { BlockDashboardPage } from "@/pages/region-dashboard/BlockDashboardPage";
import { SchemeDashboardPage } from "@/pages/scada-detail-dashboard/SchemeDashboardPage";
import { VillageDashboardPage } from "@/pages/scada-detail-dashboard/VillageDashboardPage";
import { EsrScadaDashboardPage } from "@/pages/scada-detail-dashboard/EsrScadaDashboardPage";

// jsdom has no canvas; the charts are irrelevant here.
vi.mock("echarts-for-react/esm/core", () => ({ default: () => <div data-testid="echart" /> }));

function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Routes>
            <Route path="/dashboard/circle/overview" element={<CircleOverviewPage />} />
            <Route path="/dashboard/region/:id" element={<RegionDashboardPage />} />
            <Route path="/dashboard/circle/:id" element={<CircleDashboardPage />} />
            <Route path="/dashboard/division/:id" element={<DivisionDashboardPage />} />
            <Route path="/dashboard/subdivision/:id" element={<SubDivisionDashboardPage />} />
            <Route path="/dashboard/block/:id" element={<BlockDashboardPage />} />
            <Route path="/dashboard/scheme/:id" element={<SchemeDashboardPage />} />
            <Route path="/dashboard/village/:id" element={<VillageDashboardPage />} />
            <Route path="/dashboard/esr/:id" element={<EsrScadaDashboardPage />} />
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

/** Records every mock-server table request from here on. */
function recordTableRequests() {
  const seen: URLSearchParams[] = [];
  server.events.removeAllListeners("request:start");
  server.events.on("request:start", ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname === "/api/chlorine-data") seen.push(url.searchParams);
  });
  return seen;
}

const matches = (q: URLSearchParams, scope: Record<string, string>) =>
  Object.entries(scope).every(([k, v]) => q.get(k) === v) &&
  [...q.keys()].length === Object.keys(scope).length;

/**
 * Stays within the branch: names the page's own node (the deepest scope column,
 * so it is not widened) and contradicts none of the ancestors (so it is not a
 * stale branch). A narrower request - e.g. the ESR page's per-reservoir series,
 * keyed on scheme_id + village_name + esr_name - is fine.
 */
const withinBranch = (q: URLSearchParams, scope: Record<string, string>) => {
  const keys = Object.keys(scope);
  const own = keys[keys.length - 1];
  return q.get(own) === scope[own] && [...q.entries()].every(([k, v]) => !(k in scope) || scope[k] === v);
};

/**
 * Waits for a chlorine-data request scoped to exactly `scope` (the page's branch
 * fetch), then checks every request since `from` stayed within the branch - so a
 * page that first fetches its branch and then widens (e.g. after losing the
 * node's name) fails, not just one that never scopes at all.
 */
async function expectFetch(seen: URLSearchParams[], branch: Record<string, string>, from = 0) {
  // Every request names the chosen state too; these branches are all in Maharashtra.
  const scope = { state: "Maharashtra", ...branch };
  await waitFor(() => {
    expect(seen.slice(from).some((q) => matches(q, scope)), `no request scoped to ${JSON.stringify(scope)}`).toBe(true);
  });
  await new Promise((r) => setTimeout(r, 150)); // let any follow-up fetch fire
  const stray = seen.slice(from).filter((q) => !withinBranch(q, scope)).map((q) => q.toString());
  expect(stray, `requests outside ${JSON.stringify(scope)}`).toEqual([]);
}

beforeEach(() => {
  useAppStore.setState({ activeState: "Maharashtra", nodePath: [] });
});

describe("drilling down through the tier dashboards", () => {
  it("opens each child with its data fetched for exactly its branch", async () => {
    const user = userEvent.setup();
    const seen = recordTableRequests();
    renderApp("/dashboard/region/nagpur");

    // A cold link to a region resolves its AF name, then scopes to it.
    await expectFetch(seen, { region: "Nagpur" });

    const steps: Array<[string, Record<string, string>]> = [
      ["Drill down into Nagpur Circle", { region: "Nagpur", circle: "Nagpur" }],
      ["Drill down into Ramtek Division", { region: "Nagpur", circle: "Nagpur", division: "Ramtek" }],
      [
        "Drill down into Ramtek Sub-Division Dashboard",
        { region: "Nagpur", circle: "Nagpur", division: "Ramtek", sub_division: "Ramtek" },
      ],
      [
        "Drill down into Ramtek Block",
        { region: "Nagpur", circle: "Nagpur", division: "Ramtek", sub_division: "Ramtek", block: "Ramtek" },
      ],
      [
        "Drill down into scheme Gobarwahi RR Retrofitting",
        {
          region: "Nagpur", circle: "Nagpur", division: "Ramtek", sub_division: "Ramtek",
          block: "Ramtek", scheme_id: "631010",
        },
      ],
      [
        "Drill down into Alesur Village",
        {
          region: "Nagpur", circle: "Nagpur", division: "Ramtek", sub_division: "Ramtek",
          block: "Ramtek", scheme_id: "631010", village_name: "Alesur",
        },
      ],
      [
        "Drill down into MBR 1.75 LL live SCADA",
        {
          region: "Nagpur", circle: "Nagpur", division: "Ramtek", sub_division: "Ramtek",
          block: "Ramtek", scheme_id: "631010", village_name: "Alesur", esr_name: "MBR 1.75 LL",
        },
      ],
    ];

    for (const [title, scope] of steps) {
      const from = seen.length;
      await user.click(await screen.findByTitle(title));
      await expectFetch(seen, scope, from);

      // The page must keep its node's name in the breadcrumb path. Losing it
      // widens the page's scope to its parent's - which React Query already has
      // cached, so no request shows it; the path is where it is visible.
      const named = useAppStore
        .getState()
        .nodePath.filter((n) => n.tier !== "State")
        .map((n) => n.name);
      expect(named).toEqual(Object.values(scope));
    }

    // And the reservoir page shows that reservoir's own data.
    expect((await screen.findAllByText("MBR 1.75 LL")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alesur").length).toBeGreaterThan(0);
  });

  it("scopes a child opened from an overview to its own branch, not a stale one", async () => {
    const user = userEvent.setup();
    // Left over from exploring Nagpur earlier in the session.
    useAppStore.setState({
      nodePath: [
        stateRootNode("Maharashtra"),
        { tier: "Region", id: "nagpur", label: "Nagpur", name: "Nagpur" },
      ],
    });
    const seen = recordTableRequests();
    renderApp("/dashboard/circle/overview");

    await user.click(await screen.findByRole("tab", { name: "Amaravati" }));
    const row = await screen.findByTitle("Click to view detailed Circle Dashboard");
    const from = seen.length;
    await user.click(row);

    await expectFetch(seen, { region: "Amravati", circle: "Akola" }, from);
    expect(seen.some((q) => q.get("region") === "Nagpur" && q.get("circle") === "Akola")).toBe(false);
  });
});

describe("pages reached by the Back button or a pasted link", () => {
  // The stored path describes the Nagpur scheme explored earlier; the village in
  // the URL is in Amravati. The page must not scope itself to the stale branch.
  it("ignores a stored path that leads elsewhere and rebuilds it from the data", async () => {
    useAppStore.setState({
      nodePath: [
        stateRootNode("Maharashtra"),
        { tier: "Region", id: "nagpur", label: "Nagpur", name: "Nagpur" },
        { tier: "Circle", id: "nagpur", label: "Nagpur", name: "Nagpur" },
        { tier: "Division", id: "ramtek", label: "Ramtek", name: "Ramtek" },
        { tier: "SubDivision", id: "ramtek", label: "Ramtek", name: "Ramtek" },
        { tier: "Block", id: "ramtek", label: "Ramtek", name: "Ramtek" },
        { tier: "Scheme", id: "631010", label: "631010", name: "631010" },
      ],
    });
    const seen = recordTableRequests();
    renderApp("/dashboard/village/ambikapur");

    // Ambikapur's own figures (56.96 L previous-day LPCD), not an empty page.
    expect(await screen.findByText("56.96 L")).toBeInTheDocument();
    expect(seen.some((q) => q.get("scheme_id") === "631010")).toBe(false);
    await waitFor(() =>
      expect(useAppStore.getState().nodePath.map((n) => n.name)).toEqual([
        "Maharashtra", "Amravati", "Akola", "Akola", "Akola", "Akola", "20027951", "Ambikapur",
      ])
    );
  });
});

describe("a page opened from a pasted link", () => {
  // With no trusted path the page loads wide and narrows client-side. Rebuilding
  // the path from that data must not make the page download its branch again.
  it("loads once, then keeps the rebuilt path for its children only", async () => {
    const seen: string[] = [];
    server.events.removeAllListeners("request:start");
    server.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) seen.push(url.pathname + url.search);
    });
    renderApp("/dashboard/block/ramtek");

    // The path is rebuilt from the loaded row...
    await waitFor(() =>
      expect(useAppStore.getState().nodePath.map((n) => n.name)).toEqual([
        "Maharashtra", "Nagpur", "Nagpur", "Ramtek", "Ramtek", "Ramtek",
      ])
    );
    await new Promise((r) => setTimeout(r, 200)); // let any refetch fire

    // ...but the page made one round of the five tables, not a second, scoped one.
    expect(seen).toHaveLength(5);
    expect(screen.getAllByText("Ramtek").length).toBeGreaterThan(0);
  });
});

describe("tier dashboard detail tiles", () => {
  // These tiles used to read "Nagpur" whatever branch was open.
  it("name the open branch from the API, not a literal", async () => {
    renderApp("/dashboard/block/akola");

    await waitFor(() => expect(screen.getAllByText("Amravati").length).toBeGreaterThan(0));
    expect(screen.queryByText("Nagpur")).not.toBeInTheDocument();
  });
});
