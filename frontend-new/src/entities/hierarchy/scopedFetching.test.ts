/**
 * Guards the request shape, not just the rendered values: a tier screen must ask
 * the server for its own branch instead of pulling the whole estate and
 * filtering in the browser.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/node";
import db from "../../../pi-mock-server/db.json";
import { useScopedNetwork, useAfInventory } from "./queries";
import { scopeKey, scopeParams } from "./scope";

const API = "http://localhost:3001";

/** Every request the hook under test issued, in order. */
let requests: string[] = [];

function recordAll() {
  requests = [];
  server.events.removeAllListeners("request:start");
  server.events.on("request:start", ({ request }) => {
    const url = new URL(request.url);
    requests.push(url.pathname + url.search);
  });
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => recordAll());

describe("scoped fetching", () => {
  it("puts the branch on the query string instead of fetching everything", async () => {
    const scope = { region: "Nagpur", circle: "Nagpur" };
    const { result } = renderHook(() => useScopedNetwork(scope), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    const tableCalls = requests.filter((u) => u.startsWith("/api/"));
    expect(tableCalls.length).toBe(5);
    for (const call of tableCalls) {
      expect(call).toContain("region=Nagpur");
      expect(call).toContain("circle=Nagpur");
    }
  });

  it("issues nothing at all until the caller's scope is resolved", async () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useScopedNetwork({ region: "Nagpur" }, enabled),
      { wrapper, initialProps: { enabled: false } }
    );

    expect(requests.filter((u) => u.startsWith("/api/"))).toHaveLength(0);

    rerender({ enabled: true });
    await waitFor(() =>
      expect(requests.filter((u) => u.startsWith("/api/")).length).toBe(5)
    );
  });

  it("counts the whole estate in one request, not one per element", async () => {
    // The AF tree holds 29 elements; a per-node crawl would be 29 requests.
    server.use(
      http.get(`${API}/piwebapi/elements/:webId/elements`, ({ request, params }) => {
        const full = new URL(request.url).searchParams.get("searchFullHierarchy") === "true";
        const children = db.elementChildren.filter((e) => e.parentWebId === params.webId);
        if (!full) return HttpResponse.json({ Items: children });

        const items: typeof db.elementChildren = [];
        const stack = [params.webId as string];
        while (stack.length) {
          const id = stack.pop()!;
          for (const child of db.elementChildren.filter((e) => e.parentWebId === id)) {
            items.push(child);
            stack.push(child.WebId);
          }
        }
        return HttpResponse.json({ Items: items });
      })
    );

    const { result } = renderHook(() => useAfInventory(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    const treeCalls = requests.filter((u) => u.includes("/piwebapi/elements"));
    // one root lookup + one full-hierarchy enumeration
    expect(treeCalls).toHaveLength(2);
    expect(treeCalls.some((u) => u.includes("searchFullHierarchy=true"))).toBe(true);

    expect(result.current.data).toMatchObject({ regions: 6, reservoirs: 4, villages: 3 });
  });

  it("caches per branch, so each scope is fetched once", () => {
    expect(scopeKey({ region: "Nagpur" })).not.toBe(scopeKey({ region: "Amravati" }));
    expect(scopeKey({ circle: "Akola", region: "Amravati" })).toBe(
      scopeKey({ region: "Amravati", circle: "Akola" })
    );
    expect(scopeKey({})).toBe("all");
    expect(scopeParams({ region: "Nagpur", circle: undefined })).toEqual({ region: "Nagpur" });
  });
});
