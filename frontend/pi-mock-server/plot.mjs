/**
 * High-resolution history behind the PI Web API trend endpoints
 * (`/streams/{webId}/recorded` and `/streams/{webId}/plot`), which PI Vision's
 * trends and popup trends read.
 *
 * db.json carries only the 7-day daily summaries (§4 endpoint 5) and the latest
 * value (§4 endpoint 4), so the samples are synthesised from them rather than
 * stored - a month of one-minute flow readings per reservoir would bloat the seed
 * for no gain. Everything is a pure function of db.json:
 *
 *  - Chlorine and Pressure are sampled every 15 minutes (the 4-per-hour packet
 *    rate the field team checks for) and each UTC day's samples average to that
 *    day's summary `Average` exactly, before rounding.
 *  - Flow Rate (L/s) is non-zero only during the village's supply window
 *    (`demographics.avg_supply_hours`, from 06:00 IST) and integrates to the day's
 *    `CALC - WATER CONSUMPTION PER DAY` total, so the trend agrees with the ESR
 *    gauge (volume over supply hours).
 *  - CALC - WATER CONSUMPTION PER DAY is one value per day, as the calculation
 *    writes it.
 *  - A point in a §6.2 system state ("Pt Created", "I/O Timeout") has no good
 *    data at all: the history is that state, which a trend draws as a gap.
 *
 * The seed covers one week; any other window repeats that week day for day, the
 * way a live PI server always has data up to "now". Nothing is returned after
 * `now`.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** Longest window one request may span; PI enforces its own limits too. */
const MAX_SPAN = 400 * DAY;
/** 06:00 IST, when the village supply starts. */
const SUPPLY_START_UTC = 30 * MINUTE;

const SAMPLE_MS = {
  Chlorine: 15 * MINUTE,
  Pressure: 15 * MINUTE,
  "Flow Rate": MINUTE,
};
/** Day-to-day wobble around each daily average, as a share of it. */
const SPREAD = { Chlorine: 0.12, Pressure: 0.08 };

const WATER_ATTR = "CALC - WATER CONSUMPTION PER DAY";

// ---------------------------------------------------------------------------
// Time parsing - the subset of PI time syntax the dashboards send
// ---------------------------------------------------------------------------

const UNIT_MS = { s: 1000, m: MINUTE, h: HOUR, d: DAY, w: 7 * DAY, mo: 30 * DAY, y: 365 * DAY };

/**
 * Accepts ISO 8601 or PI relative time: `*` (now), `t` (today), `y` (yesterday),
 * each optionally followed by `+N<unit>` / `-N<unit>`.
 */
export function parsePiTime(input, now = Date.now()) {
  if (input === undefined || input === null || input === "") return undefined;
  const s = String(input).trim();
  const rel = s.match(/^(\*|t|y|today|yesterday)?\s*(?:([+-])\s*(\d+(?:\.\d+)?)\s*(mo|s|m|h|d|w|y))?$/i);
  if (rel && (rel[1] || rel[2])) {
    const today = Math.floor(now / DAY) * DAY;
    const anchor = (rel[1] || "*").toLowerCase();
    let base = now;
    if (anchor === "t" || anchor === "today") base = today;
    if (anchor === "y" || anchor === "yesterday") base = today - DAY;
    if (rel[2]) {
      const delta = Number(rel[3]) * UNIT_MS[rel[4].toLowerCase()];
      base += rel[2] === "-" ? -delta : delta;
    }
    return base;
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : t;
}

// ---------------------------------------------------------------------------
// Deterministic noise
// ---------------------------------------------------------------------------

/** FNV-1a over the string, mixed with `n`; returns a value in [-1, 1]. */
function noise(seed, n) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= n;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return (h / 0xffffffff) * 2 - 1;
}

const round = (v, dp) => Math.round(v * 10 ** dp) / 10 ** dp;

// ---------------------------------------------------------------------------
// Series model
// ---------------------------------------------------------------------------

/** The daily summary items for an attribute, oldest first. */
function dailyItems(db, attributeWebId) {
  const summary = (db.streamSummaries || []).find((s) => s.attributeWebId === attributeWebId);
  return summary?.Items ?? [];
}

/** The summary value covering the UTC day starting at `dayStart`, cycling the seeded week. */
function dayValue(items, dayStart) {
  if (!items.length) return undefined;
  const base = Date.parse(items[0].Value.Timestamp);
  const idx = Math.floor((dayStart - base) / DAY);
  const n = items.length;
  return items[((idx % n) + n) % n].Value;
}

/**
 * Everything the generator needs to know about one attribute, or `undefined`
 * for an unknown WebId.
 */
export function describeStream(db, attributeWebId) {
  const attr = (db.attributes || []).find((a) => a.WebId === attributeWebId);
  if (!attr) return undefined;
  const siblings = (db.attributes || []).filter((a) => a.elementWebId === attr.elementWebId);
  const current = (db.streamValues || []).find((v) => v.attributeWebId === attributeWebId);
  const systemState =
    current && typeof current.Value === "object" && current.Value?.IsSystem ? current.Value : undefined;

  const element = (db.elementChildren || []).find((e) => e.WebId === attr.elementWebId);
  const village = (db.demographics || []).find((d) => d.village_webid === element?.parentWebId);
  const water = siblings.find((a) => a.Name === WATER_ATTR);

  return {
    attr,
    units: attr.DefaultUnitsName || "",
    systemState,
    current,
    items: dailyItems(db, attributeWebId),
    waterItems: water ? dailyItems(db, water.WebId) : [],
    supplyHours: village?.avg_supply_hours > 0 ? village.avg_supply_hours : 24,
  };
}

/** Samples of one UTC day for a 15-minute analogue sensor, averaging to `target`. */
function analogueDay(seed, dayStart, target, spread, step) {
  const count = Math.round(DAY / step);
  if (!target) return Array.from({ length: count }, (_, i) => [dayStart + i * step, 0]);
  const shape = [];
  for (let i = 0; i < count; i++) {
    const hour = (i * step) / HOUR;
    const diurnal = 0.6 * Math.sin((2 * Math.PI * (hour - 7)) / 24) + 0.25 * Math.sin((4 * Math.PI * hour) / 24);
    shape.push(diurnal + 0.6 * noise(seed, Math.floor((dayStart + i * step) / step)));
  }
  const mean = shape.reduce((a, b) => a + b, 0) / count;
  return shape.map((s, i) => [dayStart + i * step, Math.max(0, target + target * spread * (s - mean))]);
}

/** One-minute flow (L/s) for a UTC day: zero outside the supply window, integrating to `litres`. */
function flowDay(seed, dayStart, litres, supplyHours) {
  const count = DAY / MINUTE;
  const out = [];
  const window = Math.max(1, Math.round(supplyHours * 60));
  const first = Math.round(SUPPLY_START_UTC / MINUTE);
  const shape = [];
  for (let k = 0; k < window; k++) {
    const x = k / window;
    // ramp up, a working plateau with ripple, ramp down
    const envelope = Math.min(1, x * 8, (1 - x) * 8) || 0.2;
    shape.push(Math.max(0.05, envelope * (1 + 0.12 * Math.sin(x * 6 * Math.PI)) + 0.08 * noise(seed, Math.floor(dayStart / MINUTE) + k)));
  }
  const sum = shape.reduce((a, b) => a + b, 0);
  for (let i = 0; i < count; i++) out.push([dayStart + i * MINUTE, 0]);
  if (litres > 0) {
    for (let k = 0; k < window; k++) {
      const i = (first + k) % count;
      // litres over `window` minutes -> L/s, shaped so the minutes sum to `litres`
      out[i][1] = (litres * (shape[k] / sum)) / 60;
    }
  }
  return out;
}

/**
 * Raw recorded samples `[time, value]` in `[start, end]` (clipped to `now`), or
 * `{ systemState }` when the point has no good data.
 */
export function recordedSamples(db, attributeWebId, start, end, now = Date.now()) {
  const s = describeStream(db, attributeWebId);
  if (!s) return undefined;
  const to = Math.min(end, now);
  const from = Math.max(start, to - MAX_SPAN);
  if (s.systemState) return { stream: s, systemState: s.systemState, samples: [] };
  if (!(to >= from)) return { stream: s, samples: [] };

  const name = s.attr.Name;
  const seed = attributeWebId;
  const samples = [];
  const firstDay = Math.floor(from / DAY) * DAY;
  const keep = ([t]) => t >= from && t <= to;

  if (name === "Chlorine" || name === "Pressure") {
    for (let day = firstDay; day <= to; day += DAY) {
      const target = dayValue(s.items, day)?.Value ?? 0;
      for (const p of analogueDay(seed, day, target, SPREAD[name], SAMPLE_MS[name])) if (keep(p)) samples.push(p);
    }
    return { stream: s, samples: samples.map(([t, v]) => [t, round(v, 3)]) };
  }

  if (name === "Flow Rate") {
    for (let day = firstDay; day <= to; day += DAY) {
      const litres = dayValue(s.waterItems, day)?.Value ?? 0;
      for (const p of flowDay(seed, day, litres, s.supplyHours)) if (keep(p)) samples.push(p);
    }
    return { stream: s, samples: samples.map(([t, v]) => [t, round(v, 4)]) };
  }

  if (name === WATER_ATTR) {
    for (let day = firstDay; day <= to; day += DAY) {
      const v = dayValue(s.items, day);
      if (v && keep([day])) samples.push([day, v.Value]);
    }
    return { stream: s, samples };
  }

  // Status attributes are not historised in the seed: report the current value.
  if (s.current) return { stream: s, samples: [[from, s.current.Value]] };
  return { stream: s, samples: [] };
}

/** The latest sample at or before `t`, for the plot's left edge. */
function valueAt(db, attributeWebId, t, now) {
  const back = recordedSamples(db, attributeWebId, t - DAY, t, now);
  return back?.samples?.length ? back.samples[back.samples.length - 1] : undefined;
}

// ---------------------------------------------------------------------------
// PI Web API response shapes
// ---------------------------------------------------------------------------

function item(t, value, units, good = true) {
  return {
    Timestamp: new Date(t).toISOString().replace(".000Z", "Z"),
    Value: value,
    UnitsAbbreviation: units,
    Good: good,
    Questionable: false,
    Substituted: false,
    Annotated: false,
  };
}

function systemStateResponse(stream, start) {
  return {
    Links: {},
    Items: [item(start, stream.systemState, stream.units, false)],
    UnitsAbbreviation: stream.units,
  };
}

/** GET /streams/{webId}/recorded - every sample in the window, up to `maxCount`. */
export function recordedResponse(db, attributeWebId, { startTime, endTime, maxCount } = {}, now = Date.now()) {
  const end = parsePiTime(endTime ?? "*", now) ?? now;
  const start = parsePiTime(startTime ?? "*-1d", now) ?? end - DAY;
  const result = recordedSamples(db, attributeWebId, start, end, now);
  if (!result) return undefined;
  if (result.systemState) return systemStateResponse(result.stream, start);
  const cap = Math.max(1, Number(maxCount) || 1000);
  return {
    Links: {},
    Items: result.samples.slice(0, cap).map(([t, v]) => item(t, v, result.stream.units)),
    UnitsAbbreviation: result.stream.units,
  };
}

/**
 * GET /streams/{webId}/plot - PI's decimation for trends: for each of
 * `intervals` buckets, the first, minimum, maximum and last sample, so a
 * month of one-minute data draws in a few thousand points with every spike
 * kept. A value at the window start is included so a stepped trace begins at
 * the left edge.
 */
export function plotResponse(db, attributeWebId, { startTime, endTime, intervals } = {}, now = Date.now()) {
  const end = parsePiTime(endTime ?? "*", now) ?? now;
  const start = parsePiTime(startTime ?? "*-1d", now) ?? end - DAY;
  const result = recordedSamples(db, attributeWebId, start, end, now);
  if (!result) return undefined;
  if (result.systemState) return systemStateResponse(result.stream, start);

  const buckets = Math.max(1, Math.min(5000, Number(intervals) || 24));
  const width = Math.max(1, (Math.min(end, now) - start) / buckets);
  const picked = new Set();
  let bucket = -1;
  let first, last, min, max;
  const flush = () => {
    if (first === undefined) return;
    for (const i of [first, min, max, last]) picked.add(i);
  };
  result.samples.forEach(([t, v], i) => {
    const b = Math.min(buckets - 1, Math.floor((t - start) / width));
    if (b !== bucket) {
      flush();
      bucket = b;
      first = last = min = max = i;
      return;
    }
    last = i;
    if (v < result.samples[min][1]) min = i;
    if (v > result.samples[max][1]) max = i;
  });
  flush();

  const units = result.stream.units;
  const items = [...picked].sort((a, b) => a - b).map((i) => item(result.samples[i][0], result.samples[i][1], units));
  const firstSample = result.samples[0];
  if (!firstSample || firstSample[0] > start) {
    const edge = valueAt(db, attributeWebId, start, now);
    if (edge) items.unshift(item(start, edge[1], units));
  }
  return { Links: {}, Items: items, UnitsAbbreviation: units };
}
