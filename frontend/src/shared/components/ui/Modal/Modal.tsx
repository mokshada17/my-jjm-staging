import { ReactNode } from "react";
import { cn } from "@/shared/utils";

export interface ModalProps {
  children: ReactNode;
  className?: string;
  open?: boolean;
  onClose?: () => void;
}

export function Modal({ children, className, open = true, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50",
        className
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl",
          "shadow-lg shadow-black/10 p-6 w-full max-w-md",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}