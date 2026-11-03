import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HierarchyTier } from "@/entities/hierarchy";
// Straight from the module: the hierarchy index imports this store.
import { DEFAULT_STATE, stateInfo } from "@/entities/hierarchy/states";
import { presetSpan, stepEnd, type TimePreset } from "@/shared/lib/timeRange";

export type { TimePreset };

const HOUR = 60 * 60 * 1000;
/** The page window when nothing has been chosen yet: the last 8 hours, live. */
const DEFAULT_WINDOW_MS = 8 * HOUR;

export interface HierarchyNode {
  tier: HierarchyTier;
  /** Slug used in the `/dashboard/:tier/:id` route. */
  id: string;
  label: string;
  /**
   * The value this tier's §5.1 column holds, e.g. "Akola" for
   * `Sub Division-Akola`. Carried so a drill-down can scope its API calls to the
   * branch without first re-reading the tree. Absent until data resolves it.
   */
  name?: string;
}

export interface TelemetryReading {
  value: number;
  unit: string;
  timestamp: number;
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  raisedAt: number;
  acknowledged: boolean;
}

export type KpiFilter = "lpcd" | "chlorine" | "pressure";

interface AppState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  /** Unattended TV / wall: screen kept awake, long pages scroll themselves (features/screen-fit). */
  wallMode: boolean;
  setWallMode: (on: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  /**
   * The state the officer is looking at (an AF root, and the §5 `state` column).
   * Every request is scoped to it; switching resets the path to its root.
   */
  activeState: string;
  setActiveState: (state: string) => void;

  /** Ancestor chain from the state down to the active node; last entry is active. */
  nodePath: HierarchyNode[];
  setNodePath: (path: HierarchyNode[]) => void;
  /** Appends a node, dropping any deeper tiers already in the path. */
  drillTo: (node: HierarchyNode) => void;
  resetToTier: (tier: HierarchyTier) => void;

  /** Span of the time-bar window; a preset or whatever a trend zoom left. */
  windowMs: number;
  /** Right edge of the scrubber window; null means "live". */
  windowEndsAt: number | null;
  /** Applies a duration preset, keeping the window's right edge. */
  setTimePreset: (preset: TimePreset) => void;
  /** Sets an explicit window, e.g. from a trend zoom. An end at or past now is live. */
  setTimeWindow: (start: number, end: number) => void;
  stepWindow: (direction: -1 | 1) => void;
  goLive: () => void;

  /** Latest reading per sensor tag, replaced in place by the MQTT stream. */
  telemetry: Record<string, TelemetryReading>;
  upsertTelemetry: (readings: Record<string, TelemetryReading>) => void;

  kpiFilters: KpiFilter[];
  toggleKpiFilter: (filter: KpiFilter) => void;
  clearKpiFilters: () => void;

  alerts: Alert[];
  pushAlert: (alert: Omit<Alert, "acknowledged">) => void;
  acknowledgeAlert: (id: string) => void;
  clearAcknowledgedAlerts: () => void;

  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
}

const TIER_ORDER: HierarchyTier[] = [
  "State",
  "Region",
  "Circle",
  "Division",
  "SubDivision",
  "Block",
  "Scheme",
  "Village",
  "ESR",
];

/** The breadcrumb root for a state. Carries `name`, so every scope built from a path names the state. */
export function stateRootNode(state: string): HierarchyNode {
  return { tier: "State", id: stateInfo(state).id, label: state, name: state };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "dark",
      sidebarOpen: true,
      wallMode: false,
      setWallMode: (wallMode) => set({ wallMode }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      activeState: DEFAULT_STATE.name,
      setActiveState: (activeState) => set({ activeState, nodePath: [stateRootNode(activeState)] }),

      nodePath: [stateRootNode(DEFAULT_STATE.name)],
      setNodePath: (nodePath) => set({ nodePath }),
      drillTo: (node) =>
        set((state) => {
          const depth = TIER_ORDER.indexOf(node.tier);
          const kept = state.nodePath.filter(
            (n) => TIER_ORDER.indexOf(n.tier) < depth
          );
          return { nodePath: [...kept, node] };
        }),
      resetToTier: (tier) =>
        set((state) => {
          const depth = TIER_ORDER.indexOf(tier);
          const trimmed = state.nodePath.filter(
            (n) => TIER_ORDER.indexOf(n.tier) <= depth
          );
          return { nodePath: trimmed.length ? trimmed : [stateRootNode(state.activeState)] };
        }),

      windowMs: DEFAULT_WINDOW_MS,
      windowEndsAt: null,
      setTimePreset: (preset) =>
        set((state) => ({ windowMs: presetSpan(preset, state.windowEndsAt ?? Date.now()) })),
      setTimeWindow: (start, end) =>
        set({ windowMs: Math.max(1000, end - start), windowEndsAt: end >= Date.now() ? null : end }),
      // Stepping forward past now snaps back to live.
      stepWindow: (direction) =>
        set((state) => ({ windowEndsAt: stepEnd(state.windowMs, state.windowEndsAt, direction) })),
      goLive: () => set({ windowEndsAt: null }),

      telemetry: {},
      upsertTelemetry: (readings) =>
        set((state) => ({ telemetry: { ...state.telemetry, ...readings } })),

      kpiFilters: [],
      toggleKpiFilter: (filter) =>
        set((state) => ({
          kpiFilters: state.kpiFilters.includes(filter)
            ? state.kpiFilters.filter((f) => f !== filter)
            : [...state.kpiFilters, filter],
        })),
      clearKpiFilters: () => set({ kpiFilters: [] }),

      alerts: [],
      pushAlert: (alert) =>
        set((state) => ({
          alerts: [{ ...alert, acknowledged: false }, ...state.alerts],
        })),
      acknowledgeAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, acknowledged: true } : a
          ),
        })),
      clearAcknowledgedAlerts: () =>
        set((state) => ({ alerts: state.alerts.filter((a) => !a.acknowledged) })),

      activeModal: null,
      openModal: (activeModal) => set({ activeModal }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: "jjm-app-storage",
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        // An officer who switched state expects to find it again after a reload.
        activeState: state.activeState,
        // A wall's browser comes back in wall mode after a reload or a restart.
        wallMode: state.wallMode,
        sidebarOpen: state.sidebarOpen,
        windowMs: state.windowMs,
      }),
      // The path is not persisted, so start it at the restored state's root; a
      // state no longer in the registry falls back to the default.
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<AppState>) };
        const activeState = stateInfo(merged.activeState).name;
        return { ...merged, activeState, nodePath: [stateRootNode(activeState)] };
      },
      // v0 stored a preset name ("8h" | "24h" | "7d") instead of a span.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        if (version < 1) {
          const legacy: Record<string, number> = { "8h": 8 * HOUR, "24h": 24 * HOUR, "7d": 7 * 24 * HOUR };
          const { timePreset, ...rest } = state;
          return { ...rest, windowMs: legacy[String(timePreset)] ?? DEFAULT_WINDOW_MS };
        }
        return state;
      },
    }
  )
);

/**
 * Resolves the scrubber window to concrete instants. Takes primitives rather than the
 * whole state so callers can subscribe to those primitives and avoid re-rendering on
 * every unrelated store write.
 */
export function resolveTimeWindow(
  windowMs: number,
  endsAt: number | null,
  now = Date.now()
): { start: Date; end: Date } {
  const end = endsAt ?? now;
  return { start: new Date(end - windowMs), end: new Date(end) };
}
