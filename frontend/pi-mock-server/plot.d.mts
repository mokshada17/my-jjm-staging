/** Types for plot.mjs, which the MSW handlers share with the mock server. */

export interface PiStreamItem {
  Timestamp: string;
  Value: number | { Name: string; Value: number; IsSystem: boolean };
  UnitsAbbreviation: string;
  Good: boolean;
  Questionable: boolean;
  Substituted: boolean;
  Annotated: boolean;
}

export interface PiStreamValues {
  Links: Record<string, never>;
  Items: PiStreamItem[];
  UnitsAbbreviation: string;
}

export interface StreamParams {
  startTime?: string;
  endTime?: string;
  maxCount?: string | number;
  intervals?: string | number;
}

export function parsePiTime(input: string | undefined | null, now?: number): number | undefined;

export function recordedSamples(
  db: unknown,
  attributeWebId: string,
  start: number,
  end: number,
  now?: number
):
  | { stream: unknown; samples: [number, number][]; systemState?: { Name: string; Value: number; IsSystem: boolean } }
  | undefined;

export function recordedResponse(
  db: unknown,
  attributeWebId: string,
  params?: StreamParams,
  now?: number
): PiStreamValues | undefined;

export function plotResponse(
  db: unknown,
  attributeWebId: string,
  params?: StreamParams,
  now?: number
): PiStreamValues | undefined;
