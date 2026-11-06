import assert from "node:assert";

const BASE_URL = "http://localhost:3001";

async function runTests() {
  console.log("Starting verification test suite against mock server...");

  // 1. API Directory & Landing Page
  console.log("Testing GET /piwebapi...");
  const infoRes = await fetch(`${BASE_URL}/piwebapi`);
  assert.strictEqual(infoRes.status, 200);
  const info = await infoRes.json();
  assert.strictEqual(info.status, "online");
  console.log("✓ API directory working");

  // 2. Endpoint 1: Resolve Root Path to WebID
  console.log("Testing Endpoint 1: Resolve Root Path to WebID...");
  const rootRes = await fetch(`${BASE_URL}/piwebapi/elements?path=\\\\DemoAF\\JJM\\JJM\\Maharashtra`);
  assert.strictEqual(rootRes.status, 200);
  const rootElem = await rootRes.json();
  assert.strictEqual(rootElem.Name, "Maharashtra");
  assert.strictEqual(rootElem.WebId, "E0k-7zR3_XEEa5vK9QdYwAAA_qE0yBq_k5xG_Q1AAA");
  assert.strictEqual(rootElem.HasChildren, true);
  assert.ok(rootElem.Links.Self, "Links.Self should exist");
  assert.ok(rootElem.Links.Elements, "Links.Elements should exist");
  assert.ok(rootElem.Links.Attributes, "Links.Attributes should exist");
  console.log("✓ Endpoint 1 root element resolved successfully");

  // 3. Follow Links.Self for Root
  console.log("Testing click on root Links.Self...");
  const rootSelfRes = await fetch(rootElem.Links.Self);
  assert.strictEqual(rootSelfRes.status, 200);
  const rootSelfData = await rootSelfRes.json();
  assert.strictEqual(rootSelfData.WebId, rootElem.WebId);
  console.log("✓ Links.Self works correctly");

  // 4. Follow Links.Elements to enumerate Regions (Endpoint 2)
  console.log("Testing click on root Links.Elements (Endpoint 2)...");
  const regionsRes = await fetch(rootElem.Links.Elements);
  assert.strictEqual(regionsRes.status, 200);
  const regionsData = await regionsRes.json();
  assert.ok(Array.isArray(regionsData.Items), "Items array should be present");
  assert.ok(regionsData.Items.length >= 1, "At least 1 region should be present");
  const amravati = regionsData.Items.find((r) => r.Name === "Region-Amravati");
  assert.ok(amravati, "Region-Amravati should be found");
  assert.ok(amravati.Links.Elements, "Region should have Links.Elements");
  console.log("✓ Level 2 (Region) resolved with Links");

  // 5. Recursively traverse down to Village -> Reservoir
  let currentElem = amravati;
  const expectedHops = [
    { level: "Circle", name: "Circle-Akola" },
    { level: "Division", name: "Division-Akola" },
    { level: "Sub-Division", name: "Sub Division-Akola" },
    { level: "Block", name: "Block-Akola" },
    { level: "Scheme", name: "Scheme-20027951 - Khambora 60 VRRWSS Tq. & Dist. Akola" },
    { level: "Village", name: "Ambikapur" },
    { level: "Reservoir", name: "Proposed 1.00 LL MBR-Outlet-1" }
  ];

  for (const hop of expectedHops) {
    console.log(`Crawling down to ${hop.level} (${hop.name})...`);
    const hopRes = await fetch(currentElem.Links.Elements);
    assert.strictEqual(hopRes.status, 200);
    const hopData = await hopRes.json();
    assert.ok(Array.isArray(hopData.Items), `Items must be array for ${hop.level}`);
    const nextElem = hopData.Items.find((i) => i.Name === hop.name);
    assert.ok(nextElem, `Child element ${hop.name} not found`);
    currentElem = nextElem;
  }

  const reservoir = currentElem;
  assert.strictEqual(reservoir.WebId, "E0k-7zR3_XEEa5vK9QdYwAAA_AMBIKAPUR_MBR1_WEBID");
  assert.strictEqual(reservoir.TemplateName, "MJP Reservoir MBR - Level - Active");
  assert.strictEqual(reservoir.HasChildren, false);
  console.log("✓ Recursive traversal down 8 tiers succeeded! All Links verified.");

  // 6. Endpoint 3: Attribute (Sensor) Discovery by Name
  console.log("Testing click on reservoir Links.Attributes (Endpoint 3)...");
  const allAttrsRes = await fetch(reservoir.Links.Attributes);
  assert.strictEqual(allAttrsRes.status, 200);
  const allAttrs = await allAttrsRes.json();
  assert.ok(Array.isArray(allAttrs.Items));
  assert.ok(allAttrs.Items.length >= 12, "Should have 12+ attributes");
  console.log(`✓ Fetched ${allAttrs.Items.length} attributes on reservoir`);

  // 6b. Test nameFilter
  console.log("Testing nameFilter=Chlorine...");
  const chlorineAttrRes = await fetch(`${reservoir.Links.Attributes}?nameFilter=Chlorine`);
  assert.strictEqual(chlorineAttrRes.status, 200);
  const chlorineAttrData = await chlorineAttrRes.json();
  assert.strictEqual(chlorineAttrData.Items.length, 1);
  const chlorineAttr = chlorineAttrData.Items[0];
  assert.strictEqual(chlorineAttr.Name, "Chlorine");
  assert.strictEqual(chlorineAttr.WebId, "A0k-7zR3_XEEa5vK9QdYwAAA_CHLORINE_ATTR_WEBID");
  assert.ok(chlorineAttr.Links.Value, "Chlorine attribute must have Links.Value");
  console.log("✓ Attribute filtering with nameFilter working");

  // 7. Endpoint 4: Click Links.Value to fetch Real-Time Instantaneous Value
  console.log("Testing click on chlorine Links.Value (Endpoint 4)...");
  const chlorineValRes = await fetch(chlorineAttr.Links.Value);
  assert.strictEqual(chlorineValRes.status, 200);
  const chlorineVal = await chlorineValRes.json();
  assert.strictEqual(chlorineVal.Value, 0.35);
  assert.strictEqual(chlorineVal.Good, true);
  assert.strictEqual(chlorineVal.UnitsAbbreviation, "mg/l");
  assert.strictEqual(chlorineVal.id, undefined, "Mock internal id should not leak");
  assert.strictEqual(chlorineVal.attributeWebId, undefined, "attributeWebId should not leak");
  console.log("✓ Real-time stream value matches PI Web API format");

  // 7b. Test System State Value (Pt Created)
  console.log("Testing System State error value (Pt Created)...");
  const ptCreatedRes = await fetch(`${BASE_URL}/piwebapi/streams/A0k-7zR3_XEEa5vK9QdYwAAA_ESR1_CHLORINE_ATTR_WEBID/value`);
  assert.strictEqual(ptCreatedRes.status, 200);
  const ptCreatedVal = await ptCreatedRes.json();
  assert.strictEqual(ptCreatedVal.Good, false);
  assert.strictEqual(ptCreatedVal.Value.Name, "Pt Created");
  assert.strictEqual(ptCreatedVal.Value.Value, 253);
  console.log("✓ System State error response working");

  // 8. Endpoint 5: 7-Day Daily Historical Summary Telemetry
  console.log("Testing 7-day Historical Summary Telemetry (Endpoint 5)...");
  const summaryRes = await fetch(
    `${BASE_URL}/piwebapi/streams/A0k-7zR3_XEEa5vK9QdYwAAA_CHLORINE_ATTR_WEBID/summary?startTime=2026-08-18&endTime=2026-08-25&summaryType=Average&summaryDuration=1d`
  );
  assert.strictEqual(summaryRes.status, 200);
  const summaryData = await summaryRes.json();
  assert.ok(Array.isArray(summaryData.Items), "Items should be an array");
  assert.strictEqual(summaryData.Items.length, 7, "Should have 7 daily summary points");
  assert.strictEqual(summaryData.Items[0].Value.Value, 0.28);
  assert.strictEqual(summaryData.Items[6].Value.Value, 0.31);
  console.log("✓ 7-day Historical Summary telemetry working");

  // 8b. Trend history (recorded / plot), which the popup trends and the Sensor
  // Fusion display read. Each day's recorded chlorine must average to that
  // day's summary, so the trends cannot contradict Endpoint 5.
  console.log("Testing trend history (/streams/{webId}/recorded and /plot)...");
  for (const [i, item] of summaryData.Items.entries()) {
    const day = item.Value.Timestamp.slice(0, 10);
    const recRes = await fetch(
      `${BASE_URL}/piwebapi/streams/A0k-7zR3_XEEa5vK9QdYwAAA_CHLORINE_ATTR_WEBID/recorded?startTime=${day}T00:00:00Z&endTime=${day}T23:59:59Z`
    );
    assert.strictEqual(recRes.status, 200);
    const rec = await recRes.json();
    assert.strictEqual(rec.Items.length, 96, `day ${i + 1}: 15-minute chlorine samples`);
    const mean = rec.Items.reduce((a, s) => a + s.Value, 0) / rec.Items.length;
    assert.ok(Math.abs(mean - item.Value.Value) < 0.005, `day ${i + 1}: recorded mean ${mean} vs summary ${item.Value.Value}`);
  }
  const plotRes = await fetch(
    `${BASE_URL}/piwebapi/streams/A0k-7zR3_XEEa5vK9QdYwAAA_FLOW_RATE_ATTR_WEBID/plot?startTime=*-31d&endTime=*&intervals=400`
  );
  assert.strictEqual(plotRes.status, 200);
  const plot = await plotRes.json();
  assert.ok(plot.Items.length > 0 && plot.Items.length <= 1601, "plot is decimated to <= 4 values per interval");
  assert.strictEqual(plot.UnitsAbbreviation, "L/s");
  const offlineRes = await fetch(`${BASE_URL}/piwebapi/streams/A0k-7zR3_XEEa5vK9QdYwAAA_ESR1_PRESSURE_ATTR_WEBID/plot?startTime=*-1d`);
  const offline = await offlineRes.json();
  assert.strictEqual(offline.Items[0].Good, false, "a point in a system state plots no good data");
  assert.strictEqual(offline.Items[0].Value.Name, "Pt Created");
  console.log("✓ Trend history agrees with the daily summaries");

  // 9. Relational Ingestion Tables APIs
  console.log("Testing Ingestion REST APIs (/api/chlorine-data, etc.)...");
  const chlorineDataRes = await fetch(`${BASE_URL}/api/chlorine-data?scheme_id=20027951`);
  assert.strictEqual(chlorineDataRes.status, 200);
  const chlorineTable = await chlorineDataRes.json();
  // Scheme 20027951 covers Ambikapur, which carries both an MBR and an ESR.
  assert.strictEqual(chlorineTable.length, 2);
  const ambikapurMbr = chlorineTable.find(
    (r) => r.esr_name === "Proposed 1.00 LL MBR-Outlet-1"
  );
  assert.ok(ambikapurMbr, "Ambikapur MBR row should be present");
  assert.strictEqual(ambikapurMbr.scheme_id, "20027951");
  assert.strictEqual(ambikapurMbr.chlorine_value_7, 0.31);

  const commStatusRes = await fetch(`${BASE_URL}/api/communication-status`);
  assert.strictEqual(commStatusRes.status, 200);
  const commTable = await commStatusRes.json();
  assert.strictEqual(
    commTable.find((r) => r.esr_name === "Proposed 1.00 LL MBR-Outlet-1").chlorine_status,
    "Online"
  );
  console.log("✓ Relational ingestion REST endpoints working");

  // 10. Guide conformance: 2.1 production examples, 3 templates, 5 counters
  console.log("Testing guide conformance of the seeded dataset...");

  const [water, chlorineAll, pressureAll, commAll, demographics, assets] = await Promise.all(
    [
      "water-consumption",
      "chlorine-data",
      "pressure-data",
      "communication-status",
      "demographics",
      "asset-details",
    ].map((c) => fetch(`${BASE_URL}/api/${c}`).then((r) => r.json()))
  );

  // Every named production example in 2.1 must exist somewhere in the tree.
  for (const [field, expected] of [
    ["region", ["Amravati", "Nagpur"]],
    ["circle", ["Akola", "Nagpur"]],
    ["division", ["Akola", "Ramtek"]],
    ["sub_division", ["Akola", "Ramtek"]],
    ["block", ["Akola", "Ramtek"]],
    ["scheme_id", ["20027951", "631010"]],
    ["village_name", ["Ambikapur", "Alesur", "Paunarkhari"]],
  ]) {
    const present = new Set(water.map((r) => r[field]));
    for (const name of expected) {
      assert.ok(present.has(name), `2.1 example missing from ${field}: ${name}`);
    }
  }

  // 5.1 / 5.2: the analytics counters must agree with the stored 7-day series.
  const bandCount = (row, prefix, pred) => {
    let n = 0;
    for (let d = 1; d <= 7; d++) {
      const v = row[`${prefix}${d}`];
      if (v !== undefined && pred(Number(v))) n += 1;
    }
    return n;
  };

  for (const row of chlorineAll) {
    const at = `${row.village_name}/${row.esr_name}`;
    assert.strictEqual(row.chlorine_less_than_02_mgl, bandCount(row, "chlorine_value_", (v) => v > 0 && v < 0.2), `chlorine <0.2 counter wrong for ${at}`);
    assert.strictEqual(row.chlorine_between_02_05_mgl, bandCount(row, "chlorine_value_", (v) => v >= 0.2 && v <= 0.5), `chlorine 0.2-0.5 counter wrong for ${at}`);
    assert.strictEqual(row.chlorine_greater_than_05_mgl, bandCount(row, "chlorine_value_", (v) => v > 0.5), `chlorine >0.5 counter wrong for ${at}`);
    assert.strictEqual(row.number_of_consistent_zero_value_in_chlorine, bandCount(row, "chlorine_value_", (v) => v === 0), `chlorine zero counter wrong for ${at}`);
  }

  for (const row of pressureAll) {
    const at = `${row.village_name}/${row.esr_name}`;
    assert.strictEqual(row.pressure_0_to_7_m, bandCount(row, "pressure_value_", (v) => v > 0 && v <= 7), `pressure 0-7 counter wrong for ${at}`);
    assert.strictEqual(row.pressure_7_to_12_m, bandCount(row, "pressure_value_", (v) => v > 7 && v <= 12), `pressure 7-12 counter wrong for ${at}`);
    assert.strictEqual(row.pressure_greater_than_12_m, bandCount(row, "pressure_value_", (v) => v > 12), `pressure >12 counter wrong for ${at}`);
  }

  // 5.3: zero_value_count must match the water series.
  for (const row of water) {
    assert.strictEqual(row.zero_value_count, bandCount(row, "water_value_day", (v) => v === 0), `zero_value_count wrong for ${row.esr_name}`);
  }

  // The four tables upsert on the same key, so they must line up one to one.
  const rowKey = (r) => `${r.scheme_id}|${r.village_name}|${r.esr_name}`;
  const waterKeys = new Set(water.map(rowKey));
  for (const [name, table] of [["chlorine_data", chlorineAll], ["pressure_data", pressureAll], ["communication_status", commAll]]) {
    assert.strictEqual(table.length, water.length, `${name} row count differs from water_consumption`);
    for (const row of table) {
      assert.ok(waterKeys.has(rowKey(row)), `${name} has an orphan row: ${rowKey(row)}`);
    }
  }

  // 5.4 value conversion vocabulary.
  for (const row of commAll) {
    for (const f of ["chlorine_status", "pressure_status", "flow_meter_status"]) {
      assert.ok(["Online", "Offline"].includes(row[f]), `${f} must be Online/Offline`);
    }
    for (const f of ["chlorine_connected", "pressure_connected", "flow_meter_connected"]) {
      assert.ok(["Connected", "Not Connected"].includes(row[f]), `${f} must be Connected/Not Connected`);
    }
  }

  // 3: all three active reservoir templates must be represented in the tree.
  const templates = new Set();
  const seen = new Set();
  const queue = [rootElem.WebId];
  while (queue.length > 0) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    const page = await fetch(`${BASE_URL}/piwebapi/elements/${id}/elements?maxCount=100000`).then((r) => r.json());
    for (const el of page.Items) {
      if (el.TemplateName) templates.add(el.TemplateName);
      if (el.HasChildren) queue.push(el.WebId);
    }
  }
  for (const t of [
    "MJP Reservoir Level - Active",
    "MJP Reservoir MBR FL & CL - Level - Active",
    "MJP Reservoir MBR - Level - Active",
  ]) {
    assert.ok(templates.has(t), `3 template not represented in the tree: ${t}`);
  }

  // 6.2: the four system state codes are served in the documented order.
  const states = await fetch(`${BASE_URL}/api/system-state-values`).then((r) => r.json());
  assert.deepStrictEqual(states.map((x) => x.code), [253, 255, 248, 246]);

  // The two non-PI collections back dashboard fields the guide defines no
  // source for; every reservoir and village must be covered so nothing on
  // screen falls back to a literal.
  assert.ok(demographics.length > 0, "demographics should be seeded");
  const villageKeys = new Set(water.map((r) => `${r.scheme_id}|${r.village_name}`));
  for (const key of villageKeys) {
    const row = demographics.find((d) => `${d.scheme_id}|${d.village_name}` === key);
    assert.ok(row, `demographics missing for village ${key}`);
    // The Scheme dashboard's Water Source tile reads this; a gap would show "-".
    assert.ok(row.water_source, `demographics.water_source empty for village ${key}`);
  }
  assert.strictEqual(assets.length, water.length, "asset_details must cover every reservoir");
  for (const row of assets) {
    assert.ok(waterKeys.has(rowKey(row)), `asset_details orphan row: ${rowKey(row)}`);
    for (const f of ["reservoir_category", "inlet_line_size", "outlet_line_material", "operator_name", "operator_contact"]) {
      assert.ok(row[f], `asset_details.${f} empty for ${row.esr_name}`);
    }
  }
  console.log(`✓ Guide conformance verified across ${water.length} reservoirs`);

  // 12. Further states (not in the guide): each is a root element of the AF
  // database, and the hierarchy-carrying tables filter on `state` like `region`.
  console.log("Testing the per-state AF roots and state scoping...");
  const stateNames = ["Maharashtra", "Gujarat", "Madhya Pradesh"];
  let reservoirTotal = 0;
  for (const state of stateNames) {
    const path = `\\\\DemoAF\\JJM\\JJM\\${state}`;
    const res = await fetch(`${BASE_URL}/piwebapi/elements?path=${encodeURIComponent(path)}`);
    assert.strictEqual(res.status, 200, `${state} root should resolve`);
    const stateRoot = await res.json();
    assert.strictEqual(stateRoot.Name, state);
    const tier2 = await fetch(stateRoot.Links.Elements).then((r) => r.json());
    assert.ok(tier2.Items.length > 0 && tier2.Items.every((r) => r.Name.startsWith("Region-")), `${state}: Tier 2 must be regions`);
    for (const table of ["water-consumption", "chlorine-data", "pressure-data", "demographics"]) {
      const rows = await fetch(`${BASE_URL}/api/${table}?state=${encodeURIComponent(state)}`).then((r) => r.json());
      assert.ok(rows.length > 0, `${state}: ${table} should have rows`);
      assert.ok(rows.every((r) => r.state === state), `${state}: ${table} returned another state's rows`);
      if (table === "water-consumption") reservoirTotal += rows.length;
    }
  }
  assert.strictEqual(reservoirTotal, water.length, "every reservoir belongs to exactly one state");
  console.log(`✓ ${stateNames.length} state roots resolve and scope their tables`);

  console.log("\n=======================================================");
  console.log(" ALL 12 VERIFICATION TESTS PASSED SUCCESSFULLY! (100%)");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
