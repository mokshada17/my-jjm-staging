/**
 * Alarm limits drawn on the ESR chlorine and pressure trends - the Hi / HiHi / Lo
 * traces PI Vision shows as `ESR …|Pressure|Hi` and friends.
 *
 * PI_WEB_API_USAGE_GUIDE defines no limit attributes, so these are the figures
 * printed on Figma 2:11688 (and in the PI Vision display). They live here once,
 * so the dashboard markers and the popup trend's limit traces cannot disagree.
 */

/** mg/l. The 0.2-0.5 band is the §5.1 "ideal" range. */
export const CHLORINE_LIMITS = { hi: 0.5, lo: 0.2 } as const;

/** bar. 0.69 bar is the 7 m head where §5.2's standard band begins. */
export const PRESSURE_LIMITS_BAR = { hi: 0.69, hiHi: 0.7, lo: 0.2 } as const;
