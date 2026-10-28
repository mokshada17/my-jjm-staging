# Handoff Documentation: Jal Jeevan Mission (JJM) Unified Water Intelligence Platform

## Overall Objective
Implement the frontend user interface for the **Jal Jeevan Mission (JJM) — Maharashtra Centralized IoT Platform** directly matching the Figma design system (`yGIHly9Geo1hJwYw1Fedt6`), adhering strictly to the **Frontend Technical Guide** (`jjm_frontend_technical_guide.docx`), connecting to the mock API server at `http://localhost:3001`, with zero new external libraries, utilizing only local assets from `/src/shared/assets`, and verified by a full unit test suite and browser end-to-end flow.

---

## Summary of Pixel-Faithful Figma Implementation
The application was engineered from the **Login Page** through the full prototype navigation map with exact parity to the Figma reference frames:
1. **Command Center Dark Canvas**: Defaulted to Figma's deep midnight canvas (`#000B2A` / `#0E1526` / `#161F2E`).
2. **Login Page (`1:14812`)**:
   - Left hero panel featuring the high-clarity scenic reservoir photo (`Login_Page_Background.jpeg`), vivid blue sky, lush hills, Maharashtra map outline with *"Har Ghar Jal Har Ghar Sujal"*.
   - Headline typography: *"Unified Water \n Intelligence Platform"* with *"Platform"* in `#24D2FF`.
   - 4 Frosted glass feature cards with custom icon containers.
   - Right auth panel in solid dark navy (`#1E2638`), centered white emblem badge with Gold Lion Capital, dark inputs (`#161F2E`), bright cyan *"Sign In"* button (`#24D2FF`), and official security audit banner.
3. **Portal Landing Page (`1:14590`)**:
   - Full-bleed reservoir scenic background across the viewport.
   - Black top bar (`#000B2A`) with State Emblem on left, Commissioner profile on right.
   - Hero introduction: *"Welcome, Commissioner"* with *"Commissioner"* in cyan `#24D2FF`.
   - 3 Frosted glass portal launch cards with exact status badges (`• Operational`, `• Online`, `• Active`), checkmark features, and colored launch buttons:
     - IoT Monitoring Portal: Dark Teal (`#146A88`)
     - GIS Intelligence Portal: Amber/Gold (`#D89A14`)
     - MIS Analytics Portal: Cyan (`#24D2FF`)
   - Statewide Infrastructure Overview with `• Live Data` green badge and 6 compact stat cards.
   - Black footer bar with Har Ghar Jal branding.
4. **Enterprise Dashboard (`1:352`)**:
   - Single-screen zero-scroll command center layout on `#000B2A`.
   - Top header with Gold Lion emblem, centered title *"JJM ESR Overview Dashboard | Jal Jeevan Mission-Har Ghar Jal"*, Har Ghar Jal logo, and *"Dark"* toggle pill.
   - 9-Tier Breadcrumbs with custom icons and labels (*Maharashtra*, *Region*, *Circle*, *Division*, *Sub Division*, *Block*, *Scheme*, *Village*, *ESR*).
   - Left Column: Geographic Maharashtra map with 6 pastel regional zones (Amravati `#E8A29A`, Nagpur `#EFA885`, Sambhajinagar `#B49DD8`, Nashik `#E8D574`, Pune `#9DC88D`, Konkan `#87A987`), district labels, red headquarters pins, compass rose, and color legend.
   - Right Column: Exact 6 stacked dark modules:
     1. `IOT PROJECT OVERVIEW` (6 / 14 / 37 / 143 / 389)
     2. `METADATA RECEIVED` (6 / 10 / 22 / 84 / 147 / 276)
     3. `VILLAGES, POPULATION, HOUSEHOLD COVERED UNDER SCHEME` (4,120 / 8,321,403 / 1,878,055)
     4. `RESERVOIR INFORMATION` (6,179 / 215 / 700)
     5. `SCHEME PERFORMANCE (KPIS) TOTAL SCHEME: 389` (3 sub-columns with sub-boxes)
     6. `VILLAGE LEVEL PERFORMANCE (KPIS) TOTAL VILLAGES: 389` (identical 3 sub-columns)
   - Bottom Time Bar: Midnight `#000511` with timestamps, refresh icon, `◀ 8h ▶`, and vibrant green `Now` pill (`#00E63D`).
5. **Division Operational Dashboard (`1:4212`)**:
   - Left Column: Nagpur badge, overview grid, Demographics Covered, Reservoir Information, Functionality Statistics table, Average Supply Duration (`2.85 Hours` green), Scheme & Village KPIs.
   - Right Column:
     - `COMMUNICATION STATUS` table (Flow Meter, Chlorine, Pressure across 24h, 0-72h, 72h, Total).
     - `LITER PER CAPITA DAY (LPCD)` table (Chandrapur, Nagpur).
     - `DIVISION LEVEL PERFORMANCE FOR SCHEME (2)` table (Vyahad, Bidgaon Tarodi wss - clickable to ESR SCADA).
6. **ESR SCADA Asset Dashboard (`1:11688`)**:
   - Left Column: `ESR 3.73LL` badge, Scheme & Village details, Reservoir Details grid, `LINE DETAILS` table + Supply Duration (`8.41 hours`) + Operator Details (Shriram Bewarkule, 8202826794), and isometric SCADA Schematic (tank `3.73 LL`, `FM` badge `61.09 m³/h`, `PS` badge `2.41 bar`, `RCA` badge `0.00 mg/l`, pipe network to 3 village houses, caption `ESR 3.73 LL - 1`).
   - Right Column: `CRITICAL PARAMETERS` row (Water Consumption, Chlorine, Pressure), 3 Telemetry charts (Water consumption 5-day bars, Chlorine with threshold bands, Pressure with threshold bands), Semicircular Flow Rate needle dial (`51.09 m³/h`), and Totalizer Flow line chart (`304,412.00`).
7. **Testing Quality Gate**: 18 unit and integration tests across 6 suites in Vitest with 100% pass rate.
8. **Production Build**: Clean production build with 0 TypeScript errors in `npm run build`.

---

## How to Run

### 1. Ensure Mock API Server is Running
```bash
npm run mock:server
# or node pi-mock-server/server.js
# Confirmed listening on http://localhost:3001
```

### 2. Start Vite Development Server
```bash
npm run dev
# Server ready on http://localhost:5174 (or 5173)
```

### 3. Run Test Suite
```bash
npm run test:run
```

### 4. Verify Production Build
```bash
npm run build
```

---

## Checklist of Tasks Left to Do
- [ ] Connect live MQTT Mosquitto broker stream (`14.99.99.166:1889`) to real-time telemetry reducer in `MqttProvider`.
- [ ] Implement full Web GIS ArcGIS/MapLibre layer overlay workbench (`src/widgets/gis-map-workbench`).
- [ ] Implement virtualized MIS export engine for 1,999+ village records (`ExcelJS` / `jsPDF`).
- [ ] Connect remaining administrative tier levels (Sub-Division, Block, Scheme, Village) to PI Web API child enumeration endpoints.
