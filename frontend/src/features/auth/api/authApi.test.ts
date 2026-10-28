import { afterEach, describe, expect, it } from "vitest";
import { http as mock, HttpResponse } from "msw";
import { server } from "@/test/msw/node";
import { ApiError } from "@/shared/api";
import { authApi } from "./authApi";

const LOGIN = "http://localhost:3001/auth/login";
const credentials = { email: "commissioner@maharashtra.gov.in", password: "secret" };

afterEach(() => localStorage.clear());

describe("authApi.login", () => {
  it("stores the session a real auth service returns, stamped with its start", async () => {
    const res = await authApi.login(credentials);
    expect(res.token).toBe("test-token");
    expect(localStorage.getItem("jjm_token")).toBe("test-token");
    expect(JSON.parse(localStorage.getItem("jjm_user")!).signedInAt).toBeTruthy();
  });

  // The fallback exists for the mock server, which has no auth endpoint. It must
  // never turn a real service's rejection into a successful sign-in.
  it.each([401, 403, 500])("rejects when the auth service answers %i", async (status) => {
    server.use(mock.post(LOGIN, () => HttpResponse.json({ message: "no" }, { status })));

    await expect(authApi.login(credentials)).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem("jjm_token")).toBeNull();
    expect(localStorage.getItem("jjm_user")).toBeNull();
  });

  it.each([
    ["has no auth endpoint (404)", () => new HttpResponse(null, { status: 404 })],
    ["is unreachable", () => HttpResponse.error()],
  ])("signs in offline when the server %s", async (_case, reply) => {
    server.use(mock.post(LOGIN, reply));

    const res = await authApi.login(credentials);
    expect(res.user.email).toBe(credentials.email);
    expect(localStorage.getItem("jjm_token")).toBeTruthy();
  });
});
