/**
 * Resolves the `?column=value` scope a screen should fetch with.
 *
 * The breadcrumb path the user drilled through already names every ancestor, so
 * a drill-down costs no extra lookup: the circle dashboard reached from Nagpur
 * knows it is `?region=Nagpur` before it fetches anything. A cold deep link has
 * no such path, so it falls back to the widest scope it can prove and narrows
 * the result client-side.
 *
 * Every scope names the chosen state, even that widest one: a request never
 * reaches past the state the officer is looking at.
 */
import { useMemo } from "react";
import { useAppStore } from "@/app/store";
import type { HierarchyTier } from "./types";
import { slug } from "./aggregation";
import { useAfRegions } from "./queries";
import { TIER_COLUMN, TIER_ORDER, type HierarchyScope } from "./scope";
import { useActiveState } from "./useActiveState";

/** Region spellings differ between the Figma ribbon and the AF tree. */
const REGION_ALIASES: Record<string, string> = {
  amaravati: "amravati",
  chatrapatisambhajinagar: "chhatrapatisambhajinagar",
};

export function canonicalRegion(name: string): string {
  const flat = name.toLowerCase().replace(/[^a-z]/g, "");
  return REGION_ALIASES[flat] ?? flat;
}

export const sameRegion = (a: string, b: string) => canonicalRegion(a) === canonicalRegion(b);

/**
 * Filters for every tier strictly above `tier`, taken from the breadcrumb path.
 *
 * The path is only trusted when it leads to this very node (`tier` + `id`): after
 * the browser's Back button or a pasted link it may still describe some other
 * branch, and scoping to that would fetch the wrong rows. An untrusted path gives
 * no ancestors, so the page fetches wider and narrows by slug instead.
 */
export function useAncestorScope(tier: HierarchyTier, id?: string): HierarchyScope {
  const nodePath = useAppStore((s) => s.nodePath);
  const { name: state } = useActiveState();

  return useMemo(() => {
    if (id !== undefined && !nodePath.some((n) => n.tier === tier && n.id === id)) return { state };
    const depth = TIER_ORDER.indexOf(tier);
    const scope: HierarchyScope = { state };
    for (const node of nodePath) {
      if (node.tier === "State") continue;
      if (TIER_ORDER.indexOf(node.tier) >= depth) break;
      if (node.name) scope[TIER_COLUMN[node.tier as keyof typeof TIER_COLUMN]] = node.name;
    }
    return scope;
  }, [nodePath, tier, id, state]);
}

/**
 * Translates a Figma region label ("Amaravati") into the name the AF tree uses
 * ("Amravati"), so it can go on the query string. Costs one root lookup plus one
 * children call, both cached for the session.
 */
export function useRegionScope(regionLabel?: string): {
  scope: HierarchyScope;
  isResolved: boolean;
} {
  const { name: state } = useActiveState();
  const regions = useAfRegions(Boolean(regionLabel));
  const match = regionLabel
    ? regions.data?.find((r) => sameRegion(r.name, regionLabel))
    : undefined;

  return {
    scope: match ? { state, region: match.name } : { state },
    isResolved: !regionLabel || Boolean(match),
  };
}

export interface TierScope {
  /** What actually goes on the query string. */
  scope: HierarchyScope;
  /** False while the scope is still being resolved — hold the fetch until then. */
  isReady: boolean;
  /** The resolved name of the unit in the route, when known. */
  name?: string;
}

/**
 * The scope for a `/dashboard/:tier/:id` page. Includes the target tier itself
 * whenever its name is known — from the breadcrumb on a drill-down, or from the
 * AF region list for a cold link to a region — which narrows the request by one
 * more level. Otherwise the ancestors alone scope the fetch and the caller
 * matches `:id` against the returned rows.
 */
export function useTierScope(tier: HierarchyTier, id?: string): TierScope {
  const ancestors = useAncestorScope(tier, id);
  const nodePath = useAppStore((s) => s.nodePath);
  const { name: state } = useActiveState();

  const remembered = useMemo(
    () => nodePath.find((n) => n.tier === tier && n.id === id)?.name,
    [nodePath, tier, id]
  );

  // A cold link straight to a region can still be resolved from the AF tree.
  const needsRegionLookup = tier === "Region" && Boolean(id) && !remembered;
  const regions = useAfRegions(needsRegionLookup);
  const fromAf = needsRegionLookup
    ? regions.data?.find((r) => slug(r.name) === slug(id!))?.name
    : undefined;

  const name = remembered ?? fromAf;

  return useMemo(() => {
    if (tier === "State") return { scope: { state }, isReady: true, name: state };

    const column = TIER_COLUMN[tier as keyof typeof TIER_COLUMN];
    return {
      scope: name ? { ...ancestors, [column]: name } : ancestors,
      // Only the region lookup can still be in flight; everything else is
      // either remembered or resolved client-side from the ancestor scope.
      isReady: !needsRegionLookup || !regions.isLoading,
      name,
    };
  }, [tier, ancestors, name, needsRegionLookup, regions.isLoading, state]);
}
