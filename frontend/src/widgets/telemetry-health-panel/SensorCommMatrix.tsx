import { FlowIcon, ChlorineIcon, PressureIcon, CommunicationIcon } from "@/shared/assets/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui";

export interface CommRowData {
  h24: number;
  h0_72: number;
  h72Plus: number;
  total: number;
}

export interface SensorCommData {
  flowMeter: CommRowData;
  chlorine: CommRowData;
  pressure: CommRowData;
}

interface SensorCommMatrixProps {
  data?: SensorCommData;
  className?: string;
}

const defaultCommData: SensorCommData = {
  flowMeter: { h24: 1840, h0_72: 120, h72Plus: 45, total: 2005 },
  chlorine: { h24: 1420, h0_72: 95, h72Plus: 62, total: 1577 },
  pressure: { h24: 2150, h0_72: 140, h72Plus: 38, total: 2328 },
};

export function SensorCommMatrix({
  data = defaultCommData,
  className = "",
}: SensorCommMatrixProps) {
  const rows = [
    {
      name: "Flow Meter",
      icon: <FlowIcon width="1.125rem" height="0.875rem" topColor="#24D2FF" middleColor="#2FA4C1" bottomColor="#10B981" />,
      values: data.flowMeter,
    },
    {
      name: "Chlorine",
      icon: <ChlorineIcon width="1rem" height="1rem" />,
      values: data.chlorine,
    },
    {
      name: "Pressure",
      icon: <PressureIcon width="1rem" height="1rem" />,
      values: data.pressure,
    },
  ];

  return (
    <div
      className={`p-4 rounded-xl bg-white dark:bg-[#111E35] border border-slate-200 dark:border-[#1E2D4A] shadow-sm flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CommunicationIcon width="1rem" height="1rem" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Communication Status
            </h4>
            <p className="text-[0.625rem] text-slate-500 dark:text-slate-400">
              Sensor telemetry health across network
            </p>
          </div>
        </div>
      </div>

      {/* Table Grid */}
      <div className="overflow-x-auto">
        <Table className="w-full text-xs">
          <TableHeader>
            <TableRow className="text-[0.625rem] uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
              <TableHead className="text-left pb-2 font-semibold">Sensor</TableHead>
              <TableHead className="text-center pb-2 font-semibold text-emerald-600 dark:text-emerald-400">
                &lt;24h
              </TableHead>
              <TableHead className="text-center pb-2 font-semibold text-amber-500">
                0-72h
              </TableHead>
              <TableHead className="text-center pb-2 font-semibold text-red-500">
                &gt;72h
              </TableHead>
              <TableHead className="text-right pb-2 font-semibold text-slate-700 dark:text-slate-300">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {rows.map((row) => (
              <TableRow key={row.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                <TableCell className="py-2.5 text-left font-medium text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 flex-shrink-0">{row.icon}</span>
                    <span>{row.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                  {row.values.h24.toLocaleString()}
                </TableCell>
                <TableCell className="py-2.5 text-center font-bold text-amber-500">
                  {row.values.h0_72.toLocaleString()}
                </TableCell>
                <TableCell className="py-2.5 text-center font-bold text-red-500">
                  {row.values.h72Plus.toLocaleString()}
                </TableCell>
                <TableCell className="py-2.5 text-right font-extrabold text-slate-900 dark:text-white">
                  {row.values.total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
