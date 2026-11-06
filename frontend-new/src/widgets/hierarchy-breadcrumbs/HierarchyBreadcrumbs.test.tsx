import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HierarchyBreadcrumbs } from "./HierarchyBreadcrumbs";
import { stateRootNode, useAppStore } from "@/app/store";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("HierarchyBreadcrumbs", () => {
  // Reset even when an assertion fails, so a drilled-in path never leaks into the
  // tests that expect the generic labels.
  afterEach(() => {
    useAppStore.getState().setActiveState("Maharashtra");
  });

  it("keeps the generic tier labels after drilling into a node", () => {
    useAppStore.getState().setNodePath([
      stateRootNode("Maharashtra"),
      { tier: "Region", id: "nagpur", label: "Nagpur" },
      { tier: "Circle", id: "nagpur", label: "Nagpur" },
    ]);

    render(
      <MemoryRouter>
        <HierarchyBreadcrumbs currentTier="Circle" />
      </MemoryRouter>
    );

    expect(screen.getByText("Region")).toBeInTheDocument();
    expect(screen.getByText("Circle")).toBeInTheDocument();
    expect(screen.queryByText("Nagpur")).not.toBeInTheDocument();
  });

  it("renders all 9 tiers from the chosen state to ESR", () => {
    render(
      <MemoryRouter>
        <HierarchyBreadcrumbs currentTier="State" />
      </MemoryRouter>
    );

    expect(screen.getByText("Maharashtra")).toBeInTheDocument();
    expect(screen.getByText("Region")).toBeInTheDocument();
    expect(screen.getByText("Circle")).toBeInTheDocument();
    expect(screen.getByText("Division")).toBeInTheDocument();
    expect(screen.getByText("Sub Division")).toBeInTheDocument();
    expect(screen.getByText("Block")).toBeInTheDocument();
    expect(screen.getByText("Scheme")).toBeInTheDocument();
    expect(screen.getByText("Village")).toBeInTheDocument();
    expect(screen.getByText("ESR")).toBeInTheDocument();
  });

  it("calls onSelectTier callback when a tier button is clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <MemoryRouter>
        <HierarchyBreadcrumbs currentTier="State" onSelectTier={handleSelect} />
      </MemoryRouter>
    );

    const divisionBtn = screen.getByText("Division");
    await user.click(divisionBtn);

    expect(handleSelect).toHaveBeenCalledWith("Division");
  });

  it("handles clicking on any of the 9 tiers without errors", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <MemoryRouter>
        <HierarchyBreadcrumbs currentTier="State" onSelectTier={handleSelect} />
      </MemoryRouter>
    );

    // The state tab opens the state menu; picking the current state selects it.
    await user.click(screen.getByText("Maharashtra"));
    await user.click(await screen.findByRole("menuitem", { name: "Maharashtra" }));

    const tiers = [
      "Region",
      "Circle",
      "Division",
      "Sub Division",
      "Block",
      "Scheme",
      "Village",
      "ESR",
    ];

    for (const tierLabel of tiers) {
      const btn = screen.getByText(tierLabel);
      await user.click(btn);
    }

    expect(handleSelect).toHaveBeenCalledTimes(9);
  });

  it("navigates to the overview page for each tier (and /dashboard for the state) when no onSelectTier is provided", async () => {
    const user = userEvent.setup();
    mockNavigate.mockClear();

    render(
      <MemoryRouter>
        <HierarchyBreadcrumbs currentTier="State" />
      </MemoryRouter>
    );

    await user.click(screen.getByText("Maharashtra"));
    await user.click(await screen.findByRole("menuitem", { name: "Maharashtra" }));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");

    await user.click(screen.getByText("Region"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/region/overview");

    await user.click(screen.getByText("Circle"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/circle/overview");

    await user.click(screen.getByText("Division"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/division/overview");

    await user.click(screen.getByText("Sub Division"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/subdivision/overview");

    await user.click(screen.getByText("Block"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/block/overview");

    await user.click(screen.getByText("Scheme"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/scheme/overview");

    await user.click(screen.getByText("Village"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/village/overview");

    await user.click(screen.getByText("ESR"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/esr/overview");
  });
  it("switches state from the root tab and opens that state's Enterprise dashboard", async () => {
    const user = userEvent.setup();
    mockNavigate.mockClear();
    useAppStore.getState().setNodePath([
      stateRootNode("Maharashtra"),
      { tier: "Region", id: "nagpur", label: "Nagpur", name: "Nagpur" },
    ]);

    render(
      <MemoryRouter>
        <HierarchyBreadcrumbs currentTier="Region" />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Maharashtra" }));
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual(["Maharashtra", "Gujarat", "Madhya Pradesh"]);
    await user.click(screen.getByRole("menuitem", { name: "Gujarat" }));

    // The whole path restarts at the new state, so nothing scopes to Nagpur any more.
    const { activeState, nodePath } = useAppStore.getState();
    expect(activeState).toBe("Gujarat");
    expect(nodePath).toEqual([stateRootNode("Gujarat")]);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    expect(screen.getByRole("button", { name: "Gujarat" })).toBeInTheDocument();
  });

  // Hovering a tab changes nothing: every hover colour repeats the resting one, in
  // both themes, for the selected tab and the rest.
  it("has no hover effect on any tab", () => {
    render(
      <MemoryRouter>
        <HierarchyBreadcrumbs currentTier="Scheme" />
      </MemoryRouter>
    );

    const tabs = screen.getAllByRole("button");
    expect(tabs).toHaveLength(9);
    for (const tab of tabs) {
      const classes = tab.className.split(/\s+/);
      expect(classes).not.toContain("hover:bg-accent");
      for (const c of classes.filter((c) => /(^|:)hover:(bg|text)-/.test(c))) {
        expect(classes).toContain(c.replace("hover:", ""));
      }
    }
  });
});

