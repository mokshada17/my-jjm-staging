import { useEffect, useState } from "react";
import { UI_SCALE_EVENT, readUiScale } from "@/shared/lib/uiScale";

/**
 * The large-screen scale factor - 1 up to 1920px, ~1.33 at 2560, 2 at 3840 - for
 * code that draws in px rather than rem: ECharts options and the SVG trends.
 * Multiply design-pixel sizes by it. Updates when the window resizes, and when
 * the page is re-fitted to the screen.
 */
export function useUiScale(): number {
  const [scale, setScale] = useState(readUiScale);

  useEffect(() => {
    const update = () => setScale(readUiScale());
    update();
    window.addEventListener("resize", update);
    window.addEventListener(UI_SCALE_EVENT, update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener(UI_SCALE_EVENT, update);
    };
  }, []);

  return scale;
}
