import { useEsrOverviewRows, type EsrOverviewRow } from "@/entities/overview";
import { ThemedImg } from "@/shared/components/figma";
import { OpenNodeButton, type OverviewColumn } from "@/widgets/overview-master-table";
import { TierOverviewPage } from "./TierOverviewPage";

/** A centred header with its sensor icon. */
const iconHeader = (icon: React.ReactNode, label: string) => (
  <span className="flex items-center justify-center gap-1.5">
    {icon}
    <span>{label}</span>
  </span>
);

// Figma 1:12632 (ESR Overview). Per-reservoir readings rather than village
// counts, so it shows only the Communication Status block, in the roomier
// `relaxed` density.
const columns: OverviewColumn<EsrOverviewRow>[] = [
  {
    id: "scheme",
    header: "Scheme ID - Name",
    kind: "plain",
    cell: (r) => (
      <div className="flex flex-col items-center gap-2 text-center font-semibold text-[#1D283B] dark:text-white">
        <div className="text-xs">{r.schemeId}</div>
        <div className="text-sm">{r.schemeName}</div>
        <div className="text-xs">{r.schemeSubtext}</div>
      </div>
    ),
  },
  { id: "village", header: "Village Name", cell: (r) => r.villageName },
  {
    id: "esr",
    header: "ESR Name",
    kind: "plain",
    cell: (r) => (
      <OpenNodeButton path={r.path} variant="large" title="Click to view detailed ESR Dashboard">
        {r.esrName}
      </OpenNodeButton>
    ),
  },
  {
    id: "chlorine",
    header: iconHeader(<ThemedImg name="kpi-chlorine" w={16} h={16} />, "Chlorine"),
    headerClassName: "text-center",
    kind: "reading",
    cell: (r) => r.chlorine,
  },
  {
    id: "pressure",
    header: iconHeader(<ThemedImg name="kpi-pressure" w={16} h={16} />, "Pressure"),
    headerClassName: "text-center",
    kind: "reading",
    cell: (r) => r.pressure,
  },
  {
    id: "water",
    header: iconHeader(<ThemedImg name="water-hand-small" w={18} h={13} />, "Water Consumption"),
    headerClassName: "text-center",
    kind: "reading",
    cell: (r) => r.waterConsumption,
  },
];

export function EsrOverviewPage() {
  return (
    <TierOverviewPage
      tier="ESR"
      useRows={useEsrOverviewRows}
      columns={columns}
      sections={["commStatus"]}
      density="relaxed"
    />
  );
}
