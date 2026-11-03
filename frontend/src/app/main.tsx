import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./providers/AppProviders";
import { Toaster } from "@/shared/components/ui/toaster";
import { router } from "./routes";
// Inter, self-hosted: bundled with the app rather than fetched from Google Fonts,
// so it also loads on restricted networks. globals.css and tailwind.config.js
// name it as "Inter Variable".
import "@fontsource-variable/inter";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster />
    </AppProviders>
  </React.StrictMode>
);