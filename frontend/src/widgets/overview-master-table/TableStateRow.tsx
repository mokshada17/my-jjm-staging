import { TableCell, TableRow } from "@/shared/components/ui";

export interface TableStateRowProps {
  colSpan: number;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  /** Shown when the query succeeded but the current filter matched nothing. */
  emptyLabel?: string;
}

/**
 * Renders nothing once rows are available, so a table can drop it in ahead of
 * its `.map()` without branching the surrounding markup.
 */
export function TableStateRow({
  colSpan,
  isLoading,
  isError,
  isEmpty,
  emptyLabel = "No records for this selection.",
}: TableStateRowProps) {
  if (!isLoading && !isError && !isEmpty) return null;

  const message = isLoading
    ? "Loading from PI ingestion tables…"
    : isError
      ? "Could not reach the PI mock server. Start it with `npm run mock:server`."
      : emptyLabel;

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={colSpan}
        className={`py-10 px-3 text-center text-xs ${
          isError ? "text-[#DC2626] dark:text-[#FF3838]" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {message}
      </TableCell>
    </TableRow>
  );
}
