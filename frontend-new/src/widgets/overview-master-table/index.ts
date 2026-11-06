// The config-driven table every overview page uses.
export * from "./OverviewTable";
export * from "./OverviewCards";
export * from "./sections";
export * from "./OpenNodeButton";

// Building blocks (used by OverviewTable; exported for tables with special needs).
export * from "./CommStatusMatrixCell";
export * from "./VillageLevelKpisHeader";
export * from "./VillageLevelKpisCells";
export * from "./TableStateRow";

/** @deprecated Hand-assembled table; use OverviewTable. Kept so open branches still build. */
export * from "./OverviewMasterTable";
