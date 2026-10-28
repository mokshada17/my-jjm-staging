import { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { MqttProvider } from "./MqttProvider";
import { ToastProvider } from "@/shared/hooks/use-toast";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <MqttProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </MqttProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}