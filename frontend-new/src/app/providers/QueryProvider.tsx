import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { createQueryClient } from "@/shared/api";

export function QueryProvider({ children }: { children: ReactNode }) {
  // Retry policy and defaults live with the HTTP client (shared/api/queryClient).
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}