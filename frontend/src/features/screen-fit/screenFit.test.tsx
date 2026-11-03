import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAppStore } from "@/app/store";
import { ScreenFit } from "./ScreenFit";
import { WallModeButton } from "./WallModeButton";
import { MIN_FIT, overflow, screenFont, shrinkToFit } from "./fit";
import { SCROLLING_PAGE } from "@/shared/lib/uiScale";

describe("screen fit sizing", () => {
  it.each([
    [1280, 720, 16 * (2 / 3)],
    [1920, 1080, 16],
    [2560, 1080, 16], // a 21:9 wall is held to its height
    [3840, 2160, 32],
    [7680, 4320, 64],
  ])("%ix%i shows the 1920x1080 design at root %fpx", (w, h, px) => {
    expect(screenFont(w, h)).toBeCloseTo(px);
  });

  it("measures overflow on the tighter side, and 1 when the page fits", () => {
    expect(overflow({ width: 1920, height: 1392 }, { width: 1920, height: 1080 })).toBeCloseTo(1.289, 3);
    expect(overflow({ width: 1900, height: 900 }, { width: 1920, height: 1080 })).toBe(1);
  });

  it("shrinks past the overflow, but never below the readable floor", () => {
    expect(shrinkToFit(16, 1.25, 16 * MIN_FIT)).toBeLessThan(16 / 1.25);
    expect(shrinkToFit(16, 3, 16 * MIN_FIT)).toBe(16 * MIN_FIT);
  });
});

describe("ScreenFit", () => {
  const size = { width: window.innerWidth, height: window.innerHeight };
  const resizeTo = (width: number, height: number) =>
    act(() => {
      Object.assign(window, { innerWidth: width, innerHeight: height });
    });

  afterEach(() => {
    resizeTo(size.width, size.height);
    act(() => useAppStore.getState().setWallMode(false));
  });

  const renderAt = (url: string) =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <ScreenFit />
      </MemoryRouter>
    );

  it("fits a desktop-width screen on its own, with no switch", () => {
    resizeTo(1280, 720);
    renderAt("/dashboard");
    expect(document.documentElement).toHaveClass("screen-fit");
    expect(parseFloat(document.documentElement.style.fontSize)).toBeCloseTo(16 * (2 / 3));
  });

  it("shrinks a page that runs past the screen, unless it is marked to scroll", () => {
    // jsdom does no layout: stand in a page 2,000px tall on a 1920x1080 screen.
    const root = document.documentElement;
    Object.defineProperty(root, "scrollHeight", { configurable: true, get: () => 2000 });
    Object.defineProperty(root, "scrollWidth", { configurable: true, get: () => 1920 });
    resizeTo(1920, 1080);
    try {
      const { unmount } = renderAt("/dashboard");
      expect(parseFloat(root.style.fontSize)).toBeLessThan(16);
      unmount();

      // The Region Overview: screen-sized like every page, and it scrolls.
      const marker = document.createElement("div");
      marker.setAttribute(SCROLLING_PAGE, "");
      document.body.appendChild(marker);
      renderAt("/dashboard/region/overview");
      expect(parseFloat(root.style.fontSize)).toBe(16);
      marker.remove();
    } finally {
      delete (root as { scrollHeight?: number }).scrollHeight;
      delete (root as { scrollWidth?: number }).scrollWidth;
    }
  });

  it("leaves tablets and phones to their own layouts", () => {
    resizeTo(768, 1024);
    renderAt("/dashboard");
    expect(document.documentElement).not.toHaveClass("screen-fit");
    expect(document.documentElement.style.fontSize).toBe("");
  });

  it("turns wall mode on from ?display=tv - the URL a wall's kiosk browser opens - and off from ?display=off", () => {
    const { unmount } = renderAt("/dashboard?display=tv");
    expect(useAppStore.getState().wallMode).toBe(true);
    unmount();
    renderAt("/dashboard?display=off");
    expect(useAppStore.getState().wallMode).toBe(false);
  });

  it("goes fullscreen from the header button, and leaves it on the way out", () => {
    const request = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = request;
    render(<WallModeButton />);

    fireEvent.click(screen.getByRole("button", { name: /Wall display/ }));
    expect(useAppStore.getState().wallMode).toBe(true);
    expect(request).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Exit wall display" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Exit wall display" }));
    expect(useAppStore.getState().wallMode).toBe(false);
  });
});
