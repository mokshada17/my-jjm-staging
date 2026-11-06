import { useQuery } from "@tanstack/react-query";
import { telemetryApi, flattenDaySeries, type SeriesPoint } from "./api";
import { scopeKey, type HierarchyScope } from "../hierarchy/scope";

export const telemetryKeys = {
  all: ["telemetry"] as const,
  waterConsumption: (scope: HierarchyScope) =>
    [...telemetryKeys.all, "water-consumption", scopeKey(scope)] as const,
  chlorine: (scope: HierarchyScope) =>
    [...telemetryKeys.all, "chlorine", scopeKey(scope)] as const,
  pressure: (scope: HierarchyScope) =>
    [...telemetryKeys.all, "pressure", scopeKey(scope)] as const,
  communicationStatus: (scope: HierarchyScope) =>
    [...telemetryKeys.all, "communication-status", scopeKey(scope)] as const,
};

/**
 * The three chart series on the ESR dashboard. Each is scoped to the reservoir
 * in the route, so the server returns that one row rather than the whole table
 * for the client to search. The query stays disabled until the scope names a
 * reservoir.
 */
export function useWaterConsumptionSeries(scope: HierarchyScope, enabled = true) {
  return useQuery({
    queryKey: telemetryKeys.waterConsumption(scope),
    queryFn: ({ signal }) => telemetryApi.waterConsumption(scope, { signal }),
    enabled,
    select: (rows): SeriesPoint[] =>
      flattenDaySeries(rows[0], "water_value_day", "water_date_day"),
  });
}

export function useChlorineSeries(scope: HierarchyScope, enabled = true) {
  return useQuery({
    queryKey: telemetryKeys.chlorine(scope),
    queryFn: ({ signal }) => telemetryApi.chlorine(scope, { signal }),
    enabled,
    select: (rows): SeriesPoint[] =>
      flattenDaySeries(rows[0], "chlorine_value_", "chlorine_date_day_"),
  });
}

export function usePressureSeries(scope: HierarchyScope, enabled = true) {
  return useQuery({
    queryKey: telemetryKeys.pressure(scope),
    queryFn: ({ signal }) => telemetryApi.pressure(scope, { signal }),
    enabled,
    select: (rows): SeriesPoint[] =>
      flattenDaySeries(rows[0], "pressure_value_", "pressure_date_day_"),
  });
}

export function useCommunicationStatus(scope: HierarchyScope = {}, enabled = true) {
  return useQuery({
    queryKey: telemetryKeys.communicationStatus(scope),
    queryFn: ({ signal }) => telemetryApi.communicationStatus(scope, { signal }),
    enabled,
  });
}
