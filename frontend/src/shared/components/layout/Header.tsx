import { ReactNode } from "react";

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="text-xl font-bold">JJM Dashboard</div>
        <nav className="flex items-center gap-4">
          {children}
        </nav>
      </div>
    </header>
  );
}