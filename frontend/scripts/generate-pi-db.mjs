/**
 * Regenerates pi-mock-server/db.json from the hierarchy and field mappings in
 * PI_WEB_API_USAGE_GUIDE.
 *
 * Every element, attribute, WebId, value and column below traces to a specific
 * section of that document:
 *
 *   §2.1  9-tier hierarchy + element naming patterns + production examples
 *   §2.3  the canonical Ambikapur asset path
 *   §3    the three active reservoir templates
 *   §4    endpoint 1-5 response shapes
 *   §5.1  chlorine_data columns + analytics counters
 *   §5.2  pressure_data columns + analytics counters
 *   §5.3  water_consumption columns
 *   §5.4  communication_status columns + value conversion logic
 *   §6    "Pt Created" / system state codes
 *
 * The Ambikapur "Proposed 1.00 LL MBR-Outlet-1" branch reproduces the document's
 * sample JSON byte-for-byte (WebIds, GUIDs, timestamps, values), so the guide's
 * printed responses remain valid against this mock.
 *
 * The guide describes one state. The dashboard also lets an officer switch state,
 * so the AF database holds one root element per state (Maharashtra, Gujarat,
 * Madhya Pradesh) and the four hierarchy-carrying tables gain a `state` column,
 * filtered like `region`. Only Maharashtra's tree is taken from the guide; the
 * other two follow its naming patterns with their own regions (Gujarat's five
 * geographic zones, Madhya Pradesh's ten revenue divisions).
 *
 * Run: node scripts/generate-pi-db.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "..", "pi-mock-server", "db.json");

/** §2.2: the AF database; each state is a root element under it. */
const AF_DATABASE = "\\\\DemoAF\\JJM\\JJM";
const PI_HOST = "https://192.168.1.6";

/** §5: the ingestion jobs pull a rolling 7-day window ending 2026-08-25. */
const WINDOW_DATES = [
  "2026-08-19",
  "2026-08-20",
  "2026-08-21",
  "2026-08-22",
  "2026-08-23",
  "2026-08-24",
  "2026-08-25",
];

/** §3: only elements carrying one of these templates are treated as reservoirs. */
const TEMPLATES = {
  ESR: "MJP Reservoir Level - Active",
  MBR_FL_CL: "MJP Reservoir MBR FL & CL - Level - Active",
  MBR: "MJP Reservoir MBR - Level - Active",
};

/**
 * §6.2: PI system state codes returned in place of a numeric reading.
 * Kept in the guide's listed order, which is what /api/system-state-values serves.
 */
const SYSTEM_STATES = [
  { id: "pt-created", code: 253, name: "Pt Created", description: "Tag is configured in PI AF, but no hardware data has ever been received" },
  { id: "io-timeout", code: 255, name: "I/O Timeout", description: "Hardware stopped transmitting data" },
  { id: "comm-error", code: 248, name: "Comm Error", description: "Network / modem transmission error" },
  { id: "calc-failed", code: 246, name: "Calc Failed", description: "Mathematical formula failed due to missing inputs" },
];

// ---------------------------------------------------------------------------
// Hierarchy spec — §2.1 "Production Examples" column, placed under the parents
// the document's §2.2 chain and real Maharashtra administration imply.
// ---------------------------------------------------------------------------

/**
 * `webId` / `guid` are pinned where the guide prints them; everywhere else they
 * follow the same naming convention so paths stay readable in the server log.
 */
const MAHARASHTRA = {
  tier: "State",
  name: "Maharashtra",
  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_qE0yBq_k5xG_Q1AAA",
  guid: "19b484fe-bf1b-419b-a7e8-e501a3501a01",
  children: [
    {
      tier: "Region",
      name: "Region-Amravati",
      webId: "REGION_AMRAVATI_WEBID",
      children: [
        {
          tier: "Circle",
          name: "Circle-Akola",
          webId: "CIRCLE_AKOLA_WEBID",
          children: [
            {
              tier: "Division",
              name: "Division-Akola",
              webId: "DIVISION_AKOLA_WEBID",
              children: [
                {
                  tier: "SubDivision",
                  name: "Sub Division-Akola",
                  webId: "SUBDIVISION_AKOLA_WEBID",
                  children: [
                    {
                      tier: "Block",
                      name: "Block-Akola",
                      webId: "BLOCK_AKOLA_WEBID",
                      children: [
                        {
                          tier: "Scheme",
                          name: "Scheme-20027951 - Khambora 60 VRRWSS Tq. & Dist. Akola",
                          webId: "SCHEME_20027951_WEBID",
                          // Not in PI (see _meta); placeholder until the asset register supplies it.
                          waterSource: "Katepurna Dam",
                          children: [
                            {
                              tier: "Village",
                              name: "Ambikapur",
                              webId: "AMBIKAPUR_WEBID",
                              // Sized against the reservoir's daily supply so LPCD
                              // lands either side of the 55 l/person/day benchmark.
                              population: 2300,
                              households: 460,
                              avgSupplyHours: 0.93,
                              children: [
                                {
                                  tier: "Reservoir",
                                  name: "Proposed 1.00 LL MBR-Outlet-1",
                                  // §4 endpoint 2 prints both of these verbatim.
                                  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_AMBIKAPUR_MBR1_WEBID",
                                  guid: "7a3311de-3a9d-4e9e-b152-7b19810a9912",
                                  template: TEMPLATES.MBR,
                                  // Canonical asset: its attribute WebIds carry no reservoir
                                  // segment, matching the guide's printed stream URLs.
                                  attrPrefix: "",
                                  telemetry: {
                                    // §4 endpoint 5 sample response.
                                    chlorine: { series: [0.28, 0.32, 0.45, 0.38, 0.29, 0.35, 0.31], current: 0.35 },
                                    pressure: { series: [7.2, 8.1, 8.5, 7.8, 8.3, 8.0, 8.4], current: 8.4 },
                                    water: { series: [125000, 132000, 128000, 135000, 129000, 131000, 133000], current: 133000 },
                                    flow: { current: 125.5 },
                                    // §4 endpoint 4 "Communication 24hr Status = Online".
                                    comm: {
                                      chlorine: { h24: 2, h24to72: 1, h72: 1 },
                                      pressure: { h24: 2, h24to72: 1, h72: 1 },
                                      flow: { h24: 2, h24to72: 1, h72: 1 },
                                    },
                                  },
                                },
                                {
                                  tier: "Reservoir",
                                  name: "ESR 1.00 LL",
                                  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_AMBIKAPUR_ESR1_WEBID",
                                  template: TEMPLATES.ESR,
                                  attrPrefix: "ESR1",
                                  // §6: points created in AF but never wired.
                                  telemetry: {
                                    chlorine: { series: [0, 0, 0, 0, 0, 0, 0], systemState: 253 },
                                    pressure: { series: [0, 0, 0, 0, 0, 0, 0], systemState: 253 },
                                    water: { series: [0, 0, 0, 0, 0, 0, 0], systemState: 253 },
                                    flow: { systemState: 253 },
                                    comm: {
                                      chlorine: { h24: 0, h24to72: 0, h72: 1 },
                                      pressure: { h24: 0, h24to72: 0, h72: 1 },
                                      flow: { h24: 0, h24to72: 0, h72: 1 },
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    { tier: "Block", name: "Block-Barshitakali", webId: "BLOCK_BARSHITAKALI_WEBID", children: [] },
                  ],
                },
                { tier: "SubDivision", name: "Sub Division-Murtizapur", webId: "SUBDIVISION_MURTIZAPUR_WEBID", children: [] },
              ],
            },
            { tier: "Division", name: "Division-Washim", webId: "DIVISION_WASHIM_WEBID", children: [] },
          ],
        },
        { tier: "Circle", name: "Circle-Amravati", webId: "CIRCLE_AMRAVATI_WEBID", children: [] },
      ],
    },
    {
      tier: "Region",
      name: "Region-Nagpur",
      webId: "REGION_NAGPUR_WEBID",
      children: [
        {
          tier: "Circle",
          name: "Circle-Nagpur",
          webId: "CIRCLE_NAGPUR_WEBID",
          children: [
            {
              tier: "Division",
              name: "Division-Ramtek",
              webId: "DIVISION_RAMTEK_WEBID",
              children: [
                {
                  tier: "SubDivision",
                  name: "Sub Division-Ramtek",
                  webId: "SUBDIVISION_RAMTEK_WEBID",
                  children: [
                    {
                      tier: "Block",
                      name: "Block-Ramtek",
                      webId: "BLOCK_RAMTEK_WEBID",
                      children: [
                        {
                          tier: "Scheme",
                          name: "Scheme-631010 - Gobarwahi RR Retrofitting",
                          webId: "SCHEME_631010_WEBID",
                          // Not in PI (see _meta); placeholder until the asset register supplies it.
                          waterSource: "Wainganga River",
                          children: [
                            {
                              tier: "Village",
                              name: "Alesur",
                              webId: "ALESUR_WEBID",
                              population: 1800,
                              households: 360,
                              avgSupplyHours: 1.25,
                              children: [
                                {
                                  tier: "Reservoir",
                                  name: "MBR 1.75 LL",
                                  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_ALESUR_MBR175_WEBID",
                                  template: TEMPLATES.MBR_FL_CL,
                                  attrPrefix: "ALESUR_MBR175",
                                  telemetry: {
                                    chlorine: { series: [0.12, 0.15, 0.18, 0.09, 0.14, 0.16, 0.11], current: 0.11 },
                                    pressure: { series: [5.4, 6.2, 4.8, 6.9, 5.1, 6.5, 5.8], current: 5.8 },
                                    water: { series: [88000, 91000, 0, 94000, 89000, 92000, 90000], current: 90000 },
                                    flow: { current: 78.3 },
                                    comm: {
                                      chlorine: { h24: 2, h24to72: 0, h72: 0 },
                                      pressure: { h24: 0, h24to72: 1, h72: 0 },
                                      flow: { h24: 0, h24to72: 0, h72: 1 },
                                    },
                                  },
                                },
                              ],
                            },
                            {
                              tier: "Village",
                              name: "Paunarkhari",
                              webId: "PAUNARKHARI_WEBID",
                              population: 1150,
                              households: 230,
                              avgSupplyHours: 0.68,
                              children: [
                                {
                                  tier: "Reservoir",
                                  name: "ESR 1.00 LL",
                                  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_PAUNARKHARI_ESR1_WEBID",
                                  template: TEMPLATES.ESR,
                                  attrPrefix: "PAUNARKHARI_ESR1",
                                  telemetry: {
                                    chlorine: { series: [0.62, 0.71, 0.55, 0.68, 0.59, 0.74, 0.65], current: 0.65 },
                                    pressure: { series: [13.2, 14.1, 12.8, 13.9, 14.5, 13.1, 12.6], current: 12.6 },
                                    water: { series: [64000, 67000, 63000, 66000, 65000, 62000, 68000], current: 68000 },
                                    // §6.2 code 255 — hardware stopped transmitting.
                                    flow: { systemState: 255 },
                                    comm: {
                                      chlorine: { h24: 2, h24to72: 0, h72: 0 },
                                      pressure: { h24: 1, h24to72: 0, h72: 0 },
                                      flow: { h24: 0, h24to72: 0, h72: 1 },
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      tier: "Region",
      name: "Region-Pune",
      webId: "REGION_PUNE_WEBID",
      children: [{ tier: "Circle", name: "Circle-Pune", webId: "CIRCLE_PUNE_WEBID", children: [] }],
    },
    { tier: "Region", name: "Region-Nashik", webId: "REGION_NASHIK_WEBID", children: [] },
    { tier: "Region", name: "Region-Konkan", webId: "REGION_KONKAN_WEBID", children: [] },
    {
      tier: "Region",
      name: "Region-Chhatrapati Sambhajinagar",
      webId: "REGION_CHHATRAPATI_SAMBHAJINAGAR_WEBID",
      children: [],
    },
  ],
};

// ---------------------------------------------------------------------------
// Further states - not in the guide. Same §2.1 naming and §3 templates as
// Maharashtra (the reservoir templates are what marks an element a reservoir),
// one or two populated branches each and the remaining regions empty, as in
// Maharashtra. Names are unique across states: the §5 tables join on
// scheme / village / ESR name.
// ---------------------------------------------------------------------------

/** A healthy sensor's communication counts. */
const ONLINE = { h24: 2, h24to72: 1, h72: 0 };

const emptyRegion = (name) => ({
  tier: "Region",
  name: `Region-${name}`,
  webId: `REGION_${name.toUpperCase().replace(/[^A-Z]+/g, "_")}_WEBID`,
  children: [],
});

const GUJARAT = {
  tier: "State",
  name: "Gujarat",
  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_GUJARAT_ROOT_WEBID",
  children: [
    {
      tier: "Region",
      name: "Region-Central Gujarat",
      webId: "REGION_CENTRAL_GUJARAT_WEBID",
      children: [
        {
          tier: "Circle",
          name: "Circle-Vadodara",
          webId: "CIRCLE_VADODARA_WEBID",
          children: [
            {
              tier: "Division",
              name: "Division-Vadodara",
              webId: "DIVISION_VADODARA_WEBID",
              children: [
                {
                  tier: "SubDivision",
                  name: "Sub Division-Savli",
                  webId: "SUBDIVISION_SAVLI_WEBID",
                  children: [
                    {
                      tier: "Block",
                      name: "Block-Savli",
                      webId: "BLOCK_SAVLI_WEBID",
                      children: [
                        {
                          tier: "Scheme",
                          name: "Scheme-410215 - Savli Group Regional WSS",
                          webId: "SCHEME_410215_WEBID",
                          waterSource: "Mahi River",
                          children: [
                            {
                              tier: "Village",
                              name: "Manjusar",
                              webId: "MANJUSAR_WEBID",
                              population: 2100,
                              households: 420,
                              avgSupplyHours: 1.1,
                              children: [
                                {
                                  tier: "Reservoir",
                                  name: "ESR 2.50 LL",
                                  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_MANJUSAR_ESR250_WEBID",
                                  template: TEMPLATES.ESR,
                                  attrPrefix: "MANJUSAR_ESR250",
                                  telemetry: {
                                    chlorine: { series: [0.34, 0.41, 0.38, 0.29, 0.36, 0.44, 0.39], current: 0.39 },
                                    pressure: { series: [9.1, 8.7, 10.2, 9.6, 8.9, 9.8, 9.4], current: 9.4 },
                                    water: { series: [118000, 121000, 115000, 124000, 119000, 122000, 120000], current: 120000 },
                                    flow: { current: 96.4 },
                                    comm: { chlorine: ONLINE, pressure: ONLINE, flow: ONLINE },
                                  },
                                },
                              ],
                            },
                            {
                              tier: "Village",
                              name: "Samlaya",
                              webId: "SAMLAYA_WEBID",
                              population: 1400,
                              households: 280,
                              avgSupplyHours: 0.85,
                              children: [
                                {
                                  tier: "Reservoir",
                                  name: "MBR 1.20 LL",
                                  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_SAMLAYA_MBR120_WEBID",
                                  template: TEMPLATES.MBR_FL_CL,
                                  attrPrefix: "SAMLAYA_MBR120",
                                  telemetry: {
                                    // Under-chlorinated, with one day the pump never ran.
                                    chlorine: { series: [0.15, 0.12, 0.18, 0.11, 0.16, 0.14, 0.13], current: 0.13 },
                                    pressure: { series: [6.1, 5.8, 6.4, 0, 6.0, 5.7, 6.2], current: 6.2 },
                                    water: { series: [72000, 70000, 74000, 0, 71000, 73000, 69000], current: 69000 },
                                    flow: { current: 54.2 },
                                    comm: {
                                      chlorine: ONLINE,
                                      pressure: { h24: 1, h24to72: 1, h72: 0 },
                                      flow: { h24: 0, h24to72: 1, h72: 0 },
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                { tier: "SubDivision", name: "Sub Division-Padra", webId: "SUBDIVISION_PADRA_WEBID", children: [] },
              ],
            },
            { tier: "Division", name: "Division-Anand", webId: "DIVISION_ANAND_WEBID", children: [] },
          ],
        },
        { tier: "Circle", name: "Circle-Ahmedabad", webId: "CIRCLE_AHMEDABAD_WEBID", children: [] },
      ],
    },
    {
      tier: "Region",
      name: "Region-Saurashtra",
      webId: "REGION_SAURASHTRA_WEBID",
      children: [
        {
          tier: "Circle",
          name: "Circle-Rajkot",
          webId: "CIRCLE_RAJKOT_WEBID",
          children: [
            {
              tier: "Division",
              name: "Division-Rajkot",
              webId: "DIVISION_RAJKOT_WEBID",
              children: [
                {
                  tier: "SubDivision",
                  name: "Sub Division-Gondal",
                  webId: "SUBDIVISION_GONDAL_WEBID",
                  children: [
                    {
                      tier: "Block",
                      name: "Block-Gondal",
                      webId: "BLOCK_GONDAL_WEBID",
                      children: [
                        {
                          tier: "Scheme",
                          name: "Scheme-420388 - Gondal Bhadar Group WSS",
                          webId: "SCHEME_420388_WEBID",
                          waterSource: "Bhadar Dam",
                          children: [
                            {
                              tier: "Village",
                              name: "Gomta",
                              webId: "GOMTA_WEBID",
                              population: 1650,
                              households: 330,
                              avgSupplyHours: 0.75,
                              children: [
                                {
                                  tier: "Reservoir",
                                  name: "MBR 0.90 LL",
                                  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_GOMTA_MBR090_WEBID",
                                  template: TEMPLATES.MBR,
                                  attrPrefix: "GOMTA_MBR090",
                                  telemetry: {
                                    chlorine: { series: [0.52, 0.61, 0.58, 0.66, 0.55, 0.63, 0.59], current: 0.59 },
                                    pressure: { series: [12.8, 13.4, 12.9, 13.6, 12.5, 13.1, 13.3], current: 13.3 },
                                    water: { series: [83000, 85000, 82000, 86000, 84000, 87000, 85000], current: 85000 },
                                    // §6.2 code 255 - the flow meter stopped transmitting.
                                    flow: { systemState: 255 },
                                    comm: { chlorine: ONLINE, pressure: ONLINE, flow: { h24: 0, h24to72: 0, h72: 1 } },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      ...emptyRegion("North Gujarat"),
      children: [{ tier: "Circle", name: "Circle-Mehsana", webId: "CIRCLE_MEHSANA_WEBID", children: [] }],
    },
    emptyRegion("South Gujarat"),
    emptyRegion("Kutch"),
  ],
};

const MADHYA_PRADESH = {
  tier: "State",
  name: "Madhya Pradesh",
  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_MADHYA_PRADESH_ROOT_WEBID",
  children: [
    {
      tier: "Region",
      name: "Region-Bhopal",
      webId: "REGION_BHOPAL_WEBID",
      children: [
        {
          tier: "Circle",
          name: "Circle-Bhopal",
          webId: "CIRCLE_BHOPAL_WEBID",
          children: [
            {
              tier: "Division",
              name: "Division-Sehore",
              webId: "DIVISION_SEHORE_WEBID",
              children: [
                {
                  tier: "SubDivision",
                  name: "Sub Division-Ashta",
                  webId: "SUBDIVISION_ASHTA_WEBID",
                  children: [
                    {
                      tier: "Block",
                      name: "Block-Ashta",
                      webId: "BLOCK_ASHTA_WEBID",
                      children: [
                        {
                          tier: "Scheme",
                          name: "Scheme-512407 - Ashta Multi Village Scheme",
                          webId: "SCHEME_512407_WEBID",
                          waterSource: "Parbati River",
                          children: [
                            {
                              tier: "Village",
                              name: "Kajlas",
                              webId: "KAJLAS_WEBID",
                              population: 1950,
                              households: 390,
                              avgSupplyHours: 1.05,
                              children: [
                                {
                                  tier: "Reservoir",
                                  name: "ESR 2.00 LL",
                                  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_KAJLAS_ESR200_WEBID",
                                  template: TEMPLATES.ESR,
                                  attrPrefix: "KAJLAS_ESR200",
                                  telemetry: {
                                    chlorine: { series: [0.25, 0.31, 0.28, 0.35, 0.3, 0.27, 0.33], current: 0.33 },
                                    pressure: { series: [8.4, 7.9, 8.8, 8.1, 7.6, 8.5, 8.2], current: 8.2 },
                                    water: { series: [108000, 104000, 111000, 106000, 109000, 103000, 107000], current: 107000 },
                                    flow: { current: 88.6 },
                                    comm: { chlorine: ONLINE, pressure: ONLINE, flow: ONLINE },
                                  },
                                },
                              ],
                            },
                            {
                              tier: "Village",
                              name: "Mainana",
                              webId: "MAINANA_WEBID",
                              population: 1250,
                              households: 250,
                              avgSupplyHours: 0.7,
                              children: [
                                {
                                  tier: "Reservoir",
                                  name: "MBR 0.75 LL",
                                  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_MAINANA_MBR075_WEBID",
                                  template: TEMPLATES.MBR,
                                  attrPrefix: "MAINANA_MBR075",
                                  telemetry: {
                                    // §6.2 code 248 - the chlorine analyser's modem drops out.
                                    chlorine: { series: [0, 0, 0, 0, 0, 0, 0], systemState: 248 },
                                    pressure: { series: [4.2, 4.8, 3.9, 4.5, 4.1, 4.6, 4.4], current: 4.4 },
                                    water: { series: [61000, 58000, 63000, 60000, 62000, 59000, 64000], current: 64000 },
                                    flow: { current: 41.8 },
                                    comm: { chlorine: { h24: 0, h24to72: 0, h72: 1 }, pressure: ONLINE, flow: ONLINE },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            { tier: "Division", name: "Division-Raisen", webId: "DIVISION_RAISEN_WEBID", children: [] },
          ],
        },
        { tier: "Circle", name: "Circle-Vidisha", webId: "CIRCLE_VIDISHA_WEBID", children: [] },
      ],
    },
    {
      tier: "Region",
      name: "Region-Indore",
      webId: "REGION_INDORE_WEBID",
      children: [
        {
          tier: "Circle",
          name: "Circle-Indore",
          webId: "CIRCLE_INDORE_WEBID",
          children: [
            {
              tier: "Division",
              name: "Division-Dhar",
              webId: "DIVISION_DHAR_WEBID",
              children: [
                {
                  tier: "SubDivision",
                  name: "Sub Division-Badnawar",
                  webId: "SUBDIVISION_BADNAWAR_WEBID",
                  children: [
                    {
                      tier: "Block",
                      name: "Block-Badnawar",
                      webId: "BLOCK_BADNAWAR_WEBID",
                      children: [
                        {
                          tier: "Scheme",
                          name: "Scheme-513122 - Badnawar Group Water Supply",
                          webId: "SCHEME_513122_WEBID",
                          waterSource: "Mahi Dam",
                          children: [
                            {
                              tier: "Village",
                              name: "Kod",
                              webId: "KOD_WEBID",
                              population: 2400,
                              households: 480,
                              avgSupplyHours: 1.2,
                              children: [
                                {
                                  tier: "Reservoir",
                                  name: "MBR 2.25 LL",
                                  webId: "E0k-7zR3_XEEa5vK9QdYwAAA_KOD_MBR225_WEBID",
                                  template: TEMPLATES.MBR_FL_CL,
                                  attrPrefix: "KOD_MBR225",
                                  telemetry: {
                                    chlorine: { series: [0.48, 0.55, 0.51, 0.44, 0.58, 0.49, 0.53], current: 0.53 },
                                    pressure: { series: [11.2, 12.5, 11.8, 12.9, 11.5, 12.2, 11.9], current: 11.9 },
                                    water: { series: [131000, 128000, 135000, 0, 133000, 130000, 134000], current: 134000 },
                                    flow: { current: 112.4 },
                                    comm: { chlorine: ONLINE, pressure: { h24: 1, h24to72: 0, h72: 0 }, flow: ONLINE },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    ...["Jabalpur", "Gwalior", "Ujjain", "Rewa", "Sagar", "Shahdol", "Chambal", "Narmadapuram"].map(emptyRegion),
  ],
};

/** Every state root in the AF database, Maharashtra first. */
const STATE_TREES = [MAHARASHTRA, GUJARAT, MADHYA_PRADESH];

/**
 * Asset-register and O&M details. NOT part of the PI guide - PI carries sensor
 * readings, not pipe schedules or operator contacts - so these are seeded here
 * rather than written into the ESR dashboard as literals.
 */
const ASSET_DETAILS = {
  "Proposed 1.00 LL MBR-Outlet-1": {
    category: "Proposed",
    lines: {
      inlet: { size: "200MM", material: "DI K-7" },
      inletRising: { size: "250MM", material: "DI" },
      distribution: { size: "90MM", material: "PVC" },
      outlet: { size: "250MM", material: "DI K-7" },
    },
    operator: { name: "Shriram Bewarkule", contact: "8202826794" },
  },
  "ESR 1.00 LL": {
    category: "Existing",
    lines: {
      inlet: { size: "150MM", material: "DI K-7" },
      inletRising: { size: "200MM", material: "DI" },
      distribution: { size: "75MM", material: "PVC" },
      outlet: { size: "200MM", material: "DI K-9" },
    },
    operator: { name: "Vasant Deshmukh", contact: "9420117733" },
  },
  "MBR 1.75 LL": {
    category: "Existing",
    lines: {
      inlet: { size: "250MM", material: "DI K-9" },
      inletRising: { size: "300MM", material: "DI" },
      distribution: { size: "110MM", material: "HDPE" },
      outlet: { size: "300MM", material: "DI K-7" },
    },
    operator: { name: "Prakash Ingle", contact: "9890453218" },
  },
  "ESR 2.50 LL": {
    category: "Existing",
    lines: {
      inlet: { size: "300MM", material: "DI K-9" },
      inletRising: { size: "350MM", material: "DI" },
      distribution: { size: "125MM", material: "HDPE" },
      outlet: { size: "350MM", material: "DI K-7" },
    },
    operator: { name: "Hitesh Parmar", contact: "9825014471" },
  },
  "MBR 1.20 LL": {
    category: "Existing",
    lines: {
      inlet: { size: "200MM", material: "DI K-7" },
      inletRising: { size: "250MM", material: "DI" },
      distribution: { size: "90MM", material: "HDPE" },
      outlet: { size: "250MM", material: "DI K-7" },
    },
    operator: { name: "Jignesh Vasava", contact: "9909128830" },
  },
  "MBR 0.90 LL": {
    category: "Proposed",
    lines: {
      inlet: { size: "150MM", material: "DI K-7" },
      inletRising: { size: "200MM", material: "DI" },
      distribution: { size: "75MM", material: "PVC" },
      outlet: { size: "200MM", material: "DI K-7" },
    },
    operator: { name: "Bhavesh Rathod", contact: "9824650912" },
  },
  "ESR 2.00 LL": {
    category: "Existing",
    lines: {
      inlet: { size: "250MM", material: "DI K-9" },
      inletRising: { size: "300MM", material: "DI" },
      distribution: { size: "110MM", material: "HDPE" },
      outlet: { size: "300MM", material: "DI K-9" },
    },
    operator: { name: "Ramesh Malviya", contact: "9826301457" },
  },
  "MBR 0.75 LL": {
    category: "Existing",
    lines: {
      inlet: { size: "150MM", material: "DI K-7" },
      inletRising: { size: "150MM", material: "DI" },
      distribution: { size: "75MM", material: "PVC" },
      outlet: { size: "150MM", material: "DI K-7" },
    },
    operator: { name: "Santosh Kushwaha", contact: "9752218843" },
  },
  "MBR 2.25 LL": {
    category: "Proposed",
    lines: {
      inlet: { size: "300MM", material: "DI K-9" },
      inletRising: { size: "350MM", material: "DI" },
      distribution: { size: "125MM", material: "HDPE" },
      outlet: { size: "350MM", material: "DI K-9" },
    },
    operator: { name: "Dinesh Chouhan", contact: "9893376120" },
  },
};

// ---------------------------------------------------------------------------
// Attribute catalogue — §5.4 lists the 12 attributes queried per ESR; §5.1-5.3
// add "CALC - WATER CONSUMPTION PER DAY".
// ---------------------------------------------------------------------------

const SENSORS = [
  { key: "chlorine", label: "Chlorine", commLabel: "Chlorine" },
  { key: "pressure", label: "Pressure", commLabel: "Pressure" },
  { key: "flow", label: "Flow Rate", commLabel: "Flow Rate" },
];

const ATTRIBUTE_CATALOGUE = [
  { slug: "CHLORINE_ATTR", name: "Chlorine", description: "Residual Chlorine Sensor Reading", units: "mg/l", source: "chlorine" },
  { slug: "PRESSURE_ATTR", name: "Pressure", description: "Reservoir Outlet Pressure Reading", units: "m", source: "pressure" },
  { slug: "WATER_CONSUMPTION_ATTR", name: "CALC - WATER CONSUMPTION PER DAY", description: "Calculated Daily Water Consumption", units: "L", source: "water" },
  { slug: "FLOW_RATE_ATTR", name: "Flow Rate", description: "Instantaneous Flow Rate Reading", units: "L/s", source: "flow" },
  ...SENSORS.map((s) => ({
    slug: `COMM_${s.key === "flow" ? "FLOW" : s.key.toUpperCase()}_24HR`,
    name: `Communication Status - ${s.commLabel} - 24hr`,
    description: `${s.commLabel} communication status over the last 24 hours`,
    units: "",
    source: `comm.${s.key}.h24`,
  })),
  ...SENSORS.map((s) => ({
    slug: `COMM_${s.key === "flow" ? "FLOW" : s.key.toUpperCase()}_24HR_72HR`,
    name: `Communication Status - ${s.commLabel} - 24hr - 72hr`,
    description: `${s.commLabel} communication status between 24 and 72 hours`,
    units: "",
    source: `comm.${s.key}.h24to72`,
  })),
  ...SENSORS.map((s) => ({
    slug: `COMM_${s.key === "flow" ? "FLOW" : s.key.toUpperCase()}_72HR`,
    name: `Communication Status - ${s.commLabel} - 72hr`,
    description: `${s.commLabel} communication status beyond 72 hours`,
    units: "",
    source: `comm.${s.key}.h72`,
  })),
];

/**
 * Attribute GUIDs the guide prints verbatim. Everything else gets a deterministic
 * hash-derived GUID, which PI would assign arbitrarily anyway.
 */
const PINNED_ATTRIBUTE_GUIDS = {
  // §4 Endpoint 3, "Real JSON Response".
  "A0k-7zR3_XEEa5vK9QdYwAAA_CHLORINE_ATTR_WEBID": "9b1285ef-1a3b-4c2d-9e11-881a2b3c4d5e",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** §5.1: dates are stored formatted as "19-Aug". */
function shortDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${String(d.getUTCDate()).padStart(2, "0")}-${month}`;
}

/** Deterministic GUID-shaped id so regenerating the file produces no diff noise. */
function pseudoGuid(seed) {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h1 ^= seed.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  const hex = (n, len) => n.toString(16).padStart(len, "0").slice(-len);
  const a = hex(h1, 8);
  const b = hex(Math.imul(h1, 31) >>> 0, 4);
  const c = hex(Math.imul(h1, 131) >>> 0, 4);
  const d = hex(Math.imul(h1, 17) >>> 0, 4);
  const e = hex(Math.imul(h1, 8191) >>> 0, 8) + hex(Math.imul(h1, 7) >>> 0, 4);
  return `${a}-${b}-${c}-${d}-${e.slice(0, 12)}`;
}

function attrWebId(prefix, slug) {
  return `A0k-7zR3_XEEa5vK9QdYwAAA_${prefix ? `${prefix}_` : ""}${slug}_WEBID`;
}

function systemStateValue(code) {
  const meta = SYSTEM_STATES.find((s) => s.code === code);
  return { Name: meta.name, Value: code, IsSystem: true };
}

/** Reads a "comm.chlorine.h24"-style path out of a reservoir's telemetry spec. */
function resolveSource(telemetry, source) {
  return source.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), telemetry);
}

// ---------------------------------------------------------------------------
// Walk the tree
// ---------------------------------------------------------------------------

const elements = [];
const elementChildren = [];
const attributes = [];
const streamValues = [];
const streamSummaries = [];
const reservoirs = [];
const demographics = [];

/**
 * `waterSource` is set on scheme nodes and handed down to their villages. It is
 * kept out of `ancestry` on purpose: ancestry is spread into the §5 tables, which
 * must stay exactly as the PI guide prints them.
 */
function walk(node, parent, ancestry, waterSource) {
  const source = node.waterSource ?? waterSource;
  const afPath = `${parent ? parent.afPath : AF_DATABASE}\\${node.name}`;
  const guid = node.guid || pseudoGuid(afPath);
  const record = {
    id: parent ? slugify(node.name) : `${slugify(node.name)}-root`,
    ...(parent ? { parentWebId: parent.webId } : {}),
    WebId: node.webId,
    Id: guid,
    Name: node.name,
    Path: afPath,
    TemplateName: node.template || null,
    HasChildren: (node.children || []).length > 0,
  };

  if (!parent) {
    elements.push(record);
  } else {
    elementChildren.push(record);
  }

  const self = { ...node, afPath, guid };
  const nextAncestry = { ...ancestry };

  // The root element names the state; the §5 rows carry it in their `state` column.
  if (node.tier === "State") nextAncestry.state = node.name;
  // §2.4: strip the tier prefix to get the clean database value.
  if (node.tier === "Region") nextAncestry.region = node.name.replace(/^Region-/, "");
  if (node.tier === "Circle") nextAncestry.circle = node.name.replace(/^Circle-/, "");
  if (node.tier === "Division") nextAncestry.division = node.name.replace(/^Division-/, "");
  if (node.tier === "SubDivision") nextAncestry.sub_division = node.name.replace(/^Sub Division-/, "");
  if (node.tier === "Block") nextAncestry.block = node.name.replace(/^Block-/, "");
  if (node.tier === "Scheme") {
    // §2.4: regex Scheme-(ID) - (Name)
    const m = node.name.match(/^Scheme-(\d+)\s*-\s*(.+)$/);
    nextAncestry.scheme_id = m ? m[1] : node.name;
    nextAncestry.scheme_name = m ? m[2] : node.name;
  }
  if (node.tier === "Village") {
    nextAncestry.village_name = node.name.replace(/^Village-/, "");
    demographics.push({
      id: demographics.length + 1,
      ...nextAncestry,
      village_webid: node.webId,
      population: node.population ?? 0,
      households: node.households ?? 0,
      avg_supply_hours: node.avgSupplyHours ?? 0,
      water_source: source ?? "",
    });
  }
  if (node.tier === "Reservoir") {
    nextAncestry.esr_name = node.name;
    reservoirs.push({ node: self, ancestry: nextAncestry });
  }

  for (const child of node.children || []) walk(child, self, nextAncestry, source);
}

for (const tree of STATE_TREES) walk(tree, null, {});

// ---------------------------------------------------------------------------
// Attributes + streams per reservoir (§4 endpoints 3-5)
// ---------------------------------------------------------------------------

for (const { node, ancestry } of reservoirs) {
  const t = node.telemetry || {};

  for (const attr of ATTRIBUTE_CATALOGUE) {
    const webId = attrWebId(node.attrPrefix, attr.slug);
    attributes.push({
      id: `${slugify(node.attrPrefix || "mbr1")}-${slugify(attr.name)}`,
      elementWebId: node.webId,
      nameFilter: attr.name,
      WebId: webId,
      Id: PINNED_ATTRIBUTE_GUIDS[webId] || pseudoGuid(webId),
      Name: attr.name,
      Description: attr.description,
      Path: `${node.afPath}|${attr.name}`,
      Type: "Single",
      DefaultUnitsName: attr.units,
    });

    // Endpoint 4 — instantaneous value.
    const isComm = attr.source.startsWith("comm.");
    if (isComm) {
      streamValues.push({
        id: `${slugify(node.attrPrefix || "mbr1")}-${slugify(attr.name)}-value`,
        attributeWebId: webId,
        Timestamp: `${WINDOW_DATES.at(-1)}T07:30:00Z`,
        Value: resolveSource(t, attr.source) ?? 0,
        Good: true,
      });
      continue;
    }

    const spec = t[attr.source];
    if (!spec) continue;

    if (spec.systemState !== undefined) {
      streamValues.push({
        id: `${slugify(node.attrPrefix || "mbr1")}-${slugify(attr.name)}-value`,
        attributeWebId: webId,
        Timestamp: `${WINDOW_DATES.at(-1)}T00:00:00Z`,
        Value: systemStateValue(spec.systemState),
        Good: false,
      });
    } else {
      streamValues.push({
        id: `${slugify(node.attrPrefix || "mbr1")}-${slugify(attr.name)}-value`,
        attributeWebId: webId,
        Timestamp: `${WINDOW_DATES.at(-1)}T07:30:00Z`,
        Value: spec.current,
        UnitsAbbreviation: attr.units,
        Good: true,
        Questionable: false,
        Substituted: false,
      });
    }

    // Endpoint 5 — 7-day daily summary. Average for chlorine/pressure (§5.1,
    // §5.2), Total for water consumption (§5.3). Flow Rate is read live only.
    if (!spec.series) continue;
    const summaryType = attr.source === "water" ? "Total" : "Average";
    streamSummaries.push({
      id: `${slugify(node.attrPrefix || "mbr1")}-${slugify(attr.name)}-summary-${summaryType.toLowerCase()}`,
      attributeWebId: webId,
      summaryType,
      summaryDuration: "1d",
      Items: spec.series.map((value, i) => ({
        Type: summaryType,
        Value: {
          Timestamp: `${WINDOW_DATES[i]}T00:00:00Z`,
          Value: value,
          UnitsAbbreviation: attr.units,
          Good: spec.systemState === undefined,
        },
      })),
    });
  }
}

// ---------------------------------------------------------------------------
// Relational ingestion tables (§5)
// ---------------------------------------------------------------------------

const chlorine_data = [];
const chlorine_history = [];
const pressure_data = [];
const pressure_history = [];
const water_consumption = [];
const water_consumption_history = [];
const communication_status = [];
const asset_details = [];

const dashboardUrl = (afPath) => `${PI_HOST}/piwebapi/asset?path=${afPath}`;

const hierarchyColumns = (a) => ({
  state: a.state,
  region: a.region,
  circle: a.circle,
  division: a.division,
  sub_division: a.sub_division,
  block: a.block,
  scheme_id: a.scheme_id,
  scheme_name: a.scheme_name,
  village_name: a.village_name,
  esr_name: a.esr_name,
});

const countZeros = (series) => series.filter((v) => v === 0).length;

reservoirs.forEach(({ node, ancestry }, idx) => {
  const t = node.telemetry || {};
  const rowId = idx + 1;
  const url = dashboardUrl(node.afPath);

  // -- §5.1 chlorine_data -------------------------------------------------
  const cl = t.chlorine?.series ?? [];
  const clRow = { id: rowId, ...hierarchyColumns(ancestry) };
  cl.forEach((v, i) => (clRow[`chlorine_value_${i + 1}`] = v));
  cl.forEach((_, i) => (clRow[`chlorine_date_day_${i + 1}`] = shortDate(WINDOW_DATES[i])));
  clRow.number_of_consistent_zero_value_in_chlorine = countZeros(cl);
  clRow.chlorine_less_than_02_mgl = cl.filter((v) => v > 0 && v < 0.2).length;
  clRow.chlorine_between_02_05_mgl = cl.filter((v) => v >= 0.2 && v <= 0.5).length;
  clRow.chlorine_greater_than_05_mgl = cl.filter((v) => v > 0.5).length;
  clRow.dashboard_url = url;
  chlorine_data.push(clRow);
  chlorine_history.push({
    id: rowId,
    scheme_id: ancestry.scheme_id,
    village_name: ancestry.village_name,
    esr_name: ancestry.esr_name,
    reading_date: WINDOW_DATES.at(-1),
    value: cl.at(-1) ?? 0,
    unit: "mg/l",
    created_at: `${WINDOW_DATES.at(-1)}T11:23:00Z`,
  });

  // -- §5.2 pressure_data -------------------------------------------------
  const pr = t.pressure?.series ?? [];
  const prRow = { id: rowId, ...hierarchyColumns(ancestry) };
  pr.forEach((v, i) => (prRow[`pressure_value_${i + 1}`] = v));
  pr.forEach((_, i) => (prRow[`pressure_date_day_${i + 1}`] = shortDate(WINDOW_DATES[i])));
  prRow.number_of_consistent_zero_value_in_pressure = countZeros(pr);
  prRow.pressure_0_to_7_m = pr.filter((v) => v > 0 && v <= 7).length;
  prRow.pressure_7_to_12_m = pr.filter((v) => v > 7 && v <= 12).length;
  prRow.pressure_greater_than_12_m = pr.filter((v) => v > 12).length;
  prRow.dashboard_url = url;
  pressure_data.push(prRow);
  pressure_history.push({
    id: rowId,
    scheme_id: ancestry.scheme_id,
    village_name: ancestry.village_name,
    esr_name: ancestry.esr_name,
    reading_date: WINDOW_DATES.at(-1),
    value: pr.at(-1) ?? 0,
    unit: "m",
    created_at: `${WINDOW_DATES.at(-1)}T11:25:00Z`,
  });

  // -- §5.3 water_consumption ---------------------------------------------
  const wa = t.water?.series ?? [];
  const waRow = { id: rowId, ...hierarchyColumns(ancestry) };
  wa.forEach((v, i) => (waRow[`water_value_day${i + 1}`] = v));
  wa.forEach((_, i) => (waRow[`water_date_day${i + 1}`] = shortDate(WINDOW_DATES[i])));
  waRow.zero_value_count = countZeros(wa);
  waRow.dashboard_url = url;
  water_consumption.push(waRow);
  water_consumption_history.push({
    id: rowId,
    scheme_id: ancestry.scheme_id,
    village_name: ancestry.village_name,
    esr_name: ancestry.esr_name,
    reading_date: WINDOW_DATES.at(-1),
    value: wa.at(-1) ?? 0,
    unit: "L",
    created_at: `${WINDOW_DATES.at(-1)}T11:27:00Z`,
  });

  // -- asset register (not a PI table) -------------------------------------
  const asset = ASSET_DETAILS[ancestry.esr_name] ?? ASSET_DETAILS["ESR 1.00 LL"];
  asset_details.push({
    id: rowId,
    scheme_id: ancestry.scheme_id,
    village_name: ancestry.village_name,
    esr_name: ancestry.esr_name,
    reservoir_category: asset.category,
    inlet_line_size: asset.lines.inlet.size,
    inlet_line_material: asset.lines.inlet.material,
    inlet_rising_line_size: asset.lines.inletRising.size,
    inlet_rising_line_material: asset.lines.inletRising.material,
    distribution_line_size: asset.lines.distribution.size,
    distribution_line_material: asset.lines.distribution.material,
    outlet_line_size: asset.lines.outlet.size,
    outlet_line_material: asset.lines.outlet.material,
    operator_name: asset.operator.name,
    operator_contact: asset.operator.contact,
  });

  // -- §5.4 communication_status ------------------------------------------
  // Value conversion: a numeric reading means the sensor is wired ("Connected");
  // a system state means it is not. 24hr value 2 or 1 is "Online", 0 "Offline".
  const connected = (sensor) => (t[sensor]?.systemState !== undefined ? "Not Connected" : "Connected");
  const status = (sensor) => ((t.comm?.[sensor]?.h24 ?? 0) >= 1 ? "Online" : "Offline");
  const band = (sensor, key) => String(t.comm?.[sensor]?.[key] ?? 0);

  communication_status.push({
    id: rowId,
    scheme_id: ancestry.scheme_id,
    village_name: ancestry.village_name,
    esr_name: ancestry.esr_name,
    chlorine_connected: connected("chlorine"),
    pressure_connected: connected("pressure"),
    flow_meter_connected: connected("flow"),
    chlorine_status: status("chlorine"),
    pressure_status: status("pressure"),
    flow_meter_status: status("flow"),
    chlorine_0h_72h: band("chlorine", "h24to72"),
    pressure_0h_72h: band("pressure", "h24to72"),
    flow_meter_0h_72h: band("flow", "h24to72"),
    chlorine_72h: band("chlorine", "h72"),
    pressure_72h: band("pressure", "h72"),
    flow_meter_72h: band("flow", "h72"),
    last_checked_at: `${WINDOW_DATES.at(-1)}T11:29:00Z`,
  });
});

// §6.2 reference list, served at /api/system-state-values.
const systemStateValues = SYSTEM_STATES.map((meta) => ({
  id: meta.id,
  code: meta.code,
  name: meta.name,
  description: meta.description,
  Timestamp: `${WINDOW_DATES.at(-1)}T00:00:00Z`,
  Value: systemStateValue(meta.code),
  Good: false,
}));

const db = {
  _meta: {
    generatedBy: "scripts/generate-pi-db.mjs",
    source: "PI_WEB_API_USAGE_GUIDE",
    afDatabase: AF_DATABASE,
    states: STATE_TREES.map((t) => t.name),
    window: { startTime: "2026-08-18", endTime: "2026-08-25" },
    note:
      "elements/elementChildren/attributes/streamValues/streamSummaries mirror the PI Web API " +
      "responses in §4. chlorine_data, pressure_data, water_consumption and communication_status " +
      "mirror the Postgres tables the §5 cron jobs write. 'demographics' is NOT part of the PI " +
      "guide - PI carries no population, household, supply-duration or water-source figures " +
      "(water_source repeats the village's scheme source and is a placeholder) - and is seeded " +
      "here so the dashboards have a single data source instead of hardcoded values. " +
      "'asset_details' is likewise outside the guide: pipe schedules, reservoir category " +
      "and operator contacts come from the asset register, not from PI.",
  },
  elements,
  elementChildren,
  attributes,
  streamValues,
  streamSummaries,
  chlorine_data,
  chlorine_history,
  pressure_data,
  pressure_history,
  water_consumption,
  water_consumption_history,
  communication_status,
  systemStateValues,
  demographics,
  asset_details,
};

fs.writeFileSync(OUT_FILE, `${JSON.stringify(db, null, 2)}\n`, "utf-8");

console.log(`Wrote ${OUT_FILE}`);
for (const [k, v] of Object.entries(db)) {
  if (Array.isArray(v)) console.log(`  ${k.padEnd(28)} ${v.length} rows`);
}
