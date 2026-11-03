import { useParams } from "react-router-dom";
import {
  useActiveHierarchyNode,
  useOpenHierarchyNode,
  labelFromRouteId,
} from "@/features/select-hierarchy-node";
import { useTierSummary } from "@/entities/overview";
import { divisionKey, schemeBands, villageBands } from "@/entities/hierarchy";
import { ThemedImg } from "@/shared/components/figma";
import { TierDashboard, childRows, schemeRows } from "@/widgets/tier-dashboard";

/** Figma 2:2693 (dark) / 2:1382 (light). */
export function CircleDashboardPage() {
  // Child rows open with their full ancestry recorded, so the next page fetches
  // only its own branch from the mock server.
  const openNode = useOpenHierarchyNode();
  const { id } = useParams();
  const { rows, rollup: roll, villages, name } = useTierSummary("Circle", id);
  // Every row under this node shares its ancestry, so any one names its branch.
  const branch = rows[0];
  useActiveHierarchyNode({
    tier: "Circle",
    id: id ?? "circle",
    label: labelFromRouteId(id, "Circle"),
    name,
    row: branch,
  });

  return (
    <TierDashboard
      tier="Circle"
      tierLabel="Circle"
      name={branch?.circle ?? labelFromRouteId(id, "Circle")}
      summaryTiles={[
        { label: "Region", value: branch?.region ?? "-" },
        { label: "Number of Division", value: roll.counts.divisions },
        { label: "Number of Sub Division", value: roll.counts.subDivisions },
        { label: "Number of Block", value: roll.counts.blocks },
        { label: "Number of Scheme", value: roll.counts.schemes },
      ]}
      roll={roll}
      scheme={schemeBands(rows, villages)}
      village={villageBands(roll)}
      child={{
        label: "Division",
        icon: <ThemedImg name="tier-division" w={25} h={25} />,
        rows: childRows(
          rows, villages, divisionKey, (r) => r.division, "Division",
          openNode,
          (n) => `Drill down into ${n} Division`,
        ),
      }}
      schemeRows={schemeRows(rows, villages, openNode)}
      totalsInDark
    />
  );
}
