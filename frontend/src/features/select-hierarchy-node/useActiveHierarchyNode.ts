import { useEffect } from "react";
import { useAppStore, type HierarchyNode } from "@/app/store";
import { pathTo, type HierarchyRow } from "@/entities/hierarchy";

/**
 * Registers the page's node as the active one. Shallower tiers already in the path
 * are kept, deeper ones are dropped.
 */
export function useActiveHierarchyNode(node: HierarchyNode & { row?: Partial<HierarchyRow> }) {
  const drillTo = useAppStore((s) => s.drillTo);
  const setNodePath = useAppStore((s) => s.setNodePath);
  const { tier, id, label, name, row } = node;
  // A page that passes `row` (even while it is still undefined) registers its node
  // from its data, never by appending to whatever path is already stored.
  const fromRow = "row" in node && tier !== "State";

  useEffect(() => {
    if (fromRow) {
      // Until the row loads, register nothing: appending this node to a stale path
      // (after the Back button or a pasted link) would make useAncestorScope trust
      // that path and scope the fetch to another branch.
      if (!row) return;
      // Then rebuild the whole path from the row: every row carries its full
      // hierarchy, so the path matches the data however the page was reached.
      const path = pathTo(row, tier as Exclude<typeof tier, "State">);
      const current = useAppStore.getState().nodePath;
      if (JSON.stringify(current) !== JSON.stringify(path)) setNodePath(path);
      return;
    }
    // `name` must travel with the node: it is what lets the next tier down scope
    // its fetch (useAncestorScope skips nodes without one). Dropping it silently
    // widened every drill-down to a whole-table fetch.
    drillTo({ tier, id, label, name });
  }, [drillTo, setNodePath, fromRow, tier, id, label, name, row]);
}

/** Title-cases a route param for display until the real name arrives from the API. */
export function labelFromRouteId(id: string | undefined, fallback: string): string {
  if (!id) return fallback;
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
