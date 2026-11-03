import { useId, type SVGProps } from "react";
export interface LPCDProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const LPCD = ({
  width = 500,
  height = 330,
  ...props
}: LPCDProps) => {
  const id = useId();

  const rulerGradient = `${id}-ruler`;
  const blueGradient = `${id}-blue`;
  const cyanGradient = `${id}-cyan`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 330"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Light gray ruler so it's visible on white backgrounds */}
        <linearGradient
          id={rulerGradient}
          x1="72"
          y1="30"
          x2="142"
          y2="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#F9FAFB" />
          <stop offset="0.5" stopColor="#F1F3F5" />
          <stop offset="1" stopColor="#E7E9ED" />
        </linearGradient>

        {/* Blue water */}
        <linearGradient
          id={blueGradient}
          x1="160"
          y1="176"
          x2="360"
          y2="228"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#2196F3" />
          <stop offset="0.5" stopColor="#28A4FF" />
          <stop offset="1" stopColor="#168FF1" />
        </linearGradient>

        {/* Cyan water */}
        <linearGradient
          id={cyanGradient}
          x1="160"
          y1="246"
          x2="360"
          y2="299"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#3CD9D5" />
          <stop offset="0.5" stopColor="#32D5DA" />
          <stop offset="1" stopColor="#29CDD3" />
        </linearGradient>
      </defs>

      {/* =========================
          RULER
         ========================= */}

      <rect
        x="72"
        y="30"
        width="70"
        height="270"
        rx="10"
        fill={`url(#${rulerGradient})`}
        stroke="#DDE1E6"
        strokeWidth="1.5"
      />

      {/* Ruler measurement marks */}
      <g fill="#071442">
        {/* Long mark */}
        <rect x="72" y="50" width="40" height="7" rx="3.5" />

        {/* Short marks */}
        <rect x="72" y="68" width="20" height="6" rx="3" />
        <rect x="72" y="84" width="20" height="6" rx="3" />

        {/* Long mark */}
        <rect x="72" y="100" width="40" height="7" rx="3.5" />

        {/* Short marks */}
        <rect x="72" y="118" width="20" height="6" rx="3" />
        <rect x="72" y="134" width="20" height="6" rx="3" />

        {/* Long mark */}
        <rect x="72" y="150" width="40" height="7" rx="3.5" />

        {/* Short marks */}
        <rect x="72" y="168" width="20" height="6" rx="3" />
        <rect x="72" y="184" width="20" height="6" rx="3" />

        {/* Long mark */}
        <rect x="72" y="200" width="40" height="7" rx="3.5" />

        {/* Short marks */}
        <rect x="72" y="218" width="20" height="6" rx="3" />
        <rect x="72" y="234" width="20" height="6" rx="3" />

        {/* Long mark */}
        <rect x="72" y="250" width="40" height="7" rx="3.5" />

        {/* Short marks */}
        <rect x="72" y="268" width="20" height="6" rx="3" />
        <rect x="72" y="284" width="20" height="6" rx="3" />
      </g>

      {/* =========================
          TOP WATER LEVEL
         ========================= */}

      <path
        d="
          M160 176

          C168 185 177 185 185 176
          C193 185 202 185 210 176
          C218 185 227 185 235 176
          C243 185 252 185 260 176
          C268 185 277 185 285 176
          C293 185 302 185 310 176
          C318 185 327 185 335 176
          C343 185 352 185 360 176

          V228
          H160
          Z
        "
        fill={`url(#${blueGradient})`}
      />

      {/* =========================
          BOTTOM WATER LEVEL
         ========================= */}

      <path
        d="
          M160 246

          C168 255 177 255 185 246
          C193 255 202 255 210 246
          C218 255 227 255 235 246
          C243 255 252 255 260 246
          C268 255 277 255 285 246
          C293 255 302 255 310 246
          C318 255 327 255 335 246
          C343 255 352 255 360 246

          V299
          H160
          Z
        "
        fill={`url(#${cyanGradient})`}
      />
    </svg>
  );
};

export default LPCD;