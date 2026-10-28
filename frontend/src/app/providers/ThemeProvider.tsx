import React, { createContext, useContext, useEffect } from "react";
import { useAppStore } from "@/app/store";

interface ThemeContextType {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  // Follow the OS / browser light-dark preference (PR #8). jsdom has no
  // matchMedia, so the tests keep the stored theme instead of mocking it globally -
  // a global mock answers every media query "no", which flips useMediaQuery
  // layouts (overview tables, ESR charts) to their tablet form.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      setTheme(colorScheme.matches ? "dark" : "light");
    };

    syncTheme();
    colorScheme.addEventListener("change", syncTheme);

    return () => {
      colorScheme.removeEventListener("change", syncTheme);
    };
  }, [setTheme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}