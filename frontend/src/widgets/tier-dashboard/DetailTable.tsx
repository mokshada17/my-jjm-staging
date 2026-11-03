import type { ReactNode } from "react";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui";
import { cn } from "@/shared/utils";

export interface DetailColumn<Row> {
  id: string;
  /** Icon + heading; headings break onto two lines in the frames. */
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  /** Cell classes: alignment and the value's colour. */
  className?: string;
}

/**
 * The child table under the charts on the Scheme (villages) and Village (ESRs)
 * dashboards: an 11px heading band over plain 12px rows divided by strokes.
 */
export function DetailTable<Row>({
  columns,
  rows,
  rowKey,
  rowTitle,
  onOpen,
  rowClassName = "h-[2.1875rem]",
  className,
}: {
  columns: DetailColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  rowTitle?: (row: Row) => string;
  onOpen?: (row: Row) => void;
  rowClassName?: string;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-lg overflow-hidden shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border", className)}>
      <Table className="table-fixed">
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="h-[2.6875rem] bg-jjm-light-bg dark:bg-jjm-surface hover:bg-jjm-light-bg dark:hover:bg-jjm-surface">
            {columns.map((c) => (
              <TableHead
                key={c.id}
                className="h-auto px-2 py-1 text-center text-[0.6875rem] leading-[0.8125rem] font-semibold text-jjm-blue-light dark:text-jjm-cyan"
              >
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="text-xs font-semibold">
          {rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              title={rowTitle?.(row)}
              onClick={onOpen ? () => onOpen(row) : undefined}
              className={cn(
                "border-b border-jjm-light-stroke dark:border-jjm-border hover:bg-transparent",
                onOpen && "cursor-pointer",
                rowClassName,
              )}
            >
              {columns.map((c) => (
                <TableCell key={c.id} className={cn("px-2 py-0 text-center text-black dark:text-white", c.className)}>
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
