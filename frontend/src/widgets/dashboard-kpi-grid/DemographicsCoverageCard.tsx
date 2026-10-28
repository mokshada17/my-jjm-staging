import { VillagesIcon, PopulationIcon } from "@/shared/assets/icons";

export interface DemographicsData {
  villages: number | string;
  population: number | string;
  households: number | string;
}

interface DemographicsCoverageCardProps {
  data?: DemographicsData;
  className?: string;
}

const defaultData: DemographicsData = {
  villages: "4,120",
  population: "8,321,423",
  households: "1,878,006",
};

export function DemographicsCoverageCard({
  data = defaultData,
  className = "",
}: DemographicsCoverageCardProps) {
  return (
    <div
      className={`p-4 rounded-xl bg-white dark:bg-[#111E35] border border-slate-200 dark:border-[#1E2D4A] shadow-sm flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
            <VillagesIcon width="1.125rem" height="1.125rem" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Demographics & Coverage
            </h4>
            <p className="text-[0.625rem] text-slate-500 dark:text-slate-400">
              Statewide administrative coverage
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 text-center">
        {/* Villages */}
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0F1B2D]/70 border border-slate-100 dark:border-slate-800/60">
          <p className="text-[0.625rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Villages
          </p>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {data.villages}
          </p>
          <span className="text-[0.5625rem] font-medium text-emerald-600 dark:text-emerald-400">
            100% mapped
          </span>
        </div>

        {/* Population */}
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0F1B2D]/70 border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center justify-center gap-1 mb-1">
            <PopulationIcon width="0.75rem" height="0.75rem" />
            <p className="text-[0.625rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Population
            </p>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-[#1E6B8A] dark:text-jjm-cyan tracking-tight">
            {data.population}
          </p>
          <span className="text-[0.5625rem] font-medium text-slate-400">
            Beneficiaries
          </span>
        </div>

        {/* Households */}
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0F1B2D]/70 border border-slate-100 dark:border-slate-800/60">
          <p className="text-[0.625rem] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Households
          </p>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
            {data.households}
          </p>
          <span className="text-[0.5625rem] font-medium text-emerald-600 dark:text-emerald-400">
            FHTC Active
          </span>
        </div>
      </div>
    </div>
  );
}
