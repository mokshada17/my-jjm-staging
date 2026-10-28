import { http, HttpResponse } from "msw";
import db from "../../../pi-mock-server/db.json";
import { plotResponse, recordedResponse } from "../../../pi-mock-server/plot.mjs";

const API = "http://localhost:3001";

/**
 * Tests are served the same db.json the PI mock server serves, so a change to
 * the seed cannot drift from what the suite asserts.
 */
/**
 * Mirrors the mock server's filtering so the suite exercises the same scoped
 * requests the app makes in the browser, rather than always seeing every row.
 */
const table =
  <T extends Record<string, unknown>>(rows: T[]) =>
  ({ request }: { request: Request }) => {
    const params = new URL(request.url).searchParams;
    let filtered = rows;
    for (const [key, value] of params.entries()) {
      filtered = filtered.filter((row) =>
        row[key] === undefined
          ? true
          : String(row[key]).toLowerCase() === value.toLowerCase()
      );
    }
    return HttpResponse.json(filtered);
  };

const allElements = [...db.elements, ...db.elementChildren] as Array<{
  WebId: string;
  Id: string;
  Name: string;
  Path: string;
  TemplateName: string | null;
  HasChildren: boolean;
  parentWebId?: string;
}>;

/** Collapses runs of either slash so a path compares equal however it is written. */
const normalise = (p: string) => p.replace(/[\\/]+/g, "\\").toLowerCase();

const elementResponse = (el: (typeof allElements)[number]) => ({
  WebId: el.WebId,
  Id: el.Id,
  Name: el.Name,
  Path: el.Path,
  TemplateName: el.TemplateName ?? null,
  HasChildren: Boolean(el.HasChildren),
  Links: {
    Self: `${API}/piwebapi/elements/${el.WebId}`,
    Elements: `${API}/piwebapi/elements/${el.WebId}/elements`,
    Attributes: `${API}/piwebapi/elements/${el.WebId}/attributes`,
  },
});

export const handlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    return HttpResponse.json({
      token: "test-token",
      user: {
        id: "usr-comm-01",
        email: body.email ?? "commissioner@maharashtra.gov.in",
        name: "Commissioner",
        role: "admin",
      },
    });
  }),

  // -- §5 relational ingestion tables ---------------------------------------
  http.get(`${API}/api/water-consumption`, table(db.water_consumption)),
  http.get(`${API}/api/chlorine-data`, table(db.chlorine_data)),
  http.get(`${API}/api/pressure-data`, table(db.pressure_data)),
  http.get(`${API}/api/communication-status`, table(db.communication_status)),
  http.get(`${API}/api/demographics`, table(db.demographics)),
  http.get(`${API}/api/asset-details`, table(db.asset_details)),

  // -- §4 endpoints 1-2, used to crawl the AF tree --------------------------
  http.get(`${API}/piwebapi/elements`, ({ request }) => {
    const path = new URL(request.url).searchParams.get("path");
    const match = path
      ? allElements.find((el) => normalise(el.Path) === normalise(path))
      : undefined;
    return match
      ? HttpResponse.json(elementResponse(match))
      : HttpResponse.json({ Errors: ["not found"] }, { status: 404 });
  }),

  http.get(`${API}/piwebapi/elements/:webId/elements`, ({ request, params }) => {
    const query = new URL(request.url).searchParams;
    const children = (id: string) => allElements.filter((el) => el.parentWebId === id);

    let matches: typeof allElements;
    if (query.get("searchFullHierarchy") === "true") {
      matches = [];
      const stack = [params.webId as string];
      while (stack.length > 0) {
        const id = stack.pop()!;
        for (const child of children(id)) {
          matches.push(child);
          stack.push(child.WebId);
        }
      }
    } else {
      matches = children(params.webId as string);
    }

    const templateName = query.get("templateName");
    if (templateName) matches = matches.filter((el) => el.TemplateName === templateName);

    return HttpResponse.json({ Items: matches.map(elementResponse) });
  }),

  // -- §4 endpoint 3, then the trend history PI Vision reads -----------------
  http.get(`${API}/piwebapi/elements/:webId/attributes`, ({ params }) =>
    HttpResponse.json({
      Items: db.attributes
        .filter((a) => a.elementWebId === params.webId)
        .map((a) => ({
          WebId: a.WebId,
          Id: a.Id,
          Name: a.Name,
          Description: a.Description,
          Path: a.Path,
          Type: a.Type,
          DefaultUnitsName: a.DefaultUnitsName,
          Links: { Value: `${API}/piwebapi/streams/${a.WebId}/value` },
        })),
    })
  ),

  // Same generator as the mock server, so the suite sees the server's samples.
  http.get(`${API}/piwebapi/streams/:webId/:method`, ({ request, params }) => {
    const query = new URL(request.url).searchParams;
    const args = {
      startTime: query.get("startTime") ?? undefined,
      endTime: query.get("endTime") ?? undefined,
      maxCount: query.get("maxCount") ?? undefined,
      intervals: query.get("intervals") ?? undefined,
    };
    const webId = params.webId as string;
    const body =
      params.method === "plot"
        ? plotResponse(db, webId, args)
        : params.method === "recorded"
          ? recordedResponse(db, webId, args)
          : undefined;
    return body
      ? HttpResponse.json(body)
      : HttpResponse.json({ Errors: ["not found"] }, { status: 404 });
  }),

  http.get("/api/health", () => {
    return HttpResponse.json({ status: "ok" });
  }),

  http.get("/api/users", () => {
    return HttpResponse.json([
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" },
    ]);
  }),

  http.post("/api/users", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: Date.now(), ...body }, { status: 201 });
  }),

  http.get("/api/users/:id", ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ id: Number(id), name: `User ${id}`, email: `user${id}@example.com` });
  }),

  http.put("/api/users/:id", async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: Number(id), ...body });
  }),

  http.delete("/api/users/:id", ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ success: true, id: Number(id) });
  }),
];