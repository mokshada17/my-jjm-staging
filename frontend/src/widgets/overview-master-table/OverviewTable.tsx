import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui";
import { cn } from "@/shared/utils";
import { SECTIONS, type OverviewSection, type SectionRow } from "./sections";
import { TableStateRow } from "./TableStateRow";

/**
 * How a column's cells look:
 *  - text     bold name, left-aligned            ("Nagpur")
 *  - number   bold count, centred                ("3")
 *  - mono     bold figure in the monospace face  ("5,250")
 *  - reading  cyan sensor reading, centred       ("0.31 mg/l")
 *  - plain    no text styling - for cells that render their own content,
 *             like an OpenNodeButton or a stacked badge
 */
export type OverviewCellKind = "text" | "number" | "mono" | "reading" | "plain";

/** Row padding: `compact` for the tier tables, `relaxed` for the roomier ESR table. */
export type OverviewDensity = "compact" | "relaxed";

// Figma overview rows: 14px semibold text on #1F3146 / #E2E8EF strokes.
const CELL_STROKE = "border-r border-jjm-light-stroke dark:border-[#1F3146]";
const CELL_TEXT = "text-sm font-semibold text-[#1D283B] dark:text-white";

const cellVariants = cva("", {
  variants: {
    density: { compact: "py-4 px-3", relaxed: "py-5 px-4" },
    kind: {
      plain: CELL_STROKE,
      text: `${CELL_TEXT} ${CELL_STROKE}`,
      number: `${CELL_TEXT} ${CELL_STROKE} text-center`,
      mono: `${CELL_TEXT} ${CELL_STROKE}`,
      reading: `text-xs font-semibold text-jjm-blue-light dark:text-jjm-cyan text-center ${CELL_STROKE}`,
    },
  },
});

const headVariants = cva("", {
  variants: {
    density: {
      compact: "py-3 px-3 border-r border-slate-200 dark:border-jjm-border",
      relaxed: "py-3.5 px-4 border-r border-slate-200 dark:border-jjm-border",
    },
  },
});

export interface OverviewColumn<Row> {
  /** Stable key, unique within the table. */
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  /** Cell styling; defaults to `text`. */
  kind?: OverviewCellKind;
  /** Extra classes for this column's cells, merged over the kind's (tailwind-merge). */
  className?: string;
  /** Extra classes for this column's header cell. */
  headerClassName?: string;
  /**
   * The row's identity in the collapsed tablet cards (OverviewCards). Defaults to
   * the last `plain` column - the row's own open-dashboard button on every page.
   */
  primary?: boolean;
}

export interface OverviewTableProps<Row extends { id: string } & SectionRow> {
  /** This table's own columns, drawn before the shared sections. */
  columns: OverviewColumn<Row>[];
  rows: Row[];
  /** Shared blocks after the columns, in order. A sub-header row is drawn when `villageKpis` is included. */
  sections: OverviewSection[];
  isLoading: boolean;
  isError: boolean;
  density?: OverviewDensity;
  className?: string;
  /** Caps the scroll viewport so the sticky header has something to stick to. */
  maxBodyHeight?: string;
  /**
   * `grouped`: Figma's three header rows (section title, group, band), centred
   * column cells and Communication Status as real columns - every overview frame
   * in the Figma. Defaults to `grouped`.
   */
  layout?: OverviewLayout;
}

export type OverviewLayout = "standard" | "grouped";

/** Header cell for a table column in the grouped layout: covers all three header rows. */
/** Figma's tier columns are ~96px, so two-word headings wrap ("No. of / Reservoir"). */
const GROUPED_HEAD =
  "w-24 py-2 px-2 text-center border-r border-b border-jjm-light-stroke dark:border-[#1F3146] bg-white dark:bg-jjm-canvas";

const withClasses = (base: string, extra?: string) => (extra ? cn(base, extra) : base);

/**
 * The overview master table, built from config: pass the tier's columns and the
 * shared sections, and the header rows, sub-header padding and loading-row span
 * all follow from them - nothing to count or keep in sync by hand.
 */
export function OverviewTable<Row extends { id: string } & SectionRow>({
  columns,
  rows,
  sections,
  isLoading,
  isError,
  density = "compact",
  className = "",
  maxBodyHeight = "calc(100vh - 16.25rem)",
  layout = "grouped",
}: OverviewTableProps<Row>) {
  const blocks = sections.map((s) => ({ key: s, ...SECTIONS[s] }));
  const hasSubHeader = sections.includes("villageKpis");
  const grouped = layout === "grouped";
  const colSpan = columns.length + blocks.reduce((n, b) => n + (grouped ? b.grouped.span : b.span), 0);

  if (grouped) {
    return (
      <Card className={`overflow-hidden rounded-lg shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-[#1F3146] ${className}`}>
        <div className="overflow-auto" style={{ maxHeight: maxBodyHeight }}>
          <Table className="text-xs text-left border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-20">
              <TableRow className="text-jjm-blue-light dark:text-jjm-cyan text-xs font-semibold hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead key={col.id} rowSpan={3} className={withClasses(GROUPED_HEAD, col.headerClassName)}>
                    {col.header}
                  </TableHead>
                ))}
                {blocks.map((b) => (
                  <SectionFragment key={b.key}>{b.grouped.top}</SectionFragment>
                ))}
              </TableRow>
              <TableRow className="text-jjm-blue-light dark:text-jjm-cyan text-[0.625rem] font-semibold hover:bg-transparent">
                {blocks.map((b) => (
                  <SectionFragment key={b.key}>{b.grouped.middle}</SectionFragment>
                ))}
              </TableRow>
              <TableRow className="text-[0.5625rem] hover:bg-transparent">
                {blocks.map((b) => (
                  <SectionFragment key={b.key}>{b.grouped.bands}</SectionFragment>
                ))}
              </TableRow>
            </TableHeader>
            {/* Every row keeps its bottom rule, the last one too: the card runs on to
                the foot of the screen, so its own border no longer closes the table. */}
            <TableBody className="text-xs [&>tr>td]:border-b [&>tr>td]:border-jjm-light-stroke dark:[&>tr>td]:border-[#1F3146]">
              <TableStateRow colSpan={colSpan} isLoading={isLoading} isError={isError} isEmpty={rows.length === 0} />
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-transparent">
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={withClasses(
                        cn(cellVariants({ density, kind: col.kind ?? "text" }), "text-center"),
                        col.className
                      )}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                  {blocks.map((b) => (
                    <SectionFragment key={b.key}>{(b.grouped.cells ?? b.cells)(row)}</SectionFragment>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden transition-colors duration-150 ${className}`}>
      {/* The scroll viewport lives here, not in shadcn's Table wrapper, so the sticky
          header has a capped height to stick against. */}
      <div className="overflow-auto" style={{ maxHeight: maxBodyHeight }}>
        <Table className="text-xs text-left border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="text-jjm-blue-light dark:text-jjm-cyan text-[0.6875rem] font-semibold hover:bg-transparent [&>th]:sticky [&>th]:top-0 [&>th]:z-20 [&>th]:bg-jjm-light-surface dark:[&>th]:bg-[#0A1227] [&>th]:border-b [&>th]:border-slate-200 dark:[&>th]:border-jjm-border">
              {columns.map((col) => (
                <TableHead key={col.id} className={withClasses(headVariants({ density }), col.headerClassName)}>
                  {col.header}
                </TableHead>
              ))}
              {blocks.map((b) => (
                <SectionFragment key={b.key}>{b.head}</SectionFragment>
              ))}
            </TableRow>
            {hasSubHeader && (
              <TableRow className="text-[0.5625rem] text-slate-600 dark:text-slate-400 hover:bg-transparent [&>th]:sticky [&>th]:top-[3.25rem] [&>th]:z-20 [&>th]:bg-jjm-light-bg dark:[&>th]:bg-[#070E22] [&>th]:border-b [&>th]:border-slate-200 dark:[&>th]:border-jjm-border">
                {columns.map((col) => (
                  <TableHead key={col.id} className="border-r border-slate-200 dark:border-jjm-border" />
                ))}
                {blocks.map((b) => (
                  <SectionFragment key={b.key}>{b.sub}</SectionFragment>
                ))}
              </TableRow>
            )}
          </TableHeader>
          {/* border-separate above disables `divide-y`, so rows carry their own rule. */}
          <TableBody className="text-xs [&>tr>td]:border-b [&>tr>td]:border-slate-200 dark:[&>tr>td]:border-jjm-border/60">
            <TableStateRow colSpan={colSpan} isLoading={isLoading} isError={isError} isEmpty={rows.length === 0} />
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50 dark:hover:bg-jjm-surface/40 transition">
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={withClasses(cellVariants({ density, kind: col.kind ?? "text" }), col.className)}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
                {blocks.map((b) => (
                  <SectionFragment key={b.key}>{b.cells(row)}</SectionFragment>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

/** Keys a section's cells without adding a DOM element. */
function SectionFragment({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
