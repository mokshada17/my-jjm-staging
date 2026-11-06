import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import App from "@/app/App";
import { useAppStore } from "@/app/store";
import { ThemeProvider } from "./ThemeProvider";

vi.mock("@/app/hooks/useApiErrorHandling", () => ({
  useApiErrorHandling: vi.fn(),
}));

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <Routes>
          <Route element={<App />}>
            <Route path="/login" element={<div>Login</div>} />
            <Route path="/landing" element={<div>Landing</div>} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe("theme route behavior", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({ theme: "light" });
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  it.each(["/login", "/landing"])("%s follows the system theme", async (path) => {
    renderApp(path);

    await waitFor(() => {
      expect(useAppStore.getState().theme).toBe("dark");
      expect(document.documentElement).toHaveClass("dark");
    });
  });

  it("keeps the saved dashboard theme even when the system is dark", async () => {
    renderApp("/dashboard");

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("light");
    });
    expect(useAppStore.getState().theme).toBe("light");
  });
});
