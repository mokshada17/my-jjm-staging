import type { FeatureCollection, Geometry } from "geojson";
import { canonicalRegion, useActiveState } from "@/entities/hierarchy";
import maharashtraGeo from "@/shared/assets/geo/maharashtra-districts.json";
import gujaratGeo from "@/shared/assets/geo/gujarat-districts.json";
import madhyaPradeshGeo from "@/shared/assets/geo/madhya-pradesh-districts.json";
import {
  DISTRICT_DISPLAY_NAMES,
  GUJARAT_REGIONS,
  MADHYA_PRADESH_REGIONS,
  MAHARASHTRA_REGIONS,
  OUTSIDE_LABEL_DISTRICTS,
  regionsByDistrict,
  type Region,
} from "./regions";

export type DistrictCollection = FeatureCollection<Geometry, { district: string }>;

/** Everything the state and region maps draw for one state. */
export interface StateMap {
  /** The state's name, as in the AF tree and the state registry. */
  state: string;
  /** District boundaries (scripts/build-state-geo.mjs). */
  districts: DistrictCollection;
  regions: Region[];
  regionByDistrict: Record<string, Region>;
  /** Current names for districts the geometry still calls by an old one. */
  displayNames: Record<string, string>;
  /** Districts whose state-map label is drawn outside them, and on which side. */
  outsideLabels: Record<string, "west" | "north">;
}

const stateMap = (
  state: string,
  districts: unknown,
  regions: Region[],
  extras: Partial<Pick<StateMap, "displayNames" | "outsideLabels">> = {}
): StateMap => ({
  state,
  districts: districts as DistrictCollection,
  regions,
  regionByDistrict: regionsByDistrict(regions),
  displayNames: extras.displayNames ?? {},
  outsideLabels: extras.outsideLabels ?? {},
});

/** Keyed by state name; one entry per state in the registry (entities/hierarchy/states). */
export const STATE_MAPS: Record<string, StateMap> = {
  Maharashtra: stateMap("Maharashtra", maharashtraGeo, MAHARASHTRA_REGIONS, {
    displayNames: DISTRICT_DISPLAY_NAMES,
    outsideLabels: OUTSIDE_LABEL_DISTRICTS,
  }),
  Gujarat: stateMap("Gujarat", gujaratGeo, GUJARAT_REGIONS),
  "Madhya Pradesh": stateMap("Madhya Pradesh", madhyaPradeshGeo, MADHYA_PRADESH_REGIONS),
};

/** The chosen state's map. */
export function useStateMap(): StateMap {
  const { name } = useActiveState();
  return STATE_MAPS[name] ?? STATE_MAPS.Maharashtra;
}

/**
 * The map region a route id or AF name refers to. Compared through
 * canonicalRegion, so "chhatrapati-sambhajinagar" (a route) finds the region
 * whose map id is "sambhajinagar", and "Amravati" (AF) finds "Amaravati" (Figma).
 */
export function findRegion(map: StateMap, idOrName?: string): Region | undefined {
  if (!idOrName) return undefined;
  const wanted = canonicalRegion(idOrName);
  return map.regions.find((r) => canonicalRegion(r.id) === wanted || canonicalRegion(r.label) === wanted);
}
