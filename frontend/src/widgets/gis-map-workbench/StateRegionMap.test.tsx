import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StateRegionMap } from "./StateRegionMap";
import { STATE_MAPS } from "./stateMaps";
import { mapLayer, pinCollisions, scaleOf } from "./mapTestUtils";

const MAHARASHTRA = STATE_MAPS.Maharashtra;

describe("StateRegionMap labels", () => {
  it.each(Object.values(STATE_MAPS).map((map) => [map.state, map] as const))(
    "%s: one HQ pin per region, and no district name under a pin",
    (_state, map) => {
      const { container } = render(<StateRegionMap map={map} />);
      const { pins, labels, collisions } = pinCollisions(mapLayer(container));

      expect(pins).toBe(map.regions.length);
      expect(labels).toBeGreaterThanOrEqual(map.districts.features.length - 1);
      expect(collisions).toEqual([]);
    }
  );

  it("names the state it draws", () => {
    render(<StateRegionMap map={STATE_MAPS.Gujarat} />);
    expect(screen.getByRole("img", { name: "Gujarat regional water supply map" })).toBeInTheDocument();
  });
});

describe("StateRegionMap borders", () => {
  // Every border is drawn once, as a line over unstroked fills: heavier between
  // regions and round the state, thinner between districts of one region.
  it("draws region and district borders as single line layers", () => {
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);
    const layer = mapLayer(container);
    const region = layer.querySelector('path[data-lines="region"]');
    const district = layer.querySelector('path[data-lines="district"]');

    expect(region?.getAttribute("d")).toBeTruthy();
    expect(district?.getAttribute("d")).toBeTruthy();
    expect(Number(region?.getAttribute("stroke-width"))).toBeGreaterThan(
      Number(district?.getAttribute("stroke-width"))
    );
    // Fills carry no stroke of their own, so no edge is drawn twice.
    const fills = [...layer.querySelectorAll("path:not([data-lines])")].filter(
      (p) => p.getAttribute("fill") !== "none" && p.closest("g") === layer
    );
    expect(fills).toHaveLength(35);
    for (const p of fills) expect(p.getAttribute("stroke")).toBeNull();
  });
});

describe("StateRegionMap hover tooltips", () => {
  // Hovering a district names that district only - not "District — Region".
  it("titles each district with just its own name", () => {
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);
    const titles = [...mapLayer(container).querySelectorAll("path > title")].map((t) => t.textContent);

    expect(titles).toHaveLength(35);
    expect(titles.filter((t) => t?.includes("—"))).toEqual([]);
    expect(titles).toContain("Satara");
    expect(titles).toContain("Chhatrapati Sambhajinagar");
  });
});

describe("StateRegionMap outside labels", () => {
  const labelFor = (container: HTMLElement, name: string) =>
    [...mapLayer(container).querySelectorAll("text")].find((t) => t.textContent === name)!;

  // Mumbai, Ratnagiri and Sindhudurg sit offshore, right-aligned against the coast.
  it.each(["Mumbai", "Ratnagiri", "Sindhudurg"])("sets %s offshore", (name) => {
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);
    expect(labelFor(container, name).getAttribute("text-anchor")).toBe("end");
  });

  // Bhandara sits above its top edge on the northern state border, outside the state.
  it("sets Bhandara above the state's northern border", () => {
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);
    const bhandara = labelFor(container, "Bhandara");
    const nagpur = labelFor(container, "Nagpur");
    expect(bhandara.getAttribute("text-anchor")).toBe("middle");
    expect(Number(bhandara.getAttribute("y"))).toBeLessThan(Number(nagpur.getAttribute("y")) - 30);
  });

  // Every label set outside its district is tied back to it by a leader line.
  it("draws a leader from each outside label into its district", () => {
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);
    const leaders = [...mapLayer(container).querySelectorAll("[data-leader]")].map((g) =>
      g.getAttribute("data-leader")
    );
    expect(leaders.sort()).toEqual(["Bhandara", "Mumbai", "Ratnagiri", "Sindhudurg"]);
  });

  it("sets outside labels 1.5x the smallest in-district size", () => {
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);
    for (const name of ["Mumbai", "Ratnagiri", "Sindhudurg", "Bhandara"]) {
      expect(Number(labelFor(container, name).getAttribute("font-size"))).toBeCloseTo(11.25, 2);
    }
  });

  // The compass is pinned to the card's bottom-left corner, outside the map drawing.
  it("pins the compass to the card's bottom-left corner", () => {
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);
    const compass = container.querySelector("[data-compass]")!;
    expect(compass.getAttribute("class")).toContain("bottom-[6.375rem]"); // 102px, in rem so it scales on large screens
    expect(compass.getAttribute("class")).toContain("left-3");
    expect(mapLayer(container).contains(compass)).toBe(false);
  });
});

describe("StateRegionMap zoom", () => {
  it("starts unzoomed with zoom-out and reset disabled", () => {
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);

    expect(scaleOf(mapLayer(container))).toBe(1);
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset zoom" })).toBeDisabled();
  });

  it("zooms in, out and back to the full state view", async () => {
    const user = userEvent.setup();
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBeCloseTo(1.6, 2));
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBeCloseTo(2.56, 2));

    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBeCloseTo(1.6, 2));

    await user.click(screen.getByRole("button", { name: "Reset zoom" }));
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBe(1));
    expect(screen.getByRole("button", { name: "Reset zoom" })).toBeDisabled();
  });

  // Only the buttons zoom the state map; the wheel is left to scroll the page.
  it("ignores the mouse wheel and double-click", async () => {
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);
    const svg = container.querySelector("svg")!;

    const wheel = fireEvent.wheel(svg, { deltaY: -600, clientX: 400, clientY: 300 });
    fireEvent.dblClick(svg, { clientX: 400, clientY: 300 });
    await new Promise((r) => setTimeout(r, 400));

    expect(wheel).toBe(true); // not preventDefault-ed, so the page still scrolls
    expect(scaleOf(mapLayer(container))).toBe(1);
  });

  // Pins and leader dots grow with the zoomed map like the labels; held at a fixed
  // size they looked tiny beside them.
  it("scales the HQ pins and leader dots with the map", async () => {
    const user = userEvent.setup();
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);
    const layer = () => mapLayer(container);
    const pins = () => [...layer().querySelectorAll("g[data-pin]")].map((g) => g.getAttribute("transform"));
    const dots = () => [...layer().querySelectorAll("[data-leader] circle")].map((c) => c.getAttribute("r"));
    const before = { pins: pins(), dots: dots() };
    expect(before.pins).toHaveLength(6);

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => expect(scaleOf(layer())).toBeCloseTo(1.6, 2));
    // No counter-scale by 1 / zoom: the zoom layer's own scale grows them.
    expect(pins()).toEqual(before.pins);
    expect(dots()).toEqual(before.dots);
  });

  it("keeps the legend and compass outside the zoomed layer", () => {
    const { container } = render(<StateRegionMap map={MAHARASHTRA} />);
    const layer = mapLayer(container);

    expect(layer.querySelectorAll("path").length).toBeGreaterThan(30);
    expect(layer.textContent).not.toContain("Regions");
    expect(container.querySelector("svg")!.textContent).toContain("Regions");
  });
});
