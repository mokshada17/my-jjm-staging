import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppStore } from "@/app/store";
import { SCROLLING_PAGE, UI_SCALE_EVENT } from "@/shared/lib/uiScale";
import { FIT_MIN_WIDTH, MIN_FIT, overflow, screenFont, shrinkToFit } from "./fit";

/** Up to this many measure-and-shrink passes per fit; it settles in one or two. */
const MAX_PASSES = 4;
/** Auto-scroll speed in design px per second, and the pause at either end. */
const SCROLL_SPEED = 40;
const SCROLL_PAUSE_MS = 5000;

/**
 * Fits every page to the screen it is on. Mounted once in App.
 *
 *  - On any screen at least FIT_MIN_WIDTH wide - laptop, desktop, 720p HD TV,
 *    ultrawide, 4K, 8K - the page is scaled to fill the screen exactly, and
 *    re-fitted whenever the window or screen changes size, data loads or the
 *    route changes. Narrower screens (tablets, phones) keep their responsive
 *    layouts at the CSS rule's size. A page too long to fit at a readable size
 *    (MIN_FIT) scrolls as usual, and a page marked SCROLLING_PAGE is never shrunk
 *    to fit its height at all: it keeps the screen's size and scrolls.
 *  - Wall mode, for an unattended TV or control-room wall: the header button
 *    (which also goes fullscreen) or `?display=tv` in the URL turns it on,
 *    `?display=off` off; it is remembered. It keeps the screen awake, and a page
 *    too long to fit scrolls itself slowly, as nobody stands at a wall to scroll.
 */
export function ScreenFit() {
  const wallMode = useAppStore((s) => s.wallMode);
  const setWallMode = useAppStore((s) => s.setWallMode);
  const { search, pathname } = useLocation();

  useEffect(() => {
    const value = new URLSearchParams(search).get("display");
    if (value === "tv") setWallMode(true);
    else if (value === "off") setWallMode(false);
  }, [search, setWallMode]);

  useFitToScreen(pathname);
  useAutoScroll(wallMode, pathname);
  useWakeLock(wallMode);
  return null;
}

function setRootFont(px: number | null) {
  const root = document.documentElement;
  const next = px === null ? "" : `${px}px`;
  if (root.style.fontSize === next) return;
  root.style.fontSize = next;
  window.dispatchEvent(new Event(UI_SCALE_EVENT));
}

/** Sizes the root font so the page fills the screen; see fit.ts. */
function useFitToScreen(route: string) {
  // A layout effect, so the first fit lands before the page is painted unscaled.
  useLayoutEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const fit = () => {
      const screen = { width: window.innerWidth, height: window.innerHeight };
      if (!screen.width || !screen.height) return;
      if (screen.width < FIT_MIN_WIDTH) {
        // Tablet and phone layouts: the CSS rule sizes them.
        root.classList.remove("screen-fit");
        setRootFont(null);
        return;
      }
      root.classList.add("screen-fit");
      const full = screenFont(screen.width, screen.height);
      // A page that scrolls by design is only kept from overflowing sideways.
      const scrolls = document.querySelector(`[${SCROLLING_PAGE}]`) !== null;
      let font = full;
      for (let pass = 0; pass < MAX_PASSES; pass++) {
        setRootFont(font);
        // Reading the size forces layout at this font size.
        const page = { width: root.scrollWidth, height: scrolls ? 0 : root.scrollHeight };
        const over = overflow(page, screen);
        if (over <= 1) break;
        const next = shrinkToFit(font, over, full * MIN_FIT);
        if (next >= font) break; // at the floor: it scrolls
        font = next;
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();
    window.addEventListener("resize", schedule);
    // Re-fit as the page's content changes size: data arriving, a table filling.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [route]);

  // Unmounting hands sizing back to the CSS rule.
  useEffect(
    () => () => {
      document.documentElement.classList.remove("screen-fit");
      setRootFont(null);
    },
    []
  );
}

/**
 * Wall mode: where a page is too long to fit even at MIN_FIT, scrolls it down slowly,
 * pauses at the bottom, returns to the top and starts again. Any input from a
 * person at the screen pauses it for a while.
 */
function useAutoScroll(on: boolean, route: string) {
  useEffect(() => {
    if (!on) return;
    // Wait at the top, scroll down, wait at the bottom, jump back; repeat.
    let phase: "top" | "down" | "bottom" = "top";
    let phaseEnds = performance.now() + SCROLL_PAUSE_MS;
    let position = 0;
    let last = performance.now();
    let frame = 0;
    if (window.scrollY > 0) window.scrollTo(0, 0);

    const step = (now: number) => {
      const dt = now - last;
      last = now;
      const root = document.documentElement;
      const max = root.scrollHeight - window.innerHeight;
      if (max <= 1) {
        // It fits: nothing to scroll.
        phase = "top";
        phaseEnds = now + SCROLL_PAUSE_MS;
        position = 0;
      } else if (phase === "down") {
        const scale = parseFloat(getComputedStyle(root).fontSize) / 16;
        position = Math.min(max, position + (SCROLL_SPEED * scale * dt) / 1000);
        window.scrollTo(0, position);
        if (position >= max) {
          phase = "bottom";
          phaseEnds = now + SCROLL_PAUSE_MS;
        }
      } else if (now >= phaseEnds) {
        if (phase === "bottom") {
          position = 0;
          window.scrollTo({ top: 0, behavior: "smooth" });
          phase = "top";
          phaseEnds = now + SCROLL_PAUSE_MS;
        } else {
          phase = "down";
        }
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    // Someone at the screen takes over for a while; it resumes from where they left it.
    const interrupt = () => {
      phase = "top";
      phaseEnds = performance.now() + 4 * SCROLL_PAUSE_MS;
      position = window.scrollY;
    };
    const events = ["wheel", "pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, interrupt, { passive: true }));
    return () => {
      cancelAnimationFrame(frame);
      events.forEach((e) => window.removeEventListener(e, interrupt));
    };
  }, [on, route]);
}

/** Wall mode: keeps the screen from dimming or sleeping while the dashboard is visible. */
function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let active = true;

    const acquire = async () => {
      if (document.visibilityState !== "visible" || (lock && !lock.released)) return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (active) lock = next;
        else void next.release();
      } catch {
        // Not allowed here (no user gesture yet, battery saver): the OS's own
        // display settings apply.
      }
    };
    // A wake lock is dropped whenever the tab is hidden; take it again on return.
    const onVisibility = () => void acquire();

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibility);
      void lock?.release();
    };
  }, [on]);
}
