import { useSchemeOverviewRows, type SchemeOverviewRow } from "@/entities/overview";
import { OpenNodeButton, type OverviewColumn } from "@/widgets/overview-master-table";
import { TierOverviewPage } from "./TierOverviewPage";

// Figma 1:12808 (Scheme Overview). The Village Level, Water Consumption and
// Communication Status blocks follow these columns.
const columns: OverviewColumn<SchemeOverviewRow>[] = [
  { id: "block", header: "Block Name", cell: (r) => r.blockName },
  {
    id: "scheme",
    header: "Scheme ID - Scheme Name",
    kind: "plain",
    cell: (r) => (
      // Figma: the scheme ID in its box, the name under it.
      <div className="flex flex-col items-center gap-1.5">
        <OpenNodeButton path={r.path} variant="card" title="Click to view detailed Scheme Dashboard">
          {r.schemeId}
        </OpenNodeButton>
        <span className="text-sm font-semibold text-[#1D283B] dark:text-white">{r.schemeName}</span>
      </div>
    ),
  },
  { id: "household", header: "Household", kind: "mono", cell: (r) => r.household },
  { id: "population", header: "Population", kind: "mono", cell: (r) => r.population },
  { id: "villages", header: "No. of Village", kind: "number", cell: (r) => r.noOfVillage },
  { id: "reservoirs", header: "No. of Reservoir", kind: "number", cell: (r) => r.noOfReservoir },
];

export function SchemeOverviewPage() {
  return <TierOverviewPage tier="Scheme" useRows={useSchemeOverviewRows} columns={columns} />;
}
