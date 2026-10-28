import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Card } from "@/shared/components/ui";
import { ThemedImg } from "@/shared/components/figma";
import { cn } from "@/shared/utils";
import { DEFAULT_COMM_STATUS_MATRIX, DEFAULT_VILLAGE_KPIS } from "@/entities/telemetry/utils";
import type { CommStatusMatrix } from "@/entities/telemetry";
import { KPI_BAD, KPI_GOOD, KPI_WARN, KpiBlock } from "@/widgets/dashboard-kpi-grid/PerformanceKpiCard";
import type { OverviewCellKind, OverviewColumn } from "./OverviewTable";
import type { OverviewSection, SectionRow } from "./sections";

/**
 * The overview table as a list of collapsible cards, for screens too narrow for
 * its 19-21 columns (TierOverviewPage switches below 1280px). Built from the same
 * config as the table, so a page needs nothing extra.
 *
 * Collapsed, each row is one line: its open-dashboard button and only the issues
 * worth opening it for (below 55 LPCD, chlorine out of range, low pressure,
 * sensors offline over 72h), or "All OK" - so a long list stays about as compact
 * as the table and shows which rows need attention. Tapping the line opens the
 * full card: the page's other columns as label / value pairs, the LPCD / Chlorine
 * / Pressure blocks of the Region cards, and Water Consumption beside the
 * Communication Status matrix.
 */
export interface OverviewCardsProps<Row extends { id: string } & SectionRow> {
  columns: OverviewColumn<Row>[];
  rows: Row[];
  sections: OverviewSection[];
  isLoading: boolean;
  isError: boolean;
}

const STROKE = "border-jjm-light-stroke dark:border-[#1F3146]";
const LABEL = "text-[0.6875rem] font-semibold leading-tight text-jjm-blue-light dark:text-jjm-cyan";
const TEXT = "text-sm font-semibold text-[#1D283B] dark:text-white";

/** The table's cell kinds, as card values (no cell padding or strokes). */
const VALUE: Record<OverviewCellKind, string> = {
  text: TEXT,
  number: TEXT,
  mono: TEXT,
  reading: "text-sm font-semibold text-jjm-blue-light dark:text-jjm-cyan",
  plain: "",
};

/** Band colours, as in the table. */
const GOOD = "text-[#16A349] dark:text-[#21C45D]";
const WARN = "text-[#D97706] dark:text-[#FBBF23]";
const BAD = "text-jjm-red";

/** The row's identity: a column marked `primary`, else the last `plain` one, else the first. */
function primaryColumn<Row>(columns: OverviewColumn<Row>[]): OverviewColumn<Row> {
  return (
    columns.find((c) => c.primary) ??
    [...columns].reverse().find((c) => c.kind === "plain") ??
    columns[0]
  );
}

/** Section strip, as on the Region Overview cards. */
function Strip({ children }: { children: ReactNode }) {
  return (
    <div className="h-[1.5625rem] px-3 flex items-center bg-jjm-light-bg dark:bg-jjm-surface text-xs font-semibold uppercase text-jjm-blue-light dark:text-jjm-cyan">
      {children}
    </div>
  );
}

/** A KpiBlock-style box: a 35px heading strip over its content. */
function Block({ icon, heading, children }: { icon: ReactNode; heading: string; children: ReactNode }) {
  return (
    <div className={cn("min-w-0 rounded-lg overflow-hidden border bg-white dark:bg-jjm-canvas", STROKE)}>
      <div className="h-[2.1875rem] flex items-center justify-center gap-2 px-1 bg-jjm-light-bg dark:bg-jjm-surface">
        {icon}
        <span className="text-[0.625rem] font-semibold text-jjm-blue-light dark:text-jjm-cyan">{heading}</span>
      </div>
      {children}
    </div>
  );
}

const SENSORS = [
  { key: "chlorine", label: "Chlorine", icon: <ThemedImg name="kpi-chlorine" w={18} h={18} /> },
  { key: "pressure", label: "Pressure", icon: <ThemedImg name="kpi-pressure" w={18} h={18} /> },
  { key: "flow", label: "Flow", icon: <ThemedImg name="sensor-flow" w={18} h={14} /> },
] as const;

const WINDOWS: { label: string; tone: string; value: (s: CommStatusMatrix["flow"]) => number }[] = [
  { label: "24Hrs", tone: GOOD, value: (s) => s.h24 },
  { label: "0Hrs-72Hrs", tone: WARN, value: (s) => s.h0To72 },
  { label: ">72Hrs", tone: BAD, value: (s) => s.h72Plus },
];

const ANTENNA = <ThemedImg name="comm-antenna-light" dark="comm-antenna-dark" w={16} h={17} darkW={16} darkH={16} />;

function CommStatusBlock({ status = DEFAULT_COMM_STATUS_MATRIX }: { status?: CommStatusMatrix }) {
  return (
    <Block icon={ANTENNA} heading="Communication Status">
      <div className="grid grid-cols-[3rem_repeat(3,minmax(0,1fr))] text-center">
        <span />
        {WINDOWS.map((w) => (
          <span key={w.label} className={cn("py-1.5 text-[0.625rem] font-semibold", w.tone)}>
            {w.label}
          </span>
        ))}
        {SENSORS.map(({ key, label, icon }) => (
          <div key={key} className="contents">
            <span className={cn("flex items-center justify-center h-9 border-t", STROKE)} title={label} aria-label={label}>
              {icon}
            </span>
            {WINDOWS.map((w) => (
              <span key={w.label} className={cn("flex items-center justify-center h-9 border-t text-sm font-bold", STROKE, w.tone)}>
                {w.value(status[key])}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Block>
  );
}

// ---------------------------------------------------------------------------
// Collapsed line: issues only
// ---------------------------------------------------------------------------

interface Issue {
  label: string;
  count: number;
}

/**
 * What needs attention in a row: the bad band of each Village Level KPI and the
 * sensors silent for over 72 hours. Amber bands (moderate pressure, 0-72h delays)
 * stay in the expanded card.
 */
function rowIssues(row: SectionRow, sections: OverviewSection[]): Issue[] {
  const issues: Issue[] = [];
  if (sections.includes("villageKpis")) {
    const k = row.villageKpis ?? DEFAULT_VILLAGE_KPIS;
    issues.push(
      { label: "LPCD <55", count: k.lpcdBelow55 },
      { label: "Chlorine out of range", count: k.chlorineLow + k.chlorineHigh },
      { label: "Low pressure", count: k.pressureLow }
    );
  }
  if (sections.includes("commStatus")) {
    const c = row.commStatus ?? DEFAULT_COMM_STATUS_MATRIX;
    issues.push({ label: "Offline >72h", count: SENSORS.reduce((n, { key }) => n + c[key].h72Plus, 0) });
  }
  return issues.filter((i) => i.count > 0);
}

const CHIP = "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold";

/**
 * How the chips sit beside the name:
 *  - line   all on one line;
 *  - split  over two lines, half on each (4 -> 2 + 2, 3 -> 2 + 1), in aligned
 *           columns, when they do not fit on one;
 *  - wrap   plain wrapping, when even two lines do not fit beside the name.
 * Decided from the chips' real widths and the room left beside the name, and
 * re-decided as that room changes.
 */
type ChipLayout = "line" | "split" | "wrap";

function useChipLayout(count: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const [layout, setLayout] = useState<ChipLayout>("line");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const decide = () => {
      const widths = [...el.children].map((c) => (c as HTMLElement).offsetWidth);
      const room = el.clientWidth;
      // gap-x-2 is in rem, so read it rather than assume 8px (it grows on large screens)
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const span = (ws: number[]) => ws.reduce((a, b) => a + b, 0) + gap * Math.max(0, ws.length - 1);
      if (span(widths) <= room) return setLayout("line");
      const perLine = Math.ceil(widths.length / 2);
      const columns = Array.from({ length: perLine }, (_, c) => Math.max(widths[c] ?? 0, widths[c + perLine] ?? 0));
      setLayout(span(columns) <= room ? "split" : "wrap");
    };
    decide();
    const ro = new ResizeObserver(decide);
    ro.observe(el);
    return () => ro.disconnect();
  }, [count]);

  return { ref, layout, perLine: Math.ceil(count / 2) };
}

function IssueChips({ issues }: { issues: Issue[] }) {
  const { ref, layout, perLine } = useChipLayout(issues.length);
  return (
    <span
      ref={ref}
      data-layout={layout}
      // 8px between chips, 16px between chip lines, so a split pair reads as two rows.
      className={cn("flex-1 min-w-0 gap-x-2 gap-y-4", layout === "split" ? "grid" : "flex flex-wrap items-center")}
      style={layout === "split" ? { gridTemplateColumns: `repeat(${perLine}, max-content)` } : undefined}
    >
      {issues.length === 0 ? (
        <span className={cn(CHIP, "border-jjm-green/40 bg-jjm-green/10", GOOD)}>
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          All OK
        </span>
      ) : (
        issues.map((i) => (
          <span key={i.label} className={cn(CHIP, "border-jjm-red/40 bg-jjm-red/10", BAD)}>
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            {i.label}:
            <span className="font-bold">{i.count}</span>
          </span>
        ))
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function OverviewCard<Row extends { id: string } & SectionRow>({
  row,
  columns,
  sections,
}: {
  row: Row;
  columns: OverviewColumn<Row>[];
  sections: OverviewSection[];
}) {
  const nameId = useId();
  const kpis = row.villageKpis ?? DEFAULT_VILLAGE_KPIS;
  const showKpis = sections.includes("villageKpis");
  const showWater = sections.includes("waterConsumption");
  const showComm = sections.includes("commStatus");
  const primary = primaryColumn(columns);
  const detailColumns = columns.filter((c) => c !== primary);
  const issues = rowIssues(row, sections);

  return (
    <AccordionItem value={row.id} className="border-0">
      <Card className={cn("rounded-lg shadow-none bg-white dark:bg-jjm-canvas", STROKE)}>
        {/* Collapsed line. The name button opens the dashboard; the rest of the
            line is the expand trigger (a button cannot sit inside another).
            The issues sit beside the name, on one line or split evenly over two
            (see useChipLayout); only when less than ~300px is left beside the name
            does the trigger drop to its own row under it. The trigger sits inside
            the accordion's <h3>, so the sizing goes on that. */}
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pl-3 pr-2 py-2 min-h-[3.5rem] [&>h3]:flex-1 [&>h3]:min-w-[min(100%,18.75rem)]">
          <div id={nameId} className="shrink-0 max-w-full [&>div]:items-start [&>div]:text-left">
            {primary.cell(row)}
          </div>
          <AccordionTrigger
            aria-labelledby={`${nameId} ${nameId}-more`}
            className="py-1 gap-3 hover:no-underline text-left [&>svg]:text-jjm-blue-light dark:[&>svg]:text-jjm-cyan"
          >
            <span id={`${nameId}-more`} className="sr-only">
              details
            </span>
            <IssueChips issues={issues} />
          </AccordionTrigger>
        </div>

        <AccordionContent className={cn("px-3 pb-3 pt-3 border-t flex flex-col gap-3", STROKE)}>
          {/* The page's other columns: header over value, as many abreast as fit.
              Table headers and stacked cells are centred for their columns; in a
              card they line up on the left with everything else. */}
          <dl className="grid grid-cols-[repeat(auto-fill,minmax(9.375rem,1fr))] gap-x-4 gap-y-3">
            {detailColumns.map((col) => (
              <div key={col.id} className="min-w-0 flex flex-col gap-1">
                <dt className={cn(LABEL, "[&>span]:justify-start")}>{col.header}</dt>
                <dd className={cn("min-w-0 break-words [&>div]:items-start [&>div]:text-left", VALUE[col.kind ?? "text"])}>
                  {col.cell(row)}
                </dd>
              </div>
            ))}
          </dl>

          {showKpis && (
            <section aria-label="Village Level" className="flex flex-col gap-2">
              <Strip>Village Level</Strip>
              {/* Side by side from md; stacked below, where three blocks squeeze
                  "0.2-0.5(mg/l)" out of its cell. */}
              <div className="grid grid-cols-1 md:grid-cols-[190fr_238fr_238fr] gap-[0.3125rem]">
                <KpiBlock
                  icon={<ThemedImg name="kpi-lpcd" w={26} h={17} />}
                  heading="LPCD"
                  labels={[">55 LPCD", "<55 LPCD"]}
                  values={[
                    { value: kpis.lpcdAbove55, tone: KPI_GOOD },
                    { value: kpis.lpcdBelow55, tone: KPI_BAD },
                  ]}
                  gapClass="gap-x-[0.3125rem]"
                />
                <KpiBlock
                  icon={<ThemedImg name="kpi-chlorine" w={18} h={18} />}
                  heading="Chlorine"
                  labels={["0.2-0.5(mg/l)", "<0.2mg/l", ">0.5mg/l"]}
                  values={[
                    { value: kpis.chlorineIdeal, tone: KPI_GOOD },
                    { value: kpis.chlorineLow, tone: KPI_BAD },
                    { value: kpis.chlorineHigh, tone: KPI_WARN },
                  ]}
                  gapClass="gap-x-1"
                />
                <KpiBlock
                  icon={<ThemedImg name="kpi-pressure" w={18} h={18} />}
                  heading="Pressure"
                  labels={[">7mh", "2-0.5(pm)", "<2mh"]}
                  values={[
                    { value: kpis.pressureHigh, tone: KPI_GOOD },
                    { value: kpis.pressureModerate, tone: KPI_WARN },
                    { value: kpis.pressureLow, tone: KPI_BAD },
                  ]}
                  gapClass="gap-x-1"
                />
              </div>
            </section>
          )}

          {(showWater || showComm) && (
            <div className={cn("grid gap-[0.3125rem]", showWater && showComm && "md:grid-cols-[1fr_2fr]")}>
              {showWater && (
                <Block icon={<ThemedImg name="water-hand-small" w={18} h={13} />} heading="Water Consumption">
                  <div className={cn("h-[calc(100%-2.1875rem)] min-h-[3.75rem] flex items-center justify-center", TEXT)}>
                    {row.waterConsumption ?? "-"}
                  </div>
                </Block>
              )}
              {showComm && <CommStatusBlock status={row.commStatus} />}
            </div>
          )}
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}

export function OverviewCards<Row extends { id: string } & SectionRow>({
  columns,
  rows,
  sections,
  isLoading,
  isError,
}: OverviewCardsProps<Row>) {
  const [open, setOpen] = useState<string[]>([]);

  if (isLoading || isError || rows.length === 0) {
    return (
      <Card
        className={cn(
          "rounded-lg shadow-none bg-white dark:bg-jjm-canvas py-10 px-3 text-center text-xs",
          STROKE,
          isError ? "text-[#DC2626] dark:text-[#FF3838]" : "text-slate-500 dark:text-slate-400"
        )}
      >
        {isLoading
          ? "Loading from PI ingestion tables…"
          : isError
            ? "Could not reach the PI mock server. Start it with `npm run mock:server`."
            : "No records for this selection."}
      </Card>
    );
  }

  const allOpen = open.length === rows.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>
          {rows.length} {rows.length === 1 ? "record" : "records"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(allOpen ? [] : rows.map((r) => r.id))}
          className="h-7 px-2 text-xs font-semibold text-jjm-blue-light hover:text-jjm-blue-light dark:text-jjm-cyan dark:hover:text-jjm-cyan hover:bg-transparent"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </Button>
      </div>
      <Accordion type="multiple" value={open} onValueChange={setOpen} className="flex flex-col gap-2">
        {rows.map((row) => (
          <OverviewCard key={row.id} row={row} columns={columns} sections={sections} />
        ))}
      </Accordion>
    </div>
  );
}
