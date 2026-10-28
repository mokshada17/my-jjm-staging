import type { ReactNode } from "react";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui";
import { Panel, PANEL_HEADING, StatTile, ThemedImg } from "@/shared/components/figma";
import { cn } from "@/shared/utils";
import {
  formatHours,
  formatLakhLitres,
  formatLpcd,
  formatPopulation,
  type TierRollup,
} from "@/entities/hierarchy";

// Panels shared by the tier dashboards (Region, Circle, Division, Sub Division,
// Block), measured off the Figma frames - e.g. Circle 2:2693 (dark) / 2:1382 (light).

const GREEN = "text-[#0FB880]";
const RED = "text-jjm-red";
/** "0hrs-72hrs" is yellow on the dark frames and amber on the light ones. */
const CAUTION = "text-[#D87705] dark:text-[#EEF605]";
const INK = "text-black dark:text-white";

export interface SummaryTile {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

/**
 * The node's own box: its name on a pill in the title strip (35px dark / 39px
 * light), then a row of three tiles over a row of two - or two rows of three when
 * given six tiles (Scheme, Village).
 */
export function NodeSummaryPanel({
  name,
  tiles,
  pillClassName,
  headerClassName = "h-[2.4375rem] dark:h-[2.1875rem]",
}: {
  name: string;
  tiles: SummaryTile[];
  pillClassName?: string;
  headerClassName?: string;
}) {
  const tile = (t: SummaryTile, span: string) => (
    <StatTile
      key={t.label}
      className={cn(span, t.icon && "pl-2 gap-2")}
      icon={t.icon}
      label={t.label}
      value={t.value}
    />
  );
  const rowOfThree = tiles.length === 6 ? tiles : tiles.slice(0, 3);
  return (
    <Panel
      title={
        <span
          className={cn(
            "flex items-center h-[1.8125rem] w-[13.9375rem] justify-center rounded-md bg-jjm-blue-light text-sm font-bold normal-case text-white dark:h-[1.5625rem] dark:w-[13.75rem] dark:justify-start dark:pl-4 dark:rounded dark:border dark:border-[#00BCD4]",
            pillClassName,
          )}
        >
          {name}
        </span>
      }
      headerClassName={headerClassName}
      bodyClassName="grid grid-cols-6 gap-x-3 gap-y-1 px-4 py-2"
    >
      {rowOfThree.map((t) => tile(t, "col-span-2"))}
      {tiles.length === 6 ? null : tiles.slice(3).map((t) => tile(t, "col-span-3"))}
    </Panel>
  );
}

/** "Villages, Population, Household Covered under scheme". */
export function CoveragePanel({ roll }: { roll: TierRollup }) {
  return (
    <Panel title="Villages, Population, Household Covered under scheme" bodyClassName="grid grid-cols-3 gap-x-3 px-4 py-[0.3125rem]">
      <StatTile
        className="min-h-[2.5625rem]"
        valueClassName="text-sm"
        icon={<ThemedImg name="tile-villages-light" dark="tile-villages-dark" w={31} h={25} darkW={44} darkH={35} className="dark:-ml-1.5" />}
        label="Number of Villages"
        value={formatPopulation(roll.counts.villages)}
      />
      <StatTile
        className="min-h-[2.5625rem]"
        valueClassName="text-sm"
        icon={<ThemedImg name="tile-population-light" dark="tile-population-dark" w={25} h={25} darkW={35} darkH={35} />}
        label="Population"
        value={formatPopulation(roll.population)}
      />
      <StatTile
        className="min-h-[2.5625rem]"
        valueClassName="text-sm"
        icon={<ThemedImg name="tile-household-light" dark="tile-household-dark" w={34} h={25} darkW={47} darkH={35} />}
        label="Household"
        value={formatPopulation(roll.households)}
      />
    </Panel>
  );
}

/** "Reservoir Information": ESR / GSR / MBR counts. */
export function ReservoirPanel({ roll }: { roll: TierRollup }) {
  const tile = "min-h-[3.25rem] pl-2 gap-[0.1875rem]";
  return (
    <Panel title="Reservoir Information" bodyClassName="grid grid-cols-3 gap-x-3 px-4 py-[0.3125rem]">
      <StatTile
        className={tile}
        icon={<ThemedImg name="tile-esr-light" dark="tile-esr-dark" w={25} h={29} darkW={26} darkH={30} />}
        label="ESR"
        value={roll.counts.esr}
      />
      <StatTile
        className={tile}
        icon={<ThemedImg name="tile-gsr-light" dark="tile-gsr-dark" w={30} h={25} darkW={36} darkH={30} />}
        label="GSR"
        value={roll.counts.gsr}
      />
      <StatTile
        className={tile}
        icon={<ThemedImg name="tile-mbr-light" dark="tile-mbr-dark" w={25} h={25} darkW={30} darkH={30} />}
        label="MBR"
        value={roll.counts.mbr}
      />
    </Panel>
  );
}

const BOX =
  "rounded-md border border-jjm-light-stroke dark:border-jjm-border bg-jjm-light-tile dark:bg-jjm-canvas";
const CARD = "rounded-lg shadow-none bg-white dark:bg-jjm-canvas border-jjm-light-stroke dark:border-jjm-border";

function FunctionalityBox({ labels, values }: { labels: string[]; values: number[] }) {
  return (
    <div className={cn(BOX, "min-h-[3.875rem] px-1.5 flex flex-col")}>
      {/* The rule under the labels is on the dark frames only. */}
      <div className="grid grid-cols-3 text-center text-[0.625rem] text-[#0F162A] dark:text-white pt-[0.4375rem] pb-[0.1875rem] border-b border-transparent dark:border-jjm-border">
        {labels.map((l) => (
          <span key={l} className="whitespace-nowrap">{l}</span>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-3 items-center text-center text-[0.8125rem] font-bold text-[#48494A] dark:text-white">
        {values.map((v, i) => (
          <span key={i}>{v}</span>
        ))}
      </div>
    </div>
  );
}

/**
 * "Functionality Statistics" (484px) beside "Average Time Duration Water Supply per
 * Day" (262px). Both cards inset their title strips 5px, unlike the other panels.
 */
export function FunctionalityRow({ roll }: { roll: TierRollup }) {
  const { schemes, villages } = roll.functionality;
  return (
    <div className="grid grid-cols-[484fr_262fr] gap-[0.625rem]">
      <Card className={cn(CARD, "p-[0.3125rem] pb-[0.6875rem] dark:pb-[0.3125rem] flex flex-col gap-[0.375rem]")}>
        <div className="h-[1.6875rem] shrink-0 flex items-center px-2 bg-jjm-light-bg dark:bg-jjm-surface">
          <h2 className={PANEL_HEADING}>Functionality Statistics</h2>
        </div>
        {/* Grows with the card when the page column fills the screen. */}
        <div className="grow grid grid-cols-2 gap-[0.375rem]">
          <FunctionalityBox
            labels={["Total Scheme", "Functional", "Non Functional"]}
            values={[schemes.total, schemes.functional, schemes.nonFunctional]}
          />
          <FunctionalityBox
            labels={["Total Village", "Functional", "Non Functional"]}
            values={[villages.total, villages.functional, villages.nonFunctional]}
          />
        </div>
      </Card>
      <AvgSupplyCard roll={roll} />
    </div>
  );
}

/**
 * "Average Time Duration Water Supply per Day": an inset title strip over a boxed
 * green figure. The Scheme and Village frames break the heading after "Duration"
 * and set it at 13px.
 */
export function AvgSupplyCard({
  roll,
  className,
  compact = false,
}: {
  roll: TierRollup;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Card className={cn(CARD, "p-[0.3125rem] pt-[0.5938rem] dark:pt-[0.3125rem] flex flex-col gap-[0.375rem]", className)}>
      <div className={cn("shrink-0 flex items-center justify-center bg-jjm-light-bg dark:bg-jjm-surface", compact ? "h-[3.125rem]" : "h-11 px-2")}>
        <h2
          className={cn(
            "font-semibold text-center text-jjm-blue-light dark:text-jjm-cyan",
            compact ? "text-[0.8125rem] leading-4 whitespace-nowrap" : "text-sm leading-[1.0625rem]",
          )}
        >
          {compact ? "Average Time Duration" : "Average Time Duration Water"}
          <br />
          {compact ? "Water Supply per Day" : "Supply per Day"}
        </h2>
      </div>
      {/* The figure's box takes the card's remaining height. */}
      <div className={cn(BOX, "min-h-[2.375rem] grow flex items-center justify-center text-[0.625rem] font-medium", GREEN)}>
        {formatHours(roll.avgSupplyHours)}
      </div>
    </Card>
  );
}

/**
 * Right-column card: 16px padding round an inset title strip (26px dark / 41px
 * light), 13px / 14px uppercase heading.
 */
function TableCard({
  title,
  icon,
  className,
  bandClassName,
  children,
}: {
  title: ReactNode;
  icon?: ReactNode;
  className?: string;
  bandClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn(CARD, "flex flex-col px-4 pt-4 pb-[1.0625rem]", className)}>
      <div className={cn("h-[2.5625rem] dark:h-[1.625rem] shrink-0 flex items-center justify-center gap-1.5 bg-jjm-light-bg dark:bg-jjm-surface", bandClassName)}>
        {icon}
        <h2 className="text-sm dark:text-[0.8125rem] font-semibold uppercase text-jjm-blue-light dark:text-jjm-cyan">
          {title}
        </h2>
      </div>
      {children}
    </Card>
  );
}

const HEAD = "h-auto p-0 text-[0.6875rem] leading-[0.8125rem] font-semibold text-jjm-blue-light dark:text-jjm-cyan";
const ROW_RULE = "border-b border-jjm-light-stroke dark:border-jjm-border hover:bg-transparent";

/** "Communication Status": sensors online within 24h, 0-72h, past 72h. */
export function CommStatusPanel({
  roll,
  className,
  bandClassName,
}: {
  roll: TierRollup;
  className?: string;
  /** The Region frame's strip is 35px tall in dark, not 26px. */
  bandClassName?: string;
}) {
  const total = roll.counts.reservoirs;
  const sensors = [
    { name: "Flow Meter", icon: <ThemedImg name="sensor-flow" w={25} h={20} />, s: roll.commStatus.flow },
    { name: "Chlorine", icon: <ThemedImg name="kpi-chlorine" w={20} h={20} className="mx-[0.1563rem]" />, s: roll.commStatus.chlorine },
    { name: "Pressure", icon: <ThemedImg name="kpi-pressure" w={20} h={20} className="mx-[0.1563rem]" />, s: roll.commStatus.pressure },
  ];
  return (
    <TableCard
      title="Communication Status"
      className={className}
      bandClassName={bandClassName}
      icon={<ThemedImg name="comm-antenna-light" dark="comm-antenna-dark" w={25} h={27} darkW={25} darkH={25} />}
    >
      <Table className="table-fixed">
        {/* No rule under this header, unlike the LPCD and scheme tables. */}
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="hover:bg-transparent [&>th]:align-top">
            <TableHead className={cn(HEAD, "w-[23%] text-left pt-[0.5625rem] pb-[0.375rem]")}>Sensor Name</TableHead>
            <TableHead className={cn(HEAD, "w-[18%] text-center pt-[0.5625rem]")}>24hrs</TableHead>
            <TableHead className={cn(HEAD, "w-[18%] text-center pt-[0.5625rem]")}>0hrs-72hrs</TableHead>
            <TableHead className={cn(HEAD, "w-[17%] text-center pt-[0.5625rem]")}>72hrs</TableHead>
            <TableHead className={cn(HEAD, "w-[24%] text-center pt-[0.5625rem]")}>
              Total Number of
              <br />
              Sensors
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-[0.8125rem]">
          {sensors.map(({ name, icon, s }) => (
            <TableRow key={name} className={cn(ROW_RULE, "h-9 dark:h-8 last:border-0")}>
              <TableCell className={cn("p-0", INK)}>
                <span className="flex items-center gap-[0.125rem]">
                  {icon}
                  {name}
                </span>
              </TableCell>
              <TableCell className={cn("p-0 text-center font-semibold", GREEN)}>{s.h24}</TableCell>
              <TableCell className={cn("p-0 text-center font-semibold", CAUTION)}>{s.h0To72}</TableCell>
              <TableCell className={cn("p-0 text-center font-semibold", RED)}>{s.h72Plus}</TableCell>
              <TableCell className="p-0 text-center font-semibold text-jjm-canvas dark:text-white">{total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}

function ColumnHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[0.4375rem]">
      {icon}
      <span className="text-center">{children}</span>
    </span>
  );
}

const LPCD_ICON = <ThemedImg name="kpi-lpcd" w={37} h={25} />;
const WATER_ICON = <ThemedImg name="water-hand" w={26} h={25} />;

export interface ChildLpcdRow {
  key: string;
  name: string;
  title: string;
  lpcd: number;
  water: number;
  open: () => void;
}

/** "Liter Per Capita Day (LPCD)": one row per child node, opening it on click. */
export function ChildLpcdPanel({
  childLabel,
  childIcon,
  rows,
  className,
}: {
  childLabel: string;
  childIcon: ReactNode;
  rows: ChildLpcdRow[];
  className?: string;
}) {
  return (
    <TableCard title="Liter Per Capita Day (LPCD)" className={className}>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className={cn(HEAD, "w-[33%] text-left py-[0.875rem]")}>
              <span className="inline-flex items-center gap-[0.1875rem]">
                {childIcon}
                {childLabel}
              </span>
            </TableHead>
            <TableHead className={cn(HEAD, "w-[38%] text-center")}>
              <ColumnHeading icon={LPCD_ICON}>
                Liter Per Capita day (LPCD)
                <br />
                -Previous Day
              </ColumnHeading>
            </TableHead>
            <TableHead className={cn(HEAD, "w-[29%] text-right")}>
              <ColumnHeading icon={WATER_ICON}>
                Water Consumption(LL)
                <br />
                -Current Day
              </ColumnHeading>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-[0.8125rem]">
          {rows.map((row) => (
            <TableRow
              key={row.key}
              onClick={row.open}
              title={row.title}
              className={cn(ROW_RULE, "h-9 cursor-pointer")}
            >
              <TableCell className={cn("p-0", INK)}>{row.name}</TableCell>
              <TableCell className={cn("p-0 text-center font-bold", row.lpcd < 55 ? RED : INK)}>
                {formatLpcd(row.lpcd)}
              </TableCell>
              <TableCell className={cn("p-0 text-center font-bold", GREEN)}>{formatLakhLitres(row.water)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}

export interface SchemeRow {
  key: string;
  id: string;
  name: string;
  title: string;
  lpcd: number;
  water: number;
  open: () => void;
}

/** "<Tier> Level Performance for Scheme (N)": one row per scheme. */
export function SchemePerformancePanel({
  tierLabel,
  rows,
  className,
}: {
  tierLabel: string;
  rows: SchemeRow[];
  className?: string;
}) {
  return (
    <TableCard
      title={
        <>
          {tierLabel} Level Performance for Scheme <span className="ml-2">({rows.length})</span>
        </>
      }
      className={className}
    >
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className={cn(HEAD, "w-[38%] text-left py-[0.875rem]")}>
              <span className="inline-flex items-center gap-[0.125rem]">
                <ThemedImg name="tier-scheme" w={29} h={23} />
                Scheme Id &amp; Scheme Name
              </span>
            </TableHead>
            <TableHead className={cn(HEAD, "w-[33%] text-center")}>
              <ColumnHeading icon={LPCD_ICON}>
                Liter Per Capita day (LPCD)
                <br />
                -Current Day
              </ColumnHeading>
            </TableHead>
            <TableHead className={cn(HEAD, "w-[29%] text-right")}>
              <ColumnHeading icon={WATER_ICON}>
                Water Consumption(LL)
                <br />
                -Current Day
              </ColumnHeading>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.key}
              onClick={row.open}
              title={row.title}
              className={cn(ROW_RULE, "h-[3.1875rem] cursor-pointer")}
            >
              <TableCell className={cn("p-0", INK)}>
                <span className="block text-[0.6875rem]">{row.id}</span>
                <span className="block text-[0.8125rem] font-bold">{row.name}</span>
              </TableCell>
              <TableCell className={cn("p-0 text-center text-[0.8125rem] font-bold", RED)}>{formatLpcd(row.lpcd)}</TableCell>
              <TableCell className={cn("p-0 text-center text-[0.8125rem] font-bold", GREEN)}>
                {formatLakhLitres(row.water)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
