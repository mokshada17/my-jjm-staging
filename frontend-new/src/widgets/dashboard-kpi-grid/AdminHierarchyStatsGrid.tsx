import {
  CircleIcon,
  DivisionIcon,
  SubDivisionIcon,
  BlockIcon,
  SchemeIcon,
} from "@/shared/assets/icons";

export interface AdminHierarchyStatsGridProps {
  circles?: number | string;
  divisions?: number | string;
  subDivisions?: number | string;
  blocks?: number | string;
  schemes?: number | string;
  className?: string;
}

export function AdminHierarchyStatsGrid({
  circles = 1,
  divisions = 3,
  subDivisions = 15,
  blocks = 23,
  schemes = 389,
  className = "",
}: AdminHierarchyStatsGridProps) {
  return (
    <div className={`rounded-xl bg-white dark:bg-jjm-canvas border border-slate-200 dark:border-jjm-border p-3 shadow-sm transition-colors duration-150 ${className}`}>
      <div className="grid grid-cols-12 gap-2 text-left">
        <div className="col-span-4 rounded-lg bg-jjm-light-surface dark:bg-jjm-surface border border-slate-200 dark:border-jjm-border p-2 flex items-center gap-3">
          <CircleIcon width="1.375rem" height="1.375rem" color="#0284C7" className="text-[#0284C7] dark:text-jjm-cyan" />
          <div>
            <span className="text-[0.625rem] text-slate-500 dark:text-slate-400 block">Number of Circle</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{circles}</span>
          </div>
        </div>

        <div className="col-span-4 rounded-lg bg-jjm-light-surface dark:bg-jjm-surface border border-slate-200 dark:border-jjm-border p-2 flex items-center gap-3">
          <DivisionIcon width="1.375rem" height="1.375rem" color="#0284C7" className="text-[#0284C7] dark:text-jjm-cyan" />
          <div>
            <span className="text-[0.625rem] text-slate-500 dark:text-slate-400 block">Number of Division</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{divisions}</span>
          </div>
        </div>

        <div className="col-span-4 rounded-lg bg-jjm-light-surface dark:bg-jjm-surface border border-slate-200 dark:border-jjm-border p-2 flex items-center gap-3">
          <SubDivisionIcon width="1.375rem" height="1.375rem" color="#0284C7" className="text-[#0284C7] dark:text-jjm-cyan" />
          <div>
            <span className="text-[0.625rem] text-slate-500 dark:text-slate-400 block">Number of Sub Division</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{subDivisions}</span>
          </div>
        </div>

        <div className="col-span-6 rounded-lg bg-jjm-light-surface dark:bg-jjm-surface border border-slate-200 dark:border-jjm-border p-2 flex items-center gap-3">
          <BlockIcon width="1.375rem" height="1.375rem" color="#0284C7" className="text-[#0284C7] dark:text-jjm-cyan" />
          <div>
            <span className="text-[0.625rem] text-slate-500 dark:text-slate-400 block">Number of Block</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{blocks}</span>
          </div>
        </div>

        <div className="col-span-6 rounded-lg bg-jjm-light-surface dark:bg-jjm-surface border border-slate-200 dark:border-jjm-border p-2 flex items-center gap-3">
          <SchemeIcon width="1.375rem" height="1.375rem" color="#0284C7" className="text-[#0284C7] dark:text-jjm-cyan" />
          <div>
            <span className="text-[0.625rem] text-slate-500 dark:text-slate-400 block">Number of Scheme</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{schemes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
