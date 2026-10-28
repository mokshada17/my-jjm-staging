/**
 * Each state's regions and the districts each covers, for the state and region
 * maps. District keys match the `district` property of that state's
 * <state>-districts.json; stateMaps.ts ties a state to its geometry and regions.
 *
 * Maharashtra: the six MJP regional divisions. Its geometry uses 2011 census
 * naming; `DISTRICT_DISPLAY_NAMES` carries the current names.
 */
export interface Region {
  id: string;
  label: string;
  /** Figma palette for the regional zones. */
  fill: string;
  districts: string[];
  /** Regional HQ [lon, lat]. */
  hq: [number, number];
}

export const MAHARASHTRA_REGIONS: Region[] = [
  {
    id: "konkan",
    label: "Konkan",
    fill: "#87A987",
    districts: ["Palghar", "Thane", "Mumbai", "Raigad", "Ratnagiri", "Sindhudurg"],
    hq: [72.8777, 19.076],
  },
  {
    id: "nashik",
    label: "Nashik",
    fill: "#E8D574",
    districts: ["Nandurbar", "Dhule", "Jalgaon", "Nashik", "Ahmednagar"],
    hq: [73.7898, 19.9975],
  },
  {
    id: "pune",
    label: "Pune",
    fill: "#9DC88D",
    districts: ["Pune", "Satara", "Solapur", "Sangli", "Kolhapur"],
    hq: [73.8567, 18.5204],
  },
  {
    id: "sambhajinagar",
    label: "Chhatrapati Sambhajinagar",
    fill: "#B49DD8",
    districts: [
      "Aurangabad",
      "Jalna",
      "Beed",
      "Parbhani",
      "Hingoli",
      "Nanded",
      "Latur",
      "Osmanabad",
    ],
    hq: [75.3433, 19.8762],
  },
  {
    id: "amravati",
    label: "Amaravati",
    fill: "#E8A29A",
    districts: ["Buldhana", "Akola", "Amravati", "Washim", "Yavatmal"],
    hq: [77.7796, 20.9374],
  },
  {
    id: "nagpur",
    label: "Nagpur",
    fill: "#EFA885",
    districts: ["Nagpur", "Wardha", "Bhandara", "Gondia", "Chandrapur", "Gadchiroli"],
    hq: [79.0882, 21.1458],
  },
];

/** Districts renamed since the 2011 census the boundary data is keyed on. */
export const DISTRICT_DISPLAY_NAMES: Record<string, string> = {
  Aurangabad: "Chhatrapati Sambhajinagar",
  Osmanabad: "Dharashiv",
};

/**
 * Districts whose state-map label sits outside the district, like Mumbai's (which
 * goes there on its own, being too small for any label). These do fit a name
 * inside, but only at the unreadable 6.5px floor size:
 *  - Ratnagiri and Sindhudurg, thin coastal strips: offshore, west of the coast.
 *  - Bhandara, wedged between Nagpur and Gondia on the northern state border:
 *    just above its top edge, outside the state.
 */
export const OUTSIDE_LABEL_DISTRICTS: Record<string, "west" | "north"> = {
  Ratnagiri: "west",
  Sindhudurg: "west",
  Bhandara: "north",
};

/**
 * Gujarat: its five geographic zones. The geometry is current (34 districts,
 * Vav-Tharad included), so no display renames are needed.
 */
export const GUJARAT_REGIONS: Region[] = [
  {
    id: "kutch",
    label: "Kutch",
    fill: "#E8D574",
    districts: ["Kutch"],
    hq: [69.667, 23.242],
  },
  {
    id: "saurashtra",
    label: "Saurashtra",
    fill: "#EFA885",
    districts: [
      "Rajkot",
      "Jamnagar",
      "Devbhumi Dwarka",
      "Porbandar",
      "Junagadh",
      "Gir Somnath",
      "Amreli",
      "Bhavnagar",
      "Botad",
      "Surendranagar",
      "Morbi",
    ],
    hq: [70.8022, 22.3039],
  },
  {
    id: "north-gujarat",
    label: "North Gujarat",
    fill: "#B49DD8",
    districts: ["Banaskantha", "Vav-Tharad", "Patan", "Mehsana", "Sabarkantha", "Aravalli", "Gandhinagar"],
    hq: [72.3693, 23.588],
  },
  {
    id: "central-gujarat",
    label: "Central Gujarat",
    fill: "#9DC88D",
    districts: ["Ahmedabad", "Anand", "Kheda", "Vadodara", "Panchmahal", "Mahisagar", "Dahod", "Chhota Udaipur"],
    hq: [73.1812, 22.3072],
  },
  {
    id: "south-gujarat",
    label: "South Gujarat",
    fill: "#87A987",
    districts: ["Bharuch", "Narmada", "Surat", "Tapi", "Navsari", "Valsad", "Dang"],
    hq: [72.8311, 21.1702],
  },
];

/**
 * Madhya Pradesh: its ten revenue divisions (Narmadapuram was Hoshangabad, the
 * district's name in the geometry). The geometry is current (52 districts).
 */
export const MADHYA_PRADESH_REGIONS: Region[] = [
  {
    id: "bhopal",
    label: "Bhopal",
    fill: "#9DC88D",
    districts: ["Bhopal", "Sehore", "Raisen", "Vidisha", "Rajgarh"],
    hq: [77.4126, 23.2599],
  },
  {
    id: "chambal",
    label: "Chambal",
    fill: "#E8D574",
    districts: ["Sheopur", "Morena", "Bhind"],
    hq: [78.0, 26.4947],
  },
  {
    id: "gwalior",
    label: "Gwalior",
    fill: "#8EC5D6",
    districts: ["Gwalior", "Datia", "Shivpuri", "Guna", "Ashoknagar"],
    hq: [78.1828, 26.2183],
  },
  {
    id: "indore",
    label: "Indore",
    fill: "#EFA885",
    districts: ["Indore", "Dhar", "Jhabua", "Alirajpur", "Barwani", "Khargone", "Khandwa", "Burhanpur"],
    hq: [75.8577, 22.7196],
  },
  {
    id: "jabalpur",
    label: "Jabalpur",
    fill: "#B49DD8",
    districts: ["Jabalpur", "Katni", "Narsinghpur", "Chhindwara", "Seoni", "Mandla", "Dindori", "Balaghat"],
    hq: [79.9864, 23.1815],
  },
  {
    id: "narmadapuram",
    label: "Narmadapuram",
    fill: "#E8A29A",
    districts: ["Hoshangabad", "Harda", "Betul"],
    hq: [77.725, 22.752],
  },
  {
    id: "rewa",
    label: "Rewa",
    fill: "#87A987",
    districts: ["Rewa", "Satna", "Sidhi", "Singrauli"],
    hq: [81.2961, 24.5362],
  },
  {
    id: "sagar",
    label: "Sagar",
    fill: "#D9A6C8",
    districts: ["Sagar", "Damoh", "Panna", "Chhatarpur", "Tikamgarh", "Niwari"],
    hq: [78.7378, 23.8388],
  },
  {
    id: "shahdol",
    label: "Shahdol",
    fill: "#C9B98A",
    districts: ["Shahdol", "Anuppur", "Umaria"],
    hq: [81.3509, 23.296],
  },
  {
    id: "ujjain",
    label: "Ujjain",
    fill: "#A7B8E0",
    districts: ["Ujjain", "Ratlam", "Mandsaur", "Neemuch", "Shajapur", "Dewas", "Agar Malwa"],
    hq: [75.7849, 23.1765],
  },
];

export const regionsByDistrict = (regions: Region[]): Record<string, Region> =>
  Object.fromEntries(regions.flatMap((region) => region.districts.map((d) => [d, region])));
