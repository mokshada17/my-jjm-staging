# JJM Dashboard — Figma vs. Implementation Gap Analysis & Plan

Audit date: 2026-09-22. Compares the current app against the Figma design of record
(`yGIHly9Geo1hJwYw1Fedt6`) as documented in `handoff.md`, the component/tech contract in
`scratch_guide.txt`, and the invariants in `AGENTS.md`.

Baseline at time of audit: `npm run test:run` → 20 tests / 6 files passing.

---

## Figma access resolved — and AGENTS.md's palette is wrong

The second token + file key (`jCK1R0xWTY970W51MjeK2V`) returned the **full 17 MB file tree**,
so every frame is now available locally. The file has **125 frames**, including
`Style Guide — Dark Theme Colors` (2:16797), `Light Theme Colors` (2:17016) and
`Typography` (2:17236), which nobody had referenced before.

The style guide and the real fills in Enterprise Dark (2:352) / Light (2:10) agree with each
other and **contradict the palette in AGENTS.md on 7 of 8 values**:

| Token | AGENTS.md | Actual Figma | Evidence |
|---|---|---|---|
| canvas | `#000B2A` | `#0E1526` | 67 fills vs 1 |
| surface | `#0E1B38` | `#1C2D54` | 20 fills |
| border | `#16274E` | `#293E66` | 76 strokes |
| green | `#00E63D` | `#10B981` | |
| red | `#FF4D4D` | `#EF4444` | |
| amber | `#FFAA00` | `#F59E0B` | |
| time bar | `#000511` | `#0B0E2D` | |
| cyan | `#24D2FF` | `#24D2FF` | the only match |

**AGENTS.md should be corrected** — it is currently a stale source of truth that actively
misleads. The tokenisation done earlier meant fixing the whole app was one file. Light theme
also corrected: page `#EDF4F9`, tiles `#F1F5F9`, accent `#1E6B8A`. The `.dark` HSL vars in
`globals.css` had right comments but stale numbers; all five now round-trip to the exact hex.

### Typography corrected from frame data (not eyeballed)
- Module titles are **14px/700 Title Case**, not 11px uppercase.
- `Total Scheme: 389` is **cyan**, not white.
- Labels are **11px at full contrast** (`#000000`/`#FFFFFF`), not 10px muted slate.
- The theme toggle is a **light pill with `#0F172A` text in both themes**.
- IOT row 2 is **two equal halves**, not 2/3 + 1/3.
- Region names are labelled on the state map; the d3 rewrite had dropped them.

### Figma typos now mirrored in code (parity was the instruction — fix these in Figma)
`LiIter Per Capita Day` (capital i), `Achiving or not achiving`, `>55 LCPD`, `Water Comption`,
and the run-together timestamps `10/11/20242:16:44PM`. The timestamp is the one I had
previously "fixed" to add spaces — that change was itself a deviation and has been reverted.

### shadcn/ui
Canonical upstream source pulled from the registry (not written from memory) for `card`,
`table`, `badge`, `separator`, `tooltip`, `button`; `components.json` added so
`npx shadcn@latest add` works. The hand-rolled `Button` was deleted (CVA-less imitation, and
`ui/Button/` vs `ui/button.tsx` resolves ambiguously on Windows). **80 card-shaped divs across
10 files** are now shadcn `Card`. Because `bg-card`/`border` resolve to the corrected tokens,
`Card` renders the Figma colours with no overrides.

### Content audit — all 19 screens

An automated diff extracts every text node from each Figma frame and checks it against the
whole `src` tree. **14 of 19 screens now report no missing content** (was 12).

Chart legends restored on the ESR dashboard: `ThresholdLineChart` now takes `markers`
(dashed markLine + colour-coded legend entry) plus `actual` and `axisName`, matching
Figma's structure — `Actual:-` in `#FFB300`, `Max-`/`Min-` in `#00D2FF`, `Hi-` in `#F59E0B`,
`Lo-`/`HiHi-` in `#8C47E6`, axis caption in `#8FADD1`. Max/Min are derived from the live
series rather than hardcoded. A test asserts all eight legend labels render.

Also corrected: the overview tables' KPI band row was rendered flat grey, but Figma
colour-codes every band (`#22C55E` / `#FBBF24` / `#EF4444`), and the pressure mid-band reads
`2-0.5mh`, not `2-0.5(pm)`.

The residual diff entries are false positives — values now produced by interpolation or by
ECharts formatters (`16.23LL`, `51.09 m³/h`, `Actual:- 304,412.00`) rather than literal strings
in source. One genuine gap remains: the `Water Comption` axis caption on the ESR "Time
Duration Water Supply" chart.

## Progress (updated 2026-09-22)

Current: `npm run build` clean, `npm run test:run` → **38 tests / 10 files passing**.

### Map geography

`MaharashtraRegionMap` previously drew invented SVG paths — the outline was not Maharashtra
and districts were decorative. It now projects real 2011-census district boundaries with
`d3-geo` (`geoMercator().fitExtent`).

- Source: [udit-001/india-maps-data](https://github.com/udit-001/india-maps-data) (MIT).
- `scripts/build-maharashtra-geo.mjs` simplifies it (Douglas-Peucker, 0.03°, 3dp) from
  1.2 MB to **27.9 KB raw / 7.5 KB gzipped**, meeting the guide's <20 KB-class budget.
- Verified bbox lon 72.66-80.89, lat 15.61-22.03 against Maharashtra's real extent.
- `regions.ts` maps all 35 districts to the six MJP divisions, with the Figma pastel fills
  and real regional-HQ coordinates for the pins. `regions.test.ts` asserts the mapping is
  total and that every label and pin projects inside the viewBox.

Two caveats: the dataset merges Mumbai City and Mumbai Suburban into one "Mumbai" feature
(Maharashtra officially has 36 districts), and district labels are placed at projected
centroids, so a concave district can place its label slightly off-centre.

**Region drill-down.** Clicking any of the six zones on the state map now routes to
`/dashboard/region/:id` (previously only Nagpur was wired; the other five did nothing).
`RegionDistrictMap` re-projects that region's districts on their own — not a crop of the
state view — replacing another hand-drawn blob that always showed Nagpur regardless of route.

Because the regions differ so much in shape (Konkan is a 0.38-aspect coastal ribbon, Amravati
is 1.26), a fixed viewBox letterboxed Konkan to 30% of the panel. Each region is therefore
projected into a square reference frame and the viewBox cropped to its own bounds, with font
sizes and stroke widths scaled to that crop, and the SVG sized by height with auto width. Every
region keeps true proportions and similar visual weight. `regions.test.ts` asserts all six
project with every district path, label and HQ pin in bounds; all six routes plus an invalid
one were smoke-tested against the dev server (the invalid one renders a "no boundary data"
placeholder rather than crashing).

| Item | State |
|---|---|
| P0-0 Figma source of truth | **Blocked** — needs Figma access, cannot be done from here |
| P0-1 Map light theme | Done |
| P0-1 Real map geography (state) | Done — hand-drawn SVG replaced with d3-geo + real district boundaries |
| P0-1 Real map geography (region) | Done — region dashboard now projects the clicked region's own districts |
| P0-1 Emoji placeholders | Done — **27** occurrences across 12 files, not the 2 the audit listed |
| P0-1 Scrubber timestamps | Done — now formatted and driven by store state |
| P0-1 Breadcrumb node names | Done |
| P0-1 Notification bell | **Deferred** — cannot verify against Figma while P0-0 is blocked |
| P0-2 ECharts | Done — all 5 charts, gauge needle now value-driven |
| P0-3 Telemetry data wiring | Done for ESR SCADA (consumption, chlorine, pressure, totalizer) |
| P0-3 Enterprise dashboard counts | **Blocked** — no mock/PI endpoint serves these figures |
| P0-3 MQTT | Provider bug fixed + rAF dispatch into store; no page subscribes yet (topic scheme unknown) |
| P1-1 `PerformanceKpiCard` | Done — the inline Scheme/Village duplication is gone |
| P1-1 Other 4 components | **Not done** — see note below; they are not "missing", they are inlined 5-10× |
| P1-2 `select-hierarchy-node` slice | Done |
| P1-2 Delete duplicate pages | Done — 8 unrouted files removed (`git rm`, recoverable) |
| P1-3 Zustand store | Done — all six slices |
| P1-4 Sticky two-row header | Done |
| P1-4 Row virtualization | **Deliberately not done** — every fixture has 1 row; premature until P0-3 |
| P2-1 Palette tokens | Done — 1,662 arbitrary values across 38 files; emitted CSS verified |
| P2-3 MSW login handler | Done |
| P2-3 SCADA + Enterprise tests | Done — 9 tests across both pages |

### Corrections to the original audit

- **The emoji count was wrong.** The audit named 2 locations; there were 27 across 12 files.
- **`.env` was already correct.** P0-3 claimed the MQTT broker needed repointing, but `.env`
  already held `14.99.99.166:1889`. Only the provider's hardcoded fallback was wrong.
- **The "duplicate" overview pages were one-line re-export shims.** An earlier revision of
  this document claimed they were divergent copies differing by 82-240 lines. That was a
  misreading: `diff` was comparing a 72-byte shim
  (`export { BlockOverviewPage } from "@/pages/overview/BlockOverviewPage";`) against the full
  page, so the line count reflected the page, not a divergence. Removing them was safe —
  nothing imported them, since `routes.tsx` imports from `@/pages/overview`.

- **P1-1 was framed wrong.** The audit said 5 of 12 components are "missing" and 7 "exist".
  In fact `DemographicsCoverageCard`, `ReservoirSummaryCard`, `SchemePerformanceKpiCard`,
  `WeeklyConsumptionChart` and `SensorCommMatrix` exist as files but **are imported by nothing** —
  the pages inline their own divergent copies. And the "missing" five are not missing either;
  they are inlined across 5-10 pages each (`Functionality` in 5, `Previous Day` consumption in 7,
  LPCD in 10). So the real task is extraction and adoption, not authoring new files — adding five
  more unimported widgets would have made the problem worse. One extraction
  (`PerformanceKpiCard`) is done as the pattern to follow; the rest need per-page visual
  verification that this environment cannot provide.

- **P1-4's virtualization is premature.** Every `*_OVERVIEW_FIXTURES` array holds exactly one
  row, so virtualization cannot be exercised or validated, and the table takes pre-rendered
  `<tr>` children rather than row data — TanStack Table would require rewriting all 8 pages and
  the multi-cell components. The sticky two-row header was done because it helps today. Revisit
  virtualization once P0-3 supplies paginated rows.

### New issues found while implementing

- **Bundle size regressed.** ECharts took the main chunk from 1.16 MB to 1.74 MB
  (284 kB → 483 kB gzip). Route-level code splitting should be considered.
- **No browser verification is possible in this environment.** AGENTS.md invariant #4 asks for
  screenshots; there is no browser tooling here. The ESR SCADA page is covered by render tests
  against mocked API responses instead, which is weaker than pixel verification.

---

## P0-0 — BLOCKER: the Figma source of truth is empty

`figma_tree.json` is **0 bytes**. `AGENTS.md` names it as the Figma Tree Specification that
every UI change must be verified against, and no Figma MCP tool (`list_frames`, `fetch_frame`)
is wired up in the current environment.

Consequence: **invariant #1 (Pre-Change Verification) and #4 (pixel parity) cannot be
satisfied by anyone today.** Every item below is derived from prose descriptions in
`handoff.md`, not from frame geometry, so exact paddings, font sizes, and spacing remain
unverified.

- [ ] Export the frame tree for `1:14812` (Login), `1:14590` (Landing), `1:352` (Enterprise),
      `1:4212` (Division), `1:11688` (ESR SCADA) into `figma_tree.json`.
- [ ] Or configure the Figma MCP server so `fetch_frame` works, and update `AGENTS.md` to
      point at it as the primary path.
- [ ] Until one of the above lands, mark "pixel parity" claims in `handoff.md` as unverified.

---

## P0-1 — Visual fidelity breaks

### Maharashtra map has no light theme
`src/widgets/gis-map-workbench/MaharashtraRegionMap.tsx` contains **zero `dark:` variants**.
The container is hardcoded `bg-[#000B2A] border-[#16274E]` (line 22) and ~20 SVG strokes are
hardcoded `#000B2A`. The whole left column of the Enterprise Dashboard stays dark when the
header's Light toggle is on, against the dual-theme requirement.

- [ ] Add `dark:` variants to the container and convert SVG strokes to `className`-driven
      `stroke-*` utilities so they invert with the theme.

### Emoji placeholders instead of the Figma icon set
- `src/pages/enterprise-dashboard/EnterpriseDashboardPage.tsx:134` — 🏠 for Household.
- `src/pages/scada-detail-dashboard/EsrScadaDashboardPage.tsx:225` — 💧 for Water Consumption.

`scratch_guide.txt` specifies a custom typed React SVG icon set. Note the Household emoji sits
in a `#0284C7`/`#1292B2` circle while its two sibling cards use tinted rounded-square icon
containers — so it breaks the card grouping visually, not just the glyph.

- [ ] Add `HouseholdIcon` and reuse `WaterConsumptionIcon` (already in
      `src/shared/assets/icons/`), matching the sibling container treatment.

### Time scrubber timestamps are unformatted
`src/widgets/dashboard-kpi-grid/TimeScrubberBar.tsx:31,84` render the literal strings
`10/11/20242:16:44PM` and `10/11/202410:16:44PM` — date and time run together with no
separator.

- [ ] Format via `src/shared/lib/date.ts` → `10/11/2024 2:16:44 PM`.
- [ ] Drive both ends from real state rather than literals (see P0-3).

### Breadcrumbs never show the selected node
`HierarchyBreadcrumbs.tsx` renders a fixed `defaultNodes` array with generic labels —
"Region", "Circle", "Division". After drilling into Nagpur the trail still reads "Region", so
the user's position in the 9-tier hierarchy is invisible.

- [ ] Accept a resolved path and render actual node names, falling back to the tier label.

### Header is missing the notification bell
`JjmHeader.tsx` renders emblem / title / Har Ghar Jal / theme toggle only.
`src/shared/assets/icons/Notification_Bell.tsx` exists but is never imported.

- [ ] Confirm against the Figma header frame, then wire the bell + alert count.

---

## P0-2 — Charts are static SVG, not ECharts

`echarts@^6.1.0` and `echarts-for-react@^3.0.6` are installed and **imported nowhere in
`src/`**. Every telemetry visual in `EsrScadaDashboardPage.tsx:220-399` is hand-drawn SVG with
literal coordinates:

- Water Consumption "bars" are divs with hardcoded `height: "65%"` strings.
- Chlorine and Pressure "traces" are single straight `<line>` elements — they cannot show a
  real series, only a flat line.
- The Flow Rate gauge needle is a fixed `<line x1="80" y1="80" x2="72" y2="24">`; it does not
  rotate with the value.
- Totalizer Flow is a static 5-point `<polyline>`.

`scratch_guide.txt` selects ECharts specifically for the canvas renderer and 96-packet/day
throughput.

- [ ] Build `src/widgets/telemetry-charts-panel/` with ECharts components for consumption
      bars, chlorine/pressure threshold-band lines, gauge, and totalizer line.
- [ ] Make the gauge needle angle a function of the reading.
- [ ] Replace the hand-drawn SVG blocks in `EsrScadaDashboardPage.tsx`.

---

## P0-3 — No data integration anywhere

### PI Web API client is dead code
`src/shared/api/piClient.ts` defines `fetchRootElement`, `fetchChildElements`,
`fetchCommunicationStatus`, `fetchChlorineData`, `fetchPressureData`, `fetchWaterConsumption`.
The only reference in the entire `src/` tree is the re-export in `shared/api/index.ts`. **No
page or widget calls it.**

Every figure on every screen is a hardcoded literal — `6` / `14` / `37` / `143` / `389`,
`8,321,403`, `51.09 m³/h`, `304,412.00`.

- [ ] Add TanStack Query hooks per tier in `entities/hierarchy` and `entities/telemetry`.
- [ ] Replace literals in `EnterpriseDashboardPage`, `DivisionDashboardPage`, and
      `EsrScadaDashboardPage` with query data + loading/error states.

### Overview tables are single-row fixtures
All 8 overview pages map over `*_OVERVIEW_FIXTURES` from `entities/overview/fixtures.ts`; each
fixture array holds exactly **one** row. The spec calls for 1,999+ village records.

- [ ] Back the overview pages with paginated queries.

### MQTT connects and does nothing
`src/app/providers/MqttProvider.tsx`:
- Never calls `subscribe` for any topic — nothing is ever received.
- Never dispatches into a store or reducer; no `requestAnimationFrame` throttling.
- Defaults to `localhost:1883`; the spec broker is `14.99.99.166:1889`.
- **Bug:** the context value is built from `clientRef.current`, which is `null` during the
  first render. Assigning to a ref does not re-render, so `useMqtt().client` stays `null`
  forever for every consumer.

- [ ] Hold the client in state (or expose a `getClient()`) so consumers see a live client.
- [ ] Add topic subscription + rAF-throttled dispatch into the telemetry slice.
- [ ] Point `.env` at the spec broker.

---

## P1-1 — 5 of the 12 required reusable components are missing

`scratch_guide.txt` §2 defines 12 core blocks. Present: `DemographicsCoverageCard`,
`ReservoirSummaryCard`, `SensorCommMatrix`, `SchemePerformanceKpiCard`, `TimeScrubberBar`,
`WaterSupplyDurationCard`, `WeeklyConsumptionChart` (≈ #11).

Missing:
- [ ] **#5 `VillagePerformanceKpiCard`** — currently duplicated inline as Module 6 of
      `EnterpriseDashboardPage.tsx:267-347`, a near-copy of Module 5.
- [ ] **#7 `FunctionalityStatsCard`**
- [ ] **#9 `DailyWaterConsumptionCard`**
- [ ] **#10 `LpcdMetricCard`**
- [ ] **#12 `LpcdTrendChart`**

---

## P1-2 — Architecture slices absent from `src/`

Against the Feature-Sliced layout in `scratch_guide.txt` §6:

| Layer | Missing |
|---|---|
| `pages/` | `web-gis-viewer/`, `mis-analytics/` |
| `widgets/` | `telemetry-charts-panel/`, `jalmitra-assistant-drawer/`; `gis-map-workbench/` holds only the SVG map — no layers, measure, buffer, or query tools |
| `features/` | all six: `select-hierarchy-node/`, `change-time-window/`, `subscribe-telemetry/`, `acknowledge-alert/`, `export-report/`, `create-helpdesk-ticket/` |
| `entities/` | `sensor/`, `kpi/`, `asset/`, `gis-layer/`, `report/` |
| `processes/` | entire layer — `auth-session/`, `telemetry-session/` |

Also present but **not** in the spec: `features/users/` (API, hooks, page, `UserCard`).

- [ ] Create the missing slices as work on each lands; don't scaffold empty folders.
- [ ] Decide whether `features/users/` is in scope; remove if not.

### Duplicate overview pages (dead code)
Three copies of the same page names exist:
- `src/pages/overview/*OverviewPage.tsx` ← the only set `routes.tsx` imports
- `src/pages/region-dashboard/{Region,Circle,Division,SubDiv,Block}OverviewPage.tsx`
- `src/pages/scada-detail-dashboard/{Scheme,Village,Esr}OverviewPage.tsx`

- [ ] Delete the unrouted copies after confirming `pages/overview/` is the intended home.

---

## P1-3 — Zustand store covers ~10% of its spec

`src/app/store/useAppStore.ts` holds `theme` and `sidebarOpen`. `scratch_guide.txt` §3.1
requires: active 9-tier hierarchy node, time-scrubber window (8h/24h/7d), live telemetry
dictionary cache, active KPI filters, alert queue, and modal overlays.

- [ ] Add the six missing slices; wire `TimeScrubberBar` and `HierarchyBreadcrumbs` to them
      (this is what unblocks P0-1's breadcrumb and timestamp items).

---

## P1-4 — Overview table has no virtualization

`src/widgets/overview-master-table/OverviewMasterTable.tsx` is a plain `<table>` with
`children` rows (57 lines). `@tanstack/react-table` and `@tanstack/react-virtual` are
installed but unused. At 1,999+ rows this will not hold up.

- [ ] Rebuild on TanStack Table + `react-virtual` with sticky two-row headers.

---

## P2-1 — Figma palette is not tokenized

`tailwind.config.js` defines only generic shadcn HSL vars. The JJM palette from `AGENTS.md`
(`#000B2A`, `#0E1B38`, `#16274E`, `#24D2FF`, `#00E63D`, `#FFAA00`, `#FF4D4D`) is repeated as
arbitrary values like `dark:bg-[#0E1B38]` in nearly every component — `EnterpriseDashboardPage.tsx`
alone repeats the module-card class string six times.

There is no single source of truth, so a palette correction means a global find-and-replace,
and nothing prevents an off-by-one hex from creeping in.

- [ ] Add a `jjm` color scale to `tailwind.config.js`.
- [ ] Extract the repeated module-card shell into one component.
- [ ] Migrate arbitrary values to tokens.

## P2-2 — Installed but unused dependencies

`maplibre-gl`, `@turf/turf`, `exceljs`, `jspdf`, `jspdf-autotable`, `@tanstack/react-table`,
`@tanstack/react-virtual`, `echarts`, `echarts-for-react`, and the whole `d3*` family are in
`package.json` but imported nowhere in `src/`. They ship weight and imply features that do not
exist.

- [ ] Keep only what the items above consume; drop the rest.

## P2-3 — Test coverage gaps

20 tests / 6 files, all passing. Untested: `EnterpriseDashboardPage`, `EsrScadaDashboardPage`,
`DivisionDashboardPage`, all 8 overview pages, `MaharashtraRegionMap`, `TimeScrubberBar`,
`OverviewMasterTable`.

Also: the `LoginPage` suite passes while MSW logs
`intercepted a request without a matching request handler: POST http://localhost:3001/auth/login`
— the test never validates the real contract.

Playwright is required by `scratch_guide.txt` §7 and is absent from `devDependencies`.

- [ ] Add the missing `POST /auth/login` MSW handler.
- [ ] Add render/interaction tests for the untested pages.
- [ ] Add Playwright + the five critical journeys (login, drill-down, telemetry load, export, GIS).

---

## Suggested order

1. **P0-0** — restore `figma_tree.json`; nothing else can be verified without it.
2. **P1-3** then **P0-1** — the store unblocks the breadcrumb and timestamp fixes.
3. **P0-3** — data layer; makes the dashboards real.
4. **P0-2** + **P1-4** — ECharts and the virtualized table, both on top of real data.
5. **P1-1**, **P1-2** — extract components, add slices.
6. **P2** — tokens, dependency cleanup, tests.

Per `AGENTS.md` invariant #4, run `npm run build` and `npm run test:run` after each item.
