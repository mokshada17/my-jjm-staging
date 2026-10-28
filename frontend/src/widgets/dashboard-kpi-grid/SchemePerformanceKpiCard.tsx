import { LpcdIcon, ChlorineIcon, PressureIcon } from "@/shared/assets/icons";

export interface PerformanceKpiData {
  lpcd: { achieving: number; notAchieving: number; total: number };
  chlorine: { normal: number; low: number; high: number };
  pressure: { normal: number; moderate: number; low: number };
}

interface SchemePerformanceKpiCardProps {
  data?: PerformanceKpiData;
  className?: string;
}

const defaultKpiData: PerformanceKpiData = {
  lpcd: { achieving: 284, notAchieving: 105, total: 389 },
  chlorine: { normal: 312, low: 52, high: 25 },
  pressure: { normal: 334, moderate: 41, low: 14 },
};

export function SchemePerformanceKpiCard({
  data = defaultKpiData,
  className = "",
}: SchemePerformanceKpiCardProps) {
  const lpcdPercent = Math.round((data.lpcd.achieving / data.lpcd.total) * 100);

  return (
    <div
      className={`p-4 rounded-xl bg-white dark:bg-[#111E35] border border-slate-200 dark:border-[#1E2D4A] shadow-sm flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Scheme Performance KPIs
          </h4>
          <p className="text-[0.625rem] text-slate-500 dark:text-slate-400">
            Water quality, volume and pressure compliance
          </p>
        </div>
        <span className="text-[0.6875rem] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10">
          {lpcdPercent}% Compliance
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* LPCD */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0F1B2D]/70 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 mb-1 text-sky-500">
            <LpcdIcon width="0.875rem" height="0.875rem" />
            <span className="text-[0.625rem] font-bold uppercase tracking-wider">LPCD</span>
          </div>
          <div className="space-y-1 text-[0.6875rem]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">&gt; 55 L:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {data.lpcd.achieving}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">&lt; 55 L:</span>
              <span className="font-bold text-red-500">
                {data.lpcd.notAchieving}
              </span>
            </div>
          </div>
        </div>

        {/* Chlorine */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0F1B2D]/70 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 mb-1 text-teal-500">
            <ChlorineIcon width="0.875rem" height="0.875rem" />
            <span className="text-[0.625rem] font-bold uppercase tracking-wider">Chlorine</span>
          </div>
          <div className="space-y-1 text-[0.6875rem]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">0.2–0.5:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {data.chlorine.normal}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">&lt; 0.2:</span>
              <span className="font-bold text-amber-500">
                {data.chlorine.low}
              </span>
            </div>
          </div>
        </div>

        {/* Pressure */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0F1B2D]/70 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5 mb-1 text-indigo-400">
            <PressureIcon width="0.875rem" height="0.875rem" />
            <span className="text-[0.625rem] font-bold uppercase tracking-wider">Pressure</span>
          </div>
          <div className="space-y-1 text-[0.6875rem]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">&gt; 0.7 bar:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {data.pressure.normal}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">&lt; 0.2 bar:</span>
              <span className="font-bold text-red-500">
                {data.pressure.low}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
