import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/components/ui";
import { useTheme } from "@/app/providers";
import { IMAGES } from "@/shared/assets/images";
import { LionCapitalIcon } from "@/shared/assets/icons";
import { AccountMenu } from "@/features/auth/components/AccountMenu";
import { WallModeButton } from "@/features/screen-fit";

export interface JjmHeaderProps {
  title?: string;
}

/**
 * Top bar (both themes): 48px, a left-to-right #01498A -> #1B2D54 gradient, the
 * gold emblem at 40px tall, a centred bold title and the Jal Jeevan Mission emblem
 * at 32px, then the wall-mode and theme switches and the account menu.
 */
export function JjmHeader({
  title = "JJM Enterprise Level Dashboard | Jal Jeevan Mission-Har Ghar Jal",
}: JjmHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <header className="relative h-12 shrink-0 bg-gradient-to-r from-jjm-header-from to-jjm-header-to flex items-center justify-between px-6 z-20">
      {/* The solid gold "sculpture" variant, cropped tight to the emblem so it fills
          the header height. */}
      <LionCapitalIcon variant="sculpture" height="2.5rem" title="Emblem of India" className="shrink-0" />

      {/* Centred on the bar from lg. On tablets the centred title ran into the icons
          on the right, so there it sits beside the emblem instead. */}
      <h1 className="ml-12 mr-auto whitespace-nowrap text-sm sm:text-base font-bold tracking-wide text-white lg:m-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* The tap-and-droplet Jal Jeevan Mission emblem follows the title. */}
        <img
          src={IMAGES.jalJeevanMissionEmblem}
          alt="Jal Jeevan Mission - Har Ghar Jal"
          className="block h-8 w-auto object-contain"
        />
        {/* Wall display: fullscreen and keep awake, for TVs and control-room walls */}
        <WallModeButton />

        {/* Single-icon theme control: the icon names the mode you are in, clicking
            it switches to the other one. Sun (light) -> dark, Moon (dark) -> light. */}
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
          title={`Switch to ${isLight ? "dark" : "light"} mode`}
          // A 30px circle with an 18px sun / moon, beside the 32px account avatar.
          className="h-[1.875rem] w-[1.875rem] p-0 rounded-full text-white hover:bg-white/10 hover:text-white transition [&_svg]:size-[1.125rem]"
        >
          {isLight ? <Sun className="text-amber-400" /> : <Moon className="text-jjm-cyan" />}
        </Button>

        {/* Signed-in user's details and Log out */}
        <AccountMenu />
      </div>
    </header>
  );
}
