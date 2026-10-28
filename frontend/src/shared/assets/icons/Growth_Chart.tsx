import React, { useId } from "react";

export interface GrowthChartProps
  extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;

  /** Main color of bars and arrow */
  color?: string;

  /** Optional separate arrow color */
  arrowColor?: string;

  /** Overall opacity of the bars */
  barOpacity?: number;

  /** Overall opacity of the arrow */
  arrowOpacity?: number;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({
  width = 286,
  height = 201,
  color = "#C3C8F5",
  arrowColor,
  barOpacity = 0.68,
  arrowOpacity = 0.9,
  ...props
}) => {
  const uid = useId().replace(/:/g, "");

  const barGradient = `bar-gradient-${uid}`;
  const actualArrowColor = arrowColor ?? color;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 286 201"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Subtle shading present in the original bars */}
        <linearGradient
          id={barGradient}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor={color}
            stopOpacity="0.95"
          />

          <stop
            offset="55%"
            stopColor={color}
            stopOpacity="0.8"
          />

          <stop
            offset="100%"
            stopColor={color}
            stopOpacity="0.68"
          />
        </linearGradient>
      </defs>

      {/* ==========================================
          GROWTH ARROW
          ========================================== */}

      <path
        d="
          M71 104
          L171 40
          L186 54
          L235 17
        "
        stroke={actualArrowColor}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="miter"
        opacity={arrowOpacity}
      />

      {/* Arrow head */}
      <path
        d="
          M222 10
          L258 6
          L246 36
          L235 19
          Z
        "
        fill={actualArrowColor}
        opacity={arrowOpacity}
      />

      {/* ==========================================
          BAR 1
          ========================================== */}

      <rect
        x="62"
        y="138"
        width="35"
        height="46"
        rx="3"
        fill={`url(#${barGradient})`}
        opacity={barOpacity}
      />

      {/* ==========================================
          BAR 2
          ========================================== */}

      <rect
        x="115"
        y="113"
        width="34"
        height="71"
        rx="3"
        fill={`url(#${barGradient})`}
        opacity={barOpacity}
      />

      {/* ==========================================
          BAR 3
          ========================================== */}

      <rect
        x="167"
        y="88"
        width="36"
        height="96"
        rx="4"
        fill={`url(#${barGradient})`}
        opacity={barOpacity}
      />

      {/* ==========================================
          BAR 4
          ========================================== */}

      <rect
        x="220"
        y="62"
        width="36"
        height="122"
        rx="4"
        fill={`url(#${barGradient})`}
        opacity={barOpacity}
      />
    </svg>
  );
};

export default GrowthChart;