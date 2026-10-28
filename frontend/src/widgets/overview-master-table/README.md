# Overview tables

Every tier overview page (`/dashboard/:tier/overview`, except Region, which uses
cards) is a `TierOverviewPage` with a column config. Don't hand-assemble tables
with `<TableHead>` / `<TableCell>` markup — describe the columns instead.

## Anatomy

```
| your columns ...           | Village Level (8) | Water Consumption (1) | Communication Status (3) |
  ^ columns config             ^---------------- sections (shared, pick which) ----------------^
```

A page file is just its columns plus one line:

```tsx
const columns: OverviewColumn<CircleOverviewRow>[] = [
  { id: "region", header: "Region", cell: (r) => r.region },
  {
    id: "circle",
    header: "Circle",
    kind: "plain",
    cell: (r) => (
      <OpenNodeButton path={r.path} title="Click to view detailed Circle Dashboard">
        {r.circle}
      </OpenNodeButton>
    ),
  },
  { id: "population", header: "Population", kind: "mono", cell: (r) => r.population },
  { id: "divisions", header: "No. of Division", kind: "number", cell: (r) => r.noOfDivision },
];

export function CircleOverviewPage() {
  return <TierOverviewPage tier="Circle" useRows={useCircleOverviewRows} columns={columns} />;
}
```

The header rows, the sub-header padding and the loading row's `colSpan` are all
computed from `columns` + `sections`. There is nothing to count by hand.

## Column options (`OverviewColumn<Row>`)

| Field | Purpose |
|---|---|
| `id` | Unique key within the table. |
| `header` | Text or JSX (e.g. an icon + label). |
| `cell(row)` | What the cell shows. |
| `kind` | Cell style (default `text`): `text` bold name · `number` bold, centred · `mono` bold monospace figure · `reading` cyan sensor reading · `plain` no text styling, for cells with their own content (buttons, badges). |
| `className` | Extra classes for this column's cells, merged **over** the kind's with tailwind-merge (`text-red-500` replaces the kind's colour). |
| `headerClassName` | Extra classes for the header cell (e.g. `text-center`). |

## Table options (`TierOverviewPage` / `OverviewTable`)

| Prop | Default | Purpose |
|---|---|---|
| `sections` | `STANDARD_SECTIONS` (all three) | Which shared blocks follow the columns, in order: `"villageKpis"`, `"waterConsumption"`, `"commStatus"`. The Village Level sub-header row appears only when `villageKpis` is included. |
| `density` | `"compact"` | `"relaxed"` gives the roomier padding the ESR table uses. |

## Opening a row's dashboard

Use `<OpenNodeButton path={row.path} title="…">`. It records the row's full
ancestry before navigating, so the dashboard fetches only its branch (see the
drill-down notes in AGENTS.md). Styles: `variant="primary"` (default name pill),
`"card"` (two-line, Scheme), `"large"` (ESR).

## Changing things

- **A column on one page** — edit that page's `columns` array.
- **A look used by several pages** — add or change a `kind` in `OverviewTable.tsx`
  (`cellVariants`) or a variant in `OpenNodeButton.tsx`, so every page gets it.
  Prefer this over copying the same `className` into several pages.
- **A one-off tweak** — `className` / `headerClassName` on that column.
- **A shared block** (Village Level, Water Consumption, Communication Status) —
  change it in `sections.tsx` / `VillageLevelKpisHeader.tsx`; it applies to every table.
- **A new shared block** — add it to `SECTIONS` in `sections.tsx` with its `span`,
  header, sub-header and cells.

`OverviewMasterTable` (the old hand-assembled table) is deprecated and kept only
so open branches still build; don't use it for new work.

## Tablets: collapsible cards instead of the table

Below 1280px `TierOverviewPage` renders `OverviewCards` in place of the table: the
19-21 columns need ~1,060-1,220px and would otherwise scroll sideways. The cards
are built from the same `columns` and `sections`, so there is nothing extra to
configure.

- **Collapsed** (the default), each row is one ~56px line: its identity column
  and only its issues, each shown when above 0 - `LPCD <55`, `Chlorine out of
  range` (low + high), `Low pressure`, `Offline >72h` (summed over the three
  sensors) - or a green "All OK". Amber bands stay in the expanded card. A long
  list stays about as compact as the table and shows which rows need attention.
- The chips sit beside the name on one line; when they do not fit they split
  evenly over two lines (4 -> 2 + 2, 3 -> 2 + 1) in aligned columns. This is
  decided from the chips' measured widths (`useChipLayout`), so it adapts to the
  page's identity column - Scheme's wide ID box splits at 768-820px, Circle's
  short name keeps one line. Below ~300px of room the chips drop under the name.
- **Expanded** (tap the line, or "Expand all"), the card shows the other columns
  as label / value pairs, the LPCD / Chlorine / Pressure blocks of the Region
  Overview cards, and Water Consumption beside the Communication Status matrix.
- The identity column is the one marked `primary: true`, else the last `plain`
  column - the row's own open-dashboard button on every page today.
- A column's `kind` sets its text style in a card; `className` (a table-cell
  class) is not applied. Centred headers and stacked cells are left-aligned.

Tests run without `matchMedia`, so they always see the table.
