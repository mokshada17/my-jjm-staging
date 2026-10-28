import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { LandingPage } from "@/pages/landing/LandingPage";
import { EnterpriseDashboardPage } from "@/pages/enterprise-dashboard/EnterpriseDashboardPage";
import { RegionDashboardPage } from "@/pages/region-dashboard/RegionDashboardPage";
import { CircleDashboardPage } from "@/pages/region-dashboard/CircleDashboardPage";
import { DivisionDashboardPage } from "@/pages/region-dashboard/DivisionDashboardPage";
import { SubDivisionDashboardPage } from "@/pages/region-dashboard/SubDivisionDashboardPage";
import { BlockDashboardPage } from "@/pages/region-dashboard/BlockDashboardPage";
import { SchemeDashboardPage } from "@/pages/scada-detail-dashboard/SchemeDashboardPage";
import { VillageDashboardPage } from "@/pages/scada-detail-dashboard/VillageDashboardPage";
import { EsrScadaDashboardPage } from "@/pages/scada-detail-dashboard/EsrScadaDashboardPage";
import { SensorFusionDashboardPage } from "@/pages/scada-detail-dashboard/SensorFusionDashboardPage";

// 8 Overview Pages matching Figma frames exactly
import {
  RegionOverviewPage,
  CircleOverviewPage,
  DivisionOverviewPage,
  SubDivOverviewPage,
  BlockOverviewPage,
  SchemeOverviewPage,
  VillageOverviewPage,
  EsrOverviewPage,
} from "@/pages/overview";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "landing", element: <LandingPage /> },
      { path: "dashboard", element: <EnterpriseDashboardPage /> },
      
      // Overview Pages accessed via Breadcrumb navigation
      { path: "dashboard/region/overview", element: <RegionOverviewPage /> },
      { path: "dashboard/circle/overview", element: <CircleOverviewPage /> },
      { path: "dashboard/division/overview", element: <DivisionOverviewPage /> },
      { path: "dashboard/subdivision/overview", element: <SubDivOverviewPage /> },
      { path: "dashboard/block/overview", element: <BlockOverviewPage /> },
      { path: "dashboard/scheme/overview", element: <SchemeOverviewPage /> },
      { path: "dashboard/village/overview", element: <VillageOverviewPage /> },
      { path: "dashboard/esr/overview", element: <EsrOverviewPage /> },

      // Detailed Tier Dashboards
      { path: "dashboard/region/:id", element: <RegionDashboardPage /> },
      { path: "dashboard/circle/:id", element: <CircleDashboardPage /> },
      { path: "dashboard/division/:id", element: <DivisionDashboardPage /> },
      { path: "dashboard/subdivision/:id", element: <SubDivisionDashboardPage /> },
      { path: "dashboard/block/:id", element: <BlockDashboardPage /> },
      { path: "dashboard/scheme/:id", element: <SchemeDashboardPage /> },
      { path: "dashboard/village/:id", element: <VillageDashboardPage /> },
      { path: "dashboard/esr/:id", element: <EsrScadaDashboardPage /> },
      // PI Vision's three-sensor trend display, linked from the ESR dashboard.
      { path: "dashboard/esr/:id/sensor-fusion", element: <SensorFusionDashboardPage /> },
      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },
]);