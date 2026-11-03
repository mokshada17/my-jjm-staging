/** The nine tiers. `State` is the root: whichever state the officer has chosen. */
export type HierarchyTier =
  | "State"
  | "Region"
  | "Circle"
  | "Division"
  | "SubDivision"
  | "Block"
  | "Scheme"
  | "Village"
  | "ESR";

export interface HierarchyCounts {
  circles?: number;
  divisions?: number;
  subDivisions?: number;
  blocks?: number;
  schemes?: number;
  villages?: number;
  reservoirs?: number;
}
