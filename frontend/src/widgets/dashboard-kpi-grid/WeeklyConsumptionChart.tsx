import { WaterConsumptionIcon } from "@/shared/assets/icons";

export interface DailyDataPoint {
  date: string;
  value: number;
  height: string;
}

export interface WeeklyConsumptionChartProps {
  data?: DailyDataPoint[];
  title?: string;
  className?: string;
}

const DEFAULT_CHART_DATA: DailyDataPoint[] = [
  { date: "14-Dec", value: 14.84, height: "70%" },
  { date: "15-Dec", value: 10.23, height: "50%" },
  { date: "16-Dec", value: 16.23, height: "80%" },
  { date: "17-Dec", value: 16.12, height: "78%" },
  { date: "18-Dec", value: 15.23, height: "74%" },
  { date: "19-Dec", value: 14.23, height: "68%" },
  { date: "20-Dec", value: 7.23, height: "35%" },
];

export function WeeklyConsumptionChart({
  data = DEFAULT_CHART_DATA,
  title = "Water Consumption (LL)",
  className = "",
}: WeeklyConsumptionChartProps) {
  return (
    <div className={`rounded-xl bg-white dark:bg-jjm-canvas border border-slate-200 dark:border-jjm-border p-3 flex flex-col justify-between shadow-sm transition-colors duration-150 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-jjm-blue-light dark:text-jjm-cyan flex items-center gap-1">
          <WaterConsumptionIcon width="0.75rem" height="0.75rem" /> {title}
        </h3>
        <span className="text-[0.625rem] text-slate-500 dark:text-slate-400">Past 7 Days</span>
      </div>

      <div className="h-28 flex items-end justify-between gap-1 pt-2 pb-1 border-b border-slate-200 dark:border-jjm-border">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
            <span className="text-[0.5rem] font-mono text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition">
              {item.value}
            </span>
            <div
              className="w-full max-w-[1.25rem] bg-gradient-to-t from-[#16528E] to-[#0284C7] dark:from-[#0C4E68] dark:to-jjm-cyan rounded-t-sm hover:brightness-125 transition-all shadow-sm"
              style={{ height: item.height }}
            />
            <span className="text-[0.5rem] text-slate-600 dark:text-slate-400 font-mono tracking-tighter truncate w-full text-center">
              {item.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
