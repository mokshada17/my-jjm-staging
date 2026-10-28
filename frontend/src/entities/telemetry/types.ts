export interface CommStatusCount {
  h24: number;      // < 24 Hours (Green)
  h0To72: number;   // 0 - 72 Hours (Amber)
  h72Plus: number;  // > 72 Hours (Red)
}

export interface CommStatusMatrix {
  chlorine: CommStatusCount;
  pressure: CommStatusCount;
  flow: CommStatusCount;
}

export interface VillageLevelKpiValues {
  lpcdAbove55: number;
  lpcdBelow55: number;
  chlorineIdeal: number;      // 0.2 - 0.5 mg/l
  chlorineLow: number;        // < 0.2 mg/l
  chlorineHigh: number;       // > 0.5 mg/l
  pressureHigh: number;       // > 7 mh
  pressureModerate: number;   // 2 - 0.5 pm / 0.2 - 0.7 bar
  pressureLow: number;        // < 2 mh / < 0.2 bar
}
