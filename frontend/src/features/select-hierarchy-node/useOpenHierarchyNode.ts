import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/app/store";
import { pathTo, routeFor, type HierarchyRow, type HierarchyTier, type PathNode } from "@/entities/hierarchy";

/**
 * Opens a hierarchy node's dashboard with its full ancestry recorded, so the page
 * fetches only its own branch from the mock server rather than whole tables.
 *
 *   const open = useOpenHierarchyNode();
 *   open(row, "Division");   // from any §5 row that sits under that division
 *   open(path);              // from a prebuilt path (e.g. an overview row's)
 */
export function useOpenHierarchyNode() {
  const navigate = useNavigate();
  const setNodePath = useAppStore((s) => s.setNodePath);

  return useCallback(
    (target: Partial<HierarchyRow> | PathNode[], tier?: Exclude<HierarchyTier, "State">) => {
      const path = Array.isArray(target) ? target : pathTo(target, tier!);
      setNodePath(path);
      navigate(routeFor(path));
    },
    [navigate, setNodePath]
  );
}
