import { WaterTankIcon, GsrTankIcon, MbrIcon } from "@/shared/assets/icons";

export interface ReservoirData {
  esr: { count: number | string; capacity: string };
  gsr: { count: number | string; capacity: string };
  mbr: { count: number | string; capacity: string };
}

interface ReservoirSummaryCardProps {
  data?: ReservoirData;
  className?: string;
}

const defaultData: ReservoirData = {
  esr: { count: "8,179", capacity: "61.73 LL" },
  gsr: { count: "216", capacity: "2.45 LL" },
  mbr: { count: "700", capacity: "7.80 LL" },
};

export function ReservoirSummaryCard({
  data = defaultData,
  className = "",
}: ReservoirSummaryCardProps) {
  return (
    <div
      className={`p-4 rounded-xl bg-white dark:bg-[#111E35] border border-slate-200 dark:border-[#1E2D4A] shadow-sm flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500">
            <WaterTankIcon width="1.125rem" height="1.125rem" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Reservoir Infrastructure
            </h4>
            <p className="text-[0.625rem] text-slate-500 dark:text-slate-400">
              Storage capacity distribution
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3">
        {/* ESR */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0F1B2D]/70 border border-slate-100 dark:border-slate-800/60 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-[#1E6B8A] dark:text-jjm-cyan">
            <WaterTankIcon width="1rem" height="1rem" />
            <span className="text-[0.625rem] font-bold uppercase tracking-wider">ESR</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {data.esr.count}
          </p>
          <span className="text-[0.625rem] font-medium text-slate-500 dark:text-slate-400">
            Cap: {data.esr.capacity}
          </span>
        </div>

        {/* GSR */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0F1B2D]/70 border border-slate-100 dark:border-slate-800/60 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-emerald-500">
            <GsrTankIcon width="1rem" height="1rem" />
            <span className="text-[0.625rem] font-bold uppercase tracking-wider">GSR</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {data.gsr.count}
          </p>
          <span className="text-[0.625rem] font-medium text-slate-500 dark:text-slate-400">
            Cap: {data.gsr.capacity}
          </span>
        </div>

        {/* MBR */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0F1B2D]/70 border border-slate-100 dark:border-slate-800/60 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-indigo-400">
            <MbrIcon width="1rem" height="1rem" />
            <span className="text-[0.625rem] font-bold uppercase tracking-wider">MBR</span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {data.mbr.count}
          </p>
          <span className="text-[0.625rem] font-medium text-slate-500 dark:text-slate-400">
            Cap: {data.mbr.capacity}
          </span>
        </div>
      </div>
    </div>
  );
}
