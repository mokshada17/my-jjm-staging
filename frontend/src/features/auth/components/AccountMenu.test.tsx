import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAppStore } from "@/app/store";
import { AccountMenu } from "./AccountMenu";

/**
 * Radix's menu is swapped for plain elements here. Opening and closing a Radix
 * menu takes 15-20s under jsdom (0.1s in Chrome, checked over the DevTools
 * protocol), and a menu left open slows every later test. These tests cover what
 * AccountMenu itself decides - what it shows and what its items do - with the
 * menu content always rendered and each item a button calling its onSelect.
 */
vi.mock("@/shared/components/ui", async (importOriginal) => {
  const ui = await importOriginal<typeof import("@/shared/components/ui")>();
  const Pass = ({ children }: { children?: ReactNode }) => <>{children}</>;
  return {
    ...ui,
    DropdownMenu: Pass,
    DropdownMenuGroup: Pass,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuTrigger: ({ children, ...props }: { children?: ReactNode }) => (
      <button type="button" {...props}>{children}</button>
    ),
    DropdownMenuContent: ({ children }: { children?: ReactNode }) => <div role="menu">{children}</div>,
    DropdownMenuLabel: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onSelect }: { children?: ReactNode; onSelect?: () => void }) => (
      <button type="button" role="menuitem" onClick={() => onSelect?.()}>{children}</button>
    ),
  };
});

afterEach(() => localStorage.clear());

const session = {
  id: "usr-comm-01",
  name: "Commissioner",
  email: "commissioner@maharashtra.gov.in",
  role: "admin",
  signedInAt: "2026-09-28T09:30:00.000Z",
};

function renderMenu(queryClient = new QueryClient()) {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/dashboard" element={<AccountMenu />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

/** Lets the async logout (and the navigation after it) finish. */
const settle = () => act(async () => {});

describe("AccountMenu", () => {
  it("shows the signed-in user's initials and details", () => {
    localStorage.setItem("jjm_user", JSON.stringify(session));
    renderMenu();

    expect(screen.getByRole("button", { name: "Account: Commissioner" })).toHaveTextContent("C");
    expect(screen.getByText("commissioner@maharashtra.gov.in")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByText("usr-comm-01")).toBeInTheDocument();
    expect(screen.getByText("Signed in")).toBeInTheDocument();
  });

  it("logs out: clears the session, cached data and path, then opens login", async () => {
    localStorage.setItem("jjm_user", JSON.stringify(session));
    localStorage.setItem("jjm_token", "token");
    const queryClient = new QueryClient();
    queryClient.setQueryData(["network", "all"], { esrs: [] });
    useAppStore.setState({
      nodePath: [{ tier: "Region", id: "nagpur", label: "Nagpur", name: "Nagpur" }],
    });
    renderMenu(queryClient);

    fireEvent.click(screen.getByRole("menuitem", { name: /Log out/ }));
    await settle();

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(localStorage.getItem("jjm_user")).toBeNull();
    expect(localStorage.getItem("jjm_token")).toBeNull();
    expect(queryClient.getQueryData(["network", "all"])).toBeUndefined();
    expect(useAppStore.getState().nodePath).toEqual([]);
  });

  it("offers Sign in when nobody is signed in", async () => {
    renderMenu();

    expect(screen.getByRole("button", { name: "Account" })).toHaveTextContent("?");
    expect(screen.getByText("Not signed in")).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Log out/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: /Sign in/ }));
    await settle();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });
});
