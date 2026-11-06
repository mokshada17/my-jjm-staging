export interface WaterSupplyDurationCardProps {
  duration?: string;
  className?: string;
}

export function WaterSupplyDurationCard({
  duration = "0.93 Hours",
  className = "",
}: WaterSupplyDurationCardProps) {
  return (
    <div
      className={`rounded-xl bg-white dark:bg-jjm-canvas border border-slate-200 dark:border-jjm-border p-3 shadow-sm flex flex-col justify-center items-center text-center transition-colors duration-150 ${className}`}
    >
      <h2 className="text-[0.6875rem] font-bold text-jjm-blue-light dark:text-jjm-cyan leading-snug mb-1.5">
        Average Time Duration Water Supply per Day
      </h2>
      <span className="text-lg font-black text-[#008000] dark:text-jjm-green font-mono">
        {duration}
      </span>
    </div>
  );
}
