import {
  useVillageOverviewRows,
  type VillageOverviewRow,
} from "@/entities/overview";
import {
  OpenNodeButton,
  OVERVIEW_COLUMN_HEADER,
  type OverviewColumn,
} from "@/widgets/overview-master-table";
import { TierOverviewPage } from "./TierOverviewPage";

// Figma 1:12151 (Village Overview). Header typos ("No of Reserviour") mirror the
// design. The Village Level, Water Consumption and Communication Status blocks
// follow these columns.
const columns: OverviewColumn<VillageOverviewRow>[] = [
  {
    id: "scheme",
    header: "Scheme ID -Scheme Name",
    headerClassName: OVERVIEW_COLUMN_HEADER,
    kind: "plain",
    cell: (r) => (
      <div className="flex flex-col items-center gap-2">
        <span
          className="min-w-[5.5rem] h-[1.0625rem] px-3  flex items-center justify-center text-sm font-semibold dark:text-jjm-cyan"
        >
          {r.schemeId}
        </span>
        <span className="max-w-[6.25rem] text-xs font-semibold text-[#1D283B] dark:text-white">
          {r.schemeFullName}
        </span>
       
      </div>
    ),
  },
  {
    id: "village",
    header: "Village Name",
    headerClassName: OVERVIEW_COLUMN_HEADER,
    kind: "plain",
    cell: (r) => (
      <OpenNodeButton
        path={r.path}
        title="Click to view detailed Village Dashboard"
      >
        {r.villageName}
      </OpenNodeButton>
    ),
  },
  {
    id: "household",
    header: "Household",
    kind: "mono",
    headerClassName: OVERVIEW_COLUMN_HEADER,
    cell: (r) => r.household,
  },
  {
    id: "population",
    header: "Population",
    kind: "mono",
    headerClassName: OVERVIEW_COLUMN_HEADER,
    cell: (r) => r.population,
  },
  {
    id: "reservoirs",
    header: "No of Reserviour",
    kind: "number",
    headerClassName: OVERVIEW_COLUMN_HEADER,
    cell: (r) => r.noOfReservoir,
  },
  {
    id: "esr",
    header: "ESR",
    kind: "number",
    headerClassName: OVERVIEW_COLUMN_HEADER,
    cell: (r) => r.esr,
  },
  {
    id: "mbr",
    header: "MBR",
    kind: "number",
    headerClassName: OVERVIEW_COLUMN_HEADER,
    cell: (r) => r.mbr,
  },
  {
    id: "gsr",
    header: "GSR",
    kind: "number",
    headerClassName: OVERVIEW_COLUMN_HEADER,
    cell: (r) => r.gsr,
  },
];

export function VillageOverviewPage() {
  return (
    <TierOverviewPage
      tier="Village"
      useRows={useVillageOverviewRows}
      columns={columns}
    />
  );
}
