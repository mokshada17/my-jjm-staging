import { useParams } from "react-router-dom";
import {
  useActiveHierarchyNode,
  useOpenHierarchyNode,
  labelFromRouteId,
} from "@/features/select-hierarchy-node";
import { useTierSummary } from "@/entities/overview";
import { schemeBands, subDivisionKey, villageBands } from "@/entities/hierarchy";
import { ThemedImg } from "@/shared/components/figma";
import { TierDashboard, childRows, schemeRows } from "@/widgets/tier-dashboard";

/** Figma 2:4212 (dark) / 2:6148 (light). */
export function DivisionDashboardPage() {
  // Child rows open with their full ancestry recorded, so the next page fetches
  // only its own branch from the mock server.
  const openNode = useOpenHierarchyNode();
  const { id } = useParams();
  const { rows, rollup: roll, villages, name } = useTierSummary("Division", id);
  // Every row under this node shares its ancestry, so any one names its branch.
  const branch = rows[0];
  useActiveHierarchyNode({
    tier: "Division",
    id: id ?? "division",
    label: labelFromRouteId(id, "Division"),
    name,
    row: branch,
  });

  return (
    <TierDashboard
      tier="Division"
      tierLabel="Division"
      name={branch?.division ?? labelFromRouteId(id, "Division")}
      summaryTiles={[
        { label: "Region", value: branch?.region ?? "-" },
        { label: "Circle", value: branch?.circle ?? "-" },
        { label: "Number of Sub Division", value: roll.counts.subDivisions },
        { label: "Number of Block", value: roll.counts.blocks },
        { label: "Number of Scheme", value: roll.counts.schemes },
      ]}
      roll={roll}
      scheme={schemeBands(rows, villages)}
      village={villageBands(roll)}
      child={{
        label: "Sub-Division",
        icon: <ThemedImg name="tier-subdivision" w={25} h={22} />,
        rows: childRows(
          rows, villages, subDivisionKey, (r) => r.subDivision, "SubDivision",
          openNode,
          (n) => `Drill down into ${n} Sub-Division Dashboard`,
        ),
      }}
      schemeRows={schemeRows(rows, villages, openNode)}
    />
  );
}