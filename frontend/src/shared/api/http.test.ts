import { afterEach, describe, expect, it, vi } from "vitest";
import { delay, http as mock, HttpResponse } from "msw";
import { server } from "@/test/msw/node";
import { ApiError, createHttpClient, serializeParams, TOKEN_KEY, UNAUTHORIZED_EVENT } from "./http";
import { retryDelay, shouldRetry } from "./queryClient";

const BASE = "http://api.test";
const api = createHttpClient(BASE, 200);

afterEach(() => localStorage.clear());

/** Resolves with the ApiError a call rejects with. */
async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    return e as ApiError;
  }
  throw new Error("expected the request to fail");
}

describe("requests", () => {
  it("drops empty params and sends no body headers on a GET", async () => {
    let seen: Request | undefined;
    server.use(mock.get(`${BASE}/api/rows`, ({ request }) => ((seen = request), HttpResponse.json([]))));

    await api.get("/api/rows", { region: "Nagpur", circle: undefined, division: null, block: "" });

    const url = new URL(seen!.url);
    expect([...url.searchParams.entries()]).toEqual([["region", "Nagpur"]]);
    expect(seen!.headers.get("accept")).toContain("application/json");
    expect(seen!.headers.get("content-type")).toBeNull(); // no CORS preflight for reads
  });

  it("sends the session token as a Bearer header", async () => {
    localStorage.setItem(TOKEN_KEY, "abc123");
    let auth: string | null = null;
    server.use(mock.get(`${BASE}/me`, ({ request }) => ((auth = request.headers.get("authorization")), HttpResponse.json({}))));

    await api.get("/me");
    expect(auth).toBe("Bearer abc123");
  });

  it("encodes arrays as repeated params", () => {
    expect(serializeParams({ id: ["a", "b"], q: "x y" })).toBe("id=a&id=b&q=x+y");
  });
});

describe("responses", () => {
  it("resolves 204 and empty bodies to undefined", async () => {
    server.use(
      mock.delete(`${BASE}/users/1`, () => new HttpResponse(null, { status: 204 })),
      mock.get(`${BASE}/empty`, () => new HttpResponse("", { status: 200 }))
    );
    await expect(api.delete("/users/1")).resolves.toBeUndefined();
    await expect(api.get("/empty")).resolves.toBeUndefined();
  });

  it("rejects malformed JSON as a parse error instead of returning a string", async () => {
    server.use(
      mock.get(`${BASE}/bad`, () =>
        new HttpResponse("{not json", { status: 200, headers: { "Content-Type": "application/json" } })
      )
    );
    const e = await failure(api.get("/bad"));
    expect(e.kind).toBe("parse");
    expect(e.isRetryable).toBe(false);
  });

  it("rejects a table that is not a list", async () => {
    server.use(mock.get(`${BASE}/api/chlorine-data`, () => HttpResponse.json({ error: "oops" })));
    const e = await failure(api.getList("/api/chlorine-data"));
    expect(e.kind).toBe("parse");
    expect(e.message).toContain("expected a list");
  });
});

describe("failures", () => {
  it.each([
    [500, true],
    [503, true],
    [429, true],
    [404, false],
    [400, false],
  ])("HTTP %i is an http error, retryable: %s", async (status, retryable) => {
    server.use(mock.get(`${BASE}/x`, () => HttpResponse.json({ message: "no" }, { status })));
    const e = await failure(api.get("/x"));
    expect(e.kind).toBe("http");
    expect(e.status).toBe(status);
    expect(e.data).toEqual({ message: "no" });
    expect(e.isRetryable).toBe(retryable);
  });

  it("reports an unreachable server as a retryable network error", async () => {
    server.use(mock.get(`${BASE}/x`, () => HttpResponse.error()));
    const e = await failure(api.get("/x"));
    expect(e.kind).toBe("network");
    expect(e.isRetryable).toBe(true);
  });

  it("times out a request that hangs", async () => {
    server.use(mock.get(`${BASE}/slow`, async () => (await delay(1000), HttpResponse.json([]))));
    const e = await failure(api.get("/slow"));
    expect(e.kind).toBe("timeout");
    expect(e.isRetryable).toBe(true);
  });

  it("cancels on the caller's AbortSignal", async () => {
    server.use(mock.get(`${BASE}/slow`, async () => (await delay(1000), HttpResponse.json([]))));
    const controller = new AbortController();
    const pending = api.get("/slow", undefined, { signal: controller.signal });
    controller.abort();
    const e = await failure(pending);
    expect(e.kind).toBe("canceled");
    expect(e.isRetryable).toBe(false);
  });
});

describe("401", () => {
  it("announces an expired session", async () => {
    server.use(mock.get(`${BASE}/x`, () => new HttpResponse(null, { status: 401 })));
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    await failure(api.get("/x"));
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stays quiet for a call that opts out (the login itself)", async () => {
    server.use(mock.post(`${BASE}/auth/login`, () => new HttpResponse(null, { status: 401 })));
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    await failure(api.post("/auth/login", {}, { skipAuthRedirect: true }));
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("retry policy", () => {
  const err = (kind: ApiError["kind"], status?: number) =>
    new ApiError("x", { kind, status, method: "GET", url: "/x" });

  it("retries network, timeout, 5xx and 429 up to twice", () => {
    for (const e of [err("network"), err("timeout"), err("http", 502), err("http", 429)]) {
      expect(shouldRetry(0, e)).toBe(true);
      expect(shouldRetry(1, e)).toBe(true);
      expect(shouldRetry(2, e)).toBe(false);
    }
  });

  it("never retries a 4xx, a cancel, malformed data or a non-API error", () => {
    for (const e of [err("http", 404), err("canceled"), err("parse"), new TypeError("bug")]) {
      expect(shouldRetry(0, e)).toBe(false);
    }
  });

  it("backs off exponentially with jitter, capped at 10s", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);
    expect([0, 1, 2, 3, 10].map(retryDelay)).toEqual([1000, 2000, 4000, 8000, 10000]);
    vi.restoreAllMocks();
  });
});
