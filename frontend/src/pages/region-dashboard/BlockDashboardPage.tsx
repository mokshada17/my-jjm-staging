import { useParams } from "react-router-dom";
import {
  useActiveHierarchyNode,
  useOpenHierarchyNode,
  labelFromRouteId,
} from "@/features/select-hierarchy-node";
import { useTierSummary } from "@/entities/overview";
import { schemeBands, villageBands } from "@/entities/hierarchy";
import { TierDashboard, schemeRows } from "@/widgets/tier-dashboard";

/** Figma 2:5059 (dark) / 2:6996 (light). A Block has no child LPCD table. */
export function BlockDashboardPage() {
  // Child rows open with their full ancestry recorded, so the next page fetches
  // only its own branch from the mock server.
  const openNode = useOpenHierarchyNode();
  const { id } = useParams();
  const { rows, rollup: roll, villages, name } = useTierSummary("Block", id);
  // Every row under this node shares its ancestry, so any one names its branch.
  const branch = rows[0];
  useActiveHierarchyNode({
    tier: "Block",
    id: id ?? "block",
    label: labelFromRouteId(id, "Block"),
    name,
    row: branch,
  });

  return (
    <TierDashboard
      tier="Block"
      tierLabel="Block"
      name={branch?.block ?? labelFromRouteId(id, "Block")}
      summaryTiles={[
        { label: "Region", value: branch?.region ?? "-" },
        { label: "Circle", value: branch?.circle ?? "-" },
        { label: "Division", value: branch?.division ?? "-" },
        { label: "Sub-Division", value: branch?.subDivision ?? "-" },
        { label: "Number of Scheme", value: roll.counts.schemes },
      ]}
      roll={roll}
      scheme={schemeBands(rows, villages)}
      village={villageBands(roll)}
      schemeRows={schemeRows(rows, villages, openNode, (n) => `Drill down into scheme ${n}`)}
      totalsInDark
    />
  );
}
