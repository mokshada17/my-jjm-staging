import { Maximize, Minimize } from "lucide-react";
import { Button } from "@/shared/components/ui";
import { useAppStore } from "@/app/store";

/**
 * The header's wall-display switch (no Figma frame: it follows the theme toggle
 * beside it). Pages fit the screen on their own (ScreenFit); this adds what an
 * unattended wall needs - fullscreen, which a browser only allows from a click,
 * the screen kept awake, and long pages scrolling themselves.
 */
export function WallModeButton() {
  const wallMode = useAppStore((s) => s.wallMode);
  const setWallMode = useAppStore((s) => s.setWallMode);
  const label = wallMode ? "Exit wall display" : "Wall display: fullscreen, keep screen awake";

  const toggle = () => {
    if (wallMode) {
      setWallMode(false);
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    } else {
      setWallMode(true);
      void document.documentElement.requestFullscreen?.().catch(() => {});
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={wallMode}
      title={label}
      // The theme toggle's 30px circle and 18px icon.
      className="h-[1.875rem] w-[1.875rem] p-0 rounded-full text-white hover:bg-white/10 hover:text-white transition [&_svg]:size-[1.125rem]"
    >
      {wallMode ? <Minimize /> : <Maximize />}
    </Button>
  );
}
