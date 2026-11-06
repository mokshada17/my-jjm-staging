import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, afterAll, beforeAll, vi } from "vitest";
import { server } from "./msw/node";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

vi.stubGlobal(
  "IntersectionObserver",
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
);
// jsdom has no PointerEvent, so fireEvent.pointerDown would build a bare Event
// with no coordinates. The trends' cursor and zoom gestures need clientX/Y.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "mouse";
    }
  }
  vi.stubGlobal("PointerEvent", PointerEventPolyfill);
}

// floating-ui (behind Radix Popover / DropdownMenu) probes `:popover-open` and
// `:modal` on every position update. jsdom implements neither, and its selector
// engine resolves them through a recursive :fullscreen walk that blocks the event
// loop for seconds once a popover has opened. Answer them the way jsdom would.
const nativeMatches = Element.prototype.matches;
Element.prototype.matches = function matches(this: Element, selector: string) {
  if (selector === ":popover-open" || selector === ":modal") return false;
  return nativeMatches.call(this, selector);
} as typeof Element.prototype.matches;
