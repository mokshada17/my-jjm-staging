import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useApiErrorHandling } from "./hooks/useApiErrorHandling";
import { useTheme } from "./providers";
import { ScreenFit } from "@/features/screen-fit";

function App() {
  // Session expiry and failed-load notices for every screen.
  useApiErrorHandling();
  const { pathname } = useLocation();
  const setTheme = useTheme().setTheme;

  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/landing") return;
    if (typeof window.matchMedia !== "function") return;

    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => setTheme(colorScheme.matches ? "dark" : "light");

    syncTheme();
    colorScheme.addEventListener("change", syncTheme);
    return () => colorScheme.removeEventListener("change", syncTheme);
  }, [pathname, setTheme]);

  return (
    <main>
      {/* Every page fitted to the screen it is on, laptop to 8K wall. */}
      <ScreenFit />
      <Outlet />
    </main>
  );
}

export default App;
