import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegionDistrictMap } from "./RegionDistrictMap";
import { STATE_MAPS } from "./stateMaps";
import { mapLayer, pinCollisions, scaleOf } from "./mapTestUtils";

const MAHARASHTRA = STATE_MAPS.Maharashtra;

describe("RegionDistrictMap labels", () => {
  // Every region of every state the officer can switch to.
  const regions = Object.values(STATE_MAPS).flatMap((map) =>
    map.regions.map((r) => [map.state, r.id, r.districts.length, map] as const)
  );
  it.each(regions)(
    "%s / %s: labels every district and none sits under the HQ pin",
    (_state, id, districtCount, map) => {
      const { container } = render(<RegionDistrictMap map={map} regionId={id} />);
      const { pins, labels, collisions } = pinCollisions(mapLayer(container));

      expect(pins).toBe(1);
      expect(labels).toBe(districtCount);
      expect(collisions).toEqual([]);
    }
  );
});

describe("RegionDistrictMap zoom", () => {
  it("zooms in, out and back to the full region view", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegionDistrictMap map={MAHARASHTRA} regionId="nagpur" />);

    expect(scaleOf(mapLayer(container))).toBe(1);
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBeCloseTo(1.6, 2));

    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBe(1));

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBeCloseTo(1.6, 2));
    await user.click(screen.getByRole("button", { name: "Reset zoom" }));
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBe(1));
  });

  // The HQ pin grows with the zoomed map like the labels; held at a fixed size it
  // looked tiny beside them.
  it("scales the HQ pin with the map", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegionDistrictMap map={MAHARASHTRA} regionId="nagpur" />);
    const pin = () => mapLayer(container).querySelector("g[data-pin]")!.getAttribute("transform");
    const before = pin();

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBeCloseTo(1.6, 2));
    expect(pin()).toBe(before); // no counter-scale by 1 / zoom
  });

  // Only the buttons zoom the region map; the wheel is left to scroll the page.
  it("ignores the mouse wheel and double-click", async () => {
    const { container } = render(<RegionDistrictMap map={MAHARASHTRA} regionId="nagpur" />);
    const svg = container.querySelector("svg")!;

    const wheel = fireEvent.wheel(svg, { deltaY: -600, clientX: 300, clientY: 200 });
    fireEvent.dblClick(svg, { clientX: 300, clientY: 200 });
    await new Promise((r) => setTimeout(r, 400));

    expect(wheel).toBe(true); // not preventDefault-ed, so the page still scrolls
    expect(scaleOf(mapLayer(container))).toBe(1);
  });

  it("returns to the full view when the region changes", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<RegionDistrictMap map={MAHARASHTRA} regionId="nagpur" />);

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBeCloseTo(1.6, 2));

    rerender(<RegionDistrictMap map={MAHARASHTRA} regionId="pune" />);
    await waitFor(() => expect(scaleOf(mapLayer(container))).toBe(1));
    expect(screen.getByText("Pune Region")).toBeInTheDocument();
  });
});
