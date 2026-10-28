import { useQuery } from "@tanstack/react-query";
import { telemetryApi } from "../telemetry/api";
import { piClient } from "../../shared/api/piClient";
import { buildNetwork, type JjmNetwork } from "./aggregation";
import { scopeKey, type HierarchyScope } from "./scope";
import { afStateRoot } from "./states";
import { useActiveState } from "./useActiveState";

export const hierarchyKeys = {
  all: ["hierarchy"] as const,
  network: (scope: HierarchyScope) =>
    [...hierarchyKeys.all, "network", scopeKey(scope)] as const,
  afRoot: (state: string) => [...hierarchyKeys.all, "af-root", state] as const,
  afChildren: (webId?: string) => [...hierarchyKeys.all, "af-children", webId] as const,
  afInventory: (state: string) => [...hierarchyKeys.all, "af-inventory", state] as const,
  assetDetails: (scope: HierarchyScope) =>
    [...hierarchyKeys.all, "asset-details", scopeKey(scope)] as const,
};

/**
 * Loads one branch of the network. The scope becomes `?region=...&circle=...` on
 * each request, so a block dashboard transfers a handful of rows instead of the
 * whole estate, and React Query keeps a separate cache entry per branch.
 *
 * `enabled` keeps the request from firing until the caller knows which branch it
 * wants, so a page never fetches before its scope is resolved.
 */
export function useScopedNetwork(scope: HierarchyScope, enabled = true) {
  return useQuery<JjmNetwork>({
    queryKey: hierarchyKeys.network(scope),
    // One signal for all five tables: if any fails or the query is dropped, the
    // rest are cancelled rather than left to finish unused.
    queryFn: async ({ signal }) => {
      const [water, chlorine, pressure, comm, demographics] = await Promise.all([
        telemetryApi.waterConsumption(scope, { signal }),
        telemetryApi.chlorine(scope, { signal }),
        telemetryApi.pressure(scope, { signal }),
        telemetryApi.communicationStatus(scope, { signal }),
        telemetryApi.demographics(scope, { signal }),
      ]);
      return buildNetwork({ water, chlorine, pressure, comm, demographics });
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/** Asset-register row for one reservoir; only the ESR dashboard needs it. */
export function useAssetDetails(scope: HierarchyScope, enabled = true) {
  return useQuery({
    queryKey: hierarchyKeys.assetDetails(scope),
    queryFn: ({ signal }) => telemetryApi.assetDetails(scope, { signal }),
    select: (rows) => rows[0],
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// AF tree — walked a level at a time, the way §4 endpoints 1-2 intend
// ---------------------------------------------------------------------------

/** Resolves the chosen state's root (§4 endpoint 1). One request per state, cached for the session. */
export function useAfRoot(enabled = true) {
  const { name: state } = useActiveState();
  return useQuery({
    queryKey: hierarchyKeys.afRoot(state),
    queryFn: ({ signal }) => piClient.fetchRootElement(afStateRoot(state), { signal }),
    enabled,
    staleTime: Infinity,
  });
}

export interface AfNode {
  name: string;
  webId: string;
  hasChildren: boolean;
  templateName: string | null;
}

/**
 * Direct children of one element (§4 endpoint 2). Fires only once `parentWebId`
 * is known, so expanding a map region or a breadcrumb costs one request for that
 * level rather than a crawl of everything beneath it.
 */
export function useAfChildren(parentWebId?: string, enabled = true) {
  return useQuery<AfNode[]>({
    queryKey: hierarchyKeys.afChildren(parentWebId),
    queryFn: async ({ signal }) => {
      const { Items } = await piClient.fetchChildElements(parentWebId!, { signal });
      return Items.map((el) => ({
        name: el.Name,
        webId: el.WebId,
        hasChildren: el.HasChildren,
        templateName: el.TemplateName,
      }));
    },
    enabled: enabled && Boolean(parentWebId),
    staleTime: 30 * 60 * 1000,
  });
}

export interface AfRegion {
  /** Region name with the §2.1 "Region-" prefix stripped. */
  name: string;
  webId: string;
  hasChildren: boolean;
}

/** The Tier 2 elements: a root lookup plus one children call. */
export function useAfRegions(enabled = true) {
  const root = useAfRoot(enabled);
  const children = useAfChildren(root.data?.WebId, enabled);

  return {
    data: children.data
      ?.filter((el) => el.name.startsWith("Region-"))
      .map<AfRegion>((el) => ({
        name: el.name.replace(/^Region-/, ""),
        webId: el.webId,
        hasChildren: el.hasChildren,
      })),
    isLoading: root.isLoading || children.isLoading,
    isError: root.isError || children.isError,
    error: root.error ?? children.error,
  };
}

export interface AfInventory {
  regions: number;
  circles: number;
  divisions: number;
  subDivisions: number;
  blocks: number;
  schemes: number;
  villages: number;
  reservoirs: number;
}

/** §3: an element is a reservoir when it carries one of the active templates. */
const RESERVOIR_TEMPLATES = [
  "MJP Reservoir Level - Active",
  "MJP Reservoir MBR FL & CL - Level - Active",
  "MJP Reservoir MBR - Level - Active",
];

/**
 * Whole-estate element counts for the Enterprise "IOT Project Overview" tile.
 * Uses PI's `searchFullHierarchy`, so this is one request rather than one per
 * node, and it runs only on the page that renders that tile.
 */
export function useAfInventory(enabled = true) {
  const { name: state } = useActiveState();
  const root = useAfRoot(enabled);

  return useQuery<AfInventory>({
    queryKey: hierarchyKeys.afInventory(state),
    queryFn: async ({ signal }) => {
      const { Items } = await piClient.fetchDescendants(root.data!.WebId, undefined, { signal });
      const counts: AfInventory = {
        regions: 0,
        circles: 0,
        divisions: 0,
        subDivisions: 0,
        blocks: 0,
        schemes: 0,
        villages: 0,
        reservoirs: 0,
      };
      for (const el of Items) {
        if (el.TemplateName && RESERVOIR_TEMPLATES.includes(el.TemplateName)) counts.reservoirs += 1;
        else if (el.Name.startsWith("Region-")) counts.regions += 1;
        else if (el.Name.startsWith("Circle-")) counts.circles += 1;
        else if (el.Name.startsWith("Sub Division-")) counts.subDivisions += 1;
        else if (el.Name.startsWith("Division-")) counts.divisions += 1;
        else if (el.Name.startsWith("Block-")) counts.blocks += 1;
        else if (el.Name.startsWith("Scheme-")) counts.schemes += 1;
        else counts.villages += 1;
      }
      return counts;
    },
    enabled: enabled && Boolean(root.data?.WebId),
    staleTime: 30 * 60 * 1000,
  });
}
