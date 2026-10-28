import { useDivisionOverviewRows, type DivisionOverviewRow } from "@/entities/overview";
import { OpenNodeButton, type OverviewColumn } from "@/widgets/overview-master-table";
import { TierOverviewPage } from "./TierOverviewPage";

// Figma 1:7856 (Division Overview). The Village Level, Water Consumption and
// Communication Status blocks follow these columns.
const columns: OverviewColumn<DivisionOverviewRow>[] = [
  { id: "circle", header: "Circle", cell: (r) => r.circle },
  {
    id: "division",
    header: "Division",
    kind: "plain",
    cell: (r) => (
      <OpenNodeButton variant="filled" path={r.path} title="Click to view detailed Division Dashboard">
        {r.division}
      </OpenNodeButton>
    ),
  },
  { id: "population", header: "Population", kind: "mono", cell: (r) => r.population },
  { id: "subdivisions", header: "No. of Sub- Division", kind: "number", cell: (r) => r.noOfSubDivision },
  { id: "schemes", header: "No. of Scheme", kind: "number", cell: (r) => r.noOfScheme },
  { id: "villages", header: "No. of Village", kind: "number", cell: (r) => r.noOfVillage },
  { id: "reservoirs", header: "No. of Reservoir", kind: "number", cell: (r) => r.noOfReservoir },
];

export function DivisionOverviewPage() {
  return <TierOverviewPage tier="Division" useRows={useDivisionOverviewRows} columns={columns} />;
}
