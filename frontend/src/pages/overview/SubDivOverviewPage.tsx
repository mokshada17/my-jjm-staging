import { useSubDivOverviewRows, type SubDivOverviewRow } from "@/entities/overview";
import { OpenNodeButton, type OverviewColumn } from "@/widgets/overview-master-table";
import { TierOverviewPage } from "./TierOverviewPage";

// Figma 1:5460 (Sub-Division Overview). The Village Level, Water Consumption and
// Communication Status blocks follow these columns.
const columns: OverviewColumn<SubDivOverviewRow>[] = [
  { id: "division", header: "Division", cell: (r) => r.division },
  {
    id: "subdivision",
    header: "Sub- Division",
    kind: "plain",
    cell: (r) => (
      <OpenNodeButton variant="filled" path={r.path} title="Click to view detailed Sub-Division Dashboard">
        {r.subDivision}
      </OpenNodeButton>
    ),
  },
  { id: "population", header: "Population", kind: "mono", cell: (r) => r.population },
  { id: "blocks", header: "No. of Block", kind: "number", cell: (r) => r.noOfBlock },
  { id: "schemes", header: "No. of Scheme", kind: "number", cell: (r) => r.noOfScheme },
  { id: "villages", header: "No. of Village", kind: "number", cell: (r) => r.noOfVillage },
  { id: "reservoirs", header: "No. of Reservoir", kind: "number", cell: (r) => r.noOfReservoir },
];

export function SubDivOverviewPage() {
  return <TierOverviewPage tier="SubDivision" useRows={useSubDivOverviewRows} columns={columns} />;
}
