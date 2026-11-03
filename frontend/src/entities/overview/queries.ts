/**
 * Turns the PI-derived network (see entities/hierarchy/aggregation) into the row
 * shapes the eight Overview tables render. Replaces the former static fixtures.
 */
import { useMemo, useRef } from "react";
import { useAfRegions, useScopedNetwork } from "../hierarchy/queries";
import type { HierarchyScope } from "../hierarchy/scope";
import type { HierarchyTier } from "../hierarchy/types";
import { useActiveState } from "../hierarchy/useActiveState";
import {
  canonicalRegion,
  sameRegion,
  useRegionScope,
  useTierScope,
} from "../hierarchy/useHierarchyScope";
import {
  blockKey,
  circleKey,
  divisionKey,
  formatLakhLitres,
  formatMgL,
  formatMetres,
  formatPopulation,
  groupBy,
  regionKey,
  rollup,
  schemeBands,
  schemeKey,
  slug,
  subDivisionKey,
  villageBands,
  villageKey,
  type EsrRecord,
  type KpiBands,
  type VillageRecord,
  type TierRollup,
} from "../hierarchy/aggregation";
import { pathTo, type PathNode } from "../hierarchy/path";
import type {
  BlockOverviewRow,
  CircleOverviewRow,
  DivisionOverviewRow,
  EsrOverviewRow,
  SchemeOverviewRow,
  SubDivOverviewRow,
  VillageOverviewRow,
} from "./types";

// ---------------------------------------------------------------------------
// Shared plumbing
// ---------------------------------------------------------------------------

export { canonicalRegion, sameRegion };

export interface OverviewQueryResult<T> {
  rows: T[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

/** The columns every Overview table shares, straight off a tier rollup. */
function commonCells(r: TierRollup) {
  return {
    population: formatPopulation(r.population),
    waterConsumption: formatLakhLitres(r.waterLitres),
    villageKpis: r.kpis,
    commStatus: r.commStatus,
  };
}

/**
 * Every Overview table is filtered by the region ribbon, so the request carries
 * `?region=<name>` and the server returns just that branch. Switching region
 * issues a new request under its own cache key rather than re-filtering a
 * state-wide payload.
 */
function useTierRows<T>(
  region: string | undefined,
  key: (r: EsrRecord) => string,
  toRow: (group: { key: string; rows: EsrRecord[] }, roll: TierRollup) => T
): OverviewQueryResult<T> {
  const { scope, isResolved } = useRegionScope(region);
  const { data, isLoading, isError, error } = useScopedNetwork(scope, isResolved);

  const rows = useMemo(() => {
    if (!data) return [];
    return groupBy(data.esrs, key).map((group) =>
      toRow(group, rollup(group.rows, data.villages))
    );
    // `key` and `toRow` are module-level or stable callbacks per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return { rows, isLoading: isLoading || !isResolved, isError, error };
}

// ---------------------------------------------------------------------------
// Tier selectors
// ---------------------------------------------------------------------------

export function useCircleOverviewRows(region?: string): OverviewQueryResult<CircleOverviewRow> {
  return useTierRows<CircleOverviewRow>(region, circleKey, ({ key, rows }, roll) => {
    const head = rows[0];
    return {
      id: `circle-${slug(key)}`,
      region: head.region,
      circle: head.circle,
      circleRoute: `/dashboard/circle/${slug(head.circle)}`,
      path: pathTo(head, "Circle"),
      noOfDivision: roll.counts.divisions,
      noOfScheme: roll.counts.schemes,
      noOfVillage: roll.counts.villages,
      noOfReservoir: roll.counts.reservoirs,
      ...commonCells(roll),
    };
  });
}

export function useDivisionOverviewRows(region?: string): OverviewQueryResult<DivisionOverviewRow> {
  return useTierRows<DivisionOverviewRow>(region, divisionKey, ({ key, rows }, roll) => {
    const head = rows[0];
    return {
      id: `division-${slug(key)}`,
      circle: head.circle,
      division: head.division,
      divisionRoute: `/dashboard/division/${slug(head.division)}`,
      path: pathTo(head, "Division"),
      noOfSubDivision: roll.counts.subDivisions,
      noOfScheme: roll.counts.schemes,
      noOfVillage: roll.counts.villages,
      noOfReservoir: roll.counts.reservoirs,
      ...commonCells(roll),
    };
  });
}

export function useSubDivOverviewRows(region?: string): OverviewQueryResult<SubDivOverviewRow> {
  return useTierRows<SubDivOverviewRow>(region, subDivisionKey, ({ key, rows }, roll) => {
    const head = rows[0];
    return {
      id: `subdiv-${slug(key)}`,
      division: head.division,
      subDivision: head.subDivision,
      subDivisionRoute: `/dashboard/subdivision/${slug(head.subDivision)}`,
      path: pathTo(head, "SubDivision"),
      noOfBlock: roll.counts.blocks,
      noOfScheme: roll.counts.schemes,
      noOfVillage: roll.counts.villages,
      noOfReservoir: roll.counts.reservoirs,
      ...commonCells(roll),
    };
  });
}

export function useBlockOverviewRows(region?: string): OverviewQueryResult<BlockOverviewRow> {
  return useTierRows<BlockOverviewRow>(region, blockKey, ({ key, rows }, roll) => {
    const head = rows[0];
    return {
      id: `block-${slug(key)}`,
      subDivision: head.subDivision,
      block: head.block,
      blockRoute: `/dashboard/block/${slug(head.block)}`,
      path: pathTo(head, "Block"),
      noOfScheme: roll.counts.schemes,
      noOfVillage: roll.counts.villages,
      noOfReservoir: roll.counts.reservoirs,
      ...commonCells(roll),
    };
  });
}

export function useSchemeOverviewRows(region?: string): OverviewQueryResult<SchemeOverviewRow> {
  return useTierRows<SchemeOverviewRow>(region, schemeKey, ({ rows }, roll) => {
    const head = rows[0];
    return {
      id: `scheme-${slug(head.schemeId)}`,
      blockName: head.block,
      schemeId: head.schemeId,
      schemeName: head.schemeName,
      schemeRoute: `/dashboard/scheme/${slug(head.schemeId)}`,
      path: pathTo(head, "Scheme"),
      household: formatPopulation(roll.households),
      noOfVillage: roll.counts.villages,
      noOfReservoir: roll.counts.reservoirs,
      ...commonCells(roll),
    };
  });
}

export function useVillageOverviewRows(region?: string): OverviewQueryResult<VillageOverviewRow> {
  return useTierRows<VillageOverviewRow>(region, villageKey, ({ key, rows }, roll) => {
    const head = rows[0];
    return {
      id: `village-${slug(key)}`,
      schemeNameBadge: head.schemeName.split(/\s+/)[0],
      schemeFullName: head.schemeName,
      villageName: head.villageName,
      villageRoute: `/dashboard/village/${slug(head.villageName)}`,
      path: pathTo(head, "Village"),
      household: formatPopulation(roll.households),
      noOfReservoir: roll.counts.reservoirs,
      esr: roll.counts.esr,
      mbr: roll.counts.mbr,
      gsr: roll.counts.gsr,
      ...commonCells(roll),
    };
  });
}

export function useEsrOverviewRows(region?: string): OverviewQueryResult<EsrOverviewRow> {
  const { scope, isResolved } = useRegionScope(region);
  const { data, isLoading, isError, error } = useScopedNetwork(scope, isResolved);

  const rows = useMemo<EsrOverviewRow[]>(() => {
    if (!data) return [];
    return data.esrs.map((r) => {
      const [first, ...rest] = r.schemeName.split(/\s+/);
      return {
        id: `esr-${slug(r.key)}`,
        schemeId: r.schemeId,
        schemeName: first,
        schemeSubtext: rest.join(" "),
        villageName: r.villageName,
        esrName: r.esrName,
        esrRoute: `/dashboard/esr/${slug(r.esrName)}`,
        path: pathTo(r, "ESR"),
        chlorine: formatMgL(r.chlorine.latest),
        pressure: formatMetres(r.pressure.latest),
        waterConsumption: formatLakhLitres(r.water.latest),
        commStatus: rollup([r], data.villages).commStatus,
      };
    });
  }, [data]);

  return { rows, isLoading: isLoading || !isResolved, isError, error };
}

// ---------------------------------------------------------------------------
// Region overview cards (Figma 2:3135 / 2:688)
// ---------------------------------------------------------------------------

export interface RegionOverviewCard {
  /** The state -> this region, for opening it with its branch scoped. */
  path: PathNode[];
  key: string;
  /** Region name as the PI AF tree spells it. */
  name: string;
  route: string;
  /** False when PI knows the region but no reservoir under it has ingested data. */
  hasData: boolean;
  totalSchemes: number;
  totalVillages: number;
  schemeKpis: KpiBands;
  villageKpis: KpiBands;
}

/**
 * The Region Overview compares every region side by side, so this is the one
 * screen whose scope really is the whole state.
 */
export function useRegionOverviewCards(): OverviewQueryResult<RegionOverviewCard> {
  const { name: state } = useActiveState();
  const { data, isLoading, isError, error } = useScopedNetwork({ state });
  const regions = useAfRegions();

  const rows = useMemo<RegionOverviewCard[]>(() => {
    if (!data || !regions.data) return [];

    // The AF tree (Tier 2) decides which cards exist; the ingestion tables fill
    // them in. A region PI knows about but has no telemetry for renders at zero.
    const byRegion = new Map(groupBy(data.esrs, regionKey).map((g) => [canonicalRegion(g.key), g.rows]));

    return regions.data.map((region) => {
      const group = byRegion.get(canonicalRegion(region.name)) ?? [];
      const roll = rollup(group, data.villages);

      return {
        key: region.webId,
        name: region.name,
        route: `/dashboard/region/${slug(region.name)}`,
        path: pathTo({ state, region: region.name }, "Region"),
        hasData: group.length > 0,
        totalSchemes: roll.counts.schemes,
        totalVillages: roll.counts.villages,
        schemeKpis: schemeBands(group, data.villages),
        villageKpis: villageBands(roll),
      };
    });
  }, [data, regions.data, state]);

  return {
    rows,
    isLoading: isLoading || regions.isLoading,
    isError: isError || regions.isError,
    error: error ?? regions.error,
  };
}

// ---------------------------------------------------------------------------
// Detail dashboards
// ---------------------------------------------------------------------------

export type DashboardTier = HierarchyTier;

const TIER_FIELD: Record<Exclude<DashboardTier, "State">, (r: EsrRecord) => string> = {
  Region: (r) => r.region,
  Circle: (r) => r.circle,
  Division: (r) => r.division,
  SubDivision: (r) => r.subDivision,
  Block: (r) => r.block,
  Scheme: (r) => r.schemeId,
  Village: (r) => r.villageName,
  ESR: (r) => r.esrName,
};

export interface TierSummary {
  /** Display name of the matched unit, or the tier name when nothing matched. */
  label: string;
  /**
   * The unit's §5.1 column value once resolved. Pages hand this to the
   * breadcrumb so a deeper drill-down can scope its request without a lookup.
   */
  name?: string;
  rows: EsrRecord[];
  rollup: TierRollup;
  /** Demographic rows for this branch, for child-group rollups on the page. */
  villages: Map<string, VillageRecord>;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  /** True once loading finished and the `:id` matched no unit in the data. */
  notFound: boolean;
}

/**
 * Resolves a `/dashboard/:tier/:id` route against the network. `id` is the
 * slugified unit name, so "sub-division-akola" and "Sub Division-Akola" match.
 */
export function useTierSummary(tier: DashboardTier, id?: string): TierSummary {
  const resolved = useTierScope(tier, id);
  const { name } = resolved;

  // Keep the scope the page first loaded with for as long as it shows this node.
  // On a pasted link or after Back the page loads wide, then rebuilds the path
  // from its data; that narrows the resolved scope, which would otherwise change
  // the query key and download the branch it already has. The rebuilt path still
  // scopes every child opened from here.
  // The state is part of the node: the Enterprise page stays mounted when the
  // officer switches state, and must not keep the previous state's pinned scope.
  const node = `${resolved.scope.state ?? ""}|${tier}:${id ?? ""}`;
  const pinned = useRef<{ node: string; scope: HierarchyScope } | null>(null);
  if (pinned.current?.node !== node) pinned.current = null;
  const scope = pinned.current?.scope ?? resolved.scope;
  const isReady = pinned.current ? true : resolved.isReady;

  const { data, isLoading, isError, error } = useScopedNetwork(scope, isReady);
  if (data && !pinned.current) pinned.current = { node, scope };
  const pending = isLoading || !isReady;

  return useMemo<TierSummary>(() => {
    const empty = rollup([], new Map());
    if (!data) {
      return {
        label: name ?? tier,
        name,
        rows: [],
        rollup: empty,
        villages: new Map(),
        isLoading: pending,
        isError,
        error,
        notFound: false,
      };
    }

    if (tier === "State") {
      return {
        label: name ?? tier,
        name,
        rows: data.esrs,
        rollup: rollup(data.esrs, data.villages),
        villages: data.villages,
        isLoading: pending,
        isError,
        error,
        notFound: false,
      };
    }

    // When the scope already named this tier the server returned only its rows;
    // otherwise narrow what came back by matching the slug in the route.
    const field = TIER_FIELD[tier];
    const wanted = id ? slug(id) : "";
    const matched = wanted
      ? data.esrs.filter((r) =>
          tier === "Region" ? sameRegion(field(r), id!) : slug(field(r)) === wanted
        )
      : data.esrs;

    return {
      label: matched[0] ? field(matched[0]) : (name ?? id ?? tier),
      name: matched[0] ? field(matched[0]) : name,
      rows: matched,
      rollup: rollup(matched, data.villages),
      villages: data.villages,
      isLoading: pending,
      isError,
      error,
      notFound: Boolean(id) && matched.length === 0,
    };
  }, [data, tier, id, name, pending, isError, error]);
}
