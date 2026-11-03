import { useParams } from "react-router-dom";
import {
  useActiveHierarchyNode,
  useOpenHierarchyNode,
  labelFromRouteId,
} from "@/features/select-hierarchy-node";
import { useTierSummary } from "@/entities/overview";
import { blockKey, schemeBands, villageBands } from "@/entities/hierarchy";
import { ThemedImg } from "@/shared/components/figma";
import { TierDashboard, childRows, schemeRows } from "@/widgets/tier-dashboard";

/** Figma 2:4640 (dark) / 2:6577 (light). */
export function SubDivisionDashboardPage() {
  // Child rows open with their full ancestry recorded, so the next page fetches
  // only its own branch from the mock server.
  const openNode = useOpenHierarchyNode();
  const { id } = useParams();
  const { rows, rollup: roll, villages, name } = useTierSummary("SubDivision", id);
  // Every row under this node shares its ancestry, so any one names its branch.
  const branch = rows[0];
  useActiveHierarchyNode({
    tier: "SubDivision",
    id: id ?? "subdivision",
    label: labelFromRouteId(id, "Sub Division"),
    name,
    row: branch,
  });

  return (
    <TierDashboard
      tier="SubDivision"
      tierLabel="Sub-Division"
      name={branch?.subDivision ?? labelFromRouteId(id, "Sub Division")}
      summaryTiles={[
        { label: "Region", value: branch?.region ?? "-" },
        { label: "Circle", value: branch?.circle ?? "-" },
        { label: "Division", value: branch?.division ?? "-" },
        { label: "Number of Block", value: roll.counts.blocks },
        { label: "Number of Scheme", value: roll.counts.schemes },
      ]}
      roll={roll}
      scheme={schemeBands(rows, villages)}
      village={villageBands(roll)}
      child={{
        label: "Block",
        icon: <ThemedImg name="tier-block-alt" w={29} h={24} />,
        rows: childRows(
          rows, villages, blockKey, (r) => r.block, "Block",
          openNode,
          (n) => `Drill down into ${n} Block`,
        ),
      }}
      schemeRows={schemeRows(rows, villages, openNode)}
    />
  );
}
