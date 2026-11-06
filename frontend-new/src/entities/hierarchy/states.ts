/**
 * The states an officer can switch between. Each is a root element of the PI AF
 * database (`\\DemoAF\JJM\JJM\<name>`) and a value of the §5 tables' `state`
 * column, so choosing a state swaps the root of the whole 9-tier hierarchy.
 *
 * Must match the roots scripts/generate-pi-db.mjs writes.
 */
export interface StateInfo {
  /** AF root element name, and the `state` column value the requests filter on. */
  name: string;
  /** Slug, as in the breadcrumb root node's id. */
  id: string;
  /** The overview pages' region tabs, in ribbon order and spelling. */
  regionTabs: string[];
  /** The tab an overview page opens on: a region with ingested data. */
  defaultRegion: string;
}

/** §2.2: the AF database every state root sits under. */
export const AF_DATABASE = "\\\\DemoAF\\JJM\\JJM";

export const STATES: StateInfo[] = [
  {
    name: "Maharashtra",
    id: "maharashtra",
    // The Figma ribbon (2:3135, 2:688): five tabs in its own spelling, which
    // canonicalRegion() maps onto the AF names.
    regionTabs: ["Amaravati", "Chhatrapati Sambhajinagar", "Nagpur", "Nashik", "Pune"],
    defaultRegion: "Nagpur",
  },
  {
    name: "Gujarat",
    id: "gujarat",
    regionTabs: ["Central Gujarat", "Saurashtra", "North Gujarat", "South Gujarat", "Kutch"],
    defaultRegion: "Central Gujarat",
  },
  {
    name: "Madhya Pradesh",
    id: "madhya-pradesh",
    regionTabs: [
      "Bhopal",
      "Indore",
      "Jabalpur",
      "Gwalior",
      "Ujjain",
      "Rewa",
      "Sagar",
      "Shahdol",
      "Chambal",
      "Narmadapuram",
    ],
    defaultRegion: "Bhopal",
  },
];

export const DEFAULT_STATE = STATES[0];

/** The registry entry for a state name; unknown names fall back to the default. */
export const stateInfo = (name?: string): StateInfo =>
  STATES.find((s) => s.name === name) ?? DEFAULT_STATE;

/** The state's root element path, as §4 endpoint 1 resolves it. */
export const afStateRoot = (name: string) => `${AF_DATABASE}\\${name}`;
