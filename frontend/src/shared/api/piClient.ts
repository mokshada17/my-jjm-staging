import { ApiError, http, type RequestOptions } from "./http";

export interface AfElement {
  WebId: string;
  Id: string;
  Name: string;
  Path: string;
  TemplateName: string | null;
  HasChildren: boolean;
  Links: {
    Self: string;
    Elements: string;
    Attributes: string;
  };
}

export interface AfElementsResponse {
  Items: AfElement[];
}

export interface CommStatusRecord {
  id?: string;
  assetId?: string;
  sensorType: "FlowMeter" | "Chlorine" | "Pressure";
  status: "<24h" | "0-72h" | ">72h";
  lastPing: string;
}

export interface TelemetryReading {
  timestamp: string;
  value: number;
  unit: string;
  quality: "Good" | "Substituted" | "Bad";
}

/** A WebId in a URL path: PI WebIds are opaque and may contain reserved characters. */
const seg = (id: string) => encodeURIComponent(id);

/** Element collections must carry an `Items` array; anything else is not data. */
async function elements(
  endpoint: string,
  params: Record<string, unknown>,
  options?: RequestOptions
): Promise<AfElementsResponse> {
  const res = await http.get<AfElementsResponse | undefined>(endpoint, params, options);
  if (!res || !Array.isArray(res.Items)) {
    throw new ApiError(`GET ${endpoint} returned no Items list`, {
      kind: "parse",
      method: "GET",
      url: endpoint,
      data: res,
    });
  }
  return res;
}

/**
 * PI Web API AF-tree calls (§4 endpoints 1-2). The §5 tables are fetched through
 * telemetryApi, always with a hierarchy scope - this client deliberately has no
 * unscoped "fetch the whole table" helpers.
 */
export const piClient = {
  /** Resolves a state's root AF element, e.g. `\\DemoAF\JJM\JJM\Maharashtra`. */
  fetchRootElement: (path: string, options?: RequestOptions) =>
    http.get<AfElement>("/piwebapi/elements", { path }, options),

  /** Discovers the direct child elements of one node. */
  fetchChildElements: (parentWebId: string, options?: RequestOptions) =>
    elements(
      `/piwebapi/elements/${seg(parentWebId)}/elements`,
      // §4 endpoint 2: mandatory, or PI truncates at 1,000 items.
      { maxCount: 100000 },
      options
    ),

  /**
   * Every descendant in one request. `searchFullHierarchy` is a standard PI Web
   * API parameter; without it a client has to issue one request per node just to
   * count the estate. `templateName` narrows the result to reservoirs (§3).
   */
  fetchDescendants: (rootWebId: string, templateName?: string, options?: RequestOptions) =>
    elements(
      `/piwebapi/elements/${seg(rootWebId)}/elements`,
      { searchFullHierarchy: true, maxCount: 100000, templateName },
      options
    ),

  /** Fetches element by specific WebId */
  fetchElementByWebId: (webId: string, options?: RequestOptions) =>
    http.get<AfElement>(`/piwebapi/elements/${seg(webId)}`, undefined, options),

  /** §4 endpoint 1 for any element: resolves an AF path to its element. */
  fetchElementByPath: (path: string, options?: RequestOptions) =>
    http.get<AfElement>("/piwebapi/elements", { path }, options),

  /** §4 endpoint 3: every attribute (sensor) on one element. */
  fetchAttributes: async (elementWebId: string, options?: RequestOptions) => {
    const endpoint = `/piwebapi/elements/${seg(elementWebId)}/attributes`;
    const res = await http.get<{ Items: AfAttribute[] } | undefined>(endpoint, undefined, options);
    if (!res || !Array.isArray(res.Items)) {
      throw new ApiError(`GET ${endpoint} returned no Items list`, {
        kind: "parse",
        method: "GET",
        url: endpoint,
        data: res,
      });
    }
    return res.Items;
  },

  /**
   * Plot values - what PI Vision trends draw: per pixel-column interval, the
   * first, minimum, maximum and last recorded value. `intervals` is roughly the
   * plot width, so a month of one-minute data costs a few thousand points.
   */
  fetchPlotValues: async (
    attributeWebId: string,
    window: { startTime: string; endTime: string; intervals: number },
    options?: RequestOptions
  ) => {
    const endpoint = `/piwebapi/streams/${seg(attributeWebId)}/plot`;
    const res = await http.get<PiStreamValues | undefined>(endpoint, window, options);
    if (!res || !Array.isArray(res.Items)) {
      throw new ApiError(`GET ${endpoint} returned no Items list`, {
        kind: "parse",
        method: "GET",
        url: endpoint,
        data: res,
      });
    }
    return res;
  },
};

export interface AfAttribute {
  WebId: string;
  Id: string;
  Name: string;
  Description: string;
  Path: string;
  Type: string;
  DefaultUnitsName: string;
}

/** A PI system state ("I/O Timeout", "Pt Created") in place of a reading. */
export interface PiSystemState {
  Name: string;
  Value: number;
  IsSystem: true;
}

export interface PiStreamValue {
  Timestamp: string;
  Value: number | PiSystemState;
  UnitsAbbreviation?: string;
  Good: boolean;
  Questionable?: boolean;
  Substituted?: boolean;
}

export interface PiStreamValues {
  Items: PiStreamValue[];
  UnitsAbbreviation?: string;
}
