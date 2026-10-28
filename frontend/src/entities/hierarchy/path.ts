/**
 * The breadcrumb path to one node of the hierarchy, built from an ingestion row.
 *
 * Every §5 row carries its full hierarchy (§2.4), so the row a user clicks already
 * names every ancestor of the child it opens. Recording that path before
 * navigating lets the child page scope its fetch to exactly its branch
 * (`?region=Nagpur&circle=Nagpur&division=…`) - whichever screen the click came
 * from, and without trusting a breadcrumb left over from an earlier drill-down.
 */
import type { EsrRecord } from "./aggregation";
import { slug } from "./aggregation";
import { TIER_ORDER } from "./scope";
import { stateInfo } from "./states";
import type { HierarchyTier } from "./types";

type DrillTier = Exclude<HierarchyTier, "State">;

/** The row field holding each tier's name. */
const TIER_FIELD: Record<HierarchyTier, keyof EsrRecord> = {
  State: "state",
  Region: "region",
  Circle: "circle",
  Division: "division",
  SubDivision: "subDivision",
  Block: "block",
  Scheme: "schemeId",
  Village: "villageName",
  ESR: "esrName",
};

/** The `/dashboard/:tier/:id` segment for each tier. */
const ROUTE_SEGMENT: Record<DrillTier, string> = {
  Region: "region",
  Circle: "circle",
  Division: "division",
  SubDivision: "subdivision",
  Block: "block",
  Scheme: "scheme",
  Village: "village",
  ESR: "esr",
};

/** Same shape as the store's HierarchyNode. */
export interface PathNode {
  tier: HierarchyTier;
  id: string;
  label: string;
  /** The §5.1 column value the fetch filters on, e.g. "Ramtek" for Block-Ramtek. */
  name?: string;
}

export type HierarchyRow = Pick<EsrRecord, (typeof TIER_FIELD)[HierarchyTier]>;

/**
 * The row's state down to `tier`, each node named from `row` (which needs those
 * tiers only). A row without a state is taken to be in the default one.
 */
export function pathTo(row: Partial<HierarchyRow>, tier: DrillTier): PathNode[] {
  const state = stateInfo(row.state);
  const path: PathNode[] = [{ tier: "State", id: state.id, label: state.name, name: state.name }];
  for (const t of TIER_ORDER.slice(1, TIER_ORDER.indexOf(tier) + 1) as DrillTier[]) {
    const name = String(row[TIER_FIELD[t]] ?? "");
    path.push({ tier: t, id: slug(name), label: name, name });
  }
  return path;
}

/** The dashboard route for the last node of a path. */
export function routeFor(path: PathNode[]): string {
  const last = path[path.length - 1];
  if (last.tier === "State") return "/dashboard";
  return `/dashboard/${ROUTE_SEGMENT[last.tier]}/${last.id}`;
}
