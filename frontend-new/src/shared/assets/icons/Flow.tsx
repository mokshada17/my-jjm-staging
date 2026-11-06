import React from "react";

export interface FlowProps
  extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;

  topColor?: string;
  middleColor?: string;
  bottomColor?: string;

  strokeWidth?: number;
  spacing?: number;
}

export default function Flow({
  width = 240,
  height = 140,

  topColor = "#149FF5",
  middleColor = "#16CDE8",
  bottomColor = "#25E4D5",

  strokeWidth = 7,
  spacing = 30,

  ...props
}: FlowProps) {
  /*
   * One wave definition.
   *
   * All 3 rows use this exact same path,
   * which guarantees identical geometry.
   */
  const wavePath = `
    M 14 0
    C 25 0, 25 -12, 38 -12
    C 51 -12, 51 0, 64 0
    C 77 0, 77 -12, 90 -12
    C 103 -12, 103 0, 114 0
  `;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      {/* Top wave */}
      <path
        d={wavePath}
        transform="translate(0 28)"
        stroke={topColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />

      {/* Middle wave */}
      <path
        d={wavePath}
        transform={`translate(0 ${28 + spacing})`}
        stroke={middleColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />

      {/* Bottom wave */}
      <path
        d={wavePath}
        transform={`translate(0 ${28 + spacing * 2})`}
        stroke={bottomColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}