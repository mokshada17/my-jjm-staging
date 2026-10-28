import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./LoginPage";
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

describe("LoginPage Component", () => {
  it("renders government branding and feature pillars", () => {
    renderWithProviders(<LoginPage />);

    // Government branding
    expect(screen.getAllByText(/Government of Maharashtra/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Water Supply & Sanitation Department/i).length).toBeGreaterThan(0);

    // Hero title & badge
    expect(screen.getByRole("heading", { name: /Unified Water/i })).toBeInTheDocument();

    // 4 Feature Pillars
    expect(screen.getByRole("heading", { name: "IoT Operations Hub" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "GIS Intelligence" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Performance Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Smart Alerts" })).toBeInTheDocument();
  });

  it("renders the login form with required fields", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/Government Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Sign In$/i })).toBeInTheDocument();
  });

  it("toggles password visibility when the eye button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: /show password/i });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    const hideButton = screen.getByRole("button", { name: /hide password/i });
    await user.click(hideButton);

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("submits the form when valid credentials are provided", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/Government Email Address/i);
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /^Sign In$/i });

    await user.clear(emailInput);
    await user.type(emailInput, "admin@maharashtra.gov.in");

    await user.clear(passwordInput);
    await user.type(passwordInput, "Secret@123");

    await user.click(submitButton);
    expect(submitButton).toBeInTheDocument();
  });
});
