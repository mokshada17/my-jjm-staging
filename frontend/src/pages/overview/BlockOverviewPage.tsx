import { useBlockOverviewRows, type BlockOverviewRow } from "@/entities/overview";
import { OpenNodeButton, type OverviewColumn } from "@/widgets/overview-master-table";
import { TierOverviewPage } from "./TierOverviewPage";

// Figma 1:5690 (Block Overview). The Village Level, Water Consumption and
// Communication Status blocks follow these columns.
const columns: OverviewColumn<BlockOverviewRow>[] = [
  { id: "subdivision", header: "Sub-Division", cell: (r) => r.subDivision },
  {
    id: "block",
    header: "Block",
    kind: "plain",
    cell: (r) => (
      <OpenNodeButton variant="filled" path={r.path} title="Click to view detailed Block Dashboard">
        {r.block}
      </OpenNodeButton>
    ),
  },
  { id: "population", header: "Population", kind: "mono", cell: (r) => r.population },
  { id: "schemes", header: "No. of Scheme", kind: "number", cell: (r) => r.noOfScheme },
  { id: "villages", header: "No. of Village", kind: "number", cell: (r) => r.noOfVillage },
  { id: "reservoirs", header: "No. of Reservoir", kind: "number", cell: (r) => r.noOfReservoir },
];

export function BlockOverviewPage() {
  return <TierOverviewPage tier="Block" useRows={useBlockOverviewRows} columns={columns} />;
}
