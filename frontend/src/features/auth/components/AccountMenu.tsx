import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui";
import { authApi } from "../api/authApi";
import { useLogout } from "../hooks/useLogout";
import type { User } from "../types";

const ROLE_LABEL: Record<User["role"], string> = {
  admin: "Administrator",
  user: "User",
  viewer: "Viewer",
};

/** "Commissioner" -> "C", "Asha Patil" -> "AP". */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

const formatSignedIn = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : undefined;

/**
 * The header's account button: the signed-in user's initials, opening their
 * details and a Log out action. The trigger sits on the navy header bar in both
 * themes; the menu itself uses the theme's popover colours (white / navy).
 */
export function AccountMenu() {
  const navigate = useNavigate();
  const logout = useLogout();
  const [user] = useState<User | null>(() => authApi.getCurrentUser());

  const signedIn = formatSignedIn(user?.signedInAt);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={user ? `Account: ${user.name}` : "Account"}
        title={user ? user.name : "Account"}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-jjm-cyan"
      >
        {/* 32px, beside the 30px theme toggle in the 48px header */}
        <Avatar className="h-8 w-8 ring-1 ring-white/40">
          <AvatarFallback className="bg-jjm-blue-light text-white text-xs font-bold">
            {user ? initials(user.name) : "?"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        {user ? (
          <>
            <DropdownMenuLabel className="flex items-center gap-3 py-2 font-normal">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-jjm-blue-light text-white text-sm font-bold">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate" title={user.email}>
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <dl className="px-2 py-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-medium text-right">{ROLE_LABEL[user.role] ?? user.role}</dd>
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="font-medium text-right truncate">{user.id}</dd>
                {signedIn && (
                  <>
                    <dt className="text-muted-foreground">Signed in</dt>
                    <dd className="font-medium text-right">{signedIn}</dd>
                  </>
                )}
              </dl>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={logout}
              className="text-jjm-red focus:text-jjm-red focus:bg-jjm-red/10 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Not signed in
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/login")} className="cursor-pointer">
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
