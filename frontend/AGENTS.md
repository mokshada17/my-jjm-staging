# Figma Design Fidelity & Mandatory Verification Rule

## Core Directive
Before making ANY changes to UI components, pages, layouts, tables, styling, or navigation in this project, you MUST first verify the source Figma design completely. We require exact visual and structural parity with the design—zero approximations.

## Reference Source
- **Figma Design URL**: `https://www.figma.com/design/jCK1R0xWTY970W51MjeK2V/Untitled`
  (file key `jCK1R0xWTY970W51MjeK2V`. The older key `yGIHly9Geo1hJwYw1Fedt6` is superseded.)
- **Figma Tree Specification**: `JJM_Dashboard/figma_tree.json` is **empty (0 bytes)** and has never
  been populated. Do not treat it as a source of truth until it is.
- **REST API access**: `/v1/files/*` and `/v1/images/*` are **paywalled on the Figma Starter plan**
  — they return HTTP 429 with `x-figma-plan-tier: starter` and a `Retry-After` of several days.
  A valid token is not sufficient. Either use a paid plan, or export the node tree with a Figma
  plugin (plugins run client-side and are not subject to the REST paywall).
- **Design tokens live in the file itself**: frames `2:16797` (Style Guide — Dark Theme Colors),
  `2:17016` (Light Theme Colors) and `2:17236` (Typography). Prefer these over any list in docs.

## Frame IDs
Frames use the `2:*` namespace. Every screen has a Light and a Dark variant.

| Screen | Dark | Light |
|---|---|---|
| Login | `2:14812` | `2:14912` |
| Portal Landing | `2:14590` | `2:14367` |
| Enterprise Dashboard | `2:352` | `2:10` |
| Region Dashboard / Overview | `2:2289` / `2:3135` | `2:3809` / `2:688` |
| Circle Dashboard / Overview | `2:2693` / `2:1824` | `2:1382` / `2:2056` |
| Division Dashboard / Overview | `2:4212` / `2:7856` | `2:6148` / `2:5916` |
| Sub-Division Dashboard / Overview | `2:4640` / `2:5460` | `2:6577` / `2:7396` |
| Block Dashboard / Overview | `2:5059` / `2:5690` | `2:6996` / `2:7628` |
| Scheme Dashboard / Overview | `2:10744` / `2:12808` | `2:10246` / `2:13040` |
| Village Dashboard / Overview | `2:11238` / `2:12151` | `2:13270` / `2:12393` |
| ESR Dashboard / Overview | `2:11688` / `2:12632` | `2:13722` / `2:14188` |

## Mandatory Invariants
1. **Pre-Change Verification**:
   - Always identify the exact Figma frame ID corresponding to the page or component being modified before editing code.
   - Inspect frame layers, hierarchy, text values, layout modes, paddings, borders, colors, and badge styles.
2. **Exact Visual Fidelity**:
   - Use the design tokens in `tailwind.config.js` (`jjm-*`). They were verified on 2026-09-22
     against the Style Guide frames **and** the actual fills in `2:352` / `2:10`.

     | Token | Value | Role |
     |---|---|---|
     | `jjm-canvas` | `#0E1526` | page canvas, card bodies |
     | `jjm-surface` | `#1C2D54` | elevated value tiles |
     | `jjm-border` | `#293E66` | the dominant stroke |
     | `jjm-scrubber` | `#0B0E2D` | bottom time bar |
     | `jjm-cyan` | `#24D2FF` | primary accent |
     | `jjm-blue-light` | `#1E6B8A` | light-theme primary accent |
     | `jjm-green` / `jjm-red` / `jjm-amber` | `#10B981` / `#EF4444` / `#F59E0B` | status, shared by both themes |
     | `jjm-light-bg` / `jjm-light-surface` | `#EDF4F9` / `#F1F5F9` | light-theme page and tiles |

     > **Superseded:** earlier revisions of this file listed `#000B2A`, `#0E1B38`, `#16274E`,
     > `#00E63D`, `#FFAA00`, `#FF4D4D`. Those are **not** in the design — `#000B2A` appears
     > exactly once in frame `2:352` versus 67 uses of `#0E1526`. Only `#24D2FF` was correct.
     > Do not reintroduce them.

   - Prefer the tokens over raw hex so a palette correction stays a one-file change.
   - **Sizes are rem, not px** (large-screen scaling). The root font size in
     `globals.css` is 16px up to 1920px and grows with the viewport above it
     (×1.33 at 2560, ×2 at 4K), so anything in rem scales and anything in px does
     not. Write Figma px as rem: `h-[2.1875rem]` for 35px, `rem(35)` from
     `@/shared/lib` in inline styles and icon `width`/`height`. Breakpoint variants
     (`min-[1440px]:`, `useMediaQuery`) stay in px. Canvas and SVG code that draws in
     px multiplies by `useUiScale()` (see the ECharts widgets and `PiTrend`),
     including ECharts defaults like `axisLabel.margin` (`LABEL_MARGIN`).
   - **Every screen is fitted** (`src/features/screen-fit`): from 1280px wide - laptop,
     desktop, HD TV, ultrawide, 4K, 8K - the root size is set from JS so each page
     fills the screen exactly and re-fits on any resize; the 1920 width cap is dropped.
     Below 1280px (tablets, phones) the CSS rule applies (16px, never smaller; above
     1080p it follows the smaller of width/1920 and height/1080) and the tablet layouts
     take over. A page too long to fit at 60% (`MIN_FIT`) scrolls; a page long by
     design (the Region Overview) passes `scrolls` to `DashboardLayout` and is never
     shrunk to fit its height - it keeps the screen's size and scrolls. *Wall mode* (the
     header button, which also goes fullscreen, or `?display=tv` / `?display=off`;
     remembered) keeps the screen awake and makes such a page scroll itself. Keep sizes
     in rem and avoid fixed px heights, or a page cannot be fitted.
   - Retain exact table column definitions, card groupings, and sensor metrics. Do NOT remove or approximate elements.
3. **UI Components**:
   - Use **shadcn/ui** primitives from `src/shared/components/ui` (`Card`, `Table`, `Badge`,
     `Button`, `Separator`, `Tooltip`). Add more with `npx shadcn@latest add <name>` —
     `components.json` is configured. Do NOT hand-roll replacements for these primitives.
   - `Card` already resolves `bg-card` / `border` to the verified tokens, so it needs no colour overrides.
4. **Navigation & Breadcrumbs Alignment**:
   - Breadcrumb navigation must follow the Figma prototype hierarchy (the state tab -> `/dashboard`, the other tiers -> respective Overview pages `/dashboard/:tier/overview`, row clicks -> Detail Dashboards `/dashboard/:tier/:id`). The state tab (Figma's "Maharashtra") is also the state picker; see "States" below.
5. **Post-Change Validation**:
   - Always run `npm run build` and `npm run test:run` to verify TypeScript and test integrity.
   - Capture browser screenshots to verify pixel parity with Figma.
   - An HTTP 200 on a route does **not** prove the page renders — CSS compile failures still
     return 200 for the HTML. Request the CSS module too, or check the browser overlay.
   - After editing `tailwind.config.js`, restart the dev server (and clear `node_modules/.vite`);
     Vite does not reliably re-read it for the PostCSS plugin, which surfaces as a bogus
     "class does not exist" error.

## Dashboard data source (do not reintroduce hardcoded figures)

Every tier screen reads from the PI mock server. There are no fixture files left;
`src/entities/overview/fixtures.ts` was deleted on 2026-09-23.

- **Seed**: `pi-mock-server/db.json` is **generated** — edit
  `scripts/generate-pi-db.mjs` and re-run `node scripts/generate-pi-db.mjs`.
  Hand-editing db.json will be overwritten. Its hierarchy, columns and analytics
  counters come from `PI_WEB_API_USAGE_GUIDE`; the Ambikapur
  `Proposed 1.00 LL MBR-Outlet-1` branch reproduces that document's printed JSON
  byte-for-byte, so the guide's sample responses stay valid against the mock.
- **Server**: `npm run mock:server` (port 3001, `VITE_API_URL`; runs under
  `node --watch`, so edits to `server.js` / `plot.mjs` restart it). `npm run mock:verify`
  checks the five PI endpoints **and** the guide-conformance invariants
  (§2.1 named entities, §3 templates, §5 counters vs. series, §5.4 vocabulary,
  §6.2 state codes). Run it after changing the generator.
- **Aggregation**: `src/entities/hierarchy/aggregation.ts` rebuilds the 9-tier
  tree from the four §5 ingestion tables — each row carries the full hierarchy
  (§2.4), so no AF walk is needed for tier rollups. `src/entities/overview/queries.ts`
  turns rollups into the Overview row types and `useTierSummary(tier, id)` resolves
  a `/dashboard/:tier/:id` route against the scoped branch.
- **Fetching is hierarchy-scoped — do not reintroduce a state-wide fetch.**
  `useScopedNetwork(scope, enabled)` puts the branch on the query string
  (`/api/chlorine-data?region=Nagpur&circle=Nagpur`), which the mock server
  filters server-side, and React Query caches one entry per branch. A tier page
  gets its scope from `useTierScope(tier, id)`: ancestors come from the
  breadcrumb `nodePath`, so drilling down costs **no** extra lookup, and each
  page issues exactly **5 requests** (the four §5 tables plus `demographics`).
  Pass `enabled: false` until the scope resolves so nothing fires early.
  - Pages hand the resolved `name` back to `useActiveHierarchyNode`, which is
    what lets the next tier down scope itself. Drop that and every drill-down
    silently widens to a full-table fetch.
  - A cold deep link has no breadcrumb, so it fetches the ancestor scope it can
    prove and narrows client-side by slug. A cold link to `/dashboard/region/:id`
    resolves the region name from the AF tree first.
  - `src/entities/hierarchy/scopedFetching.test.ts` and the "request shape" block
    in `piDataWiring.test.tsx` assert the *request counts*, not just the rendered
    values. They fail if a change starts fetching everything again.
- **AF tree**: walked one level at a time via `useAfRoot()` / `useAfChildren()`
  (§4 endpoints 1-2). `useAfInventory()` backs the Enterprise "IOT Project
  Overview" tile and uses PI's `searchFullHierarchy=true` — **one** request for
  the whole estate instead of one per node. The mock server implements that
  parameter along with `templateName` and `nameFilter`; they are real PI Web API
  parameters, though `PI_WEB_API_USAGE_GUIDE` does not mention them.
- **Not in PI, but still served from db.json**: the guide defines no source for
  population, households, average supply duration, reservoir category, pipe
  schedules or operator contacts. Rather than leave those as literals they are
  seeded in two non-PI collections - `demographics` and `asset_details` - both
  flagged in `_meta` and served at `/api/demographics` and `/api/asset-details`.
  **No page renders a hardcoded value any more**; `npm run mock:verify` asserts
  both collections cover every village and reservoir, so a gap surfaces as a
  failure rather than as a stale literal.
- **Known label mismatches** (Figma vs. PI, both left as-is): the Figma pressure
  columns read `>7mh / 2-0.5mh / <2mh` and some tiles read `bar`, while §5.2
  supplies metres in bands `0-7 / 7-12 / >12`. `rollup()` maps them by severity
  (standard→green, over→amber, low→red) and `formatBar()` converts head to bar.
  The AF tree spells `Amravati` and `Chhatrapati`; the Figma ribbon spells
  `Amaravati` and `Chatrapati`. `canonicalRegion()` bridges them — do not "fix"
  either side.
- **Tests**: `src/test/msw/handlers.ts` serves `db.json` itself, so the suite and
  the mock server cannot drift. `src/pages/piDataWiring.test.tsx` asserts each
  tier screen renders from the seed.

## States (switching state)

The top tier is `State`, not a hard-coded Maharashtra: an officer picks the state
from the breadcrumb's first tab, and every screen shows that state's data.

- **Registry**: `src/entities/hierarchy/states.ts` lists the states (name, region
  tabs, default region). Each is an AF root (`\\DemoAF\JJM\JJM\<State>`) and a
  value of the `state` column the generator adds to `chlorine_data`,
  `pressure_data`, `water_consumption` and `demographics`. The other tables join
  on scheme / village / ESR name, so those names must be unique across states.
  Seeded: Maharashtra (from the guide, unchanged bar the column), Gujarat and
  Madhya Pradesh.
- **Every request is state-scoped.** The chosen state lives in the store
  (`activeState`, persisted) and the path's root node (`stateRootNode`). Every
  scope carries `state` - `useAncestorScope` starts from it even for an untrusted
  path - and `useAfRoot` / `useAfInventory` / trend paths resolve the state's own
  root. A page that stays mounted across a switch must not keep state from the
  last one (see the `useTierSummary` pin key).
- **Maps**: `src/widgets/gis-map-workbench/stateMaps.ts` ties each state to its
  district geometry (`scripts/build-state-geo.mjs`) and regions (`regions.ts`).
  `StateRegionMap` fits the state clear of its legend (`stateMapLayout.ts`);
  Maharashtra keeps Figma's full-panel layout. Adding a state means a registry
  entry, a generator tree, a geometry file and a region list; `regions.test.ts`,
  `stateMapLayout.test.ts` and `mock:verify` check each one.

## Overview tables (config-driven)

The tier overview pages (`src/pages/overview/*`, all but Region) are built from a
column config: `TierOverviewPage` + `OverviewTable` in
`src/widgets/overview-master-table`. A page supplies its `columns`; the shared
Village Level / Water Consumption / Communication Status blocks come from
`sections`, and header rows, sub-header padding and the loading row's `colSpan`
are computed. Do not hand-assemble overview tables with `<TableHead>` /
`<TableCell>` markup, and do not reintroduce `leadingColumnCount` / hand-counted
`colSpan` (`OverviewMasterTable` is deprecated). Shared looks belong in a cell
`kind` or an `OpenNodeButton` variant; one-offs in a column's `className`.
See `src/widgets/overview-master-table/README.md`.

## Trends (PI Vision behaviour)

The ESR charts and the Sensor Fusion display behave like the PI Vision displays
shown in the API walkthrough recording (2026-08-25). There is no Figma frame for
the popup trend or `/dashboard/esr/:id/sensor-fusion`; they follow the recording
and the `jjm-*` tokens.

- **Data**: `pi-mock-server/plot.mjs` serves the standard PI Web API
  `/streams/{webId}/recorded` and `/streams/{webId}/plot` (first/min/max/last per
  interval). Samples are synthesised from db.json, not stored: 15-minute chlorine
  and pressure whose daily mean equals the §4 endpoint 5 summary, and one-minute
  flow that integrates to the day's `CALC - WATER CONSUMPTION PER DAY` within
  the village's supply window. A §6.2 system state plots as a gap. The MSW
  handlers import the same module; `npm run mock:verify` checks the daily means.
- **Client**: `src/entities/telemetry/trend.ts` resolves the ESR element by AF path,
  lists its attributes, then fetches plot values - only when a popup opens or the
  Sensor Fusion page mounts, so tier pages keep their request counts.
  `src/widgets/pi-trend` holds `PiTrend` (cursors, rubber-band zoom, scales, trace
  styles), `PopupTrend` (toolbar, details table, undo/redo, its own time bar) and
  the trace sets per ESR chart (`esrTraces.ts`). Chlorine/pressure limits live in
  `src/entities/telemetry/limits.ts`; do not inline them again.
- **Scheme / Village charts** open the same popup (`CriticalParameters`).
  `areaTraces.ts` builds them from each reservoir's `CALC - WATER CONSUMPTION PER DAY`:
  a trace may name its own reservoir (`source.esr`), and a `sum` source totals
  several (`sumSamples`) - Water Consumption is the total plus one trace per
  reservoir, LPCD is the total over the population against the 55 L benchmark.
  A stepped trace holds its last value into the window (a daily total written at
  midnight still counts at 15:00) for the autorange and the details table.
- **Time window**: the store keeps a span (`windowMs`) and an end
  (`windowEndsAt`, null = live). Presets are PI's 1h/8h/1d/1w/1mo (1mo is a
  calendar month); a trend zoom on Sensor Fusion sets an arbitrary span, labelled
  by `formatDuration` ("5h 3m").
- **Tests**: jsdom has no `PointerEvent` and resolves floating-ui's `:popover-open`
  / `:modal` probes pathologically slowly; `src/test/setup.ts` covers both. Without
  that shim, opening any Radix popover stalls the suite for ~12 s.

## Known design-side defects
These typos are in the Figma and are mirrored in code for parity. Fix them in Figma, then re-sync:
`LiIter Per Capita Day` (capital i), `Achiving or not achiving`, `>55 LCPD`, `Water Comption`,
and the run-together timestamps `10/11/20242:16:44PM`.
