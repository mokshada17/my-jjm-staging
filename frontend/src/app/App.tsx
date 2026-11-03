import { Outlet } from "react-router-dom";
import { useApiErrorHandling } from "./hooks/useApiErrorHandling";
import { ScreenFit } from "@/features/screen-fit";

function App() {
  // Session expiry and failed-load notices for every screen.
  useApiErrorHandling();

  return (
    <main>
      {/* Every page fitted to the screen it is on, laptop to 8K wall. */}
      <ScreenFit />
      <Outlet />
    </main>
  );
}

export default App;
