import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ApiError, UNAUTHORIZED_EVENT } from "@/shared/api";
import { ToastProvider } from "@/shared/hooks/use-toast";
import { Toaster } from "@/shared/components/ui/toaster";
import { describeApiError, useApiErrorHandling } from "./useApiErrorHandling";

afterEach(() => localStorage.clear());

const networkError = () =>
  new ApiError("GET /api/x could not reach the server", { kind: "network", method: "GET", url: "/api/x" });

/** Five queries failing together, the way a tier page's tables do when the server is down. */
function FailingTables() {
  for (const table of ["water", "chlorine", "pressure", "comm", "demographics"]) {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- fixed-length loop
    useQuery({ queryKey: [table], queryFn: () => Promise.reject(networkError()), retry: false });
  }
  return <p>Dashboard</p>;
}

function Shell() {
  useApiErrorHandling();
  return <FailingTables />;
}

function renderApp() {
  const queryClient = new QueryClient();
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Routes>
            <Route path="/dashboard" element={<Shell />} />
            <Route path="/login" element={<p>Login page</p>} />
          </Routes>
          <Toaster />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("useApiErrorHandling", () => {
  it("raises one toast for a burst of the same failure", async () => {
    renderApp();
    await waitFor(() => expect(screen.getByText("Server unreachable")).toBeInTheDocument());
    expect(screen.getAllByText("Server unreachable")).toHaveLength(1);
  });

  it("ends the session on a 401 and says why", async () => {
    localStorage.setItem("jjm_token", "t");
    renderApp();

    await act(async () => {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    });

    await waitFor(() => expect(screen.getByText("Login page")).toBeInTheDocument());
    expect(screen.getByText("Session expired")).toBeInTheDocument();
    expect(localStorage.getItem("jjm_token")).toBeNull();
  });
});

describe("describeApiError", () => {
  const err = (kind: ApiError["kind"], status?: number) =>
    new ApiError("x", { kind, status, method: "GET", url: "/x" });

  it.each([
    [err("network"), "Server unreachable"],
    [err("timeout"), "Server not responding"],
    [err("parse"), "Unexpected data"],
    [err("http", 503), "Server error"],
    [err("http", 404), "Request rejected"],
  ])("titles %s as %s", (error, title) => {
    expect(describeApiError(error).title).toBe(title);
  });
});
