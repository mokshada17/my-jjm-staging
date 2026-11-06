import { ReactNode } from "react";

interface SidebarProps {
  children?: ReactNode;
  isOpen?: boolean;
}

export function Sidebar({ children, isOpen = true }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-64 border-r bg-background min-h-screen p-4">
      <nav className="space-y-2">
        {children}
        <a href="/" className="block px-3 py-2 rounded hover:bg-accent">Dashboard</a>
        <a href="/users" className="block px-3 py-2 rounded hover:bg-accent">Users</a>
        <a href="/settings" className="block px-3 py-2 rounded hover:bg-accent">Settings</a>
      </nav>
    </aside>
  );
}