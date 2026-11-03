import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "./msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Testing setup verification", () => {
  it("renders test component", () => {
    render(<div data-testid="test">Hello World</div>, { wrapper: createWrapper() });
    expect(screen.getByTestId("test")).toHaveTextContent("Hello World");
  });

  it("user-event works", async () => {
    const user = userEvent.setup();
    render(
      <button data-testid="btn">Click me</button>,
      { wrapper: createWrapper() }
    );
    await user.click(screen.getByTestId("btn"));
    expect(screen.getByTestId("btn")).toBeInTheDocument();
  });

  it("MSW intercepts requests", async () => {
    server.use(
      http.get("/api/test", () => {
        return HttpResponse.json({ message: "MSW works!" });
      })
    );

    const response = await fetch("/api/test");
    const data = await response.json();
    expect(data.message).toBe("MSW works!");
  });
});