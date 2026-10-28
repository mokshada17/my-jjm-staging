import { useCircleOverviewRows, type CircleOverviewRow } from "@/entities/overview";
import { OpenNodeButton, type OverviewColumn } from "@/widgets/overview-master-table";
import { TierOverviewPage } from "./TierOverviewPage";

// Figma 1:1824 (Circle Overview). The Village Level, Water Consumption and
// Communication Status blocks follow these columns.
const columns: OverviewColumn<CircleOverviewRow>[] = [
  { id: "region", header: "Region", cell: (r) => r.region },
  {
    id: "circle",
    header: "Circle",
    kind: "plain",
    cell: (r) => (
      <OpenNodeButton path={r.path} title="Click to view detailed Circle Dashboard">
        {r.circle}
      </OpenNodeButton>
    ),
  },
  { id: "population", header: "Population", kind: "mono", cell: (r) => r.population },
  { id: "divisions", header: "No. of Division", kind: "number", cell: (r) => r.noOfDivision },
  { id: "schemes", header: "No. of Scheme", kind: "number", cell: (r) => r.noOfScheme },
  { id: "villages", header: "No. of Village", kind: "number", cell: (r) => r.noOfVillage },
  { id: "reservoirs", header: "No. of Reservoir", kind: "number", cell: (r) => r.noOfReservoir },
];

export function CircleOverviewPage() {
  return <TierOverviewPage tier="Circle" useRows={useCircleOverviewRows} columns={columns} />;
}
