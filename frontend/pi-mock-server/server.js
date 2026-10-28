import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { plotResponse, recordedResponse } from "./plot.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "db.json");
const PORT = process.env.PORT || 3001;

// Load database with auto-reload on file change
let db = {};
function loadDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    db = JSON.parse(raw);
    console.log(`[db] Loaded ${Object.keys(db).length} collections from ${DB_FILE}`);
  } catch (err) {
    console.error(`[db] Failed to load ${DB_FILE}:`, err.message);
  }
}
loadDb();

// Hot reload when db.json is modified
fs.watchFile(DB_FILE, { interval: 500 }, () => {
  console.log("[db] db.json changed on disk, reloading...");
  loadDb();
});

// Normalizes PI AF path by collapsing multiple slashes/backslashes
function normalizeAfPath(p) {
  if (!p) return "";
  const cleaned = p.trim().replace(/[\/\\]+/g, "\\");
  return cleaned.startsWith("\\\\") ? cleaned : "\\" + cleaned.replace(/^\\/, "");
}

function getBaseUrl(req) {
  const host = req.headers.host || `localhost:${PORT}`;
  const proto = req.headers["x-forwarded-proto"] || "http";
  return `${proto}://${host}`;
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data, null, 2));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, {
    Errors: [message]
  });
}

function buildElementResponse(elem, baseUrl) {
  return {
    WebId: elem.WebId,
    Id: elem.Id || elem.id,
    Name: elem.Name,
    Path: elem.Path,
    TemplateName: elem.TemplateName || null,
    HasChildren: Boolean(elem.HasChildren),
    Links: {
      Self: `${baseUrl}/piwebapi/elements/${elem.WebId}`,
      Elements: `${baseUrl}/piwebapi/elements/${elem.WebId}/elements`,
      Attributes: `${baseUrl}/piwebapi/elements/${elem.WebId}/attributes`
    }
  };
}

function buildAttributeResponse(attr, baseUrl) {
  return {
    WebId: attr.WebId,
    Id: attr.Id || attr.id,
    Name: attr.Name,
    Description: attr.Description || "",
    Path: attr.Path || "",
    Type: attr.Type || "Single",
    DefaultUnitsName: attr.DefaultUnitsName || "",
    Links: {
      Value: `${baseUrl}/piwebapi/streams/${attr.WebId}/value`
    }
  };
}

function findElementByWebId(webId) {
  if (!webId) return null;
  const root = (db.elements || []).find((e) => e.WebId === webId);
  if (root) return root;
  return (db.elementChildren || []).find((e) => e.WebId === webId) || null;
}

// Map collection aliases to db keys
const COLLECTION_MAP = {
  "chlorine-data": "chlorine_data",
  "chlorine_data": "chlorine_data",
  "chlorine-history": "chlorine_history",
  "chlorine_history": "chlorine_history",
  "pressure-data": "pressure_data",
  "pressure_data": "pressure_data",
  "pressure-history": "pressure_history",
  "pressure_history": "pressure_history",
  "water-consumption": "water_consumption",
  "water_consumption": "water_consumption",
  "water-consumption-history": "water_consumption_history",
  "water_consumption_history": "water_consumption_history",
  "communication-status": "communication_status",
  "communication_status": "communication_status",
  "system-state-values": "systemStateValues",
  "systemStateValues": "systemStateValues",
  // Not PI tables: demographics and the asset register back the dashboard
  // fields the PI guide defines no source for.
  "demographics": "demographics",
  "asset-details": "asset_details",
  "asset_details": "asset_details",
  "elements": "elements",
  "elementChildren": "elementChildren",
  "attributes": "attributes",
  "streamValues": "streamValues",
  "streamSummaries": "streamSummaries"
};

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const baseUrl = getBaseUrl(req);
  const parsedUrl = new URL(req.url, baseUrl);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const query = parsedUrl.searchParams;

  console.log(`[${req.method}] ${pathname}${parsedUrl.search}`);

  // Landing page / API Directory for developer convenience
  if (pathname === "/" || pathname === "/piwebapi") {
    const rootElement = db.elements?.[0];
    const rootPath = rootElement ? rootElement.Path : "\\\\DemoAF\\JJM\\JJM\\Maharashtra";
    return sendJson(res, 200, {
      service: "OSIsoft PI Web API & Ingestion Mock Server",
      status: "online",
      version: "1.0.0",
      documentation: "PI_WEB_API_USAGE_GUIDE.pdf",
      credentials: {
        default_admin: { username: ".\\piadmin", password: "JJM@123" },
        read_only: { username: "WebAppUser", password: "WebAppUser@123" }
      },
      endpoints: {
        root_element: `${baseUrl}/piwebapi/elements?path=${encodeURIComponent(rootPath)}`,
        child_elements_example: rootElement ? `${baseUrl}/piwebapi/elements/${rootElement.WebId}/elements` : null,
        attributes_example: `${baseUrl}/piwebapi/elements/E0k-7zR3_XEEa5vK9QdYwAAA_AMBIKAPUR_MBR1_WEBID/attributes`,
        stream_value_example: `${baseUrl}/piwebapi/streams/A0k-7zR3_XEEa5vK9QdYwAAA_CHLORINE_ATTR_WEBID/value`,
        stream_summary_example: `${baseUrl}/piwebapi/streams/A0k-7zR3_XEEa5vK9QdYwAAA_CHLORINE_ATTR_WEBID/summary?startTime=2026-08-18&endTime=2026-08-25&summaryType=Average&summaryDuration=1d`,
        stream_recorded_example: `${baseUrl}/piwebapi/streams/A0k-7zR3_XEEa5vK9QdYwAAA_PRESSURE_ATTR_WEBID/recorded?startTime=*-1d&endTime=*`,
        stream_plot_example: `${baseUrl}/piwebapi/streams/A0k-7zR3_XEEa5vK9QdYwAAA_FLOW_RATE_ATTR_WEBID/plot?startTime=*-1d&endTime=*&intervals=400`,
        relational_ingestion_apis: {
          chlorine_data: `${baseUrl}/api/chlorine-data`,
          chlorine_history: `${baseUrl}/api/chlorine-history`,
          pressure_data: `${baseUrl}/api/pressure-data`,
          pressure_history: `${baseUrl}/api/pressure-history`,
          water_consumption: `${baseUrl}/api/water-consumption`,
          water_consumption_history: `${baseUrl}/api/water-consumption-history`,
          communication_status: `${baseUrl}/api/communication-status`,
          system_state_values: `${baseUrl}/api/system-state-values`
        }
      }
    });
  }

  // -------------------------------------------------------------
  // Endpoint 1: Resolve Path to WebID or Get Elements
  // GET /piwebapi/elements?path=\\DemoAF\JJM\JJM\Maharashtra
  // -------------------------------------------------------------
  if (pathname === "/piwebapi/elements") {
    const rawPath = query.get("path");
    if (rawPath) {
      const normalizedTarget = normalizeAfPath(rawPath).toLowerCase();
      const allElements = [...(db.elements || []), ...(db.elementChildren || [])];
      const match = allElements.find((e) => {
        if (!e.Path) return false;
        return normalizeAfPath(e.Path).toLowerCase() === normalizedTarget;
      });

      if (match) {
        return sendJson(res, 200, buildElementResponse(match, baseUrl));
      } else {
        return sendError(res, 404, `Element with path '${rawPath}' not found.`);
      }
    }

    // Default list of elements
    const elements = (db.elements || []).map((e) => buildElementResponse(e, baseUrl));
    return sendJson(res, 200, { Items: elements });
  }

  // -------------------------------------------------------------
  // Endpoint 2: Recursive Child Element Enumeration
  // GET /piwebapi/elements/{Parent_WebId}/elements?maxCount=100000
  // -------------------------------------------------------------
  const elementsMatch = pathname.match(/^\/piwebapi\/elements\/([^\/]+)\/elements\/?$/);
  if (elementsMatch) {
    const parentWebId = elementsMatch[1];
    const maxCount = parseInt(query.get("maxCount") || "100000", 10);

    // PI Web API supports searchFullHierarchy / templateName / nameFilter on this
    // route. Without them a client has to walk the tree one request per node,
    // which is what the dashboard used to do just to count the estate.
    const fullHierarchy = query.get("searchFullHierarchy") === "true";
    const templateName = query.get("templateName");
    const nameFilter = query.get("nameFilter");

    const directChildren = (id) =>
      (db.elementChildren || []).filter((e) => e.parentWebId === id);

    let matches;
    if (fullHierarchy) {
      matches = [];
      const stack = [parentWebId];
      const seen = new Set();
      while (stack.length > 0) {
        const id = stack.pop();
        if (seen.has(id)) continue;
        seen.add(id);
        for (const child of directChildren(id)) {
          matches.push(child);
          stack.push(child.WebId);
        }
      }
    } else {
      matches = directChildren(parentWebId);
    }

    if (templateName) {
      matches = matches.filter((e) => e.TemplateName === templateName);
    }
    if (nameFilter) {
      // PI accepts a trailing-* wildcard here.
      const needle = nameFilter.toLowerCase();
      matches = needle.endsWith("*")
        ? matches.filter((e) => e.Name.toLowerCase().startsWith(needle.slice(0, -1)))
        : matches.filter((e) => e.Name.toLowerCase() === needle);
    }

    return sendJson(res, 200, {
      Items: matches.slice(0, maxCount).map((c) => buildElementResponse(c, baseUrl)),
    });
  }

  // -------------------------------------------------------------
  // Endpoint 3: Attribute (Sensor) Discovery by Name
  // GET /piwebapi/elements/{Element_WebId}/attributes?nameFilter={Name}
  // -------------------------------------------------------------
  const attributesMatch = pathname.match(/^\/piwebapi\/elements\/([^\/]+)\/attributes\/?$/);
  if (attributesMatch) {
    const elementWebId = attributesMatch[1];
    const nameFilter = query.get("nameFilter");

    let attrs = (db.attributes || []).filter((a) => a.elementWebId === elementWebId);

    if (nameFilter) {
      const targetFilter = nameFilter.toLowerCase().trim();
      const exactMatches = attrs.filter((a) => {
        const name = (a.Name || "").toLowerCase();
        const filterKey = (a.nameFilter || "").toLowerCase();
        return name === targetFilter || filterKey === targetFilter;
      });

      if (exactMatches.length > 0) {
        attrs = exactMatches;
      } else {
        attrs = attrs.filter((a) => {
          const n = (a.nameFilter || a.Name || "").toLowerCase();
          return n.includes(targetFilter);
        });
      }
    }

    const items = attrs.map((a) => buildAttributeResponse(a, baseUrl));
    return sendJson(res, 200, { Items: items });
  }

  // -------------------------------------------------------------
  // Single Element by WebId (Links.Self resolution)
  // GET /piwebapi/elements/{WebId}
  // -------------------------------------------------------------
  const singleElementMatch = pathname.match(/^\/piwebapi\/elements\/([^\/]+)\/?$/);
  if (singleElementMatch) {
    const webId = singleElementMatch[1];
    const element = findElementByWebId(webId);
    if (element) {
      return sendJson(res, 200, buildElementResponse(element, baseUrl));
    }
    return sendError(res, 404, `Element with WebId '${webId}' not found.`);
  }

  // -------------------------------------------------------------
  // Endpoint 4: Real-Time Instantaneous Value
  // GET /piwebapi/streams/{Attribute_WebId}/value
  // -------------------------------------------------------------
  const streamValueMatch = pathname.match(/^\/piwebapi\/streams\/([^\/]+)\/value\/?$/);
  if (streamValueMatch) {
    const attrWebId = streamValueMatch[1];
    const stream = (db.streamValues || []).find((s) => s.attributeWebId === attrWebId);

    if (stream) {
      // Build pure PI Web API payload without internal mock IDs
      const response = {
        Timestamp: stream.Timestamp,
        Value: stream.Value,
        Good: stream.Good ?? true
      };
      if (stream.UnitsAbbreviation !== undefined) {
        response.UnitsAbbreviation = stream.UnitsAbbreviation;
      }
      if (stream.Questionable !== undefined) {
        response.Questionable = stream.Questionable;
      }
      if (stream.Substituted !== undefined) {
        response.Substituted = stream.Substituted;
      }
      return sendJson(res, 200, response);
    }
    return sendError(res, 404, `Stream value for attribute WebId '${attrWebId}' not found.`);
  }

  // -------------------------------------------------------------
  // Endpoint 5: 7-Day Daily Historical Summary Telemetry
  // GET /piwebapi/streams/{Attribute_WebId}/summary
  // -------------------------------------------------------------
  const streamSummaryMatch = pathname.match(/^\/piwebapi\/streams\/([^\/]+)\/summary\/?$/);
  if (streamSummaryMatch) {
    const attrWebId = streamSummaryMatch[1];
    const summaryType = query.get("summaryType");

    let summaries = (db.streamSummaries || []).filter((s) => s.attributeWebId === attrWebId);
    if (summaryType) {
      summaries = summaries.filter(
        (s) => (s.summaryType || "").toLowerCase() === summaryType.toLowerCase()
      );
    }

    const summary = summaries[0];
    if (summary && Array.isArray(summary.Items)) {
      return sendJson(res, 200, { Items: summary.Items });
    }
    return sendJson(res, 200, { Items: [] });
  }

  // -------------------------------------------------------------
  // Trend history, as PI Vision trends read it
  // GET /piwebapi/streams/{Attribute_WebId}/recorded?startTime=*-1d&endTime=*&maxCount=1000
  // GET /piwebapi/streams/{Attribute_WebId}/plot?startTime=*-1d&endTime=*&intervals=400
  // Not in PI_WEB_API_USAGE_GUIDE; both are standard PI Web API stream
  // methods. The samples are synthesised from the seed - see plot.mjs.
  // -------------------------------------------------------------
  const streamHistoryMatch = pathname.match(/^\/piwebapi\/streams\/([^/]+)\/(recorded|plot)\/?$/);
  if (streamHistoryMatch) {
    const [, attrWebId, method] = streamHistoryMatch;
    const params = {
      startTime: query.get("startTime") ?? undefined,
      endTime: query.get("endTime") ?? undefined,
      maxCount: query.get("maxCount") ?? undefined,
      intervals: query.get("intervals") ?? undefined,
    };
    const body = method === "plot" ? plotResponse(db, attrWebId, params) : recordedResponse(db, attrWebId, params);
    if (body) return sendJson(res, 200, body);
    return sendError(res, 404, `Attribute with WebId '${attrWebId}' not found.`);
  }

  // -------------------------------------------------------------
  // Relational Ingestion REST APIs:
  // /api/:collection or /:collection
  // -------------------------------------------------------------
  let collectionKey = null;
  const apiMatch = pathname.match(/^\/api\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?\/?$/);
  const directMatch = pathname.match(/^\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?\/?$/);

  let targetId = null;
  if (apiMatch) {
    collectionKey = COLLECTION_MAP[apiMatch[1]] || apiMatch[1];
    targetId = apiMatch[2];
  } else if (directMatch && COLLECTION_MAP[directMatch[1]]) {
    collectionKey = COLLECTION_MAP[directMatch[1]];
    targetId = directMatch[2];
  }

  if (collectionKey && db[collectionKey]) {
    const items = db[collectionKey];

    if (req.method === "GET") {
      if (targetId) {
        const item = items.find((i) => String(i.id) === String(targetId) || i.WebId === targetId);
        if (item) return sendJson(res, 200, item);
        return sendError(res, 404, `Item with id '${targetId}' not found in ${collectionKey}.`);
      }

      // Filter by query parameters if any
      let filtered = [...items];
      for (const [key, val] of query.entries()) {
        filtered = filtered.filter((i) => {
          if (i[key] === undefined) return true;
          return String(i[key]).toLowerCase() === String(val).toLowerCase();
        });
      }
      return sendJson(res, 200, filtered);
    }

    // Support POST
    if (req.method === "POST") {
      let bodyStr = "";
      req.on("data", (chunk) => (bodyStr += chunk));
      req.on("end", () => {
        try {
          const newItem = JSON.parse(bodyStr || "{}");
          newItem.id = newItem.id || Date.now();
          items.push(newItem);
          sendJson(res, 201, newItem);
        } catch (e) {
          sendError(res, 400, "Invalid JSON body: " + e.message);
        }
      });
      return;
    }

    // Support PUT
    if (req.method === "PUT" && targetId) {
      let bodyStr = "";
      req.on("data", (chunk) => (bodyStr += chunk));
      req.on("end", () => {
        try {
          const update = JSON.parse(bodyStr || "{}");
          const idx = items.findIndex((i) => String(i.id) === String(targetId));
          if (idx !== -1) {
            items[idx] = { ...items[idx], ...update, id: items[idx].id };
            return sendJson(res, 200, items[idx]);
          }
          return sendError(res, 404, `Item with id '${targetId}' not found.`);
        } catch (e) {
          sendError(res, 400, "Invalid JSON body: " + e.message);
        }
      });
      return;
    }

    // Support DELETE
    if (req.method === "DELETE" && targetId) {
      const idx = items.findIndex((i) => String(i.id) === String(targetId));
      if (idx !== -1) {
        items.splice(idx, 1);
        return sendJson(res, 200, { success: true, id: targetId });
      }
      return sendError(res, 404, `Item with id '${targetId}' not found.`);
    }
  }

  // Not Found
  return sendError(res, 404, `Endpoint '${pathname}' not found.`);
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` OSIsoft PI Web API & Ingestion Mock Server Started`);
  console.log(` Base URL: http://localhost:${PORT}`);
  console.log(` API Index: http://localhost:${PORT}/piwebapi`);
  console.log(` Root Path: http://localhost:${PORT}/piwebapi/elements?path=\\\\DemoAF\\JJM\\JJM\\Maharashtra`);
  console.log(`====================================================`);
});

export default server;
