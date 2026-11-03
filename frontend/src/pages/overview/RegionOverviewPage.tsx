import { Button, Card } from "@/shared/components/ui";
import { DashboardLayout } from "@/shared/components/layout";
import { ThemedImg } from "@/shared/components/figma";
import { useOpenHierarchyNode } from "@/features/select-hierarchy-node";
import { useRegionOverviewCards } from "@/entities/overview";
import {
  KPI_BAD,
  KPI_GOOD,
  KPI_WARN,
  KpiBlock,
} from "@/widgets/dashboard-kpi-grid/PerformanceKpiCard";

type Bands = {
  lpcd: { good: number; bad: number };
  cl: { good: number; mid: number; bad: number };
  pr: { good: number; mid: number; bad: number };
};

const STRIP = "text-xs font-semibold uppercase text-jjm-blue-light dark:text-jjm-cyan";

/**
 * Two cards abreast are ~500px wide on a 1024px landscape tablet, where
 * "0.2-0.5mg/l" just overruns its cell. Between lg and 1180px the band labels
 * drop to 9px and the block row's side padding narrows; the wording stays the
 * Figma text, and from 1180px the cards are at their design size again.
 */
const TIGHT_LABEL = "lg:max-[1179px]:text-[0.5625rem]";

/**
 * One KPI section of a region card: a 25px strip inset 10px (title and total),
 * over LPCD / Chlorine / Pressure blocks at 190 : 238 : 238.
 */
function RegionKpiSection({ title, total, kpis }: { title: string; total: string; kpis: Bands }) {
  return (
    <div>
      <div className="mx-[0.625rem] h-[1.5625rem] px-4 flex items-center justify-between bg-jjm-light-bg dark:bg-jjm-surface">
        <h3 className={STRIP}>{title}</h3>
        <span className={STRIP}>{total}</span>
      </div>
      <div className="grid grid-cols-[190fr_238fr_238fr] gap-[0.3125rem] px-[0.9375rem] lg:max-[1179px]:px-[0.5rem] pt-[0.625rem] pb-[0.625rem]">
        <KpiBlock
          icon={<ThemedImg name="kpi-lpcd" w={38} h={25} darkW={26} darkH={17} />}
          heading="LiIter Per Capita Day (LPCD)"
          labels={[">55 LPCD", "<55 LPCD"]}
          values={[
            { value: kpis.lpcd.good, tone: KPI_GOOD },
            { value: kpis.lpcd.bad, tone: KPI_BAD },
          ]}
          labelClassName={TIGHT_LABEL}
          gapClass="gap-x-[0.3125rem]"
        />
        <KpiBlock
          icon={<ThemedImg name="kpi-chlorine" w={20} h={20} />}
          heading="Chlorine(mg/l)"
          labels={["0.2-0.5mg/l", "<0.2mg/l", ">0.5mg/l"]}
          values={[
            { value: kpis.cl.good, tone: KPI_GOOD },
            { value: kpis.cl.mid, tone: KPI_WARN },
            { value: kpis.cl.bad, tone: KPI_BAD },
          ]}
          labelClassName={TIGHT_LABEL}
          gapClass="gap-x-1"
        />
        <KpiBlock
          icon={<ThemedImg name="kpi-pressure" w={20} h={20} />}
          heading="Pressure (m)"
          labels={[">0.7 m", "0.2-0.7 m", "<0.2 m"]}
          values={[
            { value: kpis.pr.good, tone: KPI_GOOD },
            { value: kpis.pr.mid, tone: KPI_WARN },
            { value: kpis.pr.bad, tone: KPI_BAD },
          ]}
          labelClassName={TIGHT_LABEL}
          gapClass="gap-x-1"
        />
      </div>
    </div>
  );
}

/**
 * Figma 2:3135 (dark) / 2:688 (light): a 705x400 card per region, two abreast.
 * Below 1024px (portrait tablets) two abreast left each card ~370px for six KPI
 * blocks, so there the cards stack one per row at roughly their design width.
 */
export function RegionOverviewPage() {
  // Rows open with their full ancestry, so the dashboard fetches only its branch.
  const openNode = useOpenHierarchyNode();
  const { rows: regions, isLoading, isError } = useRegionOverviewCards();

  return (
    // Six region cards (ten in Madhya Pradesh) run past one screen by design, so the
    // page keeps the screen's size and scrolls rather than being shrunk to fit.
    <DashboardLayout scrolls currentTier="Region" contentClassName="w-full max-w-[120rem] mx-auto px-[0.625rem] pt-4 pb-4">
      {(isLoading || isError) && (
        <div
          className={`rounded-lg border p-4 text-center text-xs mb-3 ${
            isError
              ? "border-jjm-red text-jjm-red"
              : "border-jjm-light-stroke dark:border-jjm-border text-slate-500 dark:text-slate-400"
          }`}
        >
          {isError
            ? "Could not reach the PI mock server. Start it with `npm run mock:server`."
            : "Loading regions from the PI Asset Framework…"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[0.625rem]">
        {regions.map((reg) => (
          <Card
            key={reg.key}
            className="rounded-lg shadow-none bg-white dark:bg-[#111D34] border-jjm-light-stroke dark:border-jjm-border pt-5 flex flex-col gap-[0.625rem]"
          >
            {/* Region name pill; it opens the region when the region has data. */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                disabled={!reg.hasData}
                onClick={() => openNode(reg.path)}
                title={reg.hasData ? `Drill down into ${reg.name} Region Dashboard` : undefined}
                className="w-[13.9375rem] h-[1.8125rem] dark:w-[13.75rem] dark:h-[1.5625rem] rounded-md dark:rounded dark:border dark:border-[#00BCD4] bg-jjm-blue-light hover:bg-jjm-blue-light text-sm font-semibold text-white hover:text-white disabled:opacity-100"
              >
                {reg.name}
              </Button>
            </div>

            <RegionKpiSection
              title="Scheme Level Performance (KPIs)"
              total={`Total Scheme: ${reg.totalSchemes}`}
              kpis={reg.schemeKpis}
            />
            <RegionKpiSection
              title="Village Level Performance (KPIs)"
              total={`Total Villages: ${reg.totalVillages}`}
              kpis={reg.villageKpis}
            />
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
