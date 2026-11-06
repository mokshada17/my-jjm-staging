import {
  groupBy,
  lpcd,
  rollup,
  schemeKey,
  type EsrRecord,
  type HierarchyTier,
  type VillageRecord,
} from "@/entities/hierarchy";
import type { ChildLpcdRow, SchemeRow } from "./TierPanels";

type OpenNode = (row: Partial<EsrRecord>, tier: Exclude<HierarchyTier, "State">) => void;

/** One LPCD-table row per child node, e.g. the Divisions under a Circle. */
export function childRows(
  rows: EsrRecord[],
  villages: Map<string, VillageRecord>,
  key: (r: EsrRecord) => string,
  name: (r: EsrRecord) => string,
  tier: Exclude<HierarchyTier, "State">,
  openNode: OpenNode,
  /** The row's tooltip, e.g. "Drill down into Ramtek Division". */
  title: (name: string) => string,
): ChildLpcdRow[] {
  return groupBy(rows, key).map((group) => {
    const r = rollup(group.rows, villages);
    const label = name(group.rows[0]);
    return {
      key: group.key,
      name: label,
      title: title(label),
      open: () => openNode(group.rows[0], tier),
      lpcd: lpcd(r.waterLitres, r.population),
      water: r.waterLitres,
    };
  });
}

/** One row per scheme under the node, for "<Tier> Level Performance for Scheme". */
export function schemeRows(
  rows: EsrRecord[],
  villages: Map<string, VillageRecord>,
  openNode: OpenNode,
  title: (name: string) => string = (name) => `Click to view Scheme Dashboard for ${name}`,
): SchemeRow[] {
  return groupBy(rows, schemeKey).map((group) => {
    const r = rollup(group.rows, villages);
    return {
      key: group.key,
      id: group.rows[0].schemeId,
      name: group.rows[0].schemeName,
      title: title(group.rows[0].schemeName),
      open: () => openNode(group.rows[0], "Scheme"),
      lpcd: lpcd(r.waterLitres, r.population),
      water: r.waterLitres,
    };
  });
}
