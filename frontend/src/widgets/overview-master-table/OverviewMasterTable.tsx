import { ReactNode } from "react";
import { Card, Table, TableBody, TableHead, TableHeader, TableRow } from "@/shared/components/ui";
import {
  VillageLevelKpisHeader,
  VillageLevelKpisSubHeader,
} from "./VillageLevelKpisHeader";

export interface OverviewMasterTableProps {
  /** Leading header columns before the common Village Level / Comm Status columns */
  leadingHeaders?: ReactNode;
  /** Number of leading columns to pad in the sub-header row */
  leadingColumnCount?: number;
  /** Set to true if the table defines its own custom <thead> completely (e.g. ESR Overview) */
  customHeader?: ReactNode;
  /** Table body rows */
  children: ReactNode;
  className?: string;
  /** Caps the scroll viewport so the sticky header has something to stick to. */
  maxBodyHeight?: string;
}

export function OverviewMasterTable({
  leadingHeaders,
  leadingColumnCount = 6,
  customHeader,
  children,
  className = "",
  maxBodyHeight = "calc(100vh - 16.25rem)",
}: OverviewMasterTableProps) {
  return (
    <Card className={`overflow-hidden transition-colors duration-150 ${className}`}>
      {/* The scroll viewport lives here, not in shadcn's Table wrapper, so the sticky
          header has a capped height to stick against. */}
      <div className="overflow-auto" style={{ maxHeight: maxBodyHeight }}>
        <Table className="text-xs text-left border-separate border-spacing-0">
          <TableHeader>
            {customHeader ? (
              customHeader
            ) : (
              <>
                <TableRow className="text-jjm-blue-light dark:text-jjm-cyan text-[0.6875rem] font-semibold hover:bg-transparent [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-jjm-light-surface dark:[&>th]:bg-[#0A1227] [&>th]:border-b [&>th]:border-slate-200 dark:[&>th]:border-jjm-border">
                  {leadingHeaders}
                  <VillageLevelKpisHeader />
                </TableRow>
                <TableRow className="text-[0.5625rem] text-slate-600 dark:text-slate-400 hover:bg-transparent [&>th]:sticky [&>th]:top-[3.25rem] [&>th]:z-20 [&>th]:bg-jjm-light-bg dark:[&>th]:bg-[#070E22] [&>th]:border-b [&>th]:border-slate-200 dark:[&>th]:border-jjm-border">
                  {Array.from({ length: leadingColumnCount }).map((_, i) => (
                    <TableHead
                      key={i}
                      className="border-r border-slate-200 dark:border-jjm-border"
                    />
                  ))}
                  <VillageLevelKpisSubHeader />
                </TableRow>
              </>
            )}
          </TableHeader>
          {/* border-separate above disables `divide-y`, so rows carry their own rule. */}
          <TableBody className="text-xs [&>tr>td]:border-b [&>tr>td]:border-slate-200 dark:[&>tr>td]:border-jjm-border/60">
            {children}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
