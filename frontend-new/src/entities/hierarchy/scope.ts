/**
 * A hierarchy scope is the set of `?column=value` filters that narrow the §5
 * ingestion tables to one branch of the tree.
 *
 * Every screen fetches only its own branch: the Nagpur circle dashboard asks for
 * `?state=Maharashtra&region=Nagpur&circle=Nagpur`, not for every state. The ancestors come
 * from the breadcrumb path the user drilled through, so navigating deeper always
 * narrows the request rather than widening it.
 */
import type { HierarchyTier } from "./types";

export interface HierarchyScope {
  /** The chosen state; every scope carries it (see useActiveState). */
  state?: string;
  region?: string;
  circle?: string;
  division?: string;
  sub_division?: string;
  block?: string;
  scheme_id?: string;
  village_name?: string;
  esr_name?: string;
}

/** The §5.1 column each tier filters on, per the §2.4 path-parsing table. */
export const TIER_COLUMN: Record<HierarchyTier, keyof HierarchyScope> = {
  State: "state",
  Region: "region",
  Circle: "circle",
  Division: "division",
  SubDivision: "sub_division",
  Block: "block",
  Scheme: "scheme_id",
  Village: "village_name",
  ESR: "esr_name",
};

export const TIER_ORDER: HierarchyTier[] = [
  "State",
  "Region",
  "Circle",
  "Division",
  "SubDivision",
  "Block",
  "Scheme",
  "Village",
  "ESR",
];

/** Tiers strictly above `tier`, shallowest first. */
export function ancestorTiers(tier: HierarchyTier): HierarchyTier[] {
  return TIER_ORDER.slice(1, TIER_ORDER.indexOf(tier));
}

/** Drops empty entries so the query key and the URL stay stable. */
export function scopeParams(scope: HierarchyScope = {}): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(scope)) {
    if (value !== undefined && value !== null && value !== "") params[key] = value;
  }
  return params;
}

/** Stable cache key — React Query caches one entry per branch. */
export function scopeKey(scope: HierarchyScope = {}): string {
  const params = scopeParams(scope);
  return (
    Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&") || "all"
  );
}

/** True when `scope` names no branch below the state, i.e. it covers the whole state. */
export const isRootScope = (scope: HierarchyScope = {}) =>
  Object.keys(scopeParams(scope)).every((key) => key === "state");
