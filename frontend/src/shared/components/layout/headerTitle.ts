import type { HierarchyTier } from "@/entities/hierarchy";

const SUFFIX = "Jal Jeevan Mission-Har Ghar Jal";

const TIER_LABELS: Record<HierarchyTier, string> = {
  State: "State",
  Region: "Region",
  Circle: "Circle",
  Division: "Division",
  SubDivision: "Sub Division",
  Block: "Block",
  Scheme: "Scheme",
  Village: "Village",
  ESR: "ESR",
};

/**
 * The header heading, derived from the route rather than the Figma frames (whose
 * header text is wrong everywhere):
 *  - `/dashboard` (the landing page, and the state crumb) -> Enterprise Level.
 *  - `/dashboard/:tier/overview` is only reachable from the breadcrumb ribbon, so
 *    it is the one place the "Overview" heading appears.
 *  - `/dashboard/esr/:id/sensor-fusion` is the ESR's three-trend display, which
 *    PI Vision titles "JJM Sensor Fusion Dashboard".
 *  - Every other tier page was reached by drilling into a row, so it names the
 *    level only, never the selected node: "JJM Region Level Dashboard".
 */
export function headerTitle(pathname: string, tier: HierarchyTier): string {
  const path = pathname.replace(/\/+$/, "");
  const tierLabel = TIER_LABELS[tier];

  if (tier === "State" || path === "/dashboard") {
    return `JJM Enterprise Level Dashboard | ${SUFFIX}`;
  }
  if (path.endsWith("/sensor-fusion")) {
    return `JJM Sensor Fusion Dashboard | ${SUFFIX}`;
  }
  if (path.endsWith("/overview")) {
    return `JJM ${tierLabel} Overview Dashboard | ${SUFFIX}`;
  }
  return `JJM ${tierLabel} Level Dashboard | ${SUFFIX}`;
}
