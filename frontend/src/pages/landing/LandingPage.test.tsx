import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LandingPage } from "./LandingPage";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{ui}</ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe("LandingPage Component", () => {
  it("renders welcome title and commissioner details", () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByText(/Welcome,/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Commissioner/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Government of Maharashtra/i)).toBeInTheDocument();
  });

  it("renders all 3 portal launch cards", () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByText("IoT Monitoring Portal")).toBeInTheDocument();
    expect(screen.getByText("GIS Intelligence Portal")).toBeInTheDocument();
    expect(screen.getByText("MIS Analytics Portal")).toBeInTheDocument();

    const launchButtons = screen.getAllByRole("button", { name: /Launch Portal/i });
    expect(launchButtons.length).toBe(3);
  });

  it("renders statewide infrastructure overview statistics", () => {
    renderWithProviders(<LandingPage />);

    expect(screen.getByText("Connected Sensors")).toBeInTheDocument();
    expect(screen.getByText("389,042")).toBeInTheDocument();
    expect(screen.getByText("Active Telemetry")).toBeInTheDocument();
    expect(screen.getByText("8,102")).toBeInTheDocument();
    expect(screen.getByText("Water Schemes")).toBeInTheDocument();
    expect(screen.getByText("12,458")).toBeInTheDocument();
  });

  it("allows clicking launch portal button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LandingPage />);

    const firstLaunchBtn = screen.getAllByRole("button", { name: /Launch Portal/i })[0];
    await user.click(firstLaunchBtn);
    expect(firstLaunchBtn).toBeInTheDocument();
  });
});
